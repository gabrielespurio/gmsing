export const instant = false;

import { db } from "@/db";
import { purchases, suppliers, materials } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { PurchasesManager, PurchaseItem } from "./purchases-manager";

export default async function PurchasesPage() {
  const [purchaseList, supplierList, materialList] = await Promise.all([
    db
      .select({
        id: purchases.id,
        code: purchases.code,
        nfeNumber: purchases.nfeNumber,
        nfeSeries: purchases.nfeSeries,
        nfeKey: purchases.nfeKey,
        supplierName: suppliers.name,
        supplierDocument: suppliers.document,
        issueDate: purchases.issueDate,
        entryDate: purchases.entryDate,
        totalAmountCents: purchases.totalAmountCents,
        status: purchases.status,
        notes: purchases.notes,
      })
      .from(purchases)
      .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .orderBy(desc(purchases.entryDate)),

    db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        document: suppliers.document,
      })
      .from(suppliers)
      .where(eq(suppliers.active, true))
      .orderBy(suppliers.name),

    db
      .select({
        id: materials.id,
        name: materials.name,
        category: materials.category,
        unit: materials.unit,
        costPriceCents: materials.costPriceCents,
        currentStock: materials.currentStock,
      })
      .from(materials)
      .where(eq(materials.active, true))
      .orderBy(materials.name),
  ]);

  return (
    <PurchasesManager
      purchases={purchaseList as PurchaseItem[]}
      suppliers={supplierList}
      materials={materialList}
    />
  );
}
