export const instant = false;

import { db } from "@/db";
import { materials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StockManager, MaterialData } from "./stock-manager";

export default async function StockPage() {
  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.active, true))
    .orderBy(materials.category, materials.name);

  return (
    <StockManager
      initialMaterials={materialList as MaterialData[]}
    />
  );
}
