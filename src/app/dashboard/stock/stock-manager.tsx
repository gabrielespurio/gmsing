"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  X,
  Save,
  Layers,
} from "lucide-react";
import {
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
} from "@/domains/stock/actions";

export interface MaterialData {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
  currentStock: string;
  minStock: string;
  notes: string | null;
  active: boolean;
}

export interface MovementData {
  id: string;
  type: string;
  quantity: string;
  reason: string;
  createdAt: Date;
  materialName: string;
  materialUnit: string;
}

interface StockManagerProps {
  initialMaterials: MaterialData[];
  movements: MovementData[];
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const CATEGORIES = [
  "Todos",
  "ACM",
  "Lona",
  "Vinil",
  "Metalon",
  "LED",
  "Acrílico",
  "Serralheria",
  "Outros",
];

const UNITS = ["chapa", "m2", "ml", "barra", "un", "litro", "kg", "rolo", "pacote"];

export function StockManager({ initialMaterials, movements }: StockManagerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros de busca e categoria
  const filteredMaterials = initialMaterials.filter((m) => {
    if (selectedCategory !== "Todos" && m.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchCat = m.category?.toLowerCase().includes(q);
      const matchNotes = m.notes?.toLowerCase().includes(q);
      return matchName || matchCat || matchNotes;
    }
    return true;
  });

  const lowStockCount = initialMaterials.filter(
    (m) => Number(m.currentStock) <= Number(m.minStock)
  ).length;

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: MaterialData) => {
    setEditingMaterial(m);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMaterial(null);
  };

  const handleDelete = async (m: MaterialData) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o material "${m.name}"? Se houver histórico de pedidos, ele será inativado.`
      )
    ) {
      await deleteMaterialAction(m.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Estoque & Consumo de Matéria-Prima
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie chapas de ACM, lonas, vinil adesivo, perfis e iluminação LED com baixas automáticas por pedido.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Material</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Itens Cadastrados</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{initialMaterials.length}</span>
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

      {/* Barra de Busca & Categorias */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material por nome, categoria ou código..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#14274B] text-white shadow-2xs font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Tabela de Materiais & Histórico de Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Materiais */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">Saldos Atuais em Estoque</h2>
            <span className="text-xs text-slate-500">{filteredMaterials.length} materiais</span>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Nenhum material encontrado</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Não há materiais cadastrados com os filtros atuais.
              </p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E3B48A]" />
                <span>Cadastrar Material</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Material</th>
                    <th className="px-5 py-3.5">Categoria</th>
                    <th className="px-5 py-3.5 text-right">Custo Unit.</th>
                    <th className="px-5 py-3.5 text-center">Mínimo</th>
                    <th className="px-5 py-3.5 text-center">Saldo Atual</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map((m) => {
                    const isLow = Number(m.currentStock) <= Number(m.minStock);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          {m.notes && <div className="text-xs text-slate-400 mt-0.5">{m.notes}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {m.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-xs text-slate-700 font-semibold">
                          {formatCurrency(m.costPriceCents)}/{m.unit}
                        </td>
                        <td className="px-5 py-4 text-center font-mono text-xs text-slate-500">
                          {m.minStock} {m.unit}
                        </td>
                        <td className="px-5 py-4 text-center">
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
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 rounded-md text-slate-600 hover:text-[#B87A52] hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                              title="Editar Material"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(m)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                    <span
                      className={`font-mono font-bold flex items-center gap-0.5 ${
                        mov.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {mov.type === "entrada" ? (
                        <>
                          <ArrowUp className="w-3 h-3" />
                          +{mov.quantity} {mov.materialUnit}
                        </>
                      ) : (
                        <>
                          <ArrowDown className="w-3 h-3" />
                          -{mov.quantity} {mov.materialUnit}
                        </>
                      )}
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

      {/* Modal de Cadastro / Edição de Material */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1730] text-[#E3B48A] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingMaterial ? "Editar Material" : "Cadastrar Novo Material"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingMaterial
                      ? "Atualize o custo, estoque mínimo ou saldo do material"
                      : "Cadastre matéria-prima para precificação e controle de estoque"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              action={async (formData: FormData) => {
                setIsSubmitting(true);
                if (editingMaterial) {
                  formData.append("id", editingMaterial.id);
                  await updateMaterialAction(formData);
                } else {
                  await createMaterialAction(formData);
                }
                setIsSubmitting(false);
                handleCloseModal();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome do Material *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingMaterial?.name || ""}
                  placeholder="Ex: Chapa ACM 3mm 1220x5000mm Azul Cobalto"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingMaterial?.category || "ACM"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  >
                    <option value="ACM">ACM (Painel Alumínio)</option>
                    <option value="Lona">Lona Frontlight / Backlight</option>
                    <option value="Vinil">Vinil Adesivo</option>
                    <option value="Metalon">Metalon / Tubos Galvanizados</option>
                    <option value="LED">Módulos & Fitas LED</option>
                    <option value="Acrílico">Chapas de Acrílico</option>
                    <option value="Serralheria">Serralheria & Chapas Aço</option>
                    <option value="Acessórios">Fontes, Parafusos e Fixadores</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    name="unit"
                    defaultValue={editingMaterial?.unit || "chapa"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  >
                    <option value="chapa">chapa (Chapa inteira)</option>
                    <option value="m2">m² (Metro quadrado)</option>
                    <option value="ml">ml (Metro linear)</option>
                    <option value="barra">barra (Barra padrão)</option>
                    <option value="un">un (Unidade)</option>
                    <option value="litro">litro (Litro)</option>
                    <option value="kg">kg (Quilograma)</option>
                    <option value="rolo">rolo (Rolo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Custo Unit. (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="costPrice"
                    required
                    defaultValue={
                      editingMaterial
                        ? (editingMaterial.costPriceCents / 100).toFixed(2)
                        : ""
                    }
                    placeholder="Ex: 280.00"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Saldo em Estoque
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="currentStock"
                    defaultValue={editingMaterial ? editingMaterial.currentStock : "0"}
                    placeholder="0"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="minStock"
                    defaultValue={editingMaterial ? editingMaterial.minStock : "5"}
                    placeholder="5"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Detalhes do Fornecedor
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingMaterial?.notes || ""}
                  placeholder="Dimensões da chapa, marca, fornecedor preferencial, etc."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              {/* Botões Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? "Salvando..."
                      : editingMaterial
                      ? "Atualizar Material"
                      : "Salvar Material"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
