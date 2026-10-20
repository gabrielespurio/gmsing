"use server";

import { db } from "@/db";
import { materials, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMaterialAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "Outros";
  const unit = (formData.get("unit") as string)?.trim() || "un";
  const costPriceStr = (formData.get("costPrice") as string) || "0";
  const currentStockStr = (formData.get("currentStock") as string) || "0";
  const minStockStr = (formData.get("minStock") as string) || "5";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    throw new Error("Nome do material é obrigatório.");
  }

  // Converte valor em reais (ex: 280,00 ou 280.00) para centavos
  const cleanedCost = costPriceStr.replace(/\./g, "").replace(",", ".");
  const costPriceCents = Math.round(parseFloat(cleanedCost || "0") * 100);

  const cleanedCurrentStock = currentStockStr.replace(",", ".");
  const currentStock = parseFloat(cleanedCurrentStock || "0");

  const cleanedMinStock = minStockStr.replace(",", ".");
  const minStock = parseFloat(cleanedMinStock || "5");

  const [newMaterial] = await db
    .insert(materials)
    .values({
      name,
      category,
      unit,
      costPriceCents,
      currentStock: String(currentStock),
      minStock: String(minStock),
      notes,
      active: true,
    })
    .returning();

  // Se começou com saldo > 0, registra a entrada inicial
  if (currentStock > 0) {
    await db.insert(stockMovements).values({
      materialId: newMaterial.id,
      type: "entrada",
      quantity: String(currentStock),
      unitCostCents: costPriceCents,
      reason: "Saldo inicial de cadastro de material",
    });
  }

  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function updateMaterialAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "Outros";
  const unit = (formData.get("unit") as string)?.trim() || "un";
  const costPriceStr = (formData.get("costPrice") as string) || "0";
  const currentStockStr = (formData.get("currentStock") as string) || "0";
  const minStockStr = (formData.get("minStock") as string) || "5";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!id || !name) {
    throw new Error("Identificador e nome do material são obrigatórios.");
  }

  const cleanedCost = costPriceStr.replace(/\./g, "").replace(",", ".");
  const costPriceCents = Math.round(parseFloat(cleanedCost || "0") * 100);

  const cleanedCurrentStock = currentStockStr.replace(",", ".");
  const newStockNum = parseFloat(cleanedCurrentStock || "0");

  const cleanedMinStock = minStockStr.replace(",", ".");
  const minStock = parseFloat(cleanedMinStock || "5");

  const [existing] = await db.select().from(materials).where(eq(materials.id, id)).limit(1);

  if (existing) {
    const oldStock = Number(existing.currentStock);
    const diff = newStockNum - oldStock;

    if (diff !== 0) {
      await db.insert(stockMovements).values({
        materialId: id,
        type: diff > 0 ? "entrada" : "ajuste",
        quantity: String(Math.abs(diff)),
        unitCostCents: costPriceCents,
        reason: diff > 0 ? "Ajuste manual de estoque (+)" : "Ajuste manual de estoque (-)",
      });
    }
  }

  await db
    .update(materials)
    .set({
      name,
      category,
      unit,
      costPriceCents,
      currentStock: String(newStockNum),
      minStock: String(minStock),
      notes,
      updatedAt: new Date(),
    })
    .where(eq(materials.id, id));

  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function deleteMaterialAction(id: string) {
  if (!id) return;

  // Verifica se o material tem movimentações registradas
  const movements = await db
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(eq(stockMovements.materialId, id))
    .limit(1);

  if (movements.length > 0) {
    // Se possui histórico de movimentação ou pedido, inativa para manter integridade
    await db
      .update(materials)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(materials.id, id));
  } else {
    // Se não possui nenhum vínculo, remove fisicamente
    await db.delete(materials).where(eq(materials.id, id));
  }

  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}
