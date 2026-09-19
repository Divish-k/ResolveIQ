import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, FileQuestion, Loader2, ShieldAlert } from "lucide-react";
import { useCaseDetail } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { customerStatusLabel, firstLine } from "@/lib/customer";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "submitted", label: "Complaint Submitted" },
  { key: "received", label: "Case Received" },
  { key: "investigation", label: "Investigation" },
  { key: "evidence", label: "Evidence Verification" },
  { key: "decision", label: "Decision" },
  { key: "resolution", label: "Resolution" },
];

function currentStep(stage: string): number {
  switch (stage) {
    case "understand":
      return 1; // complaint submitted → "Case Received" is the active step
    case "investigate":
    case "reconstruct":
      return 2;
    case "verify":
      return 3;
    case "arbitrate":
      return 4;
    case "resolve":
    case "verify_resolution":
      return 5;
    default:
      return 1;
  }
}

const STEP_HINTS = [
  "",
  "Your case has been received by ResolveIQ.",
  "ResolveIQ is investigating what happened.",
  "Evidence is being checked for accuracy.",
  "A fair decision is being prepared.",
  "Your resolution will appear here.",
];

export default function TrackCase() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useCaseDetail(id ?? "");

  const resolution = useMemo(() => {
    if (!data) return null;
    const q = data.qwen?.resolution_explanation;
    if (q?.customer_message) {
      return {
        message: q.customer_message,
        summary: q.resolution_summary,
        detail: q.resolution_details,
      };
    }
    if (data.decision) {
      return {
        message: "Your complaint was investigated and the reported issue was verified.",
        summary: data.decision.recommended_actions.map((a) => a.label).join(" + "),
        detail: data.decision.reasoning,
      };
    }
    return null;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card rounded-xl border border-slate-200/80 p-10 text-center">
        <FileQuestion className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">Case not found.</p>
        <Link to="/customer/complaints" className="mt-4 inline-block">
          <Button size="sm">Back to My Complaints</Button>
        </Link>
      </div>
    );
  }

  const { case: c } = data;
  const isResolved = c.status === "resolved";
  const isEscalated = c.status === "escalated" || c.escalated;
  const step = currentStep(c.stage);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/customer/complaints"
        className="inline-flex items-center gap-1.5 text-sm text-cyan-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        My Complaints
      </Link>

      {/* Case header */}
      <div className="rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-cyan-200">
              Case
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight">{c.case_number}</div>
            <p className="mt-2 max-w-md text-sm text-white/85">
              {firstLine(c.description)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-2.5 py-1">{c.category}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 capitalize">
                Priority: {c.severity}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                Status: {customerStatusLabel(c.status)}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-cyan-100">
            <div>Opened</div>
            <div className="mt-0.5 text-sm font-medium text-white">
              {fmtDateTime(c.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Status steps */}
      <div className="bg-card rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <ol className="space-y-0">
          {STEPS.map((s, i) => {
            const done = i < step || (isResolved && i <= step);
            const active = i === step && !done && !isEscalated;
            const waiting = !done && !active;
            return (
              <li
                key={s.key}
                className="animate-in-up relative flex items-start gap-4 pb-5 last:pb-0"
                style={{ animationDelay: `${i * 130}ms` }}
              >
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "absolute left-[15px] top-7 h-full w-px",
                      i < step || (isResolved && i < STEPS.length - 1)
                        ? "bg-emerald-400"
                        : "bg-slate-200",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "animate-pulse-soft bg-cyan-600 text-white"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <div className="pt-1">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      done || active ? "text-slate-900" : "text-slate-400",
                    )}
                  >
                    {s.label}
                  </div>
                  {waiting && STEP_HINTS[i] && (
                    <div className="text-xs text-slate-400">{STEP_HINTS[i]}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Resolved panel */}
      {isResolved && resolution && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-800">Case Resolved</h2>
          </div>
          <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Resolution</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-800">
              {resolution.summary ?? resolution.message}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{resolution.message}</p>
            {resolution.detail && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{resolution.detail}</p>
            )}
            <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
              Resolution date: {fmtDateTime(c.updated_at)}
            </div>
          </div>
          <Link to="/customer/complaints" className="mt-4 inline-block">
            <Button size="sm">View Resolution Details</Button>
          </Link>
        </div>
      )}

      {/* Escalated panel */}
      {isEscalated && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            <h2 className="text-lg font-bold text-rose-800">Case Escalated</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-rose-800/85">
            This case needs extra care, so our team is reviewing it personally. You
            will be notified the moment a decision is made. We appreciate your
            patience.
          </p>
        </div>
      )}

      {!isResolved && !isEscalated && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          {customerStatusLabel(c.status)} — we'll keep you updated at every step.
        </div>
      )}
    </div>
  );
}
