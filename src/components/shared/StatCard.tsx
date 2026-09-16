import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "cyan",
  to,
  sub,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "cyan" | "emerald" | "amber" | "violet" | "rose" | "slate";
  to?: string;
  sub?: string;
}) {
  const tones: Record<string, string> = {
    cyan: "from-cyan-500/15 to-blue-500/5 text-cyan-600",
    emerald: "from-emerald-500/15 to-teal-500/5 text-emerald-600",
    amber: "from-amber-500/15 to-yellow-500/5 text-amber-600",
    violet: "from-violet-500/15 to-indigo-500/5 text-violet-600",
    rose: "from-rose-500/15 to-pink-500/5 text-rose-600",
    slate: "from-slate-500/15 to-slate-400/5 text-slate-600",
  };

  const body = (
    <div className="group bg-card shadow-card hover:-translate-y-0.5 relative overflow-hidden rounded-xl border border-slate-200/80 p-5 transition-all">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          tones[tone],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-slate-500">{label}</div>
          <div className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-white/60">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-card flex flex-col items-center justify-center rounded-xl border border-slate-200/80 px-6 py-14 text-center">
      <div className="mb-3 text-3xl text-slate-300">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {description && (
        <div className="mt-1 max-w-sm text-sm text-slate-500">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
