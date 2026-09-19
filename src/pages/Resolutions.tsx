import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime } from "@/lib/format";

export default function Resolutions() {
  const { data, isLoading } = useListCases({ status: "resolved" });
  const resolved = data?.cases ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resolutions"
        subtitle="Cases resolved through the ACAN pipeline — execution completed and verified against the systems."
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {resolved.length} verified resolutions
          </span>
        }
      />

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : resolved.length === 0 ? (
        <EmptyState
          title="No resolutions yet"
          description="Cases move here once their resolution is executed and verified."
        />
      ) : (
        <div className="bg-card shadow-card overflow-hidden rounded-xl border border-slate-200/80">
          <ul className="divide-y divide-slate-50">
            {resolved.map((c) => (
              <li key={c.id}>
                <Link to={`/business/cases/${c.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{c.case_number}</span>
                      <StatusBadge status={c.status} />
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Verified
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {c.customer_name} · {c.category} · resolved {fmtDateTime(c.updated_at)}
                    </div>
                  </div>
                  {c.confidence != null && (
                    <span className="text-sm font-bold text-slate-800">{Math.round(c.confidence)}%</span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
