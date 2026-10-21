export const instant = false;

import { db } from "@/db";
import { clients, materials, productsServices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DirectOrderForm } from "./order-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewDirectOrderPage() {
  const [clientList, materialList, productList] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        tradeName: clients.tradeName,
        document: clients.document,
        address: clients.address,
        city: clients.city,
        state: clients.state,
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
        currentStock: materials.currentStock,
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
        description: productsServices.description,
      })
      .from(productsServices)
      .where(eq(productsServices.active, true))
      .orderBy(productsServices.name),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Novo Pedido Direto de Produção
          </h1>
          <p className="text-sm text-slate-500">
            Crie um pedido diretamente sem necessidade de orçamento prévio. As parcelas e baixas de estoque serão geradas automaticamente.
          </p>
        </div>
      </div>

      <DirectOrderForm clients={clientList} materials={materialList} products={productList} />
    </div>
  );
}
