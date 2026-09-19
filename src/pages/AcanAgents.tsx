import { Link } from "react-router-dom";
import {
  BookCheck,
  Bot,
  CreditCard,
  ShieldAlert,
  ShoppingCart,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useAnalytics } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AGENT_LABELS, fmtDateTime } from "@/lib/format";

const AGENTS: { key: string; icon: LucideIcon; desc: string }[] = [
  { key: "order", icon: ShoppingCart, desc: "Validates orders, line items, delivery promises and entitlements." },
  { key: "payment", icon: CreditCard, desc: "Reconciles charges, refunds, captures and idempotency logs." },
  { key: "logistics", icon: Truck, desc: "Audits tracking scans, proof of delivery and closure events." },
  { key: "merchant", icon: Store, desc: "Checks fulfilment, pick logs and handoff conditions." },
  { key: "policy", icon: BookCheck, desc: "Applies the policy engine (PD-04, RT-02, BL-01, VD-03, DG-01…)." },
  { key: "risk", icon: ShieldAlert, desc: "Scores customer impact, fraud signals and authorization limits." },
];

const TONES: Record<string, string> = {
  order: "from-sky-500/15 to-sky-500/5 text-sky-600",
  payment: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  logistics: "from-amber-500/15 to-amber-500/5 text-amber-600",
  merchant: "from-violet-500/15 to-violet-500/5 text-violet-600",
  policy: "from-blue-500/15 to-blue-500/5 text-blue-600",
  risk: "from-rose-500/15 to-rose-500/5 text-rose-600",
};

export default function AcanAgents() {
  const { data, isLoading } = useAnalytics();
  const activity = data?.agentActivity ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ACAN Agents"
        subtitle="The six specialized agents that investigate every complaint across simulated enterprise systems."
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
            <Bot className="h-3.5 w-3.5" />
            {activity.length} findings recorded
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map(({ key, icon: Icon, desc }) => (
          <div key={key} className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${TONES[key]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{AGENT_LABELS[key]}</div>
                <div className="text-[11px] text-slate-400">Specialized agent</div>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Latest agent findings
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        ) : activity.length === 0 ? (
          <EmptyState
            title="No agent findings yet"
            description="Run an ACAN investigation on a case to populate agent findings."
          />
        ) : (
          <ul className="divide-y divide-slate-50">
            {activity.slice(0, 12).map((f, i) => (
              <li key={i} className="flex items-start gap-3 py-2.5">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${TONES[f.agent]}`}>
                  <IconForAgent agent={f.agent} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-semibold text-slate-800">{AGENT_LABELS[f.agent]}</span>
                    {f.case_number && (
                      <Link to={`/business/cases/${f.case_number}`} className="font-medium text-cyan-600 hover:underline">
                        {f.case_number}
                      </Link>
                    )}
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {f.confidence}%
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{f.finding}</p>
                  <div className="text-[11px] text-slate-400">{fmtDateTime(f.ran_at)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function IconForAgent({ agent }: { agent: string }) {
  const a = AGENTS.find((x) => x.key === agent);
  const Icon = a?.icon ?? Bot;
  return <Icon className="h-4 w-4" />;
}
