"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Package,
  CreditCard,
  Plus,
  Loader2,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { updateOrderStatusAction } from "@/domains/quotes/actions";

export interface OrderItem {
  id: string;
  code: string;
  title: string | null;
  status: string;
  priority: string;
  paymentMethod: string;
  paymentTerms: string | null;
  totalAmountCents: number;
  stockDeducted: boolean;
  expectedDeliveryDate: Date | null;
  installationAddress: string | null;
  createdAt: Date;
  quoteId: string | null;
  quoteCode: string | null;
  clientName: string;
  clientTrade: string | null;
  clientPhone: string | null;
}

interface OrdersTableProps {
  orders: OrderItem[];
}

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

export function OrdersTable({ orders }: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ITEMS_PER_PAGE = 10;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = o.code?.toLowerCase().includes(q);
      const matchTitle = o.title?.toLowerCase().includes(q);
      const matchClient = o.clientName?.toLowerCase().includes(q);
      const matchQuote = o.quoteCode?.toLowerCase().includes(q);
      return matchCode || matchTitle || matchClient || matchQuote;
    }
    return true;
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleUpdateStatus = (orderId: string, nextStatus: string) => {
    setLoadingOrderId(orderId);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, nextStatus);
      } finally {
        setLoadingOrderId(null);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por código, título, cliente ou orçamento..."
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por etapa"
            className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
          >
            <option value="all">Todas as Etapas ({orders.length})</option>
            <option value="em_producao">Em Produção</option>
            <option value="aguardando_material">Aguardando Material</option>
            <option value="pronto_instalacao">Pronto p/ Instalação</option>
            <option value="em_instalacao">Em Instalação</option>
            <option value="concluido">Concluído</option>
            <option value="pendente_pagamento">Pendente Pagamento</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Nenhum pedido encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {orders.length === 0
              ? "Os pedidos são gerados automaticamente quando um orçamento é aprovado ou criados como venda direta."
              : "Nenhum resultado corresponde à busca ou filtro selecionado."}
          </p>
          {orders.length === 0 && (
            <Link
              href="/dashboard/orders/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 text-[#E3B48A]" />
              <span>Criar Pedido Direto</span>
            </Link>
          )}
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
              {paginatedOrders.map((order) => {
                const badge = statusBadge[order.status] || {
                  label: order.status,
                  bg: "bg-slate-100",
                  text: "text-slate-700",
                };
                const isItemLoading = loadingOrderId === order.id;

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
                          <button
                            type="button"
                            disabled={isItemLoading}
                            onClick={() => handleUpdateStatus(order.id, "pronto_instalacao")}
                            className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {isItemLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Pronto p/ Instalação</span>
                          </button>
                        )}

                        {order.status === "pronto_instalacao" && (
                          <button
                            type="button"
                            disabled={isItemLoading}
                            onClick={() => handleUpdateStatus(order.id, "em_instalacao")}
                            className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {isItemLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Iniciar Instalação</span>
                          </button>
                        )}

                        {order.status === "em_instalacao" && (
                          <button
                            type="button"
                            disabled={isItemLoading}
                            onClick={() => handleUpdateStatus(order.id, "concluido")}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {isItemLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Concluir Pedido</span>
                          </button>
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
          <Pagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
