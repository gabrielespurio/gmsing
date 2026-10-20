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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Lista de Pedidos</h2>
          <span className="text-xs text-slate-500">{orderList.length} pedidos</span>
        </div>

        {orderList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhum pedido gerado ainda</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Os pedidos são gerados automaticamente quando um orçamento é aprovado pelo cliente.
            </p>
            <Link
              href="/dashboard/quotes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors"
            >
              <span>Ver Orçamentos Disponíveis</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Pedido / Origem</th>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Valor & Condição</th>
                  <th className="px-6 py-3.5">Entrega Prevista</th>
                  <th className="px-6 py-3.5">Status Produção</th>
                  <th className="px-6 py-3.5">Estoque</th>
                  <th className="px-6 py-3.5 text-right">Avançar Etapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderList.map((order) => {
                  const badge = statusBadge[order.status] || {
                    label: order.status,
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                  };
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-[#14274B]">{order.code}</div>
                        {order.title && (
                          <div className="text-xs font-medium text-slate-800 truncate max-w-xs">{order.title}</div>
                        )}
                        {order.quoteId ? (
                          <Link
                            href={`/dashboard/quotes/${order.quoteId}`}
                            className="text-[11px] text-[#B87A52] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            Origem: {order.quoteCode}
                          </Link>
                        ) : (
                          <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Venda Direta
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{order.clientName}</div>
                        {order.installationAddress && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">
                            {order.installationAddress}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {formatCurrency(order.totalAmountCents)}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3 text-[#B87A52]" />
                          <span>{order.paymentTerms || order.paymentMethod.toUpperCase()}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {formatDate(order.expectedDeliveryDate)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {order.stockDeducted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Package className="w-3 h-3" />
                            Baixa Efetuada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pendente Baixa
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "em_producao" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateOrderStatusAction(order.id, "pronto_instalacao");
                              }}
                            >
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-medium transition-colors"
                              >
                                Pronto p/ Instalação
                              </button>
                            </form>
                          )}

                          {order.status === "pronto_instalacao" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateOrderStatusAction(order.id, "em_instalacao");
                              }}
                            >
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-medium transition-colors"
                              >
                                Iniciar Instalação
                              </button>
                            </form>
                          )}

                          {order.status === "em_instalacao" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateOrderStatusAction(order.id, "concluido");
                              }}
                            >
                              <button
                                type="submit"
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition-colors shadow-2xs"
                              >
                                Concluir Pedido
                              </button>
                            </form>
                          )}

                          {order.status === "concluido" && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Entregue
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
