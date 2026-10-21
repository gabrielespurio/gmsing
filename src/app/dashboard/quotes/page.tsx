export const instant = false;

import Link from "next/link";
import { db } from "@/db";
import { quotes, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Plus, Search, FileText, ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { QuotesTable } from "./quotes-table";

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

export default async function QuotesPage() {
  const quoteList = await db
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
    .orderBy(desc(quotes.createdAt));

  const totalQuotesCount = quoteList.length;
  const approvedQuotes = quoteList.filter((q) => q.status === "aprovado");
  const pendingQuotes = quoteList.filter((q) => ["rascunho", "enviado", "negociacao"].includes(q.status));
  const totalNegotiatingCents = pendingQuotes.reduce((acc, q) => acc + q.totalCents, 0);
  const conversionRate = totalQuotesCount > 0 ? Math.round((approvedQuotes.length / totalQuotesCount) * 100) : 0;

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    rascunho: { label: "Rascunho", bg: "bg-slate-100", text: "text-slate-700" },
    enviado: { label: "Enviado", bg: "bg-blue-100", text: "text-blue-800" },
    negociacao: { label: "Em Negociação", bg: "bg-amber-100", text: "text-amber-800" },
    aprovado: { label: "Aprovado / Pedido", bg: "bg-emerald-100", text: "text-emerald-800" },
    recusado: { label: "Recusado", bg: "bg-rose-100", text: "text-rose-800" },
    cancelado: { label: "Cancelado", bg: "bg-gray-100", text: "text-gray-500" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Orçamentos & Precificação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Elabore propostas técnicas detalhadas e converta orçamentos aprovados em pedidos.
          </p>
        </div>

        <Link
          href="/dashboard/quotes/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Gerados</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalQuotesCount}</span>
            <span className="text-xs text-slate-500">cotações</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Negociação</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {formatCurrency(totalNegotiatingCents)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Aprovados / Pedidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{approvedQuotes.length}</span>
            <span className="text-xs text-slate-500">convertidos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Conversão</span>
            <ArrowUpRight className="w-4 h-4 text-[#B87A52]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#B87A52]">{conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <QuotesTable quotes={quoteList} />
    </div>
  );
}
