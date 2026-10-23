"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Imprimir / Salvar PDF", className }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ||
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
      }
    >
      <Printer className="w-4 h-4 text-[#E3B48A]" />
      <span>{label}</span>
    </button>
  );
}
