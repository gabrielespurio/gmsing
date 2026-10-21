"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Plus,
  Loader2,
  ArrowRight,
  Boxes,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Save,
  X,
  Info,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { updateOrderStatusAction, createDirectOrderAction } from "@/domains/quotes/actions";

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

export interface ClientOption {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

export interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
  currentStock: string;
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
  description: string | null;
}

interface OrdersManagerProps {
  orders: OrderItem[];
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

export function OrdersManager({
  orders,
  clients,
  materials,
  products,
}: OrdersManagerProps) {
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);

  // Estados da Tabela
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const ITEMS_PER_PAGE = 10;

  // Estados do Formulário (Modal de Novo Pedido Direto)
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [installationAddress, setInstallationAddress] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [productionNotes, setProductionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Abre modal se ?new=true
  useEffect(() => {
    if (searchParams?.get("new") === "true") {
      setModalOpen(true);
    }
  }, [searchParams]);

  // KPIs
  const totalOrders = orders.length;
  const inProduction = orders.filter((o) => ["em_producao", "aguardando_material"].includes(o.status));
  const inInstallation = orders.filter((o) => ["pronto_instalacao", "em_instalacao"].includes(o.status));
  const completed = orders.filter((o) => o.status === "concluido");

  // Filtragem da Tabela
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

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setTitle(`${prod.name}`);
      const val = (prod.salePriceCents / 100).toFixed(2).replace(".", ",");
      setTotalAmount(val);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const addr = client.address || (client.city ? `${client.city} - ${client.state || "SP"}` : "");
      if (addr && !installationAddress) {
        setInstallationAddress(addr);
      }
    }
  };

  const handleOpenCreate = () => {
    const firstClient = clients[0];
    setSelectedClientId(firstClient?.id || "");
    setSelectedProductId("");
    setProductQuantity("1");
    setTitle("");
    setTotalAmount("");
    setPaymentMethod("pix");
    setInstallmentsCount("1");
    setFirstDueDate(new Date().toISOString().split("T")[0]);
    const addr = firstClient?.address || (firstClient?.city ? `${firstClient.city} - ${firstClient.state || "SP"}` : "");
    setInstallationAddress(addr);
    setExpectedDeliveryDate(new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
    setSelectedMaterialId("");
    setMaterialQuantity("");
    setProductionNotes("");
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
    if (!selectedClientId) {
      alert("Selecione um cliente para o pedido.");
      return;
    }
    if (!title.trim()) {
      alert("Informe o título do pedido.");
      return;
    }
    if (!totalAmount.trim()) {
      alert("Informe o valor total do pedido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("clientId", selectedClientId);
      formData.set("productId", selectedProductId);
      formData.set("productQuantity", productQuantity);
      formData.set("title", title);
      formData.set("totalAmount", totalAmount);
      formData.set("paymentMethod", paymentMethod);
      formData.set("installmentsCount", installmentsCount);
      formData.set("firstDueDate", firstDueDate);
      formData.set("installationAddress", installationAddress);
      formData.set("expectedDeliveryDate", expectedDeliveryDate);
      formData.set("materialId", selectedMaterialId);
      formData.set("materialQuantity", materialQuantity);
      formData.set("productionNotes", productionNotes);

      await createDirectOrderAction(formData);
      handleCloseModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro ao criar o pedido.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(totalAmount.replace(/\./g, "").replace(",", ".")) || 0;
  const numInstallments = parseInt(installmentsCount, 10) || 1;
  const installmentValue = parsedAmount > 0 ? (parsedAmount / numInstallments).toFixed(2) : "0,00";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Pedidos de Venda & Produção
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie pedidos diretos ou acompanhe orçamentos convertidos com baixa de estoque e financeiro.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido Direto</span>
          </button>
          <Link
            href="/dashboard/quotes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#14274B] hover:bg-[#0B1730] text-white text-sm font-semibold transition-colors shadow-2xs"
          >
            <span>Ver Orçamentos</span>
            <ArrowRight className="w-4 h-4 text-[#E3B48A]" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Pedidos</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
            <span className="text-xs text-slate-500">pedidos ativos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Produção</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{inProduction.length}</span>
            <span className="text-xs text-slate-500">na fábrica</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pronto / Instalação</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700">{inInstallation.length}</span>
            <span className="text-xs text-slate-500">em campo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{completed.length}</span>
            <span className="text-xs text-slate-500">entregues</span>
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Barra de Filtros */}
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
              placeholder="Buscar por código, cliente, produto ou orçamento..."
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
              aria-label="Filtrar por status do pedido"
              className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
            >
              <option value="all">Todos os Status ({orders.length})</option>
              <option value="em_producao">Em Produção</option>
              <option value="aguardando_material">Aguardando Material</option>
              <option value="pronto_instalacao">Pronto p/ Instalação</option>
              <option value="em_instalacao">Em Instalação</option>
              <option value="pendente_pagamento">Pendente Pagto</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
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
                ? "Crie um pedido de venda direto ou converta orçamentos aprovados da GM Sign."
                : "Nenhum pedido corresponde à sua pesquisa."}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E3B48A]" />
                <span>Criar Primeiro Pedido</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Código / Origem</th>
                  <th className="px-6 py-3.5 font-semibold">Cliente & Contato</th>
                  <th className="px-6 py-3.5 font-semibold">Descrição do Pedido</th>
                  <th className="px-6 py-3.5 font-semibold">Valor Total</th>
                  <th className="px-6 py-3.5 font-semibold">Previsão Entrega</th>
                  <th className="px-6 py-3.5 font-semibold">Estoque</th>
                  <th className="px-6 py-3.5 font-semibold">Status de Produção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((order) => {
                  const statusInfo = statusBadge[order.status] || {
                    label: order.status,
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                  };
                  const isUpdating = loadingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-[#14274B] text-sm">
                          {order.code}
                        </div>
                        {order.quoteCode ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm mt-0.5">
                            Orç. {order.quoteCode}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm mt-0.5">
                            Venda Direta
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{order.clientName}</div>
                        {order.clientTrade && (
                          <div className="text-xs text-slate-400">{order.clientTrade}</div>
                        )}
                        {order.clientPhone && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {order.clientPhone}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {order.title || "Comunicação Visual"}
                        </div>
                        {order.installationAddress && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            📍 {order.installationAddress}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {formatCurrency(order.totalAmountCents)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.paymentTerms || order.paymentMethod.toUpperCase()}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {formatDate(order.expectedDeliveryDate)}
                      </td>

                      <td className="px-6 py-4">
                        {order.stockDeducted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Baixado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            Sem baixa
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={`h-7 px-2 rounded-md text-xs font-semibold cursor-pointer border-0 focus:ring-2 focus:ring-[#B87A52]/40 ${statusInfo.bg} ${statusInfo.text} disabled:opacity-50`}
                          >
                            <option value="pendente_pagamento">Pendente Pagto</option>
                            <option value="aguardando_material">Aguardando Material</option>
                            <option value="em_producao">Em Produção</option>
                            <option value="pronto_instalacao">Pronto p/ Instalação</option>
                            <option value="em_instalacao">Em Instalação</option>
                            <option value="concluido">Concluído</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                          {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
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

      {/* Modal Padronizado de Novo Pedido Direto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Fixo */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1730] text-[#E3B48A] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Novo Pedido de Venda & Produção
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crie um pedido com faturamento no Contas a Receber e baixa automática de estoque.
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
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* 1. Identificação do Pedido & Cliente */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B1730] text-white text-[11px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>Identificação do Pedido & Cliente</span>
                  </h4>

                  {/* Seletor Rápido de Catálogo de Produtos & Serviços */}
                  {products.length > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#0B1730] flex items-center gap-1.5 shrink-0">
                          <Boxes className="w-4 h-4 text-[#B87A52]" />
                          <span>Carregar do Catálogo de Produtos / Serviços:</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Preenche título, valor e aciona ficha técnica
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <select
                          value={selectedProductId}
                          onChange={(e) => handleProductSelect(e.target.value)}
                          className="flex-1 w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        >
                          <option value="">-- Nenhum (Preenchimento Manual) --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.code}] {p.name} ({p.category}) - {formatCurrency(p.salePriceCents)} / {p.unit}
                            </option>
                          ))}
                        </select>

                        {selectedProductId && (
                          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                            <label className="text-xs font-semibold text-slate-600">Qtde:</label>
                            <input
                              type="number"
                              min="1"
                              value={productQuantity}
                              onChange={(e) => {
                                const qty = e.target.value;
                                setProductQuantity(qty);
                                const prod = products.find((p) => p.id === selectedProductId);
                                if (prod) {
                                  const parsedQ = parseFloat(qty) || 1;
                                  const total = (prod.salePriceCents * parsedQ) / 100;
                                  setTotalAmount(total.toFixed(2).replace(".", ","));
                                }
                              }}
                              className="w-20 h-9 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cliente *
                      </label>
                      <select
                        value={selectedClientId}
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

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Título / Descrição do Pedido *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Fachada Comercial ACM 3mm com LED"
                        required
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Valor Total do Pedido (R$) *
                      </label>
                      <input
                        type="text"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="0,00"
                        required
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Prazo de Entrega Prometido
                      </label>
                      <input
                        type="date"
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Endereço de Instalação / Entrega
                      </label>
                      <input
                        type="text"
                        value={installationAddress}
                        onChange={(e) => setInstallationAddress(e.target.value)}
                        placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Condições Comerciais & Financeiro */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-5 h-5 rounded-full bg-[#B87A52] text-white text-[11px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>Condições Comerciais & Financeiro</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Forma de Pagamento
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        <option value="pix">PIX (Chave CNPJ GM Sign)</option>
                        <option value="boleto">Boleto Bancário</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="transferencia">Transferência / TED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Parcelas
                      </label>
                      <select
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        <option value="1">1x (À Vista)</option>
                        <option value="2">2x (Entrada + 30 dias)</option>
                        <option value="3">3x (Entrada + 30 + 60)</option>
                        <option value="4">4x (Entrada + 30/60/90)</option>
                        <option value="5">5x mensais</option>
                        <option value="6">6x mensais</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        1º Vencimento
                      </label>
                      <input
                        type="date"
                        value={firstDueDate}
                        onChange={(e) => setFirstDueDate(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>

                  {parsedAmount > 0 && numInstallments > 1 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between">
                      <span>Plano de Faturamento:</span>
                      <strong className="font-mono text-sm">
                        {numInstallments}x de R$ {installmentValue}
                      </strong>
                    </div>
                  )}
                </div>

                {/* 3. Integração de Estoque & Produção */}
                <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-5 h-5 rounded-full bg-[#14274B] text-white text-[11px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Integração de Estoque & Produção</span>
                  </h4>

                  {selectedProductId ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Produto do Catálogo Selecionado:</strong> Os insumos cadastrados na Ficha Técnica deste produto serão deduzidos automaticamente do estoque na confirmação do pedido.
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Insumo / Material para Baixa Manual
                        </label>
                        <select
                          value={selectedMaterialId}
                          onChange={(e) => setSelectedMaterialId(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        >
                          <option value="">-- Não baixar estoque agora --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} (Saldo: {m.currentStock} {m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Quantidade a Baixar
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={materialQuantity}
                          onChange={(e) => setMaterialQuantity(e.target.value)}
                          placeholder="Ex: 4"
                          className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Observações de Produção & Serralheria
                    </label>
                    <textarea
                      rows={2}
                      value={productionNotes}
                      onChange={(e) => setProductionNotes(e.target.value)}
                      placeholder="Especificações para soldagem, corte router CNC, pintura, fita LED ou fixadores..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Modal Fixos no Rodapé */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="hidden sm:block text-xs text-slate-500">
                  Total: <span className="font-bold font-mono text-slate-900 text-sm">R$ {totalAmount || "0,00"}</span>
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
                    disabled={isSubmitting || !title || !totalAmount}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? "Gerando Pedido..." : "Criar Pedido Direto"}</span>
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
