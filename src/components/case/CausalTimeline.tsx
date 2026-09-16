import { AlertTriangle, GitBranch } from "lucide-react";
import type { TimelineEvent } from "@/lib/types";
import { fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SOURCE_STYLES: Record<string, string> = {
  Order: "bg-sky-50 text-sky-700 border-sky-200",
  Payment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Merchant: "bg-violet-50 text-violet-700 border-violet-200",
  Logistics: "bg-amber-50 text-amber-700 border-amber-200",
  GPS: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Weather: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Communication: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

export function CausalTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-10 text-center">
        <GitBranch className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">
          The causal timeline will be reconstructed here once the investigation
          runs across Order, Payment, Logistics, GPS, Weather and Communication
          systems.
        </p>
      </div>
    );
  }

  const flagged = events.filter((e) => e.flagged);
  const sorted = [...events].sort(
    (a, b) => new Date(a.event_at).getTime() - new Date(b.event_at).getTime(),
  );
  const likelyCause = flagged
    .map((f) => `${f.source}: ${f.title}`)
    .join(" · ");

  return (
    <div className="space-y-4">
      {flagged.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Likely cause identified
          </div>
          <p className="mt-1 text-sm text-amber-800/80">
            Anomalous events across systems: {likelyCause}. These events do not
            align with the claimed outcome and are cross-checked in Evidence
            Verification.
          </p>
        </div>
      )}

      <div className="relative">
        <div className="absolute bottom-2 left-[86px] top-2 w-px bg-slate-200 md:left-[110px]" />
        <div className="space-y-5">
          {sorted.map((ev, i) => (
            <div key={ev.id} className="relative flex items-start gap-4">
              <div className="w-[74px] shrink-0 pt-1 text-right font-mono text-xs text-slate-500 md:w-[96px]">
                {fmtTime(ev.event_at)}
              </div>
              <div
                className={cn(
                  "relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2",
                  ev.flagged
                    ? "border-rose-500 bg-rose-100"
                    : ev.role === "outcome"
                      ? "border-primary bg-cyan-100"
                      : ev.role === "trigger"
                        ? "border-blue-500 bg-blue-100"
                        : "border-slate-300 bg-white",
                )}
              />
              <div
                className={cn(
                  "bg-card shadow-card flex-1 rounded-lg border p-3.5",
                  ev.flagged ? "border-rose-200" : "border-slate-200/80",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      SOURCE_STYLES[ev.source] ?? "bg-slate-100 text-slate-600 border-slate-200",
                    )}
                  >
                    {ev.source}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {ev.title}
                  </span>
                  {ev.flagged && (
                    <span className="ml-auto rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      Anomaly
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                  {ev.description}
                </p>
                {i === sorted.length - 1 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    Claimed outcome under review
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
