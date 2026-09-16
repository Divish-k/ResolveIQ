import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  Rocket,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TicketCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useArbitrate, useExecuteAction, useVerifyResolution } from "@/lib/api";
import type { CaseDetail, RecommendedAction, ResolutionAction } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfidenceGauge } from "@/components/shared/ConfidenceGauge";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, LucideIcon> = {
  refund: CreditCard,
  redispatch: Package,
  replacement: RefreshCw,
  notify_customer: Mail,
  update_ticket: TicketCheck,
};

export function DecisionPanel({ detail }: { detail: CaseDetail }) {
  const { case: c, decision, actions, settings, evidence, timeline } = detail;

  const arbitrate = useArbitrate();
  const execute = useExecuteAction();
  const verify = useVerifyResolution();

  const [execLog, setExecLog] = useState<string[]>([]);

  // Already fully resolved (seeded or completed) → show resolution summary.
  const resolvedActions = actions.filter((a) => a.status === "completed");
  const allVerified = resolvedActions.length > 0 && resolvedActions.every((a) => a.verification_status === "successful");
  const executedNotVerified =
    resolvedActions.length > 0 &&
    resolvedActions.some((a) => a.verification_status === "pending" || a.verification_status == null);

  useEffect(() => {
    if (c.status === "resolved" && allVerified) {
      setExecLog((log) => {
        const next = [...log];
        if (!next.includes("Resolution verified successfully")) next.push("Resolution verified successfully");
        return next;
      });
    }
  }, [c.status, allVerified]);

  const handleExecute = (actionType?: string) => {
    setExecLog(["Executing authorized actions…"]);
    execute.mutate(
      { caseId: c.id, actionType },
      {
        onSuccess: (data) => {
          const executed = (data as { executed: { action_type: string; label: string; result: Record<string, unknown> }[] }).executed ?? [];
          setExecLog(
            executed.map(
              (e) =>
                `✔ ${e.label} — ${String(e.result.txnId ?? e.result.dispatchId ?? e.result.messageId ?? e.result.status)}`,
            ),
          );
          verify.mutate(c.id, {
            onSuccess: () =>
              setExecLog((log) => [...log, "Verifying resolution against systems…", "Resolution verified successfully"]),
          });
        },
      },
    );
  };

  // ── No decision yet ────────────────────────────────────────────────────────
  if (!decision) {
    const canArbitrate = c.status === "arbitrating" || c.status === "verifying";
    return (
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 text-violet-600">
          <Scale className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          {c.status === "verifying"
            ? "Evidence verification in progress"
            : "Arbitration not yet run"}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          The ACAN arbitration engine will combine evidence, causal findings,
          policy, confidence, business rules, risk and authorization limits into a
          recommended resolution — or escalate if confidence is insufficient.
        </p>
        {canArbitrate ? (
          <Button
            className="mt-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={() => arbitrate.mutate(c.id)}
            disabled={arbitrate.isPending}
          >
            {arbitrate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
            {arbitrate.isPending ? "Running arbitration…" : "Run ACAN Arbitration"}
          </Button>
        ) : (
          <p className="mt-4 text-xs text-slate-400">
            Complete investigation and evidence verification first.
          </p>
        )}
      </div>
    );
  }

  // ── Escalated → Human review ───────────────────────────────────────────────
  if (decision.escalation_required || c.escalated) {
    const disputedEvidence = evidence.filter((e) => e.status === "disputed" || e.status === "contradicted");
    const anomalies = timeline.filter((t) => t.flagged);
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-900">Human Review Required</h3>
                <p className="mt-0.5 max-w-lg text-sm text-rose-800/80">
                  ACAN did not auto-resolve this case. Confidence{" "}
                  <span className="font-bold">{Math.round(decision.confidence)}%</span>{" "}
                  is below the {settings.confidence_threshold}% auto-resolution threshold.
                </p>
              </div>
            </div>
            <ConfidenceGauge value={decision.confidence} size={80} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Evidence summary">
            {disputedEvidence.length === 0 ? (
              <p className="text-sm text-slate-500">No conflicting evidence items.</p>
            ) : (
              <ul className="space-y-2">
                {disputedEvidence.map((e) => (
                  <li key={e.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-[13px] text-slate-700">
                    <span className="font-semibold">{e.source} · {e.title}</span>
                    <span className="text-slate-500"> — {e.finding}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Causal finding">
            {anomalies.length === 0 ? (
              <p className="text-sm text-slate-500">No anomalous timeline events flagged.</p>
            ) : (
              <ul className="space-y-2">
                {anomalies.map((t) => (
                  <li key={t.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-700">
                    <span className="font-semibold">{t.source}: {t.title}</span>
                    <span className="text-slate-500"> — {t.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Policy result">
            <ul className="space-y-2">
              {decision.policy_checks.map((p) => (
                <li key={p.policy} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-slate-800">{p.policy}</div>
                    <div className="text-xs text-slate-500">{p.detail}</div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      p.status === "passed"
                        ? "bg-emerald-50 text-emerald-700"
                        : p.status === "failed"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recommended action & uncertainty">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wider text-slate-400">Recommended</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {decision.recommended_actions.map((a) => a.label).join(" + ")}
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{decision.reasoning}</p>
            {decision.escalation_reason && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{decision.escalation_reason}</span>
              </div>
            )}
          </Panel>
        </div>

        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Audit trail
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.audit.slice(0, 6).map((a) => (
              <span key={a.id} className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                {a.actor} · {a.action}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Recommendation + execution + verification ──────────────────────────────
  const pendingActions = actions.filter((a) => a.status === "pending");

  return (
    <div className="space-y-4">
      {/* Recommendation */}
      <div className="bg-gradient-subtle rounded-xl border border-white/10 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Scale className="h-4 w-4" />
              ACAN Arbitration Decision
            </div>
            <h3 className="mt-2 text-xl font-bold">
              {decision.recommended_actions.map((a) => a.label).join(" + ")}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
              {decision.reasoning}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ConfidenceGauge value={decision.confidence} size={96} />
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200">
              threshold {settings.confidence_threshold}%
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {decision.policy_checks.map((p) => (
            <span
              key={p.policy}
              title={p.detail}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                p.status === "passed"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : p.status === "failed"
                    ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-300",
              )}
            >
              {p.status === "passed" ? (
                <Check className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {p.policy} · {p.status}
            </span>
          ))}
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium",
              decision.risk_level === "low"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : decision.risk_level === "medium"
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  : "border-rose-400/30 bg-rose-400/10 text-rose-300",
            )}
          >
            Risk: {decision.risk_level}
          </span>
        </div>
      </div>

      {/* Resolution actions + execution + verification */}
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Resolution actions — authorized for automatic execution
        </div>

        {pendingActions.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {decision.recommended_actions.map((a) => (
                <ActionButton
                  key={a.type}
                  action={a}
                  disabled={execute.isPending || verify.isPending}
                  onClick={() => handleExecute(a.type)}
                />
              ))}
            </div>
            <Button
              className="mt-4 w-full sm:w-auto"
              size="lg"
              disabled={execute.isPending || verify.isPending}
              onClick={() => handleExecute()}
            >
              {execute.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {verify.isPending
                ? "Verifying resolution…"
                : execute.isPending
                  ? "Executing…"
                  : "Execute recommended resolution"}
              {!execute.isPending && !verify.isPending && <ArrowRight className="h-4 w-4" />}
            </Button>

            {execLog.length > 0 && (
              <div className="mt-4 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-4">
                {execLog.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-slate-700">
                    {line.includes("✔") || line.includes("verified") ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : line.includes("Verifying") || line.includes("Executing") ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    )}
                    {line.replace("✔ ", "")}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {pendingActions.length === 0 && resolvedActions.length === 0 && (
          <p className="text-sm text-slate-500">No resolution actions recorded yet.</p>
        )}

        {/* Execution + verification detail */}
        {resolvedActions.length > 0 && (
          <div className={cn("space-y-2.5", pendingActions.length > 0 && "mt-5")}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Execution & verification
            </div>
            {resolvedActions.map((a) => (
              <ActionResultRow key={a.id} action={a} />
            ))}
            {allVerified && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-bold text-emerald-800">
                    Resolution verified successfully
                  </div>
                  <div className="text-xs text-emerald-700/80">
                    All actions executed and confirmed against simulated enterprise systems.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  action,
  disabled,
  onClick,
}: {
  action: RecommendedAction;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = ACTION_ICONS[action.type] ?? ClipboardCheck;
  return (
    <Button variant="outline" disabled={disabled} onClick={onClick}>
      <Icon className="h-4 w-4 text-cyan-600" />
      {action.label}
    </Button>
  );
}

function ActionResultRow({ action }: { action: ResolutionAction }) {
  const Icon = ACTION_ICONS[action.action_type] ?? ClipboardCheck;
  const detail = action.execution_detail ?? {};
  const refs = [detail.txnId, detail.dispatchId, detail.messageId, detail.replacementId]
    .filter(Boolean)
    .join(" · ");
  const verified = action.verification_status === "successful";
  const failed = action.verification_status === "failed";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        failed ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          failed ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600",
        )}
      >
        {failed ? <XCircle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">{action.label}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              failed ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
            )}
          >
            {failed ? "Failed" : "Completed"}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {refs ? `${refs} · ` : ""}
          {action.executed_at ? `executed ${fmtDateTime(action.executed_at)}` : ""}
        </div>
        {action.verification && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
            System confirmation:{" "}
            {String(action.verification.confirmation ?? action.verification.system ?? "confirmed")}
            {action.verification.system ? ` · ${action.verification.system}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      {children}
    </div>
  );
}
