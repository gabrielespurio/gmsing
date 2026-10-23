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
  address?: string | null;
  city?: string | null;
  state?: string | null;
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

  // Estados do Formulário de Orçamento (Padrão Proposta GM Sign Solutions)
  const initialClient = clients[0];
  const initialAddr = initialClient
    ? [initialClient.address, initialClient.city && initialClient.state ? `${initialClient.city}/${initialClient.state}` : initialClient.city].filter(Boolean).join(" — ")
    : "";

  const [selectedClient, setSelectedClient] = useState(initialClient?.id || "");
  const [title, setTitle] = useState("COMUNICAÇÃO VISUAL — PROPOSTA DE FORNECIMENTO");
  const [contactPerson, setContactPerson] = useState("");
  const [billingAddress, setBillingAddress] = useState(initialAddr);
  const [installationAddress, setInstallationAddress] = useState(initialAddr);
  const [cityStateLocation, setCityStateLocation] = useState("São José do Rio Preto/SP");
  const [validityDays, setValidityDays] = useState("30");
  const [deliveryTimeDays, setDeliveryTimeDays] = useState("30");
  const [paymentConditions, setPaymentConditions] = useState(
    "50% no aceite formal da proposta e 50% após a conclusão e validação da instalação, mediante emissão de Nota Fiscal Eletrônica."
  );
  const [includedServices, setIncludedServices] = useState(
    "Usinagens técnicas, subestrutura metálica, equipe especializada de instalação e limpeza pós-obra."
  );
  const [warrantyTerms, setWarrantyTerms] = useState(
    "12 (doze) meses contra defeitos de fabricação mecânica, ancoragem e integridade dos materiais."
  );
  const [commercialNotes, setCommercialNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Estados de Adição de Item / Serviço
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [productName, setProductName] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [summaryDescription, setSummaryDescription] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista de Itens do Orçamento
  const [items, setItems] = useState<ItemPayload[]>([]);

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

  const handleClientChange = (cId: string) => {
    setSelectedClient(cId);
    const clientObj = clients.find((c) => c.id === cId);
    if (clientObj) {
      const formattedAddr = [
        clientObj.address,
        clientObj.city && clientObj.state ? `${clientObj.city}/${clientObj.state}` : clientObj.city,
      ]
        .filter(Boolean)
        .join(" — ");
      if (formattedAddr) {
        setBillingAddress(formattedAddr);
        setInstallationAddress(formattedAddr);
      }
    }
  };

  const handleCatalogSelect = (prodId: string) => {
    setSelectedCatalogId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProductName(prod.name);
      setSummaryDescription(prod.name);
      setProductDescription(prod.description || "");
      if (prod.salePriceCents) {
        setUnitPrice((prod.salePriceCents / 100).toFixed(2));
      }
    }
  };

  const handleAddItem = () => {
    if (!productName.trim()) {
      alert("Informe o nome do produto ou serviço.");
      return;
    }

    const priceNum = parseFloat(unitPrice.replace(",", ".")) || 0;
    if (priceNum <= 0) {
      alert("Informe um valor unitário válido maior que zero.");
      return;
    }

    const parsedQty = parseInt(quantity, 10) || 1;
    const priceCents = Math.round(priceNum * 100);

    const newItem: ItemPayload = {
      productName: productName.trim(),
      dimensions: dimensions.trim() || undefined,
      summaryDescription: summaryDescription.trim() || productName.trim(),
      description: productDescription.trim(),
      quantity: parsedQty,
      pricingMethod: "manual",
      unitCostCents: 0,
      totalCostCents: 0,
      unitPriceCents: priceCents,
      totalPriceCents: priceCents * parsedQty,
      notes: "",
    };

    setItems([...items, newItem]);
    setProductName("");
    setDimensions("");
    setSummaryDescription("");
    setProductDescription("");
    setQuantity("1");
    setUnitPrice("");
    setSelectedCatalogId("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totais do Orçamento
  const totalPrice = items.reduce((acc, it) => acc + it.totalPriceCents, 0);

  const handleOpenCreate = () => {
    const firstClient = clients[0];
    const firstAddr = firstClient
      ? [firstClient.address, firstClient.city && firstClient.state ? `${firstClient.city}/${firstClient.state}` : firstClient.city].filter(Boolean).join(" — ")
      : "";

    setSelectedClient(firstClient?.id || "");
    setTitle("COMUNICAÇÃO VISUAL — PROPOSTA DE FORNECIMENTO");
    setContactPerson("");
    setBillingAddress(firstAddr);
    setInstallationAddress(firstAddr);
    setCityStateLocation("São José do Rio Preto/SP");
    setValidityDays("30");
    setDeliveryTimeDays("30");
    setPaymentConditions(
      "50% no aceite formal da proposta e 50% após a conclusão e validação da instalação, mediante emissão de Nota Fiscal Eletrônica."
    );
    setIncludedServices(
      "Usinagens técnicas, subestrutura metálica, equipe especializada de instalação e limpeza pós-obra."
    );
    setWarrantyTerms(
      "12 (doze) meses contra defeitos de fabricação mecânica, ancoragem e integridade dos materiais."
    );
    setCommercialNotes("");
    setInternalNotes("");
    setSelectedCatalogId("");
    setProductName("");
    setDimensions("");
    setSummaryDescription("");
    setProductDescription("");
    setQuantity("1");
    setUnitPrice("");
    setItems([]);
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
      formData.set("title", title);
      formData.set("contactPerson", contactPerson);
      formData.set("billingAddress", billingAddress);
      formData.set("installationAddress", installationAddress);
      formData.set("cityStateLocation", cityStateLocation);
      formData.set("validityDays", validityDays);
      formData.set("deliveryTimeDays", deliveryTimeDays);
      formData.set("paymentConditions", paymentConditions);
      formData.set("includedServices", includedServices);
      formData.set("warrantyTerms", warrantyTerms);
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
                    Nova Proposta Comercial (Padrão GM Sign)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estrutura com Escopo do Fornecimento, Tabela de Investimento, Condições e Aceite Formal.
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
                {/* 1. Identificação da Proposta & Cliente */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B1730] text-white text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>Identificação da Proposta & Destinatário</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Título / Subtítulo da Proposta *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="Ex: COMUNICAÇÃO VISUAL — COMARCA DE MONTE APRAZÍVEL"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cliente Destinatário *
                      </label>
                      <select
                        value={selectedClient}
                        onChange={(e) => handleClientChange(e.target.value)}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        A/C (Aos Cuidados / Contato Responsável)
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Ex: Sr. Reginaldo Fernando Salvioni — Chefe de Seção Judiciário"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cidade / Localidade de Emissão
                      </label>
                      <input
                        type="text"
                        value={cityStateLocation}
                        onChange={(e) => setCityStateLocation(e.target.value)}
                        placeholder="Ex: São José do Rio Preto/SP"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Endereço de Faturamento
                      </label>
                      <input
                        type="text"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="Ex: Rua Monteiro Lobato, nº 269 — Centro — Monte Aprazível/SP"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Endereço de Instalação / Obra
                      </label>
                      <input
                        type="text"
                        value={installationAddress}
                        onChange={(e) => setInstallationAddress(e.target.value)}
                        placeholder="Ex: Av. Antônio Canheo, nº 429 — Monte Aprazível/SP"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Escopo do Fornecimento & Investimento */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#B87A52] text-white text-[11px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Itens da Proposta (Escopo & Investimento)</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-normal">
                      Preencha o item técnico, dimensões e detalhamento de execução
                    </span>
                  </div>

                  {/* Seletor Opcional de Catálogo */}
                  {products.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-xs font-bold text-[#0B1730] flex items-center gap-1.5 shrink-0">
                        <Boxes className="w-4 h-4 text-[#B87A52]" />
                        <span>Carregar do Catálogo (Opcional):</span>
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

                  {/* Construtor de Item / Serviço */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Título do Item (Escopo) *
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Ex: Placa de Fachada Externa"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Dimensões
                        </label>
                        <input
                          type="text"
                          value={dimensions}
                          onChange={(e) => setDimensions(e.target.value)}
                          placeholder="Ex: 500 × 66 cm"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 text-center">
                          Qtd *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full h-9 px-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 text-right">
                          Valor Unitário (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(e.target.value)}
                          placeholder="0,00"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono font-bold text-right focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Resumo Comercial (para Tabela de Investimento)
                      </label>
                      <input
                        type="text"
                        value={summaryDescription}
                        onChange={(e) => setSummaryDescription(e.target.value)}
                        placeholder="Ex: Placa de fachada em ACM, subestrutura, vinil e instalação (se vazio, usa o título do item)"
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    {/* Descrição Detalhada em Textarea */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Descrição Técnica Detalhada (para Escopo do Fornecimento) *
                      </label>
                      <textarea
                        rows={3}
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Ex: ACM branco 3 mm usinado e dobrado em bandeja, subestrutura em aço galvanizado com acabamento anticorrosivo, identificação em vinil de alta performance, nivelamento, fixação mecânica e instalação."
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 leading-relaxed"
                      />
                    </div>

                    {/* Barra de Ação de Adicionar Item */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg">
                      <div className="text-xs text-slate-600">
                        {parseFloat(unitPrice) > 0 ? (
                          <span>
                            Subtotal do item:{" "}
                            <strong className="text-slate-900 font-mono text-sm">
                              {formatCurrency(Math.round((parseFloat(unitPrice.replace(",", ".")) || 0) * (parseInt(quantity, 10) || 1) * 100))}
                            </strong>
                          </span>
                        ) : (
                          <span className="text-slate-400">Preencha o item, descrição e valor unitário acima.</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!productName.trim() || !unitPrice || parseFloat(unitPrice.replace(",", ".")) <= 0}
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
                          <th className="px-3 py-2 text-center w-12">Item</th>
                          <th className="px-3.5 py-2.5">Escopo Técnico & Detalhamento</th>
                          <th className="px-3.5 py-2.5 text-center">Qtd</th>
                          <th className="px-3.5 py-2.5 text-right">Valor Unitário</th>
                          <th className="px-3.5 py-2.5 text-right">Valor Total</th>
                          <th className="px-3.5 py-2.5 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              Nenhum item adicionado ainda. Preencha os campos acima e clique em "Adicionar Item ao Orçamento".
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-3 py-3 text-center font-bold font-mono text-slate-800">
                                {String(idx + 1).padStart(2, "0")}
                              </td>
                              <td className="px-3.5 py-3">
                                <div className="font-bold text-slate-900 text-sm">
                                  {item.productName} {item.dimensions ? `— ${item.dimensions}` : ""}
                                </div>
                                {item.summaryDescription && item.summaryDescription !== item.productName && (
                                  <div className="text-[11px] text-[#B87A52] font-medium mt-0.5">
                                    Resumo Investimento: {item.summaryDescription}
                                  </div>
                                )}
                                {item.description && (
                                  <div className="text-xs text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                                    {item.description}
                                  </div>
                                )}
                              </td>
                              <td className="px-3.5 py-3 text-center font-mono font-medium">
                                {item.quantity} un
                              </td>
                              <td className="px-3.5 py-3 text-right font-mono text-slate-600">
                                {formatCurrency(item.unitPriceCents)}
                              </td>
                              <td className="px-3.5 py-3 text-right font-bold text-[#14274B] font-mono text-sm">
                                {formatCurrency(item.totalPriceCents)}
                              </td>
                              <td className="px-3.5 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded hover:bg-rose-50"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Condições Comerciais Padrão */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B1730] text-white text-[11px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Condições Comerciais & Aceite</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Serviços Inclusos
                      </label>
                      <input
                        type="text"
                        value={includedServices}
                        onChange={(e) => setIncludedServices(e.target.value)}
                        placeholder="Ex: Usinagens técnicas, subestrutura metálica, equipe especializada de instalação e limpeza pós-obra."
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Condições de Pagamento
                      </label>
                      <input
                        type="text"
                        value={paymentConditions}
                        onChange={(e) => setPaymentConditions(e.target.value)}
                        placeholder="Ex: 50% no aceite formal da proposta e 50% após a conclusão..."
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Prazo de Fabricação / Instalação (Dias)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={deliveryTimeDays}
                        onChange={(e) => setDeliveryTimeDays(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
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
                        Garantia Técnica
                      </label>
                      <input
                        type="text"
                        value={warrantyTerms}
                        onChange={(e) => setWarrantyTerms(e.target.value)}
                        placeholder="Ex: 12 (doze) meses..."
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Resumo da Proposta Comercial */}
                <div className="bg-[#0B1730] text-white p-5 rounded-xl border border-[#1e345e] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#E3B48A] uppercase tracking-wider">
                      Resumo da Proposta Comercial
                    </span>
                    <div className="flex flex-wrap items-baseline gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 block">Itens do Fornecimento:</span>
                        <strong className="text-slate-200 font-mono text-sm">{items.length} {items.length === 1 ? "item" : "itens"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Total do Investimento:</span>
                        <strong className="text-2xl font-bold text-white font-mono">{formatCurrency(totalPrice)}</strong>
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
