import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "understand", label: "Understand" },
  { key: "investigate", label: "Investigate" },
  { key: "reconstruct", label: "Reconstruct" },
  { key: "verify", label: "Verify" },
  { key: "arbitrate", label: "Arbitrate" },
  { key: "resolve", label: "Resolve" },
  { key: "verify_resolution", label: "Verify" },
];

export function WorkflowStepper({
  stage,
  escalated,
}: {
  stage: string;
  escalated: boolean;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === stage);

  if (escalated) {
    return (
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            ACAN Pipeline
          </span>
          <span className="ml-auto rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            Escalated to Human Review
          </span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.slice(0, 4).map((s, i) => (
            <StepDone key={s.key} label={s.label} showConnector={i < 3} />
          ))}
          <div className="flex items-center gap-1">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </div>
            {stage !== "escalated" && <span className="ml-2 text-sm font-semibold text-rose-600">Escalated</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        ACAN Pipeline — Autonomous Causal Arbitration
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const isFinal = currentIndex === STEPS.length - 1;
          const done = currentIndex > i || (isFinal && i === STEPS.length - 1);
          const active = currentIndex === i && !isFinal;
          return (
            <div key={s.key} className="flex shrink-0 items-center">
              {i > 0 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-6 md:w-8",
                    currentIndex >= i ? "bg-primary" : "bg-slate-200",
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    done && "bg-primary text-white",
                    active && "bg-primary text-white shadow-glow ring-4 ring-cyan-100",
                    !done && !active && "bg-slate-100 text-slate-400",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-[11px] font-medium",
                    active ? "text-primary" : done ? "text-slate-700" : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDone({ label, showConnector }: { label: string; showConnector: boolean }) {
  return (
    <div className="flex shrink-0 items-center">
      {showConnector && <div className="mx-1 h-0.5 w-6 bg-primary md:w-8" />}
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
          <Check className="h-4 w-4" />
        </div>
        <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
          {label}
        </span>
      </div>
    </div>
  );
}
