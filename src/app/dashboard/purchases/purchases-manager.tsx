"use client";

import { useState, useTransition, ChangeEvent } from "react";
import Link from "next/link";
import {
  ReceiptText,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Search,
  Building2,
  Boxes,
  DollarSign,
  X,
  Save,
  Clock,
  ArrowUpRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { parseNFeXml, ParsedNFe } from "@/domains/purchases/xml-parser";
import {
  createPurchaseAction,
  cancelPurchaseAction,
  CreatePurchasePayload,
} from "@/domains/purchases/actions";

export interface PurchaseItem {
  id: string;
  code: string;
  nfeNumber: string | null;
  nfeSeries: string | null;
  nfeKey: string | null;
  supplierName: string | null;
  supplierDocument: string | null;
  issueDate: Date | null;
  entryDate: Date;
  totalAmountCents: number;
  status: string;
  itemsCount?: number;
  notes: string | null;
}

export interface SupplierOption {
  id: string;
  name: string;
  document: string | null;
}

export interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
  currentStock: string;
}

interface PurchasesManagerProps {
  purchases: PurchaseItem[];
  suppliers: SupplierOption[];
  materials: MaterialOption[];
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function PurchasesManager({
  purchases,
  suppliers,
  materials,
}: PurchasesManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"xml" | "manual">("xml");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  // Estados da Tabela e Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Estados do Modal - Importação de XML
  const [xmlFileName, setXmlFileName] = useState("");
  const [parsedNFe, setParsedNFe] = useState<ParsedNFe | null>(null);
  const [itemMappings, setItemMappings] = useState<
    Record<
      number,
      {
        materialId: string; // "" = criar novo material
        category: string;
      }
    >
  >({});

  // Estados do Modal - Lançamento Manual
  const [manualSupplierId, setManualSupplierId] = useState(suppliers[0]?.id || "");
  const [manualNfeNumber, setManualNfeNumber] = useState("");
  const [manualIssueDate, setManualIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [manualNotes, setManualNotes] = useState("");
  const [manualItems, setManualItems] = useState<
    Array<{
      materialId: string;
      productName: string;
      quantity: string;
      unit: string;
      unitCost: string;
    }>
  >([]);
  const [selectedMatToAdd, setSelectedMatToAdd] = useState(materials[0]?.id || "");
  const [manualQtyToAdd, setManualQtyToAdd] = useState("1");
  const [manualCostToAdd, setManualCostToAdd] = useState("");
  const [manualInstallmentsCount, setManualInstallmentsCount] = useState("1");
  const [manualFirstDueDate, setManualFirstDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );

  // KPIs
  const totalPurchasesCents = purchases
    .filter((p) => p.status === "concluido")
    .reduce((acc, p) => acc + p.totalAmountCents, 0);
  const totalNfeCount = purchases.filter((p) => Boolean(p.nfeKey || p.nfeNumber)).length;
  const completedCount = purchases.filter((p) => p.status === "concluido").length;

  // Filtragem da Tabela
  const filteredPurchases = purchases.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCode = p.code?.toLowerCase().includes(q);
      const matchNfe = p.nfeNumber?.toLowerCase().includes(q);
      const matchSup = p.supplierName?.toLowerCase().includes(q);
      const matchDoc = p.supplierDocument?.toLowerCase().includes(q);
      return matchCode || matchNfe || matchSup || matchDoc;
    }
    return true;
  });

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Leitura do Arquivo XML
  const handleXmlUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setXmlFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseNFeXml(text);
        setParsedNFe(parsed);

        // Auto-mapeia itens com materiais que possuem nomes parecidos
        const mappings: Record<number, { materialId: string; category: string }> = {};
        parsed.items.forEach((it) => {
          const lowerName = it.productName.toLowerCase();
          const matched = materials.find((m) => {
            const mLower = m.name.toLowerCase();
            return lowerName.includes(mLower) || mLower.includes(lowerName);
          });
          mappings[it.itemNumber] = {
            materialId: matched ? matched.id : "",
            category: matched ? matched.category : "Matéria-prima",
          };
        });
        setItemMappings(mappings);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao ler arquivo XML";
        alert("Falha ao processar arquivo XML: " + msg);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenModal = () => {
    setParsedNFe(null);
    setXmlFileName("");
    setItemMappings({});
    setManualItems([]);
    setManualNfeNumber("");
    setManualNotes("");
    setActiveTab("xml");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Submissão do Modal (XML ou Manual)
  const handleSubmitPurchase = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "xml") {
        if (!parsedNFe) {
          alert("Faça o upload de um arquivo XML de NF-e válido.");
          return;
        }

        const payload: CreatePurchasePayload = {
          supplierData: parsedNFe.supplier,
          nfeKey: parsedNFe.key,
          nfeNumber: parsedNFe.number,
          nfeSeries: parsedNFe.series,
          issueDate: parsedNFe.issueDate,
          notes: `Importado via XML NF-e nº ${parsedNFe.number} (${parsedNFe.supplier.name})`,
          items: parsedNFe.items.map((it) => {
            const mapping = itemMappings[it.itemNumber];
            return {
              materialId: mapping?.materialId || undefined,
              newMaterialName: !mapping?.materialId ? it.productName : undefined,
              newMaterialCategory: !mapping?.materialId ? mapping?.category || "Matéria-prima" : undefined,
              rawProductName: it.productName,
              rawProductCode: it.productCode,
              ncm: it.ncm,
              cfop: it.cfop,
              quantity: it.quantity,
              unit: it.unit,
              unitCostCents: Math.round(it.unitPrice * 100),
              totalCostCents: Math.round(it.totalPrice * 100),
            };
          }),
          installments: parsedNFe.installments.map((inst) => ({
            number: inst.number,
            dueDate: inst.dueDate,
            amountCents: Math.round(inst.amount * 100),
          })),
        };

        await createPurchaseAction(payload);
        handleCloseModal();
      } else {
        // Modo Manual
        if (manualItems.length === 0) {
          alert("Adicione pelo menos um material à compra manual.");
          return;
        }

        const totalCents = manualItems.reduce((acc, it) => {
          const cost = parseFloat(it.unitCost.replace(/\./g, "").replace(",", ".")) || 0;
          const qty = parseFloat(it.quantity) || 1;
          return acc + Math.round(cost * qty * 100);
        }, 0);

        const numInstallments = parseInt(manualInstallmentsCount, 10) || 1;
        const baseAmount = Math.floor(totalCents / numInstallments);
        const remainder = totalCents % numInstallments;

        const installments = [];
        for (let i = 1; i <= numInstallments; i++) {
          const instAmount = i === 1 ? baseAmount + remainder : baseAmount;
          const dueDate = new Date(manualFirstDueDate);
          dueDate.setDate(dueDate.getDate() + (i - 1) * 30);
          installments.push({
            number: String(i),
            dueDate: dueDate.toISOString().split("T")[0],
            amountCents: instAmount,
          });
        }

        const payload: CreatePurchasePayload = {
          supplierId: manualSupplierId,
          nfeNumber: manualNfeNumber || undefined,
          issueDate: manualIssueDate,
          notes: manualNotes || "Compra manual de reposição de estoque",
          items: manualItems.map((it) => {
            const costCents = Math.round(parseFloat(it.unitCost.replace(/\./g, "").replace(",", ".")) * 100) || 0;
            const qty = parseFloat(it.quantity) || 1;
            return {
              materialId: it.materialId,
              rawProductName: it.productName,
              quantity: qty,
              unit: it.unit,
              unitCostCents: costCents,
              totalCostCents: Math.round(costCents * qty),
            };
          }),
          installments,
        };

        await createPurchaseAction(payload);
        handleCloseModal();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar a compra.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddManualItem = () => {
    const mat = materials.find((m) => m.id === selectedMatToAdd);
    if (!mat) return;
    const costVal = manualCostToAdd || (mat.costPriceCents / 100).toFixed(2).replace(".", ",");
    setManualItems([
      ...manualItems,
      {
        materialId: mat.id,
        productName: mat.name,
        quantity: manualQtyToAdd || "1",
        unit: mat.unit,
        unitCost: costVal,
      },
    ]);
    setManualQtyToAdd("1");
    setManualCostToAdd("");
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const handleCancelPurchase = (id: string, code: string) => {
    if (confirm(`Deseja realmente cancelar a compra "${code}"? Os materiais recebidos serão estornados do estoque e as contas a pagar canceladas.`)) {
      startTransition(async () => {
        await cancelPurchaseAction(id);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Compras & Entrada de Notas (XML)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Importe notas fiscais eletrônicas (NF-e) com entrada automática no estoque e geração de contas a pagar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Nova Compra / Importar XML</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total em Compras</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalPurchasesCents)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Notas Fiscais (NF-e)</span>
            <FileCode className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{totalNfeCount}</span>
            <span className="text-xs text-slate-500">importadas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Entradas no Estoque</span>
            <Boxes className="w-4 h-4 text-[#B87A52]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#B87A52]">{completedCount}</span>
            <span className="text-xs text-slate-500">concluídas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Fornecedores Cadastrados</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700">{suppliers.length}</span>
            <span className="text-xs text-slate-500">parceiros</span>
          </div>
        </div>
      </div>

      {/* Tabela de Compras Realizadas */}
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
              placeholder="Buscar por código, número NF-e, fornecedor ou CNPJ..."
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
              aria-label="Filtrar por status da compra"
              className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
            >
              <option value="all">Todos os Status ({purchases.length})</option>
              <option value="concluido">Concluídas</option>
              <option value="cancelado">Canceladas</option>
            </select>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhuma compra encontrada</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {purchases.length === 0
                ? "Importe seu primeiro XML de NF-e para abastecer o estoque de chapas, lonas, tintas e metalons."
                : "Nenhum resultado corresponde à sua pesquisa."}
            </p>
            {purchases.length === 0 && (
              <button
                type="button"
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-[#E3B48A]" />
                <span>Importar Primeiro XML</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Código / NF-e</th>
                  <th className="px-6 py-3.5 font-semibold">Fornecedor</th>
                  <th className="px-6 py-3.5 font-semibold">Data Emissão</th>
                  <th className="px-6 py-3.5 font-semibold">Data Entrada</th>
                  <th className="px-6 py-3.5 font-semibold">Valor Total</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPurchases.map((p) => {
                  const isConcluido = p.status === "concluido";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-[#14274B] text-sm">
                          {p.code}
                        </div>
                        {p.nfeNumber ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm mt-0.5">
                            NF-e {p.nfeNumber} {p.nfeSeries ? `(Série ${p.nfeSeries})` : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm mt-0.5">
                            Compra Manual
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {p.supplierName || "Fornecedor Avulso"}
                        </div>
                        {p.supplierDocument && (
                          <div className="text-xs text-slate-400 font-mono">
                            CNPJ: {p.supplierDocument}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(p.issueDate)}
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {formatDate(p.entryDate)}
                      </td>

                      <td className="px-6 py-4 font-bold font-mono text-slate-900 text-sm">
                        {formatCurrency(p.totalAmountCents)}
                      </td>

                      <td className="px-6 py-4">
                        {isConcluido ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Concluída
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full font-medium">
                            Cancelada
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isConcluido && (
                          <button
                            type="button"
                            onClick={() => handleCancelPurchase(p.id, p.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Cancelar Compra e Estornar Estoque"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPurchases.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal Padronizado de Nova Compra & Importação de XML */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Fixo */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1730] text-[#E3B48A] flex items-center justify-center shrink-0">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Entrada de Compra & Importação de NF-e
                  </h3>
                  <p className="text-xs text-slate-500">
                    Importe o XML da nota fiscal ou lance manualmente com entrada em estoque e financeiro.
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

            {/* Abas Superiores */}
            <div className="shrink-0 px-6 pt-3 border-b border-slate-200 bg-white flex gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("xml")}
                className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === "xml"
                    ? "border-[#B87A52] text-[#B87A52]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Importar XML (NF-e)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === "manual"
                    ? "border-[#B87A52] text-[#B87A52]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Lançamento Manual</span>
              </button>
            </div>

            {/* Corpo do Modal com Scroll Interno */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {activeTab === "xml" ? (
                /* =================== ABA 1: IMPORTAR XML =================== */
                <div className="space-y-5">
                  {/* Dropzone de Upload */}
                  {!parsedNFe ? (
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#B87A52] bg-slate-50 hover:bg-amber-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleXmlUpload}
                        className="hidden"
                      />
                      <div className="w-14 h-14 rounded-full bg-white shadow-xs flex items-center justify-center text-[#B87A52] mb-3">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">
                        Clique ou arraste o arquivo XML da NF-e aqui
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        O sistema fará a leitura automática dos produtos, fornecedor, valores e parcelas de cobrança.
                      </p>
                      <span className="mt-4 px-3 py-1.5 rounded-lg bg-[#0B1730] text-white text-xs font-semibold">
                        Selecionar Arquivo .XML
                      </span>
                    </label>
                  ) : (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Banner do Arquivo Carregado */}
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileCode className="w-5 h-5 text-emerald-600" />
                          <div>
                            <span className="text-xs font-bold text-emerald-900 block">
                              Arquivo XML Carregado: {xmlFileName}
                            </span>
                            <span className="text-[11px] text-emerald-700">
                              Chave: <span className="font-mono">{parsedNFe.key}</span>
                            </span>
                          </div>
                        </div>
                        <label className="text-xs font-semibold text-[#B87A52] hover:underline cursor-pointer">
                          Trocar XML
                          <input
                            type="file"
                            accept=".xml"
                            onChange={handleXmlUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Dados Identificados da Nota e Fornecedor */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-[#B87A52]" />
                            <span>Fornecedor (Emitente)</span>
                          </span>
                          <div className="font-bold text-slate-900 text-sm">
                            {parsedNFe.supplier.name}
                          </div>
                          {parsedNFe.supplier.tradeName && (
                            <div className="text-xs text-slate-500">
                              Fantasia: {parsedNFe.supplier.tradeName}
                            </div>
                          )}
                          <div className="text-xs text-slate-600 font-mono">
                            CNPJ: {parsedNFe.supplier.document || "Não informado"}
                          </div>
                          {parsedNFe.supplier.address && (
                            <div className="text-xs text-slate-500 line-clamp-1">
                              📍 {parsedNFe.supplier.address} ({parsedNFe.supplier.city} - {parsedNFe.supplier.state})
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <ReceiptText className="w-4 h-4 text-[#B87A52]" />
                            <span>Dados da Nota Fiscal</span>
                          </span>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Número da NF-e:</span>
                            <strong className="font-mono text-slate-900 text-sm">
                              {parsedNFe.number} (Série {parsedNFe.series})
                            </strong>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Data de Emissão:</span>
                            <span className="font-medium text-slate-700">
                              {formatDate(parsedNFe.issueDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                            <span className="text-slate-700 font-bold">Valor Total da Nota:</span>
                            <strong className="font-mono text-base font-bold text-[#B87A52]">
                              {formatCurrency(parsedNFe.totalAmount * 100)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Conciliação de Itens com o Estoque */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <Boxes className="w-4 h-4 text-[#B87A52]" />
                              <span>Itens da Nota & Vínculo com Estoque ({parsedNFe.items.length})</span>
                            </h4>
                            <p className="text-xs text-slate-500">
                              Associe cada produto a um material existente ou deixe como "Criar Novo Material".
                            </p>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-3.5 py-2.5">Item no XML</th>
                                <th className="px-3.5 py-2.5 text-center">Qtde / Un</th>
                                <th className="px-3.5 py-2.5 text-right">Custo Unit.</th>
                                <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                                <th className="px-3.5 py-2.5">Vínculo com Material no Estoque</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {parsedNFe.items.map((it) => {
                                const currentMap = itemMappings[it.itemNumber] || {
                                  materialId: "",
                                  category: "Matéria-prima",
                                };
                                return (
                                  <tr key={it.itemNumber} className="hover:bg-slate-50/70">
                                    <td className="px-3.5 py-3">
                                      <div className="font-semibold text-slate-900 line-clamp-2">
                                        {it.productName}
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono">
                                        Cód: {it.productCode || "-"} | NCM: {it.ncm || "-"}
                                      </div>
                                    </td>
                                    <td className="px-3.5 py-3 text-center font-mono font-medium">
                                      {it.quantity} {it.unit}
                                    </td>
                                    <td className="px-3.5 py-3 text-right font-mono text-slate-600">
                                      {formatCurrency(it.unitPrice * 100)}
                                    </td>
                                    <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                                      {formatCurrency(it.totalPrice * 100)}
                                    </td>
                                    <td className="px-3.5 py-3">
                                      <select
                                        value={currentMap.materialId}
                                        onChange={(e) => {
                                          setItemMappings({
                                            ...itemMappings,
                                            [it.itemNumber]: {
                                              ...currentMap,
                                              materialId: e.target.value,
                                            },
                                          });
                                        }}
                                        className={`w-full h-8 px-2 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 ${
                                          currentMap.materialId
                                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                            : "bg-amber-50 border-amber-300 text-amber-900"
                                        }`}
                                      >
                                        <option value="">➕ Criar Novo Material no Estoque</option>
                                        {materials.map((m) => (
                                          <option key={m.id} value={m.id}>
                                            Vincular a: {m.name} ({m.unit}) - Saldo atual: {m.currentStock}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Cobrança / Contas a Pagar Extraídas */}
                      {parsedNFe.installments.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>Contas a Pagar Geradas ({parsedNFe.installments.length} parcelas)</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {parsedNFe.installments.map((inst, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-700">Parcela {inst.number}</span>
                                  <span className="text-slate-400 block text-[11px]">
                                    Venc: {formatDate(inst.dueDate)}
                                  </span>
                                </div>
                                <strong className="font-mono text-slate-900">
                                  {formatCurrency(inst.amount * 100)}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* =================== ABA 2: LANÇAMENTO MANUAL =================== */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Fornecedor *
                      </label>
                      <select
                        value={manualSupplierId}
                        onChange={(e) => setManualSupplierId(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.document ? `(${s.document})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Número NF-e / Recibo
                      </label>
                      <input
                        type="text"
                        value={manualNfeNumber}
                        onChange={(e) => setManualNfeNumber(e.target.value)}
                        placeholder="Ex: 54321"
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Data de Emissão
                      </label>
                      <input
                        type="date"
                        value={manualIssueDate}
                        onChange={(e) => setManualIssueDate(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>

                  {/* Adicionar Material na Compra Manual */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-[#B87A52]" />
                      <span>Adicionar Material para Entrada de Estoque</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Material do Estoque *
                        </label>
                        <select
                          value={selectedMatToAdd}
                          onChange={(e) => setSelectedMatToAdd(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        >
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit}) - Atual: {m.currentStock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Quantidade Comprada
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={manualQtyToAdd}
                          onChange={(e) => setManualQtyToAdd(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Custo Unitário (R$)
                        </label>
                        <input
                          type="text"
                          value={manualCostToAdd}
                          onChange={(e) => setManualCostToAdd(e.target.value)}
                          placeholder="Ex: 85,00"
                          className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddManualItem}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E3B48A]" />
                        <span>Adicionar Item à Compra</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabela de Itens Manuais Adicionados */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Material</th>
                          <th className="px-3.5 py-2.5 text-center">Quantidade</th>
                          <th className="px-3.5 py-2.5 text-right">Custo Unit.</th>
                          <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                          <th className="px-3.5 py-2.5 text-center">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {manualItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              Nenhum item adicionado à compra ainda.
                            </td>
                          </tr>
                        ) : (
                          manualItems.map((it, idx) => {
                            const cost = parseFloat(it.unitCost.replace(/\./g, "").replace(",", ".")) || 0;
                            const qty = parseFloat(it.quantity) || 1;
                            const total = cost * qty;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="px-3.5 py-3 font-semibold text-slate-900">
                                  {it.productName}
                                </td>
                                <td className="px-3.5 py-3 text-center font-mono">
                                  {it.quantity} {it.unit}
                                </td>
                                <td className="px-3.5 py-3 text-right font-mono text-slate-600">
                                  R$ {cost.toFixed(2).replace(".", ",")}
                                </td>
                                <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900">
                                  R$ {total.toFixed(2).replace(".", ",")}
                                </td>
                                <td className="px-3.5 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveManualItem(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Parcelas e Contas a Pagar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Condição de Pagamento
                      </label>
                      <select
                        value={manualInstallmentsCount}
                        onChange={(e) => setManualInstallmentsCount(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      >
                        <option value="1">1x (À Vista)</option>
                        <option value="2">2x (30 / 60 dias)</option>
                        <option value="3">3x (30 / 60 / 90 dias)</option>
                        <option value="4">4x mensais</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        1º Vencimento no Contas a Pagar
                      </label>
                      <input
                        type="date"
                        value={manualFirstDueDate}
                        onChange={(e) => setManualFirstDueDate(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Fixo com Botões */}
            <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div>
                {activeTab === "xml" && parsedNFe && (
                  <span className="text-xs text-slate-500">
                    Total NF-e: <strong className="text-slate-900 font-mono text-sm">{formatCurrency(parsedNFe.totalAmount * 100)}</strong>
                  </span>
                )}
                {activeTab === "manual" && manualItems.length > 0 && (
                  <span className="text-xs text-slate-500">
                    Total Compra:{" "}
                    <strong className="text-slate-900 font-mono text-sm">
                      R${" "}
                      {manualItems
                        .reduce((acc, it) => {
                          const c = parseFloat(it.unitCost.replace(/\./g, "").replace(",", ".")) || 0;
                          const q = parseFloat(it.quantity) || 1;
                          return acc + c * q;
                        }, 0)
                        .toFixed(2)
                        .replace(".", ",")}
                    </strong>
                  </span>
                )}
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
                  type="button"
                  disabled={
                    isSubmitting ||
                    (activeTab === "xml" && !parsedNFe) ||
                    (activeTab === "manual" && manualItems.length === 0)
                  }
                  onClick={handleSubmitPurchase}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSubmitting ? "Gravando Entrada..." : "Confirmar Entrada de Estoque & Financeiro"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
