import {
  AlertOctagon,
  BadgeCheck,
  BookCheck,
  CloudSun,
  CreditCard,
  Fingerprint,
  MessageSquare,
  Satellite,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useVerifyEvidence } from "@/lib/api";
import type { EvidenceItem } from "@/lib/types";
import { fmtTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EvidenceStatusBadge } from "@/components/shared/Badges";
import { cn } from "@/lib/utils";

const SOURCE_ICONS: Record<string, LucideIcon> = {
  Order: ShoppingCart,
  Payment: CreditCard,
  Merchant: Store,
  Logistics: Truck,
  GPS: Satellite,
  Weather: CloudSun,
  Communication: MessageSquare,
  Policy: BookCheck,
};

export function EvidencePanel({
  caseId,
  evidence,
  canVerify,
}: {
  caseId: string;
  evidence: EvidenceItem[];
  canVerify: boolean;
}) {
  const verify = useVerifyEvidence();
  const contradicted = evidence.filter((e) => e.status === "contradicted");
  const disputed = evidence.filter((e) => e.status === "disputed");
  const pending = evidence.filter((e) => e.status === "pending");
  const verified = evidence.filter((e) => e.status === "verified");

  const groups: { source: string; items: EvidenceItem[] }[] = [];
  for (const item of [...evidence].sort((a, b) => (a.event_at ?? "").localeCompare(b.event_at ?? ""))) {
    const g = groups.find((x) => x.source === item.source);
    if (g) g.items.push(item);
    else groups.push({ source: item.source, items: [item] });
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Collected" value={evidence.length} tone="text-slate-900" />
        <MiniStat label="Verified" value={verified.length} tone="text-emerald-600" />
        <MiniStat label="Contradicted" value={contradicted.length} tone="text-rose-600" />
        <MiniStat label="Disputed" value={disputed.length} tone="text-amber-600" />
      </div>

      {contradicted.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <AlertOctagon className="h-4 w-4" />
            Contradiction detected
          </div>
          <div className="mt-2 space-y-2">
            {contradicted.map((c) => (
              <div key={c.id} className="rounded-lg border border-rose-200 bg-white/70 p-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-rose-900">
                  <span>{c.source} · {c.title}</span>
                  <span className="font-mono text-xs text-rose-400">claims "{c.description.split(" — ")[0]}"</span>
                </div>
                <p className="mt-1 text-[13px] text-rose-800/80">{c.finding}</p>
                {c.detail?.contradicts && (
                  <p className="mt-1 text-xs text-rose-600">
                    Conflicts with: {Array.isArray(c.detail.contradicts) ? (c.detail.contradicts as string[]).join(", ") : String(c.detail.contradicts)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {disputed.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Fingerprint className="h-4 w-4" />
            Disputed evidence — credibility uncertain
          </div>
          <div className="mt-2 space-y-1.5">
            {disputed.map((d) => (
              <p key={d.id} className="text-[13px] text-amber-800/85">
                <span className="font-semibold">{d.source} · {d.title}:</span>{" "}
                {d.finding}
              </p>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && canVerify && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <BadgeCheck className="h-4 w-4 text-cyan-600" />
            {pending.length} evidence item{pending.length > 1 ? "s" : ""} collected —
            cross-system verification not yet run.
          </div>
          <Button
            size="sm"
            onClick={() => verify.mutate(caseId)}
            disabled={verify.isPending}
          >
            {verify.isPending ? "Verifying…" : "Verify Evidence"}
          </Button>
        </div>
      )}

      {/* Evidence by source */}
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.source} className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <IconChip Icon={SOURCE_ICONS[g.source] ?? BookCheck} />
              <span className="text-sm font-semibold text-slate-900">{g.source}</span>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {g.items.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {g.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-3",
                    item.status === "contradicted"
                      ? "border-rose-200 bg-rose-50/50"
                      : item.status === "disputed"
                        ? "border-amber-200 bg-amber-50/40"
                        : "border-slate-100 bg-slate-50/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {item.event_at ? fmtTime(item.event_at) : "—"} · confidence{" "}
                        {Math.round(item.confidence)}%
                      </div>
                    </div>
                    <EvidenceStatusBadge status={item.status} />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                  {item.finding && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-md bg-white/70 px-2.5 py-1.5 text-xs text-slate-700">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />
                      <span>
                        <span className="font-semibold">Verification: </span>
                        {item.finding}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-card shadow-card rounded-xl border border-slate-200/80 px-4 py-3">
      <div className={cn("text-2xl font-bold", tone)}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}

function IconChip({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
      <Icon className="h-4 w-4" />
    </span>
  );
}
