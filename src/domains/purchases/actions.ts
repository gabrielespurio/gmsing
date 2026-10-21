"use server";

import { db } from "@/db";
import {
  purchases,
  purchaseItems,
  suppliers,
  materials,
  stockMovements,
  accountsPayable,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface PurchaseItemInput {
  materialId?: string; // Se fornecido, vincula ao material existente
  newMaterialName?: string; // Se fornecido e materialId vazio, cria material
  newMaterialCategory?: string;
  rawProductName: string;
  rawProductCode?: string;
  ncm?: string;
  cfop?: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  totalCostCents: number;
}

export interface InstallmentInput {
  number: string;
  dueDate: string;
  amountCents: number;
}

export interface CreatePurchasePayload {
  supplierId?: string;
  supplierData?: {
    name: string;
    tradeName?: string;
    document?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  nfeKey?: string;
  nfeNumber?: string;
  nfeSeries?: string;
  issueDate?: string;
  notes?: string;
  items: PurchaseItemInput[];
  installments: InstallmentInput[];
}

/**
 * Cria uma nova compra (via XML importado ou lançamento manual),
 * integrando com Estoque (entradas e saldo) e Financeiro (Contas a Pagar).
 */
export async function createPurchaseAction(payload: CreatePurchasePayload) {
  const {
    supplierId: providedSupplierId,
    supplierData,
    nfeKey,
    nfeNumber,
    nfeSeries,
    issueDate,
    notes,
    items,
    installments,
  } = payload;

  if (!items || items.length === 0) {
    throw new Error("A compra deve conter pelo menos um item.");
  }

  // 1. Identificar ou Cadastrar o Fornecedor
  let resolvedSupplierId = providedSupplierId;
  let supplierName = supplierData?.name || "Fornecedor";

  if (!resolvedSupplierId && supplierData?.document) {
    // Procura fornecedor existente pelo CNPJ/CPF
    const [existing] = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.document, supplierData.document))
      .limit(1);

    if (existing) {
      resolvedSupplierId = existing.id;
      supplierName = existing.name;
    } else if (supplierData.name) {
      // Cria fornecedor automaticamente a partir dos dados do XML
      const [newSup] = await db
        .insert(suppliers)
        .values({
          name: supplierData.name,
          tradeName: supplierData.tradeName || null,
          document: supplierData.document,
          phone: supplierData.phone || null,
          address: supplierData.address || (supplierData.city ? `${supplierData.city} - ${supplierData.state || "SP"}` : null),
          notes: "Cadastrado automaticamente via importação de XML NF-e.",
          active: true,
        })
        .returning({ id: suppliers.id, name: suppliers.name });

      resolvedSupplierId = newSup.id;
      supplierName = newSup.name;
    }
  } else if (!resolvedSupplierId && supplierData?.name) {
    const [newSup] = await db
      .insert(suppliers)
      .values({
        name: supplierData.name,
        tradeName: supplierData.tradeName || null,
        phone: supplierData.phone || null,
        active: true,
      })
      .returning({ id: suppliers.id, name: suppliers.name });

    resolvedSupplierId = newSup.id;
    supplierName = newSup.name;
  }

  // 2. Gerar Código Único da Compra (Ex: COM-2026-001)
  const currentYear = new Date().getFullYear();
  const allPurchases = await db.select({ id: purchases.id }).from(purchases);
  const nextSeq = allPurchases.length + 1;
  const purchaseCode = `COM-${currentYear}-${String(nextSeq).padStart(3, "0")}`;

  // 3. Calcular Total da Compra
  const totalAmountCents = items.reduce((acc, it) => acc + Math.round(it.totalCostCents || 0), 0);

  // 4. Inserir Registro da Compra
  const [newPurchase] = await db
    .insert(purchases)
    .values({
      code: purchaseCode,
      supplierId: resolvedSupplierId || null,
      nfeKey: nfeKey || null,
      nfeNumber: nfeNumber || null,
      nfeSeries: nfeSeries || null,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      entryDate: new Date(),
      totalAmountCents,
      status: "concluido",
      notes: notes || (nfeNumber ? `Entrada de NF-e nº ${nfeNumber} série ${nfeSeries || "1"}` : null),
    })
    .returning();

  // 5. Processar Itens e Integração com ESTOQUE
  for (const item of items) {
    let targetMaterialId = item.materialId;

    // Se solicitado criar novo material no estoque
    if (!targetMaterialId && item.newMaterialName) {
      const [createdMat] = await db
        .insert(materials)
        .values({
          name: item.newMaterialName,
          category: item.newMaterialCategory || "Geral",
          unit: item.unit.toLowerCase() || "un",
          costPriceCents: Math.round(item.unitCostCents || 0),
          currentStock: String(item.quantity || 0),
          minStock: "5",
          supplierId: resolvedSupplierId || null,
          notes: `Cadastrado automaticamente pela compra ${purchaseCode}.`,
          active: true,
        })
        .returning({ id: materials.id });

      targetMaterialId = createdMat.id;

      // Movimentação de estoque (Entrada inicial por compra)
      await db.insert(stockMovements).values({
        materialId: createdMat.id,
        type: "entrada",
        quantity: String(item.quantity),
        unitCostCents: Math.round(item.unitCostCents || 0),
        reason: `Entrada por Compra ${purchaseCode} (NF-e ${nfeNumber || "Manual"})`,
      });
    } else if (targetMaterialId) {
      // Atualiza material existente
      const [mat] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, targetMaterialId))
        .limit(1);

      if (mat) {
        const nextStock = Number(mat.currentStock) + Number(item.quantity);
        await db
          .update(materials)
          .set({
            currentStock: String(nextStock),
            costPriceCents: Math.round(item.unitCostCents || mat.costPriceCents),
            updatedAt: new Date(),
          })
          .where(eq(materials.id, targetMaterialId));

        // Registra movimentação de entrada no estoque
        await db.insert(stockMovements).values({
          materialId: targetMaterialId,
          type: "entrada",
          quantity: String(item.quantity),
          unitCostCents: Math.round(item.unitCostCents || 0),
          reason: `Entrada por Compra ${purchaseCode} (NF-e ${nfeNumber || "Manual"})`,
        });
      }
    }

    // Salva o item da compra
    await db.insert(purchaseItems).values({
      purchaseId: newPurchase.id,
      materialId: targetMaterialId || null,
      rawProductName: item.rawProductName,
      rawProductCode: item.rawProductCode || null,
      ncm: item.ncm || null,
      cfop: item.cfop || null,
      quantity: String(item.quantity),
      unit: item.unit,
      unitCostCents: Math.round(item.unitCostCents || 0),
      totalCostCents: Math.round(item.totalCostCents || 0),
    });
  }

  // 6. Integração com FINANCEIRO (Contas a Pagar)
  if (installments && installments.length > 0) {
    for (const inst of installments) {
      const amountCents = Math.round(inst.amountCents || 0);
      if (amountCents > 0) {
        await db.insert(accountsPayable).values({
          supplierId: resolvedSupplierId || null,
          purchaseId: newPurchase.id,
          beneficiaryName: supplierName,
          category: "material",
          description: `Parcela ${inst.number} - Compra ${purchaseCode} (NF-e ${nfeNumber || "Manual"}) - ${supplierName}`,
          amountCents,
          paidAmountCents: 0,
          balanceCents: amountCents,
          dueDate: inst.dueDate ? new Date(inst.dueDate) : new Date(Date.now() + 30 * 86400000),
          status: "pendente",
        });
      }
    }
  } else if (totalAmountCents > 0) {
    // Parcela única padrão para 30 dias se nenhuma for discriminada
    const defaultDueDate = new Date(Date.now() + 30 * 86400000);
    await db.insert(accountsPayable).values({
      supplierId: resolvedSupplierId || null,
      purchaseId: newPurchase.id,
      beneficiaryName: supplierName,
      category: "material",
      description: `Compra ${purchaseCode} (NF-e ${nfeNumber || "Manual"}) - ${supplierName}`,
      amountCents: totalAmountCents,
      paidAmountCents: 0,
      balanceCents: totalAmountCents,
      dueDate: defaultDueDate,
      status: "pendente",
    });
  }

  // Revalida páginas
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard");

  return { success: true, purchaseId: newPurchase.id };
}

