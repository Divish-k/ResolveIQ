import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardPlus,
  Gauge,
  Hourglass,
  ShieldAlert,
  User,
} from "lucide-react";
import { useAnalytics, useEnsureSeed, useListCases, useActivity } from "@/lib/api";
import { StatCard, PageHeader } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/Badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime } from "@/lib/format";

export default function Dashboard() {
  const { data: seed } = useEnsureSeed();
  const { data: analytics } = useAnalytics();
  const { data: casesData, isLoading } = useListCases();
  const { data: activity } = useActivity();

  const cases = casesData?.cases ?? [];
  const recent = cases.slice(0, 6);
  const activityRows = activity?.audit ?? [];
  const caseMap = activity?.cases ?? {};
  const seeding = seed?.seeded === true;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="ResolveIQ investigates complaints across enterprise systems with the ACAN pipeline — then proves the resolution."
        actions={
          <Link to="/submit">
            <Button className="bg-gradient-primary">
              <ClipboardPlus className="h-4 w-4" />
              New Complaint
            </Button>
          </Link>
        }
      />

      {seeding && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          <Bot className="h-4 w-4 animate-pulse" />
          Demo dataset seeded — 6 realistic cases loaded into the enterprise workspace.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Cases" value={analytics?.totalCases ?? "—"} icon={Activity} tone="slate" to="/cases" />
        <StatCard
          label="Investigating"
          value={(analytics?.statusCounts.investigating ?? 0) + (analytics?.statusCounts.new ?? 0)}
          icon={Hourglass}
          tone="violet"
          to="/investigation"
        />
        <StatCard
          label="Awaiting Verification"
          value={analytics?.statusCounts.verifying ?? 0}
          icon={Gauge}
          tone="amber"
          to="/investigation"
        />
        <StatCard
          label="Resolved"
          value={analytics?.resolvedCount ?? 0}
          icon={CheckCircle2}
          tone="emerald"
          to="/cases?status=resolved"
        />
        <StatCard
          label="Escalated"
          value={analytics?.escalatedCount ?? 0}
          icon={ShieldAlert}
          tone="rose"
          to="/cases?status=escalated"
        />
        <StatCard
          label="Avg Confidence"
          value={analytics?.avgConfidence != null ? `${analytics.avgConfidence}%` : "—"}
          icon={Gauge}
          tone="cyan"
          sub={`auto-resolve ≥ ${analytics?.threshold ?? 85}%`}
          to="/analytics"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Recent cases */}
        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent cases</h3>
            <Link
              to="/cases"
              className="flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/cases/${c.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {c.case_number}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {c.customer_name} · {c.order_id} · {c.category}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      {c.confidence != null && (
                        <div className="text-sm font-bold text-slate-800">
                          {Math.round(c.confidence)}%
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {fmtDateTime(c.updated_at)}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Investigation activity */}
        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Investigation activity
            </h3>
            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
              {activityRows.length} events
            </span>
          </div>
          <ul className="max-h-[430px] space-y-0 overflow-y-auto p-2">
            {activityRows.slice(0, 12).map((a) => {
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
                        <Link
                          to={`/cases/${related.id}`}
                          className="font-medium text-cyan-600 hover:underline"
                        >
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
  );
}
