export const instant = false;

import Link from "next/link";
import { db } from "@/db";
import { quotes, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Plus, Search, FileText, ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Lista de Cotações</h2>
          <span className="text-xs text-slate-500">{quoteList.length} registros</span>
        </div>

        {quoteList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhum orçamento cadastrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Crie o primeiro orçamento com cálculo de ACM, lona, vinil, letra caixa ou serviços auxiliares.
            </p>
            <Link
              href="/dashboard/quotes/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 text-[#E3B48A]" />
              <span>Criar Primeiro Orçamento</span>
            </Link>
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
                {quoteList.map((quote) => {
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
          </div>
        )}
      </div>
    </div>
  );
}
