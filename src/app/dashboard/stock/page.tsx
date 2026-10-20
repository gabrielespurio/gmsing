export const instant = false;

import { db } from "@/db";
import { materials, stockMovements } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { StockManager, MaterialData, MovementData } from "./stock-manager";

export default async function StockPage() {
  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.active, true))
    .orderBy(materials.category, materials.name);

  const movements = await db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      reason: stockMovements.reason,
      createdAt: stockMovements.createdAt,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(stockMovements)
    .innerJoin(materials, eq(stockMovements.materialId, materials.id))
    .orderBy(desc(stockMovements.createdAt))
    .limit(30);

  return (
    <StockManager
      initialMaterials={materialList as MaterialData[]}
      movements={movements as MovementData[]}
    />
  );
}
