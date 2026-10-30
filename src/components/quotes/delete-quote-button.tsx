"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteQuoteAction } from "@/domains/quotes/actions";

interface DeleteQuoteButtonProps {
  quoteId: string;
  quoteCode: string;
  clientName: string;
}

export function DeleteQuoteButton({
  quoteId,
  quoteCode,
  clientName,
}: DeleteQuoteButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteQuoteAction(quoteId);
      if (res && !res.success) {
        alert(res.error || "Erro ao excluir orçamento.");
        return;
      }
      setConfirmOpen(false);
      router.push("/dashboard/quotes");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir orçamento.";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200/80 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
        title="Excluir Orçamento"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Excluir</span>
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Orçamento
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Deseja mesmo excluir o orçamento{" "}
                  <strong className="font-semibold text-slate-900 font-mono">
                    {quoteCode}
                  </strong>{" "}
                  do cliente{" "}
                  <strong className="font-semibold text-slate-900">
                    {clientName}
                  </strong>
                  ?
                </p>
                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700 leading-relaxed">
                  Atenção: Esta ação é definitiva e removerá todos os itens técnicos e cálculos vinculados a esta proposta.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
