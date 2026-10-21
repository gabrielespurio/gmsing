"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Boxes,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { createQuoteAction, ItemPayload } from "@/domains/quotes/actions";

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

export interface ClientOption {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
}

export interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
}

export interface ProductOption {
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
}

interface QuotesManagerProps {
  quotes: QuoteItem[];
  clients: ClientOption[];
  materials: MaterialOption[];
  products: ProductOption[];
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

export function QuotesManager({
  quotes,
  clients,
  materials,
  products,
}: QuotesManagerProps) {
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);

  // Filtros e Paginação da Tabela
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Estados do Formulário de Orçamento (Modal)
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || "");
  const [validityDays, setValidityDays] = useState("10");
  const [deliveryTimeDays, setDeliveryTimeDays] = useState("15");
  const [paymentConditions, setPaymentConditions] = useState("50% de entrada e 50% na conclusão da instalação.");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Motor de Adição de Item
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [productName, setProductName] = useState("Fachada ACM com Letras Caixa LED");
  const [quantity, setQuantity] = useState("1");
  const [widthMeters, setWidthMeters] = useState("6.00");
  const [heightMeters, setHeightMeters] = useState("2.50");
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "");
  const [markupPercent, setMarkupPercent] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de Itens do Orçamento
  const [items, setItems] = useState<ItemPayload[]>([
    {
      productName: "Fachada ACM com Letras Caixa LED",
      description: "Estrutura metálica galvanizada, revestimento em ACM 3mm e letras em acrílico com iluminação LED.",
      quantity: 1,
      widthMeters: 6.0,
      heightMeters: 2.5,
      unitArea: 15.0,
      totalArea: 15.0,
      pricingMethod: "composicao",
      unitCostCents: 450000,
      totalCostCents: 450000,
      unitPriceCents: 720000,
      totalPriceCents: 720000,
      notes: "Incluso instalação e fixação estrutural.",
    },
  ]);

  // Se a rota vier com ?new=true, abre o modal automaticamente
  useEffect(() => {
    if (searchParams?.get("new") === "true") {
      setModalOpen(true);
    }
  }, [searchParams]);

  // KPIs
  const totalQuotesCount = quotes.length;
  const approvedQuotes = quotes.filter((q) => q.status === "aprovado");
  const pendingQuotes = quotes.filter((q) => ["rascunho", "enviado", "negociacao"].includes(q.status));
  const totalNegotiatingCents = pendingQuotes.reduce((acc, q) => acc + q.totalCents, 0);
  const conversionRate = totalQuotesCount > 0 ? Math.round((approvedQuotes.length / totalQuotesCount) * 100) : 0;

  // Filtragem da Tabela
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

  // Cálculos do Item em Edição
  const parsedWidth = parseFloat(widthMeters) || 0;
  const parsedHeight = parseFloat(heightMeters) || 0;
  const parsedQty = parseInt(quantity, 10) || 1;
  const unitAreaCalc = parsedWidth > 0 && parsedHeight > 0 ? Number((parsedWidth * parsedHeight).toFixed(3)) : 0;
  const totalAreaCalc = Number((unitAreaCalc * parsedQty).toFixed(3));

  const currentMat = materials.find((m) => m.id === selectedMaterialId);
  const baseCostPerUnit = currentMat ? currentMat.costPriceCents : 25000;
  const estimatedItemCostCents = unitAreaCalc > 0
    ? Math.round(unitAreaCalc * baseCostPerUnit * 1.5)
    : 15000;
  const markupFactor = 1 + (parseFloat(markupPercent) || 50) / 100;
  const estimatedItemPriceCents = Math.round(estimatedItemCostCents * markupFactor);

  const handleCatalogSelect = (prodId: string) => {
    setSelectedCatalogId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProductName(prod.name);
      if (prod.markupPercent) {
        setMarkupPercent(prod.markupPercent);
      }
      if (prod.unit === "un" || prod.unit === "hora" || prod.unit === "diaria") {
        setWidthMeters("");
        setHeightMeters("");
      } else if (prod.unit === "m2" && (!widthMeters || !heightMeters)) {
        setWidthMeters("2.00");
        setHeightMeters("1.00");
      }
    }
  };

  const handleAddItem = () => {
    if (!productName.trim()) return;

    const newItem: ItemPayload = {
      productName: productName.trim(),
      description: `${parsedWidth > 0 ? `${parsedWidth}m x ${parsedHeight}m` : ""} - Material base: ${currentMat?.name || "Padrão"}`,
      quantity: parsedQty,
      widthMeters: parsedWidth > 0 ? parsedWidth : undefined,
      heightMeters: parsedHeight > 0 ? parsedHeight : undefined,
      unitArea: unitAreaCalc > 0 ? unitAreaCalc : undefined,
      totalArea: totalAreaCalc > 0 ? totalAreaCalc : undefined,
      pricingMethod: "composicao",
      unitCostCents: estimatedItemCostCents,
      totalCostCents: estimatedItemCostCents * parsedQty,
      unitPriceCents: estimatedItemPriceCents,
      totalPriceCents: estimatedItemPriceCents * parsedQty,
      notes: "",
    };

    setItems([...items, newItem]);
    setProductName("");
    setWidthMeters("");
    setHeightMeters("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totais do Orçamento
  const totalCost = items.reduce((acc, it) => acc + it.totalCostCents, 0);
  const totalPrice = items.reduce((acc, it) => acc + it.totalPriceCents, 0);
  const grossProfit = totalPrice - totalCost;
  const grossMargin = totalPrice > 0 ? Math.round((grossProfit / totalPrice) * 100) : 0;

  const handleOpenCreate = () => {
    setSelectedClient(clients[0]?.id || "");
    setValidityDays("10");
    setDeliveryTimeDays("15");
    setPaymentConditions("50% de entrada e 50% na conclusão da instalação.");
    setCommercialNotes("");
    setInternalNotes("");
    setSelectedCatalogId("");
    setProductName("Fachada ACM com Letras Caixa LED");
    setQuantity("1");
    setWidthMeters("6.00");
    setHeightMeters("2.50");
    setSelectedMaterialId(materials[0]?.id || "");
    setMarkupPercent("60");
    setItems([
      {
        productName: "Fachada ACM com Letras Caixa LED",
        description: "Estrutura metálica galvanizada, revestimento em ACM 3mm e letras em acrílico com iluminação LED.",
        quantity: 1,
        widthMeters: 6.0,
        heightMeters: 2.5,
        unitArea: 15.0,
        totalArea: 15.0,
        pricingMethod: "composicao",
        unitCostCents: 450000,
        totalCostCents: 450000,
        unitPriceCents: 720000,
        totalPriceCents: 720000,
        notes: "Incluso instalação e fixação estrutural.",
      },
    ]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (typeof window !== "undefined" && window.location.search.includes("new=true")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert("Selecione um cliente para o orçamento.");
      return;
    }
    if (items.length === 0) {
      alert("Adicione pelo menos um item ao orçamento.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("clientId", selectedClient);
      formData.set("validityDays", validityDays);
      formData.set("deliveryTimeDays", deliveryTimeDays);
      formData.set("paymentConditions", paymentConditions);
      formData.set("commercialNotes", commercialNotes);
      formData.set("internalNotes", internalNotes);
      formData.set("items", JSON.stringify(items));
      await createQuoteAction(formData);
      handleCloseModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro ao salvar o orçamento.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Orçamentos & Precificação
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Elabore propostas técnicas detalhadas e converta orçamentos aprovados em pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </button>
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

      {/* Tabela de Orçamentos */}
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
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E3B48A]" />
                <span>Criar Primeiro Orçamento</span>
              </button>
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

      {/* Modal Padronizado de Novo Orçamento Técnico */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Fixo */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1730] text-[#E3B48A] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Novo Orçamento Técnico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure dimensões, materiais, perdas e margem de lucro para comunicação visual.
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

            {/* Formulário com Scroll Interno */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* 1. Dados Gerais da Proposta */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B1730] text-white text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>Dados Gerais da Proposta</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cliente Destinatário *
                      </label>
                      <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        required
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.tradeName ? `(${c.tradeName})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Validade da Proposta (Dias)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={validityDays}
                        onChange={(e) => setValidityDays(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Prazo de Entrega (Dias Úteis)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={deliveryTimeDays}
                        onChange={(e) => setDeliveryTimeDays(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Condições Comerciais e de Pagamento Padrão
                    </label>
                    <input
                      type="text"
                      value={paymentConditions}
                      onChange={(e) => setPaymentConditions(e.target.value)}
                      placeholder="Ex: 50% de entrada e 50% na conclusão da instalação."
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Observações Comerciais (visível ao cliente)
                      </label>
                      <textarea
                        rows={2}
                        value={commercialNotes}
                        onChange={(e) => setCommercialNotes(e.target.value)}
                        placeholder="Ex: Incluso frete e içamento até o 2º andar..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Observações Internas (produção / equipe)
                      </label>
                      <textarea
                        rows={2}
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Ex: Verificar ponto de energia 220v no local..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Motor de Precificação Técnica & Produtos */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#B87A52] text-white text-[11px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Motor de Precificação Técnica & Itens</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-normal">
                      Área e margem calculados em tempo real
                    </span>
                  </div>

                  {/* Seletor Rápido de Catálogo de Produtos & Serviços */}
                  {products.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-xs font-bold text-[#0B1730] flex items-center gap-1.5 shrink-0">
                        <Boxes className="w-4 h-4 text-[#B87A52]" />
                        <span>Carregar do Catálogo:</span>
                      </span>
                      <select
                        value={selectedCatalogId}
                        onChange={(e) => handleCatalogSelect(e.target.value)}
                        className="flex-1 h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        <option value="">-- Selecionar Produto ou Serviço Pré-Cadastrado --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.type === "servico" ? "SERVIÇO" : "PRODUTO"}] {p.code} - {p.name} ({formatCurrency(p.salePriceCents)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Construtor de Item */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Descrição do Produto / Serviço *
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Ex: Letra Caixa Inox Polido c/ LED"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Material / Categoria Base
                        </label>
                        <select
                          value={selectedMaterialId}
                          onChange={(e) => setSelectedMaterialId(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({formatCurrency(m.costPriceCents)}/{m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Largura (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={widthMeters}
                          onChange={(e) => setWidthMeters(e.target.value)}
                          placeholder="0,00"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Altura (m)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={heightMeters}
                          onChange={(e) => setHeightMeters(e.target.value)}
                          placeholder="0,00"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Área Total
                        </label>
                        <div className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-700 flex items-center">
                          {totalAreaCalc > 0 ? `${totalAreaCalc} m²` : "N/A (un)"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Markup / Lucro (%)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(e.target.value)}
                          placeholder="60"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>
                    </div>

                    {/* Barra de Ação de Adicionar Item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-500">Custo Est.:</span>{" "}
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(estimatedItemCostCents * parsedQty)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Venda Sugerida:</span>{" "}
                          <span className="font-mono font-bold text-[#B87A52]">
                            {formatCurrency(estimatedItemPriceCents * parsedQty)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!productName.trim()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E3B48A]" />
                        <span>Adicionar Item ao Orçamento</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabela de Itens Adicionados */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Item / Descrição</th>
                          <th className="px-3.5 py-2.5 text-center">Dimensões / Qtd</th>
                          <th className="px-3.5 py-2.5 text-right">Custo Est.</th>
                          <th className="px-3.5 py-2.5 text-right">Preço Venda</th>
                          <th className="px-3.5 py-2.5 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              Nenhum item adicionado ainda. Configure acima e clique em "Adicionar Item".
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-3.5 py-3">
                                <div className="font-semibold text-slate-900">{item.productName}</div>
                                {item.description && (
                                  <div className="text-[11px] text-slate-500">{item.description}</div>
                                )}
                              </td>
                              <td className="px-3.5 py-3 text-center font-mono">
                                {item.quantity} un
                                {item.unitArea ? ` (${item.unitArea} m²)` : ""}
                              </td>
                              <td className="px-3.5 py-3 text-right font-mono text-slate-500">
                                {formatCurrency(item.totalCostCents)}
                              </td>
                              <td className="px-3.5 py-3 text-right font-bold text-[#14274B] font-mono">
                                {formatCurrency(item.totalPriceCents)}
                              </td>
                              <td className="px-3.5 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Resumo da Proposta Comercial */}
                <div className="bg-[#0B1730] text-white p-5 rounded-xl border border-[#1e345e] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#E3B48A] uppercase tracking-wider">
                      Resumo da Proposta Comercial
                    </span>
                    <div className="flex flex-wrap items-baseline gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Custo Estimado:</span>
                        <strong className="text-slate-200 font-mono text-sm">{formatCurrency(totalCost)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lucro Bruto:</span>
                        <strong className="text-emerald-400 font-mono text-sm">
                          {formatCurrency(grossProfit)} ({grossMargin}%)
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total do Orçamento:</span>
                        <strong className="text-xl font-bold text-white font-mono">{formatCurrency(totalPrice)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões do Modal Fixos no Rodapé */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="hidden sm:block text-xs text-slate-500">
                  Total da Proposta: <span className="font-bold font-mono text-slate-900 text-sm">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? "Gerando Orçamento..." : "Salvar Orçamento"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
