import { useState } from "react";
import {
  BookCheck,
  CreditCard,
  Loader2,
  PlayCircle,
  ShieldAlert,
  ShoppingCart,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useRunInvestigation } from "@/lib/api";
import type { AgentFinding } from "@/lib/types";
import { AGENT_LABELS, fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AGENT_ICONS: Record<string, LucideIcon> = {
  order: ShoppingCart,
  payment: CreditCard,
  logistics: Truck,
  merchant: Store,
  policy: BookCheck,
  risk: ShieldAlert,
};

const AGENT_TONES: Record<string, string> = {
  order: "from-sky-500/15 to-sky-500/5 text-sky-600",
  payment: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  logistics: "from-amber-500/15 to-amber-500/5 text-amber-600",
  merchant: "from-violet-500/15 to-violet-500/5 text-violet-600",
  policy: "from-blue-500/15 to-blue-500/5 text-blue-600",
  risk: "from-rose-500/15 to-rose-500/5 text-rose-600",
};

export function AgentsPanel({
  caseId,
  findings,
}: {
  caseId: string;
  findings: AgentFinding[];
}) {
  const [revealed, setRevealed] = useState(0);
  const runInv = useRunInvestigation();
  const running = runInv.isPending;

  // Animated reveal of the six agents after investigation completes.
  const revealAll = () => {
    setRevealed(0);
    for (let i = 0; i < 6; i++) {
      window.setTimeout(() => setRevealed(i + 1), 420 * (i + 1));
    }
  };

  if (findings.length === 0 && !running) {
    return (
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-600">
          <PlayCircle className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Investigation not started
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Six specialized agents will query simulated enterprise systems — Order,
          Payment, Merchant, Logistics, GPS, Weather and Communication logs — and
          report evidence, findings and confidence for each domain.
        </p>
        <Button className="mt-5" onClick={() => runInv.mutate(caseId)}>
          <PlayCircle className="h-4 w-4" />
          Run ACAN Investigation
        </Button>
      </div>
    );
  }

  if (running && findings.length === 0) {
    return (
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-10 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Orchestrating six specialized agents across simulated enterprise systems…
        </p>
      </div>
    );
  }

  const ordered = ["order", "payment", "logistics", "merchant", "policy", "risk"];
  const sorted = [...findings].sort(
    (a, b) => ordered.indexOf(a.agent) - ordered.indexOf(b.agent),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Six specialized agents completed a cross-system investigation.
        </p>
        {findings.length === 6 && revealed === 0 && (
          <Button size="sm" variant="outline" onClick={revealAll}>
            <PlayCircle className="h-4 w-4" />
            Replay agent sequence
          </Button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((f, i) => {
          const visible = revealed === 0 || i < revealed;
          const Icon = AGENT_ICONS[f.agent] ?? ShoppingCart;
          const tone = AGENT_TONES[f.agent] ?? "text-cyan-600";
          return (
            <div
              key={f.id}
              className={cn(
                "bg-card shadow-card rounded-xl border border-slate-200/80 p-5 transition-all",
                revealed === 0 && "animate-in-up",
              )}
              style={revealed === 0 ? { animationDelay: `${i * 140}ms` } : undefined}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
                    tone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {AGENT_LABELS[f.agent] ?? f.agent}
                  </div>
                  <div className="text-xs text-slate-400">
                    {fmtDateTime(f.ran_at)}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    f.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  {f.status === "completed" ? "Completed" : f.status}
                </span>
              </div>

              {!visible ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-600" />
                  Agent investigating…
                </div>
              ) : (
                <>
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                    {f.finding}
                  </p>
                  {f.evidence_found.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {f.evidence_found.map((ev) => (
                        <span
                          key={ev.ref}
                          title={ev.summary}
                          className="max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          {ev.ref}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">
                      Confidence
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {Math.round(f.confidence)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      style={{ width: `${f.confidence}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
