import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const IN_FLIGHT = ["new", "investigating", "verifying", "arbitrating", "resolving"];

const STAGE_INDEX: Record<string, number> = {
  understand: 0,
  investigate: 1,
  reconstruct: 2,
  verify: 3,
  arbitrate: 4,
  resolve: 5,
  verify_resolution: 6,
};

export default function Investigation() {
  const { data, isLoading } = useListCases();
  const inFlight = (data?.cases ?? []).filter((c) => IN_FLIGHT.includes(c.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investigation Pipeline"
        subtitle="Live cases moving through the ACAN workflow — from complaint intake to verified resolution."
        actions={
          <Link to="/submit">
            <Button size="sm">
              New Complaint <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : inFlight.length === 0 ? (
        <EmptyState
          title="No cases in flight"
          description="Every case is resolved or escalated. Submit a new complaint to start the pipeline."
          action={
            <Link to="/submit">
              <Button size="sm">New Complaint</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {inFlight.map((c) => {
            const idx = STAGE_INDEX[c.stage] ?? 0;
            return (
              <Link
                key={c.id}
                to={`/cases/${c.id}`}
                className="bg-card shadow-card group rounded-xl border border-slate-200/80 p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{c.case_number}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.confidence != null && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {Math.round(c.confidence)}% confidence
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px] text-slate-500">
                  {c.customer_name} · {c.order_id}
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-slate-600">
                  {c.category}
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all",
                        c.escalated && "from-rose-500 to-rose-400",
                      )}
                      style={{ width: `${Math.max(8, (idx / 6) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    stage {idx + 1}/7
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-cyan-600 group-hover:gap-2 transition-all">
                  Open investigation <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
