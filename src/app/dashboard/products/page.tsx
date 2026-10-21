export const instant = false;

import { db } from "@/db";
import {
  productsServices,
  productComponents,
  materials,
  materialCategories,
  measurementUnits,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProductManager, ProductItem } from "./product-manager";

export default async function ProductsPage() {
  const [productList, materialsList, categoriesList, unitsList, allComponents] = await Promise.all([
    db
      .select({
        id: productsServices.id,
        code: productsServices.code,
        name: productsServices.name,
        type: productsServices.type,
        category: productsServices.category,
        unit: productsServices.unit,
        salePriceCents: productsServices.salePriceCents,
        costPriceCents: productsServices.costPriceCents,
        markupPercent: productsServices.markupPercent,
        description: productsServices.description,
        active: productsServices.active,
        createdAt: productsServices.createdAt,
      })
      .from(productsServices)
      .orderBy(desc(productsServices.createdAt)),

    db
      .select({
        id: materials.id,
        name: materials.name,
        category: materials.category,
        unit: materials.unit,
        costPriceCents: materials.costPriceCents,
      })
      .from(materials)
      .where(eq(materials.active, true))
      .orderBy(materials.name),

    db
      .select({
        id: materialCategories.id,
        name: materialCategories.name,
      })
      .from(materialCategories)
      .where(eq(materialCategories.active, true))
      .orderBy(materialCategories.name),

    db
      .select({
        id: measurementUnits.id,
        code: measurementUnits.code,
        name: measurementUnits.name,
      })
      .from(measurementUnits)
      .where(eq(measurementUnits.active, true))
      .orderBy(measurementUnits.code),

    db
      .select({
        id: productComponents.id,
        productId: productComponents.productId,
        materialId: productComponents.materialId,
        quantityPerUnit: productComponents.quantityPerUnit,
        notes: productComponents.notes,
      })
      .from(productComponents),
  ]);

  // Mapa de componentes por produto
  const componentsMap: Record<string, { materialId: string; quantityPerUnit: number; notes?: string }[]> = {};
  const componentsCountMap: Record<string, number> = {};

  for (const comp of allComponents) {
    if (!componentsMap[comp.productId]) {
      componentsMap[comp.productId] = [];
    }
    const qty = parseFloat(comp.quantityPerUnit) || 1;
    componentsMap[comp.productId].push({
      materialId: comp.materialId,
      quantityPerUnit: qty,
      notes: comp.notes || undefined,
    });
    componentsCountMap[comp.productId] = (componentsCountMap[comp.productId] || 0) + 1;
  }

  const enrichedProducts: ProductItem[] = productList.map((p) => ({
    ...p,
    componentsCount: componentsCountMap[p.id] || 0,
  }));

  return (
    <ProductManager
      initialProducts={enrichedProducts}
      materials={materialsList}
      categories={categoriesList}
      units={unitsList}
      initialComponentsMap={componentsMap}
    />
  );
}
