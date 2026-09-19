import { Link } from "react-router-dom";
import { ArrowRight, Scale } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceGauge } from "@/components/shared/ConfidenceGauge";
import { fmtDateTime } from "@/lib/format";

export default function Decisions() {
  const { data, isLoading } = useListCases();
  const decisions = (data?.cases ?? []).filter(
    (c) => c.status === "arbitrating" || c.status === "escalated" || c.status === "resolved",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decisions & Arbitration"
        subtitle="Cases that reached the ACAN arbitration stage — approve resolutions or route to human review."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : decisions.length === 0 ? (
        <EmptyState
          title="No arbitration decisions yet"
          description="Run an investigation and verify evidence to reach the arbitration stage."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {decisions.map((c) => (
            <Link
              key={c.id}
              to={`/business/cases/${c.id}`}
              className="bg-card shadow-card group rounded-xl border border-slate-200/80 p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{c.case_number}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {c.customer_name} · {c.category}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-4 flex items-center gap-4">
                <ConfidenceGauge value={c.confidence} size={64} stroke={6} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${c.escalated ? "bg-rose-500" : "bg-gradient-to-r from-cyan-500 to-blue-600"}`}
                      style={{ width: `${c.confidence ?? 0}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {c.escalated
                      ? "Escalated — human review required"
                      : c.status === "resolved"
                        ? "Resolution approved & verified"
                        : "Awaiting approval"}
                  </div>
                  <div className="text-[11px] text-slate-400">{fmtDateTime(c.updated_at)}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-600" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-600">
        <Scale className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
        <span>
          Arbitration combines evidence, causal findings, policy checks, confidence
          and risk. Low-risk authorized decisions can be executed on the case page;
          low-confidence cases are escalated for human review.
        </span>
      </div>
    </div>
  );
}
