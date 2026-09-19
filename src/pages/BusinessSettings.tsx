import { Link } from "react-router-dom";
import { BookOpen, Bot, Database, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader } from "@/components/shared/StatCard";

export default function Settings() {
  const { data } = useListCases();
  const settings = data?.settings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="ACAN pipeline configuration, Qwen model and escalation policy."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <SlidersHorizontal className="h-4 w-4 text-cyan-600" />
            Arbitration thresholds
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Auto-resolution confidence threshold" value={`${settings?.confidence_threshold ?? 85}%`} note="Decisions below this are escalated to human review." />
            <Row label="Auto-authorization limit" value={settings?.auto_authorization_limit != null ? `$${settings.auto_authorization_limit}` : "$250"} note="Resolutions within this amount can be executed automatically for low-risk cases." />
          </dl>
        </div>

        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bot className="h-4 w-4 text-cyan-600" />
            AI / LLM configuration
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-[13px] text-slate-600">Provider</span>
              <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">Qwen</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-[13px] text-slate-600">Model</span>
              <span className="font-mono text-xs text-slate-700">alibaba/qwen-3.8-max</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-[13px] text-slate-600">Usage policy</span>
              <span className="text-xs text-slate-600">Generate once · cache · reuse</span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Qwen is the only LLM used anywhere in ResolveIQ. Analyses are cached per
            case and reused — no repeated generation.
          </p>
        </div>

        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            Escalation policy
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            When arbitration confidence is below the threshold, ACAN never
            auto-resolves. The case is routed to human review with the full
            evidence summary, causal finding, policy result, recommended action
            and audit trail.
          </p>
        </div>

        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Database className="h-4 w-4 text-cyan-600" />
            Demo data
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
            The workspace is seeded with six realistic cases across every pipeline
            state. All enterprise systems (Order, Payment, Merchant, Logistics,
            GPS, Weather, Communication) are simulated deterministically — the demo
            requires no external APIs.
          </p>
          <Link to="/help" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-600 hover:underline">
            <BookOpen className="h-3.5 w-3.5" />
            ACAN architecture documentation
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div>
        <div className="text-[13px] text-slate-700">{label}</div>
        {note && <div className="mt-0.5 text-[11px] text-slate-400">{note}</div>}
      </div>
      <span className="shrink-0 text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
