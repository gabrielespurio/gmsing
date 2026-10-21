export const instant = false;
import Link from "next/link";
import { db } from "@/db";
import { quotes, orders, clients, accountsReceivable, accountsPayable } from "@/db/schema";
import { sql } from "drizzle-orm";
import {
  Calculator,
  Hammer,
  DollarSign,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  ShoppingBag,
} from "lucide-react";

export default async function DashboardPage() {
  const [quotesStats] = await db
    .select({
      total: sql<number>`count(*)`,
      open: sql<number>`count(case when status in ('rascunho', 'enviado', 'negociacao') then 1 end)`,
      approved: sql<number>`count(case when status = 'aprovado' then 1 end)`,
      negotiatingValueCents: sql<number>`coalesce(sum(case when status in ('enviado', 'negociacao') then total_cents else 0 end), 0)`,
      approvedValueCents: sql<number>`coalesce(sum(case when status = 'aprovado' then total_cents else 0 end), 0)`
    })
    .from(quotes);

  const [ordersStats] = await db
    .select({
      total: sql<number>`count(*)`,
      inProgress: sql<number>`count(case when status in ('em_producao', 'aguardando_material', 'pronto_instalacao', 'em_instalacao') then 1 end)`,
      pending: sql<number>`count(case when status = 'pendente_pagamento' then 1 end)`,
      completed: sql<number>`count(case when status = 'concluido' then 1 end)`
    })
    .from(orders);

  const [receivables] = await db
    .select({
      totalPendingCents: sql<number>`coalesce(sum(balance_cents), 0)`,
      totalReceivedCents: sql<number>`coalesce(sum(paid_amount_cents), 0)`
    })
    .from(accountsReceivable);

  const [payables] = await db
    .select({
      totalPendingCents: sql<number>`coalesce(sum(balance_cents), 0)`
    })
    .from(accountsPayable);

  const [clientsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients);

  const totalQuotes = Number(quotesStats?.total || 0);
  const approvedQuotes = Number(quotesStats?.approved || 0);
  const approvalRate = totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1730] tracking-tight">
            Painel Geral de Operações
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe orçamentos, pedidos de produção e fluxo financeiro da GM Sign Solutions em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/quotes?new=true"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white font-semibold text-sm shadow-sm transition"
          >
            <PlusCircle size={16} />
            <span>Novo Orçamento</span>
          </Link>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14274B] text-white font-medium text-sm hover:bg-[#0B1730] transition shadow-2xs"
          >
            <ShoppingBag size={16} />
            <span>Ver Pedidos</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Em Negociação
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calculator size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B1730]">
            {(Number(quotesStats?.negotiatingValueCents || 0) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-amber-600">{Number(quotesStats?.open || 0)}</span> orçamentos abertos
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Vendas Aprovadas
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B1730]">
            {(Number(quotesStats?.approvedValueCents || 0) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">{approvedQuotes}</span> aprovados ({approvalRate}% conversão)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fábrica & Produção
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Hammer size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0B1730]">
            {Number(ordersStats?.inProgress || 0)} <span className="text-sm font-normal text-slate-500">pedidos em fabricação</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-600">{Number(ordersStats?.pending || 0)}</span> pendente pagamento
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Saldo a Receber
            </span>
            <div className="p-2 rounded-lg bg-[#B87A52]/10 text-[#B87A52]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#B87A52]">
            {(Number(receivables?.totalPendingCents || 0) / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>Recebido:</span>
            <span className="font-semibold text-emerald-600">
              {(Number(receivables?.totalReceivedCents || 0) / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Financeiro e Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#0B1730]">Fluxo de Pedidos & Produção</h2>
              <p className="text-xs text-slate-500">Visão integrada das etapas de fabricação e montagem</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-semibold text-[#B87A52] hover:text-[#a66a43] transition flex items-center gap-1"
            >
              <span>Ver todos os pedidos</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-2xl font-bold text-[#0B1730]">{Number(ordersStats?.pending || 0)}</span>
              <span className="text-xs text-slate-500 block mt-1">Pendente Pagto</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
              <span className="text-2xl font-bold text-blue-700">{Number(ordersStats?.inProgress || 0)}</span>
              <span className="text-xs text-blue-700/80 block mt-1">Em Fabricação</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
              <span className="text-2xl font-bold text-amber-700">{Number(ordersStats?.total || 0)}</span>
              <span className="text-xs text-amber-700/80 block mt-1">Total de Pedidos</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
              <span className="text-2xl font-bold text-emerald-700">{Number(ordersStats?.completed || 0)}</span>
              <span className="text-xs text-emerald-700/80 block mt-1">Instalados / Concluídos</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0B1730] text-[#E3B48A] flex items-center justify-center font-bold">
                GM
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0B1730]">Base de Clientes Cadastrados</p>
                <p className="text-xs text-slate-500">Empresas e pessoas físicas atendidas pela GM Sign</p>
              </div>
            </div>
            <span className="text-xl font-bold text-[#0B1730]">{Number(clientsCount?.count || 0)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0B1730] mb-1">Saúde Financeira</h2>
            <p className="text-xs text-slate-500 mb-5">Previsão de entradas geradas pelos pedidos</p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1">
                  <span>Previsão a Receber</span>
                  <ArrowUpRight size={14} />
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  {(Number(receivables?.totalPendingCents || 0) / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center justify-between text-xs text-red-800 font-medium mb-1">
                  <span>Contas a Pagar</span>
                  <ArrowDownRight size={14} />
                </div>
                <div className="text-xl font-bold text-red-700">
                  {(Number(payables?.totalPendingCents || 0) / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/financial"
              className="text-xs font-semibold text-[#0B1730] hover:text-[#B87A52] transition"
            >
              Acessar Módulo Financeiro Completo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}