"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import {
  LayoutDashboard,
  Users,
  Layers,
  Calculator,
  FileText,
  Hammer,
  DollarSign,
  Truck,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orçamentos", href: "/dashboard/quotes", icon: Calculator },
  { label: "Ordens de Serviço", href: "/dashboard/orders", icon: Hammer },
  { label: "Clientes", href: "/dashboard/clients", icon: Users },
  { label: "Materiais & Itens", href: "/dashboard/materials", icon: Layers },
  { label: "Financeiro", href: "/dashboard/financial", icon: DollarSign },
  { label: "Fornecedores", href: "/dashboard/suppliers", icon: Truck },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-navy-dark border-r border-navy/40 flex flex-col justify-between shrink-0 min-h-screen text-white select-none">
      <div>
        {/* Top Branding */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5 shadow-sm">
            <Image
              src="/logo_gmsign.jpeg"
              alt="GM Sign"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-copper-light block">
              GM SIGN
            </span>
            <span className="text-[10px] text-white/50 uppercase tracking-wider block">
              Gestão & Produção
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-linear-to-r from-copper to-copper-light text-navy font-semibold shadow-md"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-navy" : "text-copper-light/80"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-copper/30 text-copper-light border border-copper/50 flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-copper-light uppercase tracking-wider">
              {user.role}
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-white/80 transition-colors"
          >
            <LogOut size={14} />
            <span>Encerrar Sessão</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
