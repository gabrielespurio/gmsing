export const instant = false;

import { db } from "@/db";
import { orders, quotes, clients, materials, productsServices } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { OrdersManager, OrderItem } from "./orders-manager";

export default async function OrdersPage() {
  const [orderList, clientList, materialList, productList] = await Promise.all([
    db
      .select({
        id: orders.id,
        code: orders.code,
        title: orders.title,
        status: orders.status,
        priority: orders.priority,
        paymentMethod: orders.paymentMethod,
        paymentTerms: orders.paymentTerms,
        totalAmountCents: orders.totalAmountCents,
        stockDeducted: orders.stockDeducted,
        expectedDeliveryDate: orders.expectedDeliveryDate,
        installationAddress: orders.installationAddress,
        createdAt: orders.createdAt,
        quoteId: orders.quoteId,
        quoteCode: quotes.code,
        clientName: clients.name,
        clientTrade: clients.tradeName,
        clientPhone: clients.phone,
      })
      .from(orders)
      .innerJoin(clients, eq(orders.clientId, clients.id))
      .leftJoin(quotes, eq(orders.quoteId, quotes.id))
      .orderBy(desc(orders.createdAt)),

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
    <OrdersManager
      orders={orderList as OrderItem[]}
      clients={clientList}
      materials={materialList}
      products={productList}
    />
  );
}
