import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Hourglass,
  Inbox,
  ShieldAlert,
  User,
} from "lucide-react";
import { useAnalytics, useEnsureSeed, useListCases, useActivity } from "@/lib/api";
import { StatCard, PageHeader } from "@/components/shared/StatCard";
import { StatusBadge, SeverityBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime } from "@/lib/format";

export default function BusinessOverview() {
  const { data: seed } = useEnsureSeed();
  const { data: analytics } = useAnalytics();
  const { data: casesData, isLoading } = useListCases();
  const { data: activity } = useActivity();

  const cases = casesData?.cases ?? [];
  const recent = cases.slice(0, 6);
  const incoming = cases.filter((c) => c.status === "new").slice(0, 4);
  const highPriority = cases.filter((c) => c.severity === "high" || c.severity === "critical");
  const activityRows = activity?.audit ?? [];
  const caseMap = activity?.cases ?? {};
  const seeding = seed?.seeded === true;

  const newCount = analytics?.statusCounts.new ?? 0;
  const activeInvestigations =
    (analytics?.statusCounts.investigating ?? 0) +
    (analytics?.statusCounts.verifying ?? 0) +
    (analytics?.statusCounts.arbitrating ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Overview"
        subtitle="Enterprise control center for incoming complaints, ACAN investigations, Qwen synthesis and verified resolutions."
        actions={
          <span className="flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200">
            <span className="relative flex h-2 w-2">
              <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
              <span className="bg-success relative inline-flex h-2 w-2 rounded-full" />
            </span>
            ACAN Engine · Qwen powered
          </span>
        }
      />

      {seeding && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          <Bot className="h-4 w-4 animate-pulse" />
          Demo dataset seeded — 6 realistic cases loaded into the enterprise workspace.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total Complaints" value={analytics?.totalCases ?? "—"} icon={Inbox} tone="slate" to="/business/cases" />
        <StatCard label="New Complaints" value={newCount} icon={Inbox} tone="sky" to="/business/incoming" />
        <StatCard label="Active Investigations" value={activeInvestigations} icon={Activity} tone="violet" to="/business/investigations" />
        <StatCard label="High Priority" value={highPriority.length} icon={Gauge} tone="rose" to="/business/queue" />
        <StatCard label="Resolved" value={analytics?.resolvedCount ?? 0} icon={CheckCircle2} tone="emerald" to="/business/resolutions" />
        <StatCard label="Escalated" value={analytics?.escalatedCount ?? 0} icon={ShieldAlert} tone="amber" to="/business/decisions" />
        <StatCard
          label="Avg Resolution Time"
          value={formatMin(analytics?.avgInvestigationTime ?? 0)}
          icon={Clock3}
          tone="cyan"
          to="/business/analytics"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Recent cases */}
        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent cases</h3>
            <Link to="/business/cases" className="flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link to={`/business/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{c.case_number}</span>
                        <StatusBadge status={c.status} />
                        {c.severity === "high" || c.severity === "critical" ? (
                          <SeverityBadge severity={c.severity} />
                        ) : null}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {c.customer_name} · {c.order_id} · {c.category}
                      </div>
                    </div>
                    {c.confidence != null && (
                      <div className="hidden text-right sm:block">
                        <div className="text-sm font-bold text-slate-800">{Math.round(c.confidence)}%</div>
                        <div className="text-[11px] text-slate-400">{fmtDateTime(c.updated_at)}</div>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Incoming complaints + activity */}
        <div className="space-y-6 xl:col-span-2">
          <div className="bg-card shadow-card rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Incoming complaints</h3>
              <Link to="/business/incoming" className="text-xs font-medium text-cyan-600 hover:underline">
                View all
              </Link>
            </div>
            {incoming.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                No new complaints waiting.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {incoming.map((c) => (
                  <li key={c.id}>
                    <Link to={`/business/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <span className="flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-cyan-500">
                        <span className="h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-slate-800">{c.case_number}</div>
                        <div className="truncate text-xs text-slate-500">{c.category}</div>
                      </div>
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">NEW</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-card shadow-card rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Investigation activity</h3>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                {activityRows.length} events
              </span>
            </div>
            <ul className="max-h-[280px] space-y-0 overflow-y-auto p-2">
              {activityRows.slice(0, 9).map((a) => {
                const related = a.case_id ? caseMap[a.case_id] : undefined;
                const isAgent = a.actor.startsWith("ACAN");
                return (
                  <li key={a.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                    <span
                      className={
                        isAgent
                          ? "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600"
                          : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"
                      }
                    >
                      {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] leading-snug text-slate-700">
                        <span className="font-semibold">{a.actor}</span> — {a.action}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        {related && (
                          <Link to={`/business/cases/${related.id}`} className="font-medium text-cyan-600 hover:underline">
                            {related.case_number}
                          </Link>
                        )}
                        <span>{fmtDateTime(a.created_at)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