/**
 * Cancela uma compra e estorna a entrada de materiais do estoque e parcelas a pagar
 */
export async function cancelPurchaseAction(purchaseId: string) {
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);

  if (!purchase) {
    throw new Error("Compra não encontrada.");
  }

  if (purchase.status === "cancelado") {
    return { success: true };
  }

  // 1. Buscar itens vinculados a materiais e estornar estoque
  const items = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, purchaseId));

  for (const it of items) {
    if (it.materialId) {
      const [mat] = await db
        .select()
        .from(materials)
        .where(eq(materials.id, it.materialId))
        .limit(1);

      if (mat) {
        const estornoQtd = Number(it.quantity);
        const newStock = Math.max(0, Number(mat.currentStock) - estornoQtd);

        await db
          .update(materials)
          .set({ currentStock: String(newStock), updatedAt: new Date() })
          .where(eq(materials.id, it.materialId));

        await db.insert(stockMovements).values({
          materialId: it.materialId,
          type: "saida",
          quantity: String(estornoQtd),
          unitCostCents: it.unitCostCents,
          reason: `Estorno de entrada por Cancelamento da Compra ${purchase.code}`,
        });
      }
    }
  }

  // 2. Cancelar Contas a Pagar associadas que ainda não foram pagas
  await db
    .update(accountsPayable)
    .set({ status: "cancelado" })
    .where(eq(accountsPayable.purchaseId, purchaseId));

  // 3. Atualizar status da compra
  await db
    .update(purchases)
    .set({ status: "cancelado" })
    .where(eq(purchases.id, purchaseId));

  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/financial");
  revalidatePath("/dashboard");

  return { success: true };
}
