"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, FileText, ArrowUpRight, Plus } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

export interface QuoteItem {
  id: string;
  code: string;
  status: string;
  issueDate: Date;
  validUntil: Date;
  totalCents: number;
  clientName: string;
  clientTrade: string | null;
}

interface QuotesTableProps {
  quotes: QuoteItem[];
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  rascunho: { label: "Rascunho", bg: "bg-slate-100", text: "text-slate-700" },
  enviado: { label: "Enviado", bg: "bg-blue-100", text: "text-blue-800" },
  negociacao: { label: "Em Negociação", bg: "bg-amber-100", text: "text-amber-800" },
  aprovado: { label: "Aprovado / Pedido", bg: "bg-emerald-100", text: "text-emerald-800" },
  recusado: { label: "Recusado", bg: "bg-rose-100", text: "text-rose-800" },
  cancelado: { label: "Cancelado", bg: "bg-gray-100", text: "text-gray-500" },
};

export function QuotesTable({ quotes }: QuotesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredQuotes = quotes.filter((q) => {
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchCode = q.code?.toLowerCase().includes(query);
      const matchClient = q.clientName?.toLowerCase().includes(query);
      const matchTrade = q.clientTrade?.toLowerCase().includes(query);
      return matchCode || matchClient || matchTrade;
    }
    return true;
  });

  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Top Filter Bar */}
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
            placeholder="Buscar por código, cliente ou fantasia..."
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
            aria-label="Filtrar por status"
            className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
          >
            <option value="all">Todos os Status ({quotes.length})</option>
            <option value="negociacao">Em Negociação</option>
            <option value="aprovado">Aprovado / Pedido</option>
            <option value="enviado">Enviado</option>
            <option value="rascunho">Rascunho</option>
            <option value="recusado">Recusado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {filteredQuotes.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Nenhum orçamento encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {quotes.length === 0
              ? "Crie o primeiro orçamento com cálculo de ACM, lona, vinil, letra caixa ou serviços auxiliares."
              : "Nenhum resultado corresponde à busca ou filtro selecionado."}
          </p>
          {quotes.length === 0 && (
            <Link
              href="/dashboard/quotes/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 text-[#E3B48A]" />
              <span>Criar Primeiro Orçamento</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Código</th>
                <th className="px-6 py-3.5 font-semibold">Cliente</th>
                <th className="px-6 py-3.5 font-semibold">Data Emissão</th>
                <th className="px-6 py-3.5 font-semibold">Validade</th>
                <th className="px-6 py-3.5 font-semibold">Valor Total</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedQuotes.map((quote) => {
                const statusInfo = statusMap[quote.status] || {
                  label: quote.status,
                  bg: "bg-slate-100",
                  text: "text-slate-700",
                };
                return (
                  <tr key={quote.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-[#14274B]">
                      {quote.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{quote.clientName}</div>
                      {quote.clientTrade && (
                        <div className="text-xs text-slate-400">{quote.clientTrade}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(quote.issueDate)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(quote.validUntil)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(quote.totalCents)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/quotes/${quote.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#14274B] bg-[#14274B]/5 hover:bg-[#14274B]/10 transition-colors"
                      >
                        <span>Abrir</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredQuotes.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
