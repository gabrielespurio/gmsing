"use server";

import { db } from "@/db";
import {
  quotes,
  quoteItems,
  orders,
  orderHistory,
  accountsReceivable,
  paymentsReceived,
  stockMovements,
  materials,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ItemPayload {
  productName: string;
  description?: string;
  quantity: number;
  widthMeters?: number;
  heightMeters?: number;
  unitArea?: number;
  totalArea?: number;
  pricingMethod?: string;
  unitCostCents: number;
  totalCostCents: number;
  unitPriceCents: number;
  totalPriceCents: number;
  notes?: string;
}

/**
 * Criação de novo orçamento com cálculo e snapshot de itens
 */
export async function createQuoteAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const deliveryTimeDays = parseInt((formData.get("deliveryTimeDays") as string) || "15", 10);
  const validityDays = parseInt((formData.get("validityDays") as string) || "10", 10);
  const paymentConditions = (formData.get("paymentConditions") as string) || "50% entrada e 50% na entrega";
  const commercialNotes = (formData.get("commercialNotes") as string) || "";
  const internalNotes = (formData.get("internalNotes") as string) || "";
  const itemsJson = formData.get("items") as string;

  if (!clientId) {
    throw new Error("Cliente é obrigatório");
  }

  let items: ItemPayload[] = [];
  try {
    items = JSON.parse(itemsJson || "[]");
  } catch {
    throw new Error("Itens do orçamento inválidos");
  }

  if (items.length === 0) {
    throw new Error("Adicione pelo menos um item ao orçamento");
  }

  // Gera código único ORC-YYYY-XXX
  const currentYear = new Date().getFullYear();
  const allQuotes = await db.select({ code: quotes.code }).from(quotes);
  const nextSeq = allQuotes.length + 1;
  const quoteCode = `ORC-${currentYear}-${String(nextSeq).padStart(3, "0")}`;

  const issueDate = new Date();
  const validUntil = new Date();
  validUntil.setDate(issueDate.getDate() + validityDays);

  let subtotalCents = 0;
  let estimatedCostCents = 0;

  for (const item of items) {
    subtotalCents += Math.round(Number(item.totalPriceCents || 0));
    estimatedCostCents += Math.round(Number(item.totalCostCents || 0));
  }

  const discountCents = 0;
  const totalCents = subtotalCents - discountCents;

  const [insertedQuote] = await db
    .insert(quotes)
    .values({
      code: quoteCode,
      revision: 1,
      clientId,
      status: "rascunho",
      issueDate,
      validUntil,
      paymentConditions,
      deliveryTimeDays,
      commercialNotes,
      internalNotes,
      subtotalCents,
      discountCents,
      totalCents,
      estimatedCostCents,
    })
    .returning();

  for (const item of items) {
    await db.insert(quoteItems).values({
      quoteId: insertedQuote.id,
      productName: item.productName,
      description: item.description || "",
      quantity: Number(item.quantity) || 1,
      widthMeters: item.widthMeters ? String(item.widthMeters) : null,
      heightMeters: item.heightMeters ? String(item.heightMeters) : null,
      unitArea: item.unitArea ? String(item.unitArea) : null,
      totalArea: item.totalArea ? String(item.totalArea) : null,
      pricingMethod: item.pricingMethod || "composicao",
      unitCostCents: Math.round(Number(item.unitCostCents) || 0),
      totalCostCents: Math.round(Number(item.totalCostCents) || 0),
      unitPriceCents: Math.round(Number(item.unitPriceCents) || 0),
      totalPriceCents: Math.round(Number(item.totalPriceCents) || 0),
      notes: item.notes || null,
    });
  }

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard");
  redirect(`/dashboard/quotes/${insertedQuote.id}`);
}

/**
 * Atualiza status do orçamento (ex: enviar, negociar, recusar)
 */
