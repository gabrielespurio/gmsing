"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  X,
  Save,
  CheckCircle2,
  XCircle,
  Briefcase,
  Layers,
  Clock,
  FileText,
} from "lucide-react";
import {
  createEmployeeAction,
  updateEmployeeAction,
  toggleEmployeeStatusAction,
  deleteEmployeeAction,
} from "@/domains/employees/actions";
import { Pagination } from "@/components/ui/pagination";

export interface EmployeeData {
  id: string;
  name: string;
  document: string | null;
  role: string;
  department: string;
  phone: string | null;
  email: string | null;
  admissionDate: Date | null;
  salary: string | null;
  hourlyRate: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeManagerProps {
  initialEmployees: EmployeeData[];
}

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Produção / Oficina": { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  "Instalação / Campo": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  "Criação / Pré-impressão": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  "Comercial / Vendas": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  "Administrativo / Financeiro": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
};

const SUGGESTED_ROLES = [
  "Impressor Digital / Plotter",
  "Serralheiro de Fachadas & Estruturas",
  "Instalador / Aplicador de Vinil",
  "Arte-Finalista / Designer Gráfico",
  "Operador de CNC Router / Laser",
  "Acabador / Montador de Sinalização",
  "Vendedor Técnico / Comercial",
  "Gerente de Produção",
  "Auxiliar Geral de Produção",
];

const DEPARTMENTS = [
  "Produção / Oficina",
  "Instalação / Campo",
  "Criação / Pré-impressão",
  "Comercial / Vendas",
  "Administrativo / Financeiro",
  "Geral / Outros",
];

