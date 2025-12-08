import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string; // Ex: "normal", "warning", "danger"
  color?: "emerald" | "blue" | "amber" | "indigo" | "rose";
}

export default function MetricCard({ label, value, unit, icon: Icon, color = "emerald" }: MetricCardProps) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-sky-50 text-sky-600 border-sky-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("p-2 rounded-lg", colors[color])}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">
          {value} <span className="text-base font-normal text-slate-400">{unit}</span>
        </h3>
      </div>
    </div>
  );
}