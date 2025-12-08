"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, List, Server } from "lucide-react";
import clsx from "clsx";

const menuItems = [
  { icon: Server, label: "API", href: "/" }, // Antigo index.html
  { icon: LayoutDashboard, label: "Painel", href: "/dashboard" }, // Antigo home.html
  { icon: List, label: "Registros", href: "/registros" }, // Antigo details.html
  { icon: LineChart, label: "Análises", href: "/analises" }, // Antigo analytics.html
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-emerald-600 tracking-tight">Ciclus</h1>
        <p className="text-xs text-slate-400 font-medium">Weather Station</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        v1.2.0 · Agronomia
      </div>
    </aside>
  );
}