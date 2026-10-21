"use client";

import { useState } from "react";
import {
  Users,
  Layers,
  Ruler,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Shield,
  Key,
  Lock,
} from "lucide-react";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createUnitAction,
  updateUnitAction,
  deleteUnitAction,
} from "@/domains/settings/actions";
import { Pagination } from "@/components/ui/pagination";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
}

export interface UnitItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
}

interface SettingsManagerProps {
  initialUsers: UserItem[];
  initialCategories: CategoryItem[];
  initialUnits: UnitItem[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  admin: { label: "Administrador", bg: "bg-purple-100", text: "text-purple-800" },
  comercial: { label: "Comercial / Vendas", bg: "bg-blue-100", text: "text-blue-800" },
  producao: { label: "Produção / Oficina", bg: "bg-amber-100", text: "text-amber-800" },
  financeiro: { label: "Financeiro", bg: "bg-emerald-100", text: "text-emerald-800" },
};

export function SettingsManager({
  initialUsers,
  initialCategories,
  initialUnits,
}: SettingsManagerProps) {
  const [activeTab, setActiveTab] = useState<"users" | "categories" | "units">("users");

  // Estados de busca
  const [searchUser, setSearchUser] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchUnit, setSearchUnit] = useState("");

  // Paginação
  const ITEMS_PER_PAGE = 10;
  const [userPage, setUserPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [unitPage, setUnitPage] = useState(1);

  // Modais
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtros
  const filteredUsers = initialUsers.filter((u) => {
    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * ITEMS_PER_PAGE,
    userPage * ITEMS_PER_PAGE
  );

  const filteredCategories = initialCategories.filter((c) => {
    if (!searchCategory.trim()) return true;
    const q = searchCategory.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * ITEMS_PER_PAGE,
    categoryPage * ITEMS_PER_PAGE
  );

  const filteredUnits = initialUnits.filter((u) => {
    if (!searchUnit.trim()) return true;
    const q = searchUnit.toLowerCase();
    return u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.description && u.description.toLowerCase().includes(q));
  });

  const paginatedUnits = filteredUnits.slice(
    (unitPage - 1) * ITEMS_PER_PAGE,
    unitPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
          Configurações do Sistema
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie os usuários de acesso, catálogo de categorias e unidades de medida para precificação.
        </p>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "users"
              ? "border-[#B87A52] text-[#0B1730]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4 text-[#B87A52]" />
          <span>Usuários ({initialUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "categories"
              ? "border-[#B87A52] text-[#0B1730]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4 text-[#B87A52]" />
          <span>Categorias de Materiais ({initialCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("units")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "units"
              ? "border-[#B87A52] text-[#0B1730]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Ruler className="w-4 h-4 text-[#B87A52]" />
          <span>Unidades de Medida ({initialUnits.length})</span>
        </button>
      </div>

      {/* =========================================================
          ABA 1: USUÁRIOS
      ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Buscar usuário por nome, e-mail ou cargo..."
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
              />
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Nome / Usuário</th>
                  <th className="px-6 py-3.5">E-mail</th>
                  <th className="px-6 py-3.5">Perfil de Acesso</th>
                  <th className="px-6 py-3.5">Data Cadastro</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((u) => {
                  const roleBadge = ROLE_LABELS[u.role] || {
                    label: u.role,
                    bg: "bg-slate-100",
                    text: "text-slate-700",
                  };
                  const isAdminUser = u.email === "admin@gmsign.com.br" || u.role === "admin";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          {isAdminUser && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              <Lock className="w-2.5 h-2.5" />
                              Fixo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge.bg} ${roleBadge.text}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4">
                        {u.active ? (
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
                        {isAdminUser ? (
                          <div className="flex items-center justify-end">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 select-none"
                              title="Usuário Administrador principal protegido contra alterações e exclusão."
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Protegido</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setUserModalOpen(true);
                              }}
                              className="p-1.5 rounded-md text-slate-600 hover:text-[#B87A52] hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                              title="Editar Usuário"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Deseja inativar o usuário "${u.name}"?`)) {
                                  await deleteUserAction(u.id);
                                }
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Inativar Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={userPage}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setUserPage}
            />
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 2: CATEGORIAS DE MATERIAIS
      ========================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCategory}
                onChange={(e) => {
                  setSearchCategory(e.target.value);
                  setCategoryPage(1);
                }}
                placeholder="Buscar categoria por nome ou descrição..."
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
              />
            </div>

            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Nome da Categoria</th>
                  <th className="px-6 py-3.5">Descrição</th>
                  <th className="px-6 py-3.5">Data Criação</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0B1730]">
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                        {c.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{c.description || "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4">
                      {c.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-md text-slate-600 hover:text-[#B87A52] hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                          title="Editar Categoria"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Deseja excluir a categoria "${c.name}"?`)) {
                              await deleteCategoryAction(c.id);
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={categoryPage}
              totalItems={filteredCategories.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCategoryPage}
            />
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 3: UNIDADES DE MEDIDA
      ========================================================= */}
      {activeTab === "units" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUnit}
                onChange={(e) => {
                  setSearchUnit(e.target.value);
                  setUnitPage(1);
                }}
                placeholder="Buscar unidade por código ou descrição..."
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
              />
            </div>

            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Unidade</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Código / Sigla</th>
                  <th className="px-6 py-3.5">Nome por Extenso</th>
                  <th className="px-6 py-3.5">Descrição</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#14274B]">
                      <span className="px-2.5 py-1 rounded bg-[#14274B]/5 text-[#14274B] border border-[#14274B]/10">
                        {u.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{u.description || "-"}</td>
                    <td className="px-6 py-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Inativa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUnit(u);
                            setUnitModalOpen(true);
                          }}
                          className="p-1.5 rounded-md text-slate-600 hover:text-[#B87A52] hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                          title="Editar Unidade"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Deseja excluir a unidade "${u.name}" (${u.code})?`)) {
                              await deleteUnitAction(u.id);
                            }
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir Unidade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={unitPage}
              totalItems={filteredUnits.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setUnitPage}
            />
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DE USUÁRIOS
      ========================================================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                if (editingUser && (editingUser.email === "admin@gmsign.com.br" || editingUser.role === "admin")) {
                  alert("O usuário administrador principal é protegido e não pode ser alterado.");
                  return;
                }
                setIsSubmitting(true);
                try {
                  if (editingUser) {
                    formData.append("id", editingUser.id);
                    await updateUserAction(formData);
                  } else {
                    await createUserAction(formData);
                  }
                  setUserModalOpen(false);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "Erro ao processar usuário";
                  alert(msg);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingUser?.name || ""}
                  placeholder="Ex: João da Silva"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editingUser?.email || ""}
                  placeholder="usuario@gmsign.com.br"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Senha {editingUser ? "(Deixe em branco para não alterar)" : "*"}
                </label>
                <input
                  type="password"
                  name="password"
                  required={!editingUser}
                  placeholder="••••••••"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Perfil de Acesso / Função *
                </label>
                <select
                  name="role"
                  defaultValue={editingUser?.role || "comercial"}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                >
                  <option value="admin">Administrador (Acesso total)</option>
                  <option value="comercial">Comercial / Vendas (Orçamentos)</option>
                  <option value="producao">Produção / Oficina (Pedidos e Estoque)</option>
                  <option value="financeiro">Financeiro (Contas a Receber)</option>
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status da Conta
                  </label>
                  <select
                    name="active"
                    defaultValue={editingUser.active ? "true" : "false"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
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
                  <span>{isSubmitting ? "Salvando..." : "Salvar Usuário"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DE CATEGORIAS
      ========================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategory ? "Editar Categoria de Material" : "Nova Categoria de Material"}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                setIsSubmitting(true);
                if (editingCategory) {
                  formData.append("id", editingCategory.id);
                  await updateCategoryAction(formData);
                } else {
                  await createCategoryAction(formData);
                }
                setIsSubmitting(false);
                setCategoryModalOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ""}
                  placeholder="Ex: ACM, Lona, Vinil, Aço Inox..."
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCategory?.description || ""}
                  placeholder="Informações sobre os tipos de materiais pertencentes a este grupo..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
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
                  <span>{isSubmitting ? "Salvando..." : "Salvar Categoria"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DE UNIDADES DE MEDIDA
      ========================================================= */}
      {unitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUnit ? "Editar Unidade de Medida" : "Nova Unidade de Medida"}
              </h3>
              <button
                type="button"
                onClick={() => setUnitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                setIsSubmitting(true);
                if (editingUnit) {
                  formData.append("id", editingUnit.id);
                  await updateUnitAction(formData);
                } else {
                  await createUnitAction(formData);
                }
                setIsSubmitting(false);
                setUnitModalOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Código / Sigla *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    defaultValue={editingUnit?.code || ""}
                    placeholder="Ex: chapa, m2, ml, barra, un"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nome por Extenso *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingUnit?.name || ""}
                    placeholder="Ex: Metro Quadrado, Barra 6m"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingUnit?.description || ""}
                  placeholder="Informações adicionais sobre o modo de contagem ou conversão..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
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
                  <span>{isSubmitting ? "Salvando..." : "Salvar Unidade"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
