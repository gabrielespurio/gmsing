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
  productComponents,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ItemPayload {
  productName: string;
  dimensions?: string;
  summaryDescription?: string;
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
 * Gera o próximo código único para orçamento no formato ORC-YYYY-XXX
 * Analisa o maior número existente no ano atual para evitar colisões decorrentes de exclusões.
 */
export async function getNextQuoteCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `ORC-${currentYear}-`;

  const existingQuotes = await db
    .select({ code: quotes.code })
    .from(quotes)
    .where(sql`${quotes.code} LIKE ${prefix + "%"}`);

  let maxSeq = 0;
  const existingSet = new Set<string>();

  for (const q of existingQuotes) {
    if (q.code) {
      existingSet.add(q.code);
      if (q.code.startsWith(prefix)) {
        const numPart = parseInt(q.code.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
  while (existingSet.has(candidate)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Gera o próximo código único para pedido no formato PED-YYYY-XXX
 * Analisa o maior número existente no ano atual para evitar colisões.
 */
export async function getNextOrderCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PED-${currentYear}-`;

  const existingOrders = await db
    .select({ code: orders.code })
    .from(orders)
    .where(sql`${orders.code} LIKE ${prefix + "%"}`);

  let maxSeq = 0;
  const existingSet = new Set<string>();

  for (const o of existingOrders) {
    if (o.code) {
      existingSet.add(o.code);
      if (o.code.startsWith(prefix)) {
        const numPart = parseInt(o.code.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
  while (existingSet.has(candidate)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(3, "0")}`;
  }

  return candidate;
}

/**
 * Criação de novo orçamento com cálculo e snapshot de itens
 */
export async function createQuoteAction(
  formData: FormData
): Promise<{ success: boolean; quoteId?: string; error?: string }> {
  try {
    const clientId = formData.get("clientId") as string;
    const title = (formData.get("title") as string) || "COMUNICAÇÃO VISUAL";
    const contactPerson = (formData.get("contactPerson") as string) || "";
    const billingAddress = (formData.get("billingAddress") as string) || "";
    const installationAddress = (formData.get("installationAddress") as string) || "";
    const includedServices =
      (formData.get("includedServices") as string) ||
      "Usinagens técnicas, subestrutura metálica, equipe especializada de instalação e limpeza pós-obra.";
    const warrantyTerms =
      (formData.get("warrantyTerms") as string) ||
      "12 (doze) meses contra defeitos de fabricação mecânica, ancoragem e integridade dos materiais.";
    const cityStateLocation =
      (formData.get("cityStateLocation") as string) || "São José do Rio Preto/SP";
    const deliveryTimeDays = parseInt((formData.get("deliveryTimeDays") as string) || "30", 10);
    const validityDays = parseInt((formData.get("validityDays") as string) || "30", 10);
    const paymentConditions =
      (formData.get("paymentConditions") as string) ||
      "50% no aceite formal da proposta e 50% após a conclusão e validação da instalação, mediante emissão de Nota Fiscal Eletrônica.";
    const commercialNotes = (formData.get("commercialNotes") as string) || "";
    const internalNotes = (formData.get("internalNotes") as string) || "";
    const itemsJson = formData.get("items") as string;

    if (!clientId) {
      return { success: false, error: "Cliente é obrigatório." };
    }

    let items: ItemPayload[] = [];
    try {
      items = JSON.parse(itemsJson || "[]");
    } catch {
      return { success: false, error: "Itens do orçamento inválidos." };
    }

    if (items.length === 0) {
      return { success: false, error: "Adicione pelo menos um item ao orçamento." };
    }

    // Gera código único ORC-YYYY-XXX sem colisão
    const quoteCode = await getNextQuoteCode();

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
        title,
        contactPerson,
        billingAddress,
        installationAddress,
        includedServices,
        warrantyTerms,
        cityStateLocation,
        paymentConditions,
        deliveryTimeDays,
        validityDays,
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
        dimensions: item.dimensions || null,
        summaryDescription: item.summaryDescription || item.productName,
        description: item.description || "",
        quantity: Number(item.quantity) || 1,
        widthMeters: item.widthMeters ? String(item.widthMeters) : null,
        heightMeters: item.heightMeters ? String(item.heightMeters) : null,
        unitArea: item.unitArea ? String(item.unitArea) : null,
        totalArea: item.totalArea ? String(item.totalArea) : null,
        pricingMethod: item.pricingMethod || "manual",
        unitCostCents: Math.round(Number(item.unitCostCents) || 0),
        totalCostCents: Math.round(Number(item.totalCostCents) || 0),
        unitPriceCents: Math.round(Number(item.unitPriceCents) || 0),
        totalPriceCents: Math.round(Number(item.totalPriceCents) || 0),
        notes: item.notes || null,
      });
    }

    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard");
    return { success: true, quoteId: insertedQuote.id };
  } catch (error: unknown) {
    console.error("Erro em createQuoteAction:", error);
    const msg = error instanceof Error ? error.message : "Erro interno ao salvar orçamento.";
    return { success: false, error: msg };
  }
}

/**
 * Obtém todos os dados do orçamento e seus itens para edição
 */
export async function getQuoteForEditAction(quoteId: string) {
  if (!quoteId) {
    throw new Error("ID do orçamento não fornecido.");
  }

  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId))
    .limit(1);

  if (!quote) {
    throw new Error("Orçamento não encontrado.");
  }

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId));

  const validityDays =
    quote.validityDays ??
    (quote.validUntil && quote.issueDate
      ? Math.max(
          1,
          Math.round(
            (new Date(quote.validUntil).getTime() - new Date(quote.issueDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 30);

  const mappedItems: ItemPayload[] = items.map((it) => ({
    productName: it.productName,
    dimensions: it.dimensions || undefined,
    summaryDescription: it.summaryDescription || it.productName,
    description: it.description || "",
    quantity: it.quantity,
    widthMeters: it.widthMeters ? Number(it.widthMeters) : undefined,
    heightMeters: it.heightMeters ? Number(it.heightMeters) : undefined,
    unitArea: it.unitArea ? Number(it.unitArea) : undefined,
    totalArea: it.totalArea ? Number(it.totalArea) : undefined,
    pricingMethod: it.pricingMethod || "manual",
    unitCostCents: it.unitCostCents || 0,
    totalCostCents: it.totalCostCents || 0,
    unitPriceCents: it.unitPriceCents,
    totalPriceCents: it.totalPriceCents,
    notes: it.notes || "",
  }));

  return {
    quote: {
      ...quote,
      validityDays,
    },
    items: mappedItems,
  };
}

/**
 * Edição completa do orçamento e atualização de seus itens
 */
export async function updateQuoteAction(
  formData: FormData
): Promise<{ success: boolean; quoteId?: string; error?: string }> {
  try {
    const quoteId = formData.get("quoteId") as string;
    if (!quoteId) {
      return { success: false, error: "ID do orçamento é obrigatório." };
    }

    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!existingQuote) {
      return { success: false, error: "Orçamento não encontrado." };
    }

    const clientId = formData.get("clientId") as string;
    const status = (formData.get("status") as string) || existingQuote.status;
    const title = (formData.get("title") as string) || "COMUNICAÇÃO VISUAL";
    const contactPerson = (formData.get("contactPerson") as string) || "";
    const billingAddress = (formData.get("billingAddress") as string) || "";
    const installationAddress = (formData.get("installationAddress") as string) || "";
    const includedServices = (formData.get("includedServices") as string) || "";
    const warrantyTerms = (formData.get("warrantyTerms") as string) || "";
    const cityStateLocation =
      (formData.get("cityStateLocation") as string) || "São José do Rio Preto/SP";
    const deliveryTimeDays = parseInt((formData.get("deliveryTimeDays") as string) || "30", 10);
    const validityDays = parseInt((formData.get("validityDays") as string) || "30", 10);
    const paymentConditions = (formData.get("paymentConditions") as string) || "";
    const commercialNotes = (formData.get("commercialNotes") as string) || "";
    const internalNotes = (formData.get("internalNotes") as string) || "";
    const itemsJson = formData.get("items") as string;

    if (!clientId) {
      return { success: false, error: "Cliente é obrigatório." };
    }

    let items: ItemPayload[] = [];
    try {
      items = JSON.parse(itemsJson || "[]");
    } catch {
      return { success: false, error: "Itens do orçamento inválidos." };
    }

    if (items.length === 0) {
      return { success: false, error: "Adicione pelo menos um item ao orçamento." };
    }

    // Recalcula validUntil a partir da data de emissão
    const validUntil = new Date(existingQuote.issueDate);
    validUntil.setDate(validUntil.getDate() + validityDays);

    let subtotalCents = 0;
    let estimatedCostCents = 0;

    for (const item of items) {
      subtotalCents += Math.round(Number(item.totalPriceCents || 0));
      estimatedCostCents += Math.round(Number(item.totalCostCents || 0));
    }

    const discountCents = existingQuote.discountCents || 0;
    const totalCents = subtotalCents - discountCents;

    const revision =
      existingQuote.status === "rascunho"
        ? existingQuote.revision
        : existingQuote.revision + 1;

    await db
      .update(quotes)
      .set({
        clientId,
        status,
        revision,
        validUntil,
        title,
        contactPerson,
        billingAddress,
        installationAddress,
        includedServices,
        warrantyTerms,
        cityStateLocation,
        paymentConditions,
        deliveryTimeDays,
        validityDays,
        commercialNotes,
        internalNotes,
        subtotalCents,
        totalCents,
        estimatedCostCents,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    // Substitui itens vinculados
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    for (const item of items) {
      await db.insert(quoteItems).values({
        quoteId,
        productName: item.productName,
        dimensions: item.dimensions || null,
        summaryDescription: item.summaryDescription || item.productName,
        description: item.description || "",
        quantity: Number(item.quantity) || 1,
        widthMeters: item.widthMeters ? String(item.widthMeters) : null,
        heightMeters: item.heightMeters ? String(item.heightMeters) : null,
        unitArea: item.unitArea ? String(item.unitArea) : null,
        totalArea: item.totalArea ? String(item.totalArea) : null,
        pricingMethod: item.pricingMethod || "manual",
        unitCostCents: Math.round(Number(item.unitCostCents) || 0),
        totalCostCents: Math.round(Number(item.totalCostCents) || 0),
        unitPriceCents: Math.round(Number(item.unitPriceCents) || 0),
        totalPriceCents: Math.round(Number(item.totalPriceCents) || 0),
        notes: item.notes || null,
      });
    }

    revalidatePath("/dashboard/quotes");
    revalidatePath(`/dashboard/quotes/${quoteId}`);
    revalidatePath("/dashboard");

    return { success: true, quoteId };
  } catch (error: unknown) {
    console.error("Erro em updateQuoteAction:", error);
    const msg = error instanceof Error ? error.message : "Erro interno ao atualizar orçamento.";
    return { success: false, error: msg };
  }
}

/**
 * Exclui um orçamento e seus itens vinculados
 */
export async function deleteQuoteAction(
  quoteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!quoteId) {
      return { success: false, error: "ID do orçamento não fornecido." };
    }

    const [quote] = await db
      .select({ id: quotes.id, code: quotes.code })
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!quote) {
      return { success: false, error: "Orçamento não encontrado." };
    }

    // Verifica se há pedido gerado a partir deste orçamento
    const linkedOrders = await db
      .select({ code: orders.code })
      .from(orders)
      .where(eq(orders.quoteId, quoteId))
      .limit(1);

    if (linkedOrders.length > 0) {
      return {
        success: false,
        error: `Não é possível excluir o orçamento ${quote.code} pois ele já foi convertido no pedido ${linkedOrders[0].code}. Cancele ou remova o pedido primeiro.`,
      };
    }

    // Remove itens primeiro
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

    // Remove o orçamento
    await db.delete(quotes).where(eq(quotes.id, quoteId));

    revalidatePath("/dashboard/quotes");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    console.error("Erro em deleteQuoteAction:", error);
    const msg = error instanceof Error ? error.message : "Erro interno ao excluir orçamento.";
    return { success: false, error: msg };
  }
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

  // Gera código único para o pedido PED-YYYY-XXX sem colisão
  const orderCode = await getNextOrderCode();

  const expectedDeliveryDate = expectedDeliveryDateStr ? new Date(expectedDeliveryDateStr) : new Date(Date.now() + 15 * 86400000);
  const firstDueDate = firstDueDateStr ? new Date(firstDueDateStr) : new Date();

  // Insere Pedido
  const orderTitle = items.length > 0 ? items.map((i) => i.productName).join(" + ") : `Orçamento ${quote.code}`;
  const [newOrder] = await db
    .insert(orders)
    .values({
      code: orderCode,
      title: orderTitle,
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

/**
 * CRIAÇÃO DIRETA: Pedido criado diretamente sem vínculo obrigatório com Orçamento
 * - Cria Pedido ('orders') com título/descrição, cliente, valor, pagamento e prazo
 * - Gera parcelas no Contas a Receber ('accounts_receivable')
 * - Opcionalmente deduz matéria-prima do estoque ('stock_movements')
 */
export async function createDirectOrderAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const title = (formData.get("title") as string) || "Pedido Direto";
  const totalAmountStr = (formData.get("totalAmount") as string) || "0";
  const paymentMethod = (formData.get("paymentMethod") as string) || "pix";
  const installmentsCount = parseInt((formData.get("installmentsCount") as string) || "1", 10);
  const firstDueDateStr = formData.get("firstDueDate") as string;
  const installationAddress = (formData.get("installationAddress") as string) || "";
  const expectedDeliveryDateStr = formData.get("expectedDeliveryDate") as string;
  const productionNotes = (formData.get("productionNotes") as string) || "";
  const materialId = formData.get("materialId") as string;
  const materialQuantity = parseFloat((formData.get("materialQuantity") as string) || "0");
  const productId = formData.get("productId") as string;
  const productQuantity = parseFloat((formData.get("productQuantity") as string) || "1");

  if (!clientId) {
    throw new Error("Cliente é obrigatório para gerar o pedido.");
  }

  // Converte valor em reais (ex: 1500 ou 1.500,00) para centavos
  const cleanedValue = totalAmountStr.replace(/\./g, "").replace(",", ".");
  const totalAmountCents = Math.round(parseFloat(cleanedValue || "0") * 100);

  if (totalAmountCents <= 0) {
    throw new Error("O valor total do pedido deve ser maior que zero.");
  }

  // Gera código único para o pedido PED-YYYY-XXX sem colisão
  const orderCode = await getNextOrderCode();

  const expectedDeliveryDate = expectedDeliveryDateStr
    ? new Date(expectedDeliveryDateStr)
    : new Date(Date.now() + 15 * 86400000);
  const firstDueDate = firstDueDateStr ? new Date(firstDueDateStr) : new Date();

  // Buscar componentes de estoque do produto se selecionado
  const productComps = productId
    ? await db
        .select({
          materialId: productComponents.materialId,
          quantityPerUnit: productComponents.quantityPerUnit,
        })
        .from(productComponents)
        .where(eq(productComponents.productId, productId))
    : [];

  const stockDeducted = Boolean(productComps.length > 0 || (materialId && materialQuantity > 0));

  const [newOrder] = await db
    .insert(orders)
    .values({
      code: orderCode,
      title,
      quoteId: null,
      clientId,
      status: "em_producao",
      priority: "normal",
      paymentMethod,
      paymentTerms: `${installmentsCount}x via ${paymentMethod.toUpperCase()}`,
      installmentsCount,
      totalAmountCents,
      stockDeducted,
      installationAddress,
      expectedStartDate: new Date(),
      expectedDeliveryDate,
      productionNotes,
    })
    .returning();

  await db.insert(orderHistory).values({
    orderId: newOrder.id,
    previousStatus: null,
    newStatus: "em_producao",
    notes: `Pedido criado diretamente: ${title}.`,
  });

  // INTEGRAÇÃO FINANCEIRA: Gera Contas a Receber divididas em parcelas
  const baseInstallmentAmount = Math.floor(totalAmountCents / installmentsCount);
  const remainder = totalAmountCents % installmentsCount;

  for (let i = 1; i <= installmentsCount; i++) {
    const installmentAmount = i === 1 ? baseInstallmentAmount + remainder : baseInstallmentAmount;
    const installmentDueDate = new Date(firstDueDate);
    installmentDueDate.setDate(installmentDueDate.getDate() + (i - 1) * 30);

    await db.insert(accountsReceivable).values({
      clientId,
      quoteId: null,
      orderId: newOrder.id,
      description: `Parcela ${i}/${installmentsCount} - ${title} (${newOrder.code})`,
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

  // INTEGRAÇÃO COM ESTOQUE: Baixa de insumos da ficha técnica do produto ou material avulso
  if (productComps.length > 0) {
    for (const comp of productComps) {
      const deductionQty = (parseFloat(comp.quantityPerUnit) || 1) * productQuantity;
      const [mat] = await db.select().from(materials).where(eq(materials.id, comp.materialId)).limit(1);
      if (mat) {
        await db.insert(stockMovements).values({
          materialId: mat.id,
          orderId: newOrder.id,
          type: "saida",
          quantity: String(deductionQty),
          unitCostCents: mat.costPriceCents,
          reason: `Baixa de estoque (Ficha Técnica Produto) - Pedido ${newOrder.code} (${title})`,
        });

        const newStock = Math.max(0, Number(mat.currentStock) - deductionQty);
        await db
          .update(materials)
          .set({ currentStock: String(newStock), updatedAt: new Date() })
          .where(eq(materials.id, mat.id));
      }
    }
  } else if (materialId && materialQuantity > 0) {
    const [mat] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
    if (mat) {
      await db.insert(stockMovements).values({
        materialId: mat.id,
        orderId: newOrder.id,
        type: "saida",
        quantity: String(materialQuantity),
        unitCostCents: mat.costPriceCents,
        reason: `Baixa de estoque por Pedido Direto ${newOrder.code} (${title})`,
      });

      const newStock = Math.max(0, Number(mat.currentStock) - materialQuantity);
      await db
        .update(materials)
        .set({ currentStock: String(newStock), updatedAt: new Date() })
        .where(eq(materials.id, mat.id));
    }
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard");

  return { success: true, orderId: newOrder.id };
}