function formatDate(date: Date | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(val: string | number | null | undefined) {
  if (!val) return "-";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function EmployeeManager({ initialEmployees }: EmployeeManagerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "inativos" | "todos">("ativos");
  const [departmentFilter, setDepartmentFilter] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Filtros
  const filteredEmployees = initialEmployees.filter((e) => {
    if (statusFilter === "ativos" && !e.active) return false;
    if (statusFilter === "inativos" && e.active) return false;

    if (departmentFilter !== "todos" && e.department !== departmentFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = e.name?.toLowerCase().includes(q);
      const matchRole = e.role?.toLowerCase().includes(q);
      const matchDept = e.department?.toLowerCase().includes(q);
      const matchDoc = e.document?.toLowerCase().includes(q);
      const matchEmail = e.email?.toLowerCase().includes(q);
      const matchPhone = e.phone?.toLowerCase().includes(q);
      return matchName || matchRole || matchDept || matchDoc || matchEmail || matchPhone;
    }
    return true;
  });

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeCount = initialEmployees.filter((e) => e.active).length;
  const inactiveCount = initialEmployees.filter((e) => !e.active).length;

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (employee: EmployeeData) => {
    setEditingEmployee(employee);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEmployee(null);
  };

  const handleToggleStatus = async (employee: EmployeeData) => {
    const nextStatus = !employee.active;
    const confirmMsg = nextStatus
      ? `Deseja reativar o colaborador "${employee.name}"?`
      : `Deseja inativar o colaborador "${employee.name}"?`;

    if (window.confirm(confirmMsg)) {
      await toggleEmployeeStatusAction(employee.id, nextStatus);
    }
  };

  const handleDelete = async (employee: EmployeeData) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o cadastro de "${employee.name}"?`)) {
      await deleteEmployeeAction(employee.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Quadro de Funcionários
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão da equipe interna de produção, serralheria, instalação, arte e comercial da GM Sign.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nome, cargo, CPF, telefone..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          >
            <option value="todos">Todos os Setores</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => {
              setStatusFilter("ativos");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === "ativos"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter("inativos");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === "inativos"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Inativos ({inactiveCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter("todos");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              statusFilter === "todos"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos ({initialEmployees.length})
          </button>
        </div>
      </div>

      {/* Tabela de Funcionários */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Colaborador</th>
                <th className="px-6 py-3.5">Cargo / Setor</th>
                <th className="px-6 py-3.5">Contato</th>
                <th className="px-6 py-3.5">Admissão</th>
                <th className="px-6 py-3.5">Remuneração</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600">Nenhum funcionário encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? "Tente buscar com outros termos." : "Clique em 'Novo Funcionário' para cadastrar."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((e) => {
                  const deptStyle = DEPARTMENT_COLORS[e.department] || {
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Nome e CPF */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{e.name}</div>
                        {e.document && (
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            CPF: {e.document}
                          </div>
                        )}
                      </td>

                      {/* Cargo e Setor */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          {e.role}
                        </div>
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 mt-1 rounded border ${deptStyle.bg} ${deptStyle.text} ${deptStyle.border}`}
                        >
                          {e.department}
                        </span>
                      </td>

                      {/* Contato */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-slate-600">
                          {e.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{e.phone}</span>
                            </div>
                          ) : null}
                          {e.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{e.email}</span>
                            </div>
                          ) : null}
                          {!e.phone && !e.email && (
                            <span className="text-slate-400 italic">Sem contato</span>
                          )}
                        </div>
                      </td>

                      {/* Admissão */}
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {e.admissionDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(e.admissionDate)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Remuneração */}
                      <td className="px-6 py-4 text-xs">
                        {e.salary ? (
                          <div className="font-semibold text-slate-800">
                            {formatCurrency(e.salary)}
                            <span className="text-[10px] text-slate-400 font-normal ml-1">/mês</span>
                          </div>
                        ) : null}
                        {e.hourlyRate ? (
                          <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                            {formatCurrency(e.hourlyRate)}/h
                          </div>
                        ) : null}
                        {!e.salary && !e.hourlyRate && (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {e.active ? (
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

                      {/* Ações */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(e)}
                            className="p-1.5 rounded-md text-slate-600 hover:text-[#B87A52] hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(e)}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              e.active
                                ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={e.active ? "Inativar Funcionário" : "Reativar Funcionário"}
                          >
                            {e.active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredEmployees.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* =========================================================
          MODAL DE CADASTRO / EDIÇÃO DE FUNCIONÁRIO
      ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados profissionais e contratuais do colaborador da GM Sign.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              action={async (formData: FormData) => {
                setIsSubmitting(true);
                try {
                  if (editingEmployee) {
                    formData.append("id", editingEmployee.id);
                    await updateEmployeeAction(formData);
                  } else {
                    await createEmployeeAction(formData);
                  }
                  handleCloseModal();
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "Erro ao salvar funcionário";
                  alert(msg);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {/* Nome e CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingEmployee?.name || ""}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="document"
                    defaultValue={editingEmployee?.document || ""}
                    placeholder="000.000.000-00"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              {/* Cargo e Setor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    name="role"
                    required
                    list="roleSuggestions"
                    defaultValue={editingEmployee?.role || ""}
                    placeholder="Ex: Impressor Digital / Plotter"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                  <datalist id="roleSuggestions">
                    {SUGGESTED_ROLES.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Setor / Departamento *
                  </label>
                  <select
                    name="department"
                    required
                    defaultValue={editingEmployee?.department || "Produção / Oficina"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contato (Telefone e Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingEmployee?.phone || ""}
                    placeholder="(11) 98765-4321"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingEmployee?.email || ""}
                    placeholder="funcionario@gmsign.com.br"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              {/* Admissão & Custos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    name="admissionDate"
                    defaultValue={
                      editingEmployee?.admissionDate
                        ? new Date(editingEmployee.admissionDate).toISOString().split("T")[0]
                        : ""
                    }
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Salário Base (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="salary"
                    defaultValue={editingEmployee?.salary || ""}
                    placeholder="0.00"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Custo Hora (R$/h)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="hourlyRate"
                    defaultValue={editingEmployee?.hourlyRate || ""}
                    placeholder="0.00"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              {/* Status (se edição) */}
              {editingEmployee && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status da Atividade
                  </label>
                  <select
                    name="active"
                    defaultValue={editingEmployee.active ? "true" : "false"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Observações Gerais / Especialidades / EPIs
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingEmployee?.notes || ""}
                  placeholder="Ex: Certificado NR-35 (Trabalho em altura), CNH B, especialista em envelopamento de frotas e solda MIG..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] disabled:opacity-50 text-white font-bold text-sm shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Salvando..." : "Salvar Funcionário"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
