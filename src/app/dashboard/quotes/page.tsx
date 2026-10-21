export const instant = false;

import { db } from "@/db";
import { quotes, clients, materials, productsServices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { QuotesManager, QuoteItem } from "./quotes-manager";

export default async function QuotesPage() {
  const [quoteList, clientList, materialList, productList] = await Promise.all([
    db
      .select({
        id: quotes.id,
        code: quotes.code,
        status: quotes.status,
        issueDate: quotes.issueDate,
        validUntil: quotes.validUntil,
        totalCents: quotes.totalCents,
        clientName: clients.name,
        clientTrade: clients.tradeName,
      })
      .from(quotes)
      .innerJoin(clients, eq(quotes.clientId, clients.id))
      .orderBy(desc(quotes.createdAt)),

    db
      .select({
        id: clients.id,
        name: clients.name,
        tradeName: clients.tradeName,
        document: clients.document,
      })
      .from(clients)
      .where(eq(clients.active, true))
      .orderBy(clients.name),

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
      })
      .from(productsServices)
      .where(eq(productsServices.active, true))
      .orderBy(productsServices.name),
  ]);

  return (
    <QuotesManager
      quotes={quoteList as QuoteItem[]}
      clients={clientList}
      materials={materialList}
      products={productList}
    />
  );
}
