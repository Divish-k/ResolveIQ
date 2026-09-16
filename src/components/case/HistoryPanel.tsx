import { Bot, User } from "lucide-react";
import type { AuditEntry } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HistoryPanel({ audit }: { audit: AuditEntry[] }) {
  if (audit.length === 0) {
    return (
      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-10 text-center text-sm text-slate-500">
        No audit events recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
      <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Full audit trail — {audit.length} events
      </div>
      <div className="relative space-y-0">
        <div className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-200" />
        {audit.map((entry, i) => {
          const isAgent = entry.actor.startsWith("ACAN");
          const hasDetail = Object.keys(entry.detail ?? {}).length > 0;
          return (
            <div key={entry.id} className="relative flex items-start gap-4 pb-5 last:pb-0">
              <span
                className={cn(
                  "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  isAgent ? "border-cyan-200 bg-cyan-50 text-cyan-600" : "border-blue-200 bg-blue-50 text-blue-600",
                )}
              >
                {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-800">{entry.actor}</span>
                  <span className="text-xs text-slate-400">{fmtDateTime(entry.created_at)}</span>
                </div>
                <div className="mt-0.5 text-[13px] text-slate-600">{entry.action}</div>
                {hasDetail && (
                  <pre className="mt-1.5 overflow-x-auto rounded-md bg-slate-50 p-2 text-[11px] text-slate-500">
                    {JSON.stringify(entry.detail, null, 0).slice(0, 220)}
                  </pre>
                )}
              </div>
              {i === 0 && (
                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                  latest
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
