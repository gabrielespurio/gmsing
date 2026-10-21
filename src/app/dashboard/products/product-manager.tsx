"use client";

import { useState } from "react";
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Tag,
  Wrench,
  Layers,
  ArrowRight,
  Package,
  Calculator,
  HelpCircle,
} from "lucide-react";
import {
  createProductAction,
  updateProductAction,
  toggleProductStatusAction,
  deleteProductAction,
  ComponentInput,
} from "@/domains/products/actions";
import { Pagination } from "@/components/ui/pagination";

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  unit: string;
  salePriceCents: number;
  costPriceCents: number;
  markupPercent: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  componentsCount: number;
}

export interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface UnitOption {
  id: string;
  code: string;
  name: string;
}

interface ProductManagerProps {
  initialProducts: ProductItem[];
  materials: MaterialOption[];
  categories: CategoryOption[];
  units: UnitOption[];
  initialComponentsMap: Record<string, { materialId: string; quantityPerUnit: number; notes?: string }[]>;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatMoneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function ProductManager({
  initialProducts,
  materials,
  categories,
  units,
  initialComponentsMap,
}: ProductManagerProps) {
  const [products] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | "produto" | "servico">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formType, setFormType] = useState<"produto" | "servico">("produto");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formUnit, setFormUnit] = useState("un");
  const [formSalePrice, setFormSalePrice] = useState("0,00");
  const [formCostPrice, setFormCostPrice] = useState("0,00");
  const [formMarkup, setFormMarkup] = useState("50");
  const [formDescription, setFormDescription] = useState("");

  // Ficha técnica (Componentes de estoque)
  const [components, setComponents] = useState<ComponentInput[]>([]);
  const [selectedMaterialToAdd, setSelectedMaterialToAdd] = useState(materials[0]?.id || "");
  const [quantityToAdd, setQuantityToAdd] = useState("1");

  // Filtros
  const filteredProducts = products.filter((p) => {
    if (typeFilter !== "todos" && p.type !== typeFilter) return false;
    if (statusFilter === "ativos" && !p.active) return false;
    if (statusFilter === "inativos" && p.active) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = p.code.toLowerCase().includes(q);
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      return matchCode || matchName || matchCat || matchDesc;
    }
    return true;
  });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const productCount = products.filter((p) => p.type === "produto").length;
  const serviceCount = products.filter((p) => p.type === "servico").length;

  const handleOpenCreate = (initialType: "produto" | "servico" = "produto") => {
    setEditingProduct(null);
    setFormType(initialType);
    setFormCode(initialType === "produto" ? `PRD-${Date.now().toString().slice(-4)}` : `SRV-${Date.now().toString().slice(-4)}`);
    setFormName("");
    setFormCategory(initialType === "servico" ? "Instalação" : categories[0]?.name || "Fachadas");
    setFormUnit(initialType === "servico" ? "hora" : "m2");
    setFormSalePrice("0,00");
    setFormCostPrice("0,00");
    setFormMarkup("50");
    setFormDescription("");
    setComponents([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setFormType(p.type as "produto" | "servico");
    setFormCode(p.code);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormUnit(p.unit);
    setFormSalePrice(formatMoneyInput(p.salePriceCents));
    setFormCostPrice(formatMoneyInput(p.costPriceCents));
    setFormMarkup(p.markupPercent || "50");
    setFormDescription(p.description || "");

    const comps = initialComponentsMap[p.id] || [];
    setComponents(comps);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  // Adicionar insumo do estoque à ficha técnica
  const handleAddComponent = () => {
    if (!selectedMaterialToAdd) return;
    const qty = parseFloat(quantityToAdd.replace(",", ".")) || 1;
    if (qty <= 0) return;

    // Se já existe, soma a quantidade
    const existingIndex = components.findIndex((c) => c.materialId === selectedMaterialToAdd);
    if (existingIndex >= 0) {
      const updated = [...components];
      updated[existingIndex].quantityPerUnit += qty;
      setComponents(updated);
    } else {
      setComponents([
        ...components,
        {
          materialId: selectedMaterialToAdd,
          quantityPerUnit: qty,
        },
      ]);
    }

    // Recalcular custo estimado somando os materiais
    recalculateCostFromComponents([
      ...components,
      ...(existingIndex >= 0 ? [] : [{ materialId: selectedMaterialToAdd, quantityPerUnit: qty }]),
    ]);

    setQuantityToAdd("1");
  };

  const handleRemoveComponent = (materialId: string) => {
    const updated = components.filter((c) => c.materialId !== materialId);
    setComponents(updated);
    recalculateCostFromComponents(updated);
  };

  const recalculateCostFromComponents = (comps: ComponentInput[]) => {
    let totalCents = 0;
    for (const comp of comps) {
      const mat = materials.find((m) => m.id === comp.materialId);
      if (mat) {
        totalCents += Math.round(mat.costPriceCents * comp.quantityPerUnit);
      }
    }
    if (totalCents > 0) {
      setFormCostPrice(formatMoneyInput(totalCents));
      const markupNum = parseFloat(formMarkup) || 50;
      const calculatedSaleCents = Math.round(totalCents * (1 + markupNum / 100));
      setFormSalePrice(formatMoneyInput(calculatedSaleCents));
    }
  };

  const handleToggleStatus = async (p: ProductItem) => {
    const nextStatus = !p.active;
    const msg = nextStatus
      ? `Deseja reativar o item "${p.name}"?`
      : `Deseja inativar o item "${p.name}"?`;
    if (window.confirm(msg)) {
      await toggleProductStatusAction(p.id, nextStatus);
    }
  };

  const handleDelete = async (p: ProductItem) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o item "${p.name}"?`)) {
      await deleteProductAction(p.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Catálogo de Produtos & Serviços
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Padronize produtos de comunicação visual e serviços técnicos com ficha técnica e baixa de estoque integrada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenCreate("produto")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
          <button
            onClick={() => handleOpenCreate("servico")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14274B] hover:bg-[#0B1730] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Wrench className="w-4 h-4 text-[#E3B48A]" />
            <span>Novo Serviço</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Produtos Fabricados</span>
            <Boxes className="w-4 h-4 text-[#B87A52]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{productCount}</span>
            <span className="text-xs text-slate-500">modelos cadastrados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Serviços Técnicos</span>
            <Wrench className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">{serviceCount}</span>
            <span className="text-xs text-slate-500">serviços em catálogo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Itens</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{products.length}</span>
            <span className="text-xs text-slate-500">ativos para venda</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por código, nome, categoria ou descrição..."
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => {
                setTypeFilter("todos");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                typeFilter === "todos"
                  ? "bg-white text-[#0B1730] shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => {
                setTypeFilter("produto");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                typeFilter === "produto"
                  ? "bg-white text-[#0B1730] shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Produtos ({productCount})
            </button>
            <button
              onClick={() => {
                setTypeFilter("servico");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                typeFilter === "servico"
                  ? "bg-white text-[#0B1730] shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Serviços ({serviceCount})
            </button>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            aria-label="Filtrar por status"
            className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
          >
            <option value="ativos">Apenas Ativos</option>
            <option value="inativos">Apenas Inativos</option>
            <option value="todos">Todos os Status</option>
          </select>
        </div>
      </div>

      {/* Tabela de Produtos & Serviços */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Lista de Produtos & Serviços</h2>
          <span className="text-xs text-slate-500">{filteredProducts.length} registros</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhum item encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Não há produtos ou serviços correspondentes aos filtros selecionados.
            </p>
            <button
              onClick={() => handleOpenCreate("produto")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E3B48A]" />
              <span>Cadastrar Novo Produto</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Código</th>
                  <th className="px-6 py-3.5">Produto / Serviço</th>
                  <th className="px-6 py-3.5">Tipo & Categoria</th>
                  <th className="px-6 py-3.5">Unidade</th>
                  <th className="px-6 py-3.5">Preço Venda</th>
                  <th className="px-6 py-3.5">Ficha Técnica</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((p) => {
                  const isService = p.type === "servico";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#14274B]">
                        {p.code}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                            {p.description}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {isService ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Wrench className="w-3 h-3" />
                              Serviço
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Boxes className="w-3 h-3" />
                              Produto
                            </span>
                          )}
                          <span className="text-xs text-slate-500">{p.category}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                        <span className="px-2 py-1 rounded bg-slate-100 uppercase">{p.unit}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {formatCurrency(p.salePriceCents)}
                        </div>
                        {p.costPriceCents > 0 && (
                          <div className="text-[11px] text-slate-400">
                            Custo: {formatCurrency(p.costPriceCents)} ({p.markupPercent}% mkp)
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {p.componentsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Layers className="w-3 h-3" />
                            {p.componentsCount} insumos
                          </span>
                        ) : isService ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sem insumos</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-[#B87A52] hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                            title="Editar Produto / Ficha Técnica"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              p.active ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={p.active ? "Inativar" : "Reativar"}
                          >
                            {p.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir Item"
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
            <Pagination
              currentPage={currentPage}
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição com Ficha Técnica */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Fixo */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1730] text-[#E3B48A] flex items-center justify-center shrink-0">
                  {formType === "servico" ? <Wrench className="w-4 h-4" /> : <Boxes className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingProduct
                      ? `Editar ${editingProduct.type === "servico" ? "Serviço" : "Produto"}: ${editingProduct.code}`
                      : `Cadastrar Novo ${formType === "servico" ? "Serviço" : "Produto"}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina precificação e insumos consumidos do estoque de materiais.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                setIsSubmitting(true);
                formData.set("type", formType);
                formData.set("components", JSON.stringify(components));
                try {
                  if (editingProduct) {
                    formData.set("id", editingProduct.id);
                    await updateProductAction(formData);
                  } else {
                    await createProductAction(formData);
                  }
                  handleCloseModal();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {/* Corpo com Scroll Suave */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Seletor Produto vs Serviço (apenas se novo) */}
                {!editingProduct && (
                  <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("produto");
                        setFormUnit("m2");
                        setFormCode(`PRD-${Date.now().toString().slice(-4)}`);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formType === "produto"
                          ? "bg-[#0B1730] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Boxes className="w-4 h-4 text-[#E3B48A]" />
                      <span>Produto Fabricado (com materiais)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("servico");
                        setFormUnit("hora");
                        setFormCode(`SRV-${Date.now().toString().slice(-4)}`);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formType === "servico"
                          ? "bg-[#0B1730] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Wrench className="w-4 h-4 text-[#E3B48A]" />
                      <span>Serviço Técnico / Mão de Obra</span>
                    </button>
                  </div>
                )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Código / SKU *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nome do {formType === "servico" ? "Serviço" : "Produto"} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Fachada Comercial ACM 3mm com LED"
                    required
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Fachadas, Banners..."
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    name="unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="m2">m² (Metro Quadrado)</option>
                    <option value="ml">ml (Metro Linear)</option>
                    <option value="hora">hora (Por Hora)</option>
                    <option value="diaria">diaria (Diária)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Margem / Markup Padrão (%)
                    </label>
                    <div
                      className="group relative inline-flex cursor-help"
                      title="Markup é a porcentagem calculada sobre o custo para obter o preço de venda. Fórmula: Preço = Custo × (1 + Markup%). Ex: R$ 100 de custo com 60% de markup = R$ 160 de venda."
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#B87A52] transition-colors" />
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="markupPercent"
                    value={formMarkup}
                    onChange={(e) => {
                      setFormMarkup(e.target.value);
                      const cost = parseFloat(formCostPrice.replace(/\./g, "").replace(",", ".")) || 0;
                      const mkp = parseFloat(e.target.value) || 0;
                      if (cost > 0) {
                        setFormSalePrice((cost * (1 + mkp / 100)).toFixed(2).replace(".", ","));
                      }
                    }}
                    placeholder="Ex: 60"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Calcula Preço = Custo × (1 + Markup%)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Custo Estimado (R$)
                  </label>
                  <input
                    type="text"
                    name="costPrice"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Preço de Venda Padrão (R$) *
                  </label>
                  <input
                    type="text"
                    name="salePrice"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(e.target.value)}
                    placeholder="0,00"
                    required
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#0B1730] font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                  />
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400 mt-6 italic">
                    Valor base aplicado no orçamento e pedido.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição Técnica & Detalhes
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Especificações dos materiais, acabamentos inclusos e instruções de produção..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                />
              </div>

              {/* Seção Ficha Técnica / Insumos do Estoque (apenas se for Produto) */}
              {formType === "produto" && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#B87A52]" />
                        <span>Ficha Técnica & Consumo de Estoque</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Vincule os materiais que serão baixados automaticamente no estoque quando um pedido for aprovado.
                      </p>
                    </div>
                  </div>

                  {/* Adicionar Material */}
                  <div className="flex flex-col sm:flex-row items-end gap-2 pt-1">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Selecionar Material do Estoque
                      </label>
                      <select
                        value={selectedMaterialToAdd}
                        onChange={(e) => setSelectedMaterialToAdd(e.target.value)}
                        className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.category}) - {m.unit} | Custo: {formatCurrency(m.costPriceCents)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Qtde / {formUnit}
                      </label>
                      <input
                        type="text"
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(e.target.value)}
                        placeholder="1.0"
                        className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddComponent}
                      className="px-3 py-2 h-9 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#E3B48A]" />
                      <span>Adicionar Insumo</span>
                    </button>
                  </div>

                  {/* Lista de Insumos Vinculados */}
                  {components.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                      Nenhum material de estoque vinculado. Adicione os insumos para cálculo automático de custo.
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                          <tr>
                            <th className="px-3 py-2">Material</th>
                            <th className="px-3 py-2">Consumo por {formUnit}</th>
                            <th className="px-3 py-2">Custo Unitário</th>
                            <th className="px-3 py-2">Subtotal Insumo</th>
                            <th className="px-3 py-2 text-right">Remover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {components.map((c) => {
                            const mat = materials.find((m) => m.id === c.materialId);
                            const subtotalCents = mat ? Math.round(mat.costPriceCents * c.quantityPerUnit) : 0;
                            return (
                              <tr key={c.materialId}>
                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {mat?.name || "Material não encontrado"}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {c.quantityPerUnit} {mat?.unit || "un"}
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {mat ? formatCurrency(mat.costPriceCents) : "-"}
                                </td>
                                <td className="px-3 py-2 font-bold font-mono text-slate-900">
                                  {formatCurrency(subtotalCents)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveComponent(c.materialId)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Botões do Modal Fixos no Rodapé */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Salvando..." : "Salvar Cadastro"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
