export const instant = false;

import Link from "next/link";
import { db } from "@/db";
import { orders, quotes, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  Package,
  CreditCard,
  DollarSign,
  Plus,
} from "lucide-react";
import { updateOrderStatusAction } from "@/domains/quotes/actions";
import { OrdersTable } from "./orders-table";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

const statusBadge: Record<string, { label: string; bg: string; text: string }> = {
  pendente_pagamento: { label: "Pendente Pagto", bg: "bg-amber-100", text: "text-amber-800" },
  aguardando_material: { label: "Aguardando Material", bg: "bg-orange-100", text: "text-orange-800" },
  em_producao: { label: "Em Produção", bg: "bg-blue-100", text: "text-blue-800" },
  pronto_instalacao: { label: "Pronto p/ Instalação", bg: "bg-purple-100", text: "text-purple-800" },
  em_instalacao: { label: "Em Instalação", bg: "bg-indigo-100", text: "text-indigo-800" },
  concluido: { label: "Concluído", bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelado: { label: "Cancelado", bg: "bg-rose-100", text: "text-rose-800" },
};

export default async function OrdersPage() {
  const orderList = await db
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
    .orderBy(desc(orders.createdAt));

  const totalOrders = orderList.length;
  const inProduction = orderList.filter((o) => ["em_producao", "aguardando_material"].includes(o.status));
  const inInstallation = orderList.filter((o) => ["pronto_instalacao", "em_instalacao"].includes(o.status));
  const completed = orderList.filter((o) => o.status === "concluido");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Pedidos de Venda & Produção
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie pedidos diretos ou acompanhe orçamentos convertidos com baixa de estoque e financeiro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido Direto</span>
          </Link>
          <Link
            href="/dashboard/quotes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14274B] hover:bg-[#0B1730] text-white text-sm font-semibold transition-colors shadow-2xs"
          >
            <span>Ver Orçamentos</span>
            <ArrowRight className="w-4 h-4 text-[#E3B48A]" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Pedidos</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
            <span className="text-xs text-slate-500">pedidos ativos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Produção</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{inProduction.length}</span>
            <span className="text-xs text-slate-500">na fábrica</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pronto / Instalação</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700">{inInstallation.length}</span>
            <span className="text-xs text-slate-500">em campo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{completed.length}</span>
            <span className="text-xs text-slate-500">entregues</span>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <OrdersTable orders={orderList} />
    </div>
  );
}
