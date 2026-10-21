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
  MapPin,
  X,
  Save,
  CheckCircle2,
  Building,
} from "lucide-react";
import {
  createClientAction,
  updateClientAction,
  toggleClientStatusAction,
} from "@/domains/clients/actions";
import { Pagination } from "@/components/ui/pagination";

export interface ClientData {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  personType: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  contactPerson: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
}

interface ClientManagerProps {
  initialClients: ClientData[];
}

export function ClientManager({ initialClients }: ClientManagerProps) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "inativos" | "todos">("ativos");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Filtros
  const filteredClients = initialClients.filter((c) => {
    if (statusFilter === "ativos" && !c.active) return false;
    if (statusFilter === "inativos" && c.active) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchTrade = c.tradeName?.toLowerCase().includes(q);
      const matchDoc = c.document?.toLowerCase().includes(q);
      const matchContact = c.contactPerson?.toLowerCase().includes(q);
      const matchCity = c.city?.toLowerCase().includes(q);
      return matchName || matchTrade || matchDoc || matchContact || matchCity;
    }
    return true;
  });

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeCount = initialClients.filter((c) => c.active).length;
  const inactiveCount = initialClients.filter((c) => !c.active).length;

  const handleOpenCreate = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (client: ClientData) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingClient(null);
  };

  const handleToggleStatus = async (client: ClientData) => {
    const nextStatus = !client.active;
    const confirmMsg = nextStatus
      ? `Deseja reativar o cliente "${client.name}"?`
      : `Deseja inativar o cliente "${client.name}"?`;

    if (window.confirm(confirmMsg)) {
      await toggleClientStatusAction(client.id, nextStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Carteira de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre, edite informações comerciais e gerencie clientes ativos e inativos da GM Sign.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
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
            placeholder="Buscar por razão social, nome fantasia, documento..."
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => {
              setStatusFilter("ativos");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === "ativos"
                ? "bg-white text-[#0B1730] shadow-2xs font-semibold"
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
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === "inativos"
                ? "bg-white text-[#0B1730] shadow-2xs font-semibold"
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
            className={`px-3 py-1.5 rounded-md transition-colors ${
              statusFilter === "todos"
                ? "bg-white text-[#0B1730] shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos ({initialClients.length})
          </button>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">
            {statusFilter === "ativos"
              ? "Clientes Ativos"
              : statusFilter === "inativos"
              ? "Clientes Inativados"
              : "Todos os Clientes"}
          </h2>
          <span className="text-xs text-slate-500">{filteredClients.length} encontrados</span>
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhum cliente encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Não há clientes correspondentes aos filtros selecionados.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E3B48A]" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Cliente / Razão Social</th>
                  <th className="px-6 py-3.5">Nome Fantasia</th>
                  <th className="px-6 py-3.5">Documento</th>
                  <th className="px-6 py-3.5">Contato</th>
                  <th className="px-6 py-3.5">Localização</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      {c.contactPerson && (
                        <div className="text-xs text-slate-400">Resp: {c.contactPerson}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.tradeName || "-"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      <span className="text-[10px] text-slate-400 block font-sans font-semibold">
                        {c.personType}
                      </span>
                      {c.document || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-[#B87A52]" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.city ? `${c.city} - ${c.state || "SP"}` : "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 hover:text-[#B87A52] bg-slate-100 hover:bg-[#B87A52]/10 transition-colors cursor-pointer"
                          title="Editar Cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                            c.active
                              ? "text-rose-700 hover:bg-rose-50 border border-rose-200"
                              : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                          }`}
                          title={c.active ? "Inativar Cliente" : "Reativar Cliente"}
                        >
                          {c.active ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Inativar</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reativar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredClients.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B1730] text-[#E3B48A] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingClient ? "Editar Cadastro de Cliente" : "Cadastrar Novo Cliente"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingClient
                      ? "Altere os dados comerciais e de contato"
                      : "Insira os dados para orçamentos e pedidos de comunicação visual"}
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
                if (editingClient) {
                  formData.append("id", editingClient.id);
                  await updateClientAction(formData);
                } else {
                  await createClientAction(formData);
                }
                setIsSubmitting(false);
                handleCloseModal();
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Razão Social / Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingClient?.name || ""}
                    placeholder="Ex: Comercial Ferreira Ltda"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Pessoa
                  </label>
                  <select
                    name="personType"
                    defaultValue={editingClient?.personType || "PJ"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  >
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                    <option value="PF">Pessoa Física (PF)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    name="tradeName"
                    defaultValue={editingClient?.tradeName || ""}
                    placeholder="Ex: Rede Ferreira"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Documento (CNPJ ou CPF)
                  </label>
                  <input
                    type="text"
                    name="document"
                    defaultValue={editingClient?.document || ""}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone Fixo
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingClient?.phone || ""}
                    placeholder="(11) 3333-4444"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp / Celular
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    defaultValue={editingClient?.whatsapp || ""}
                    placeholder="(11) 98888-7777"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Responsável / Contato
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    defaultValue={editingClient?.contactPerson || ""}
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingClient?.email || ""}
                  placeholder="compras@cliente.com.br"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Endereço / Logradouro
                  </label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingClient?.address || ""}
                    placeholder="Av. Paulista, 1000 - Loja 2"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingClient?.city || "São Paulo"}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    UF / Estado
                  </label>
                  <input
                    type="text"
                    name="state"
                    defaultValue={editingClient?.state || "SP"}
                    maxLength={2}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Observações Comerciais
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingClient?.notes || ""}
                  placeholder="Informações sobre faturamento, horários de instalação, preferências..."
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
                  <span>{isSubmitting ? "Salvando..." : editingClient ? "Atualizar Cliente" : "Salvar Cliente"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
