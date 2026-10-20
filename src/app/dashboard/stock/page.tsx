export const instant = false;

import { db } from "@/db";
import { materials, stockMovements } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Package, AlertTriangle, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function StockPage() {
  const materialList = await db
    .select()
    .from(materials)
    .where(eq(materials.active, true))
    .orderBy(materials.category, materials.name);

  const movements = await db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      reason: stockMovements.reason,
      createdAt: stockMovements.createdAt,
      materialName: materials.name,
      materialUnit: materials.unit,
    })
    .from(stockMovements)
    .innerJoin(materials, eq(stockMovements.materialId, materials.id))
    .orderBy(desc(stockMovements.createdAt))
    .limit(20);

  const lowStockCount = materialList.filter(
    (m) => Number(m.currentStock) <= Number(m.minStock)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
          Estoque & Consumo de Matéria-Prima
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Chapas de ACM, lonas, vinil adesivo, perfis e iluminação LED com baixas automáticas por pedido.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Itens Cadastrados</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{materialList.length}</span>
            <span className="text-xs text-slate-500">materiais</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Abaixo do Mínimo</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{lowStockCount}</span>
            <span className="text-xs text-slate-500">precisam de compra</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Movimentações Recentes</span>
            <RefreshCw className="w-4 h-4 text-[#B87A52]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#B87A52]">{movements.length}</span>
            <span className="text-xs text-slate-500">registros</span>
          </div>
        </div>
      </div>

      {/* Grid: Tabela de Materiais & Histórico de Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Materiais */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 text-sm">Saldos Atuais em Estoque</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Material</th>
                  <th className="px-6 py-3.5">Categoria</th>
                  <th className="px-6 py-3.5 text-right">Custo Unit.</th>
                  <th className="px-6 py-3.5 text-center">Mínimo</th>
                  <th className="px-6 py-3.5 text-center">Saldo Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialList.map((m) => {
                  const isLow = Number(m.currentStock) <= Number(m.minStock);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{m.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">
                        {formatCurrency(m.costPriceCents)}/{m.unit}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">
                        {m.minStock} {m.unit}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                            isLow
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {m.currentStock} {m.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movimentações / Baixas por Pedido */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 text-sm">Histórico de Baixas & Consumo</h2>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[500px] flex-1">
            {movements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhuma movimentação de matéria-prima registrada ainda.
              </p>
            ) : (
              movements.map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{mov.materialName}</span>
                    <span className="font-mono font-bold text-rose-600 flex items-center gap-0.5">
                      <ArrowDown className="w-3 h-3" />
                      -{mov.quantity} {mov.materialUnit}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">{mov.reason}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    {formatDate(mov.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