export async function updateQuoteStatusAction(quoteId: string, status: string) {
  await db
    .update(quotes)
    .set({ status, updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

/**
 * CONVERSÃO: Orçamento -> Pedido
 * - Muda status do Orçamento para 'aprovado'
 * - Cria Pedido ('orders') com endereço, prazo e forma de pagamento
 * - Gera parcelas no Contas a Receber ('accounts_receivable')
 * - Registra baixa/reserva no Estoque ('stock_movements')
 */
export async function convertQuoteToOrderAction(formData: FormData) {
  const quoteId = formData.get("quoteId") as string;
  const paymentMethod = (formData.get("paymentMethod") as string) || "pix";
  const installmentsCount = parseInt((formData.get("installmentsCount") as string) || "1", 10);
  const firstDueDateStr = formData.get("firstDueDate") as string;
  const installationAddress = (formData.get("installationAddress") as string) || "";
  const expectedDeliveryDateStr = formData.get("expectedDeliveryDate") as string;
  const productionNotes = (formData.get("productionNotes") as string) || "";

  if (!quoteId) {
    throw new Error("Identificador do orçamento não fornecido.");
  }

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote) {
    throw new Error("Orçamento não encontrado.");
  }

  // Busca itens do orçamento
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));

  // Marca orçamento como aprovado
  await db
    .update(quotes)
    .set({ status: "aprovado", updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  // Gera código único para o pedido PED-YYYY-XXX
  const currentYear = new Date().getFullYear();
  const allOrders = await db.select({ code: orders.code }).from(orders);
  const nextSeq = allOrders.length + 1;
  const orderCode = `PED-${currentYear}-${String(nextSeq).padStart(3, "0")}`;

  const expectedDeliveryDate = expectedDeliveryDateStr ? new Date(expectedDeliveryDateStr) : new Date(Date.now() + 15 * 86400000);
  const firstDueDate = firstDueDateStr ? new Date(firstDueDateStr) : new Date();

  // Insere Pedido
  const [newOrder] = await db
    .insert(orders)
    .values({
      code: orderCode,
      quoteId: quote.id,
      clientId: quote.clientId,
      status: "em_producao",
      priority: "normal",
      paymentMethod,
      paymentTerms: `${installmentsCount}x via ${paymentMethod.toUpperCase()}`,
      installmentsCount,
      totalAmountCents: quote.totalCents,
      stockDeducted: true,
      installationAddress,
      expectedStartDate: new Date(),
      expectedDeliveryDate,
      productionNotes,
    })
    .returning();

  // Registra histórico inicial do pedido
  await db.insert(orderHistory).values({
    orderId: newOrder.id,
    previousStatus: "aguardando_aprovacao",
    newStatus: "em_producao",
    notes: `Pedido gerado a partir do Orçamento aprovado ${quote.code}.`,
  });

  // INTEGRAÇÃO FINANCEIRA: Gera Contas a Receber divididas em parcelas
  const totalAmount = quote.totalCents;
  const baseInstallmentAmount = Math.floor(totalAmount / installmentsCount);
  const remainder = totalAmount % installmentsCount;

  for (let i = 1; i <= installmentsCount; i++) {
    const installmentAmount = i === 1 ? baseInstallmentAmount + remainder : baseInstallmentAmount;
    const installmentDueDate = new Date(firstDueDate);
    installmentDueDate.setDate(installmentDueDate.getDate() + (i - 1) * 30);

    await db.insert(accountsReceivable).values({
      clientId: quote.clientId,
      quoteId: quote.id,
      orderId: newOrder.id,
      description: `Parcela ${i}/${installmentsCount} - Pedido ${newOrder.code} (${quote.code})`,
      installmentNumber: i,
      totalInstallments: installmentsCount,
      amountCents: installmentAmount,
      paidAmountCents: 0,
      balanceCents: installmentAmount,
      dueDate: installmentDueDate,
      paymentMethod,
      status: "pendente",
    });
  }

  // INTEGRAÇÃO COM ESTOQUE: Baixa ou reserva de materiais com base nos itens
  const existingMaterials = await db.select().from(materials);
  for (const item of items) {
    const itemTotalArea = Number(item.totalArea || item.unitArea || 1);
    
    // Procura material mais compatível pelo nome do item
    let matchedMaterial = existingMaterials.find((m) =>
      item.productName.toLowerCase().includes(m.name.toLowerCase()) ||
      item.productName.toLowerCase().includes(m.category.toLowerCase())
    );

    // Se não achou, associa ao primeiro material da categoria ACM ou Vinil padrão
    if (!matchedMaterial && existingMaterials.length > 0) {
      matchedMaterial = existingMaterials[0];
    }

    if (matchedMaterial) {
      const deductionQty = Math.max(1, Math.round(itemTotalArea));
      
      // Insere movimentação de estoque
      await db.insert(stockMovements).values({
        materialId: matchedMaterial.id,
        orderId: newOrder.id,
        type: "saida",
        quantity: String(deductionQty),
        unitCostCents: matchedMaterial.costPriceCents,
        reason: `Baixa automática para produção do Pedido ${newOrder.code} (${item.productName})`,
      });

      // Atualiza saldo em estoque no material
      const newStock = Math.max(0, Number(matchedMaterial.currentStock) - deductionQty);
      await db
        .update(materials)
        .set({ currentStock: String(newStock), updatedAt: new Date() })
        .where(eq(materials.id, matchedMaterial.id));
    }
  }

  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard");

  redirect(`/dashboard/orders`);
}

/**
 * Atualiza status de produção do Pedido
 */
export async function updateOrderStatusAction(orderId: string, newStatus: string, notes?: string) {
  const [currentOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!currentOrder) return;

  const previousStatus = currentOrder.status;

  await db
    .update(orders)
    .set({
      status: newStatus,
      completedAt: newStatus === "concluido" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  await db.insert(orderHistory).values({
    orderId,
    previousStatus,
    newStatus,
    notes: notes || `Status atualizado de ${previousStatus} para ${newStatus}`,
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
}

/**
 * Registra recebimento de parcela no Financeiro
 */
export async function receivePaymentAction(receivableId: string, paymentMethod = "pix", notes?: string) {
  const [receivable] = await db
    .select()
    .from(accountsReceivable)
    .where(eq(accountsReceivable.id, receivableId))
    .limit(1);

  if (!receivable || receivable.status === "pago") return;

  // Atualiza a parcela para quitada
  await db
    .update(accountsReceivable)
    .set({
      paidAmountCents: receivable.amountCents,
      balanceCents: 0,
      status: "pago",
    })
    .where(eq(accountsReceivable.id, receivableId));

  // Cria o registro no histórico de pagamentos recebidos
  await db.insert(paymentsReceived).values({
    receivableId: receivable.id,
    amountCents: receivable.amountCents,
    paymentDate: new Date(),
    paymentMethod,
    notes: notes || "Baixa de pagamento confirmada",
  });

  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard");
}
