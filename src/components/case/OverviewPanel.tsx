import { FileText, Layers } from "lucide-react";
import type { CaseDetail } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { HistoryPanel } from "./HistoryPanel";

const STAGE_EXPLAINERS: Record<string, string> = {
  understand: "The complaint has been parsed into a structured case and routed to the ACAN workflow.",
  investigate: "Six specialized agents are querying simulated enterprise systems for evidence.",
  reconstruct: "Events from Order, Payment, Logistics, GPS, Weather and Communication are being merged into a causal timeline.",
  verify: "Evidence is being cross-checked across systems; contradictions are flagged.",
  arbitrate: "The arbitration engine is combining evidence, policy, risk and authorization limits.",
  resolve: "Authorized resolution actions are being executed against simulated systems.",
  verify_resolution: "Executed actions are being confirmed — payment settlement, dispatch, notifications.",
  escalated: "Confidence was insufficient. The case is awaiting human review.",
};

export function OverviewPanel({ detail }: { detail: CaseDetail }) {
  const { case: c, audit } = detail;
  return (
    <div className="space-y-4">
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <FileText className="h-4 w-4" />
          Complaint
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{c.description}</p>
      </div>

      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Layers className="h-4 w-4" />
          ACAN workflow position
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {STAGE_EXPLAINERS[c.stage] ?? "Case registered in the ACAN pipeline."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-1">Created {fmtDateTime(c.created_at)}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">Updated {fmtDateTime(c.updated_at)}</span>
          {c.escalated && (
            <span className="rounded-md bg-rose-50 px-2 py-1 font-semibold text-rose-700">Escalated</span>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/50">
          Recent activity
        </div>
        <HistoryPanel audit={audit.slice(0, 5)} />
      </div>
    </div>
  );
}
