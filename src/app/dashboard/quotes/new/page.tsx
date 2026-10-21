export const instant = false;

import { db } from "@/db";
import { clients, materials, productsServices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { QuoteForm } from "./quote-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewQuotePage() {
  const [clientList, materialList, productList] = await Promise.all([
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/quotes"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Novo Orçamento Técnico
          </h1>
          <p className="text-sm text-slate-500">
            Configure dimensões, materiais, perdas e margem de lucro para comunicação visual.
          </p>
        </div>
      </div>

      <QuoteForm clients={clientList} materials={materialList} products={productList} />
    </div>
  );
}
