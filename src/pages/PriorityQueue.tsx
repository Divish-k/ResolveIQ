import { Link } from "react-router-dom";
import { ChevronRight, Gauge } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { StatusBadge, SeverityBadge } from "@/components/shared/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function PriorityQueue() {
  const { data, isLoading } = useListCases();
  const queue = [...(data?.cases ?? [])].sort((a, b) => {
    const sev = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
    if (sev !== 0) return sev;
    return b.created_at.localeCompare(a.created_at);
  });
  const open = queue.filter((c) => c.status !== "resolved");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Priority Queue"
        subtitle="Cases ordered by severity and age — critical and high-priority complaints first."
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <Gauge className="h-3.5 w-3.5" />
            {open.length} open
          </span>
        }
      />

      {isLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : open.length === 0 ? (
        <EmptyState title="Queue is clear" description="No open cases. Every complaint has been resolved or escalated." />
      ) : (
        <div className="bg-card shadow-card overflow-hidden rounded-xl border border-slate-200/80">
          <div className="divide-y divide-slate-50">
            {open.map((c) => (
              <Link
                key={c.id}
                to={`/business/cases/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div
                  className={cn(
                    "h-10 w-1.5 shrink-0 rounded-full",
                    c.severity === "critical"
                      ? "bg-rose-500"
                      : c.severity === "high"
                        ? "bg-amber-500"
                        : c.severity === "medium"
                          ? "bg-cyan-500"
                          : "bg-slate-300",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{c.case_number}</span>
                    <SeverityBadge severity={c.severity} />
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {c.customer_name} · {c.category}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  {c.confidence != null && (
                    <div className="text-sm font-bold text-slate-800">{Math.round(c.confidence)}%</div>
                  )}
                  <div className="text-[11px] text-slate-400">{fmtDateTime(c.created_at)}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
