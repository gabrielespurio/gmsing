"use server";

import { db } from "@/db";
import { productsServices, productComponents, materials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ComponentInput {
  materialId: string;
  quantityPerUnit: number;
  notes?: string;
}

export async function createProductAction(formData: FormData) {
  const code = (formData.get("code") as string)?.trim() || `PRD-${Date.now().toString().slice(-4)}`;
  const name = (formData.get("name") as string)?.trim();
  const type = (formData.get("type") as string) || "produto";
  const category = (formData.get("category") as string)?.trim() || (type === "servico" ? "Serviço" : "Geral");
  const unit = (formData.get("unit") as string)?.trim() || (type === "servico" ? "hora" : "un");

  const salePriceRaw = (formData.get("salePrice") as string) || "0";
  const costPriceRaw = (formData.get("costPrice") as string) || "0";
  const markupPercentRaw = (formData.get("markupPercent") as string) || "50";
  const description = (formData.get("description") as string)?.trim() || null;
  const componentsJson = (formData.get("components") as string)?.trim();

  if (!name) {
    throw new Error("Nome do produto ou serviço é obrigatório.");
  }

  // Converter valor em centavos
  const salePriceCents = Math.round(
    parseFloat(salePriceRaw.replace(/\./g, "").replace(",", ".")) * 100
  ) || 0;

  const costPriceCents = Math.round(
    parseFloat(costPriceRaw.replace(/\./g, "").replace(",", ".")) * 100
  ) || 0;

  const markupPercent = (parseFloat(markupPercentRaw) || 50).toFixed(2);

  const [inserted] = await db
    .insert(productsServices)
    .values({
      code,
      name,
      type,
      category,
      unit,
      salePriceCents,
      costPriceCents,
      markupPercent,
      description,
      active: true,
    })
    .returning({ id: productsServices.id });

  // Inserir componentes de estoque na ficha técnica se houver
  if (componentsJson && inserted?.id) {
    try {
      const components: ComponentInput[] = JSON.parse(componentsJson);
      if (Array.isArray(components) && components.length > 0) {
        for (const comp of components) {
          if (comp.materialId && comp.quantityPerUnit > 0) {
            await db.insert(productComponents).values({
              productId: inserted.id,
              materialId: comp.materialId,
              quantityPerUnit: comp.quantityPerUnit.toString(),
              notes: comp.notes || null,
            });
          }
        }
      }
    } catch (e) {
      console.error("Erro ao salvar componentes do produto:", e);
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function updateProductAction(formData: FormData) {
  const id = formData.get("id") as string;
  const code = (formData.get("code") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const type = (formData.get("type") as string) || "produto";
  const category = (formData.get("category") as string)?.trim() || (type === "servico" ? "Serviço" : "Geral");
  const unit = (formData.get("unit") as string)?.trim() || (type === "servico" ? "hora" : "un");

  const salePriceRaw = (formData.get("salePrice") as string) || "0";
  const costPriceRaw = (formData.get("costPrice") as string) || "0";
  const markupPercentRaw = (formData.get("markupPercent") as string) || "50";
  const description = (formData.get("description") as string)?.trim() || null;
  const componentsJson = (formData.get("components") as string)?.trim();

  if (!id || !name) {
    throw new Error("ID e Nome do produto são obrigatórios.");
  }

  const salePriceCents = Math.round(
    parseFloat(salePriceRaw.replace(/\./g, "").replace(",", ".")) * 100
  ) || 0;

  const costPriceCents = Math.round(
    parseFloat(costPriceRaw.replace(/\./g, "").replace(",", ".")) * 100
  ) || 0;

  const markupPercent = (parseFloat(markupPercentRaw) || 50).toFixed(2);

  await db
    .update(productsServices)
    .set({
      code,
      name,
      type,
      category,
      unit,
      salePriceCents,
      costPriceCents,
      markupPercent,
      description,
      updatedAt: new Date(),
    })
    .where(eq(productsServices.id, id));

  // Atualizar componentes (apagar antigos e recriar novos)
  if (componentsJson) {
    try {
      const components: ComponentInput[] = JSON.parse(componentsJson);
      await db.delete(productComponents).where(eq(productComponents.productId, id));

      if (Array.isArray(components) && components.length > 0) {
        for (const comp of components) {
          if (comp.materialId && comp.quantityPerUnit > 0) {
            await db.insert(productComponents).values({
              productId: id,
              materialId: comp.materialId,
              quantityPerUnit: comp.quantityPerUnit.toString(),
              notes: comp.notes || null,
            });
          }
        }
      }
    } catch (e) {
      console.error("Erro ao atualizar componentes do produto:", e);
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function toggleProductStatusAction(productId: string, active: boolean) {
  await db
    .update(productsServices)
    .set({ active, updatedAt: new Date() })
    .where(eq(productsServices.id, productId));

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function deleteProductAction(productId: string) {
  await db.delete(productsServices).where(eq(productsServices.id, productId));

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function getProductComponentsAction(productId: string) {
  const list = await db
    .select({
      id: productComponents.id,
      materialId: productComponents.materialId,
      materialName: materials.name,
      materialUnit: materials.unit,
      materialCostCents: materials.costPriceCents,
      quantityPerUnit: productComponents.quantityPerUnit,
      notes: productComponents.notes,
    })
    .from(productComponents)
    .innerJoin(materials, eq(productComponents.materialId, materials.id))
    .where(eq(productComponents.productId, productId));

  return list;
}
