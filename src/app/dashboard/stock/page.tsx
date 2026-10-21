export const instant = false;

import { db } from "@/db";
import { materials, materialCategories, measurementUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StockManager, MaterialData, CategoryOption, UnitOption } from "./stock-manager";

export default async function StockPage() {
  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.active, true))
    .orderBy(materials.category, materials.name);

  const categories = await db
    .select({
      id: materialCategories.id,
      name: materialCategories.name,
      description: materialCategories.description,
    })
    .from(materialCategories)
    .where(eq(materialCategories.active, true))
    .orderBy(materialCategories.name);

  const units = await db
    .select({
      id: measurementUnits.id,
      code: measurementUnits.code,
      name: measurementUnits.name,
    })
    .from(measurementUnits)
    .where(eq(measurementUnits.active, true))
    .orderBy(measurementUnits.code);

  return (
    <StockManager
      initialMaterials={materialList as MaterialData[]}
      categories={categories as CategoryOption[]}
      units={units as UnitOption[]}
    />
  );
}
