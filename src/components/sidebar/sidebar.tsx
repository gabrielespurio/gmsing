"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Boxes,
  PackageCheck,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { logout } from "@/app/actions";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    allowedModules?: string[];
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const allowed = user.allowedModules || (user.role === "admin" ? ["all"] : []);
  const isAdmin = user.role === "admin" || allowed.includes("all");

  const navItems = [
    {
      key: "dashboard",
      label: "Visão Geral",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      key: "quotes",
      label: "Orçamentos",
      href: "/dashboard/quotes",
      icon: FileText,
      active: pathname.startsWith("/dashboard/quotes"),
      badge: "Vendas",
    },
    {
      key: "orders",
      label: "Pedidos",
      href: "/dashboard/orders",
      icon: ShoppingBag,
      active: pathname.startsWith("/dashboard/orders"),
      badge: "Produção",
    },
    {
      key: "products",
      label: "Produtos & Serviços",
      href: "/dashboard/products",
      icon: Boxes,
      active: pathname.startsWith("/dashboard/products"),
      badge: "Catálogo",
    },
    {
      key: "stock",
      label: "Estoque & Materiais",
      href: "/dashboard/stock",
      icon: PackageCheck,
      active: pathname.startsWith("/dashboard/stock"),
    },
    {
      key: "purchases",
      label: "Compras",
      href: "/dashboard/purchases",
      icon: Truck,
      active: pathname.startsWith("/dashboard/purchases"),
      badge: "Suprimentos",
    },
    {
      key: "clients",
      label: "Clientes",
      href: "/dashboard/clients",
      icon: Users,
      active: pathname.startsWith("/dashboard/clients"),
    },
    {
      key: "financial",
      label: "Financeiro",
      href: "/dashboard/financial",
      icon: DollarSign,
      active: pathname.startsWith("/dashboard/financial"),
      badge: "Receber",
    },
    {
      key: "settings",
      label: "Configurações",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname.startsWith("/dashboard/settings"),
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    return allowed.includes(item.key);
  });

  return (
    <aside className="w-64 h-screen bg-[#0B1730] border-r border-[#1e345e] flex flex-col shrink-0 select-none text-slate-300 sticky top-0 overflow-hidden">
      {/* Brand header */}
      <div className="h-20 px-6 border-b border-[#1e345e] flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#B87A52]/30 shadow-inner bg-slate-900 shrink-0">
          <Image
            src="/logo_gmsign.jpeg"
            alt="GM Sign Solutions"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm tracking-tight text-white truncate">
            GM Sign Solutions
          </span>
          <span className="text-[10px] tracking-widest text-[#E3B48A] font-semibold uppercase">
            Comunicação Visual
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Módulos Principais
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                item.active
                  ? "bg-[#14274B] text-white border-l-4 border-[#B87A52] shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-[#14274B]/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    item.active ? "text-[#E3B48A]" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    item.active
                      ? "bg-[#B87A52]/20 text-[#E3B48A] border border-[#B87A52]/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-[#1e345e] bg-[#070e1e] shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#14274B] border border-[#B87A52]/50 flex items-center justify-center text-xs font-bold text-[#E3B48A] shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-red-300 bg-slate-800/60 hover:bg-red-950/40 border border-slate-700/50 hover:border-red-800/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
