import {
  BookCheck,
  Bot,
  CreditCard,
  CloudSun,
  GitBranch,
  MessageSquare,
  Satellite,
  Scale,
  ShieldAlert,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/StatCard";

// Qwen is the LLM intelligence layer AROUND the ACAN workflow — ACAN remains
// the deterministic multi-agent investigation engine; Qwen understands,
// synthesizes and explains the structured information ACAN produces.
const LAYERED_FLOW = [
  { layer: "Qwen", step: "Complaint Understanding / Classification", desc: "Qwen reads the customer complaint and produces a summary, classification, priority hint and customer-facing message." },
  { layer: "ACAN", step: "Multi-Agent Investigation", desc: "Six specialized agents (Order, Payment, Logistics, Merchant, Policy, Risk) query simulated enterprise systems and produce structured findings." },
  { layer: "ACAN", step: "Structured Findings + Evidence", desc: "Agent findings, evidence items with verification statuses, and contradictions are stored on the case." },
  { layer: "Qwen", step: "Investigation Synthesis + Evidence / Contradiction Analysis", desc: "Qwen synthesizes the ACAN findings and evidence into a plain-language narrative: supporting evidence, contradictions, root cause, risk and recommended action." },
  { layer: "ACAN", step: "Arbitration / Decision", desc: "The deterministic arbitration engine combines evidence, policy checks, confidence, risk and authorization limits into a decision — or escalates." },
  { layer: "Qwen", step: "Customer-Friendly Resolution Explanation", desc: "Qwen turns the approved decision into a clear, empathetic message for the customer." },
];

const STAGES = [
  { n: 1, name: "Understand", desc: "Parse the complaint, resolve the customer, order and category, and route the case." },
  { n: 2, name: "Investigate", desc: "Six specialized agents query simulated enterprise systems and collect evidence." },
  { n: 3, name: "Reconstruct", desc: "Merge events from every system into a single causal timeline with anomalies flagged." },
  { n: 4, name: "Verify Evidence", desc: "Cross-check claims across systems. Contradictions — e.g. 'Delivered' vs stationary GPS — are surfaced." },
  { n: 5, name: "Arbitrate", desc: "Combine evidence, causal findings, policy, confidence, business rules, risk and authorization limits into a decision." },
  { n: 6, name: "Resolve", desc: "Execute only low-risk, authorized actions automatically against simulated systems." },
  { n: 7, name: "Verify Resolution", desc: "Confirm the resolution succeeded — payment settlement, dispatch, notification delivery." },
];

const AGENTS = [
  { name: "Order Agent", icon: ShoppingCart, desc: "Validates orders, line items, delivery promises and entitlements." },
  { name: "Payment Agent", icon: CreditCard, desc: "Reconciles charges, refunds, captures and idempotency logs." },
  { name: "Logistics Agent", icon: Truck, desc: "Audits tracking scans, proof of delivery and closure events." },
  { name: "Merchant Agent", icon: Store, desc: "Checks fulfilment, pick logs and handoff conditions." },
  { name: "Policy Agent", icon: BookCheck, desc: "Applies the policy engine (PD-04, RT-02, BL-01, VD-03, DG-01…)." },
  { name: "Risk Agent", icon: ShieldAlert, desc: "Scores customer impact, fraud signals and authorization limits." },
];

const SYSTEMS = [
  { name: "Order System", icon: ShoppingCart, desc: "Orders, line items, promises" },
  { name: "Payment System", icon: CreditCard, desc: "Captures, refunds, receipts" },
  { name: "Merchant System", icon: Store, desc: "Fulfilment, pick logs" },
  { name: "Logistics System", icon: Truck, desc: "Scans, POD, closures" },
  { name: "GPS", icon: Satellite, desc: "Telemetry, geofence" },
  { name: "Weather / External", icon: CloudSun, desc: "Flood, storm advisories" },
  { name: "Communication Logs", icon: MessageSquare, desc: "Driver & customer messages" },
];

export default function Help() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="ResolveIQ — How it works"
        subtitle="ACAN: Autonomous Causal Arbitration Architecture. Built for the Microsoft Hackathon 2026 track 'Agentic AI for Customer Support & Dispute Resolution'."
      />

      {/* Hero concept */}
      <div className="bg-gradient-subtle rounded-2xl border border-white/10 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-glow">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">ACAN — Autonomous Causal Arbitration Architecture</div>
            <div className="text-sm text-white/60">
              ResolveIQ doesn't just answer complaints — it investigates what actually happened, verifies the evidence and proves the resolution.
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { t: "Investigate, don't guess", d: "Six agents query eight simulated enterprise systems before any decision is made." },
            { t: "Verify before you resolve", d: "Every action is executed against simulated systems and then confirmed end-to-end." },
            { t: "Escalate when unsure", d: "Confidence below the threshold routes the case to human review — no blind auto-resolution." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">{c.t}</div>
              <div className="mt-1 text-[13px] leading-relaxed text-white/60">{c.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Qwen × ACAN layered architecture */}
      <section>
        <h3 className="mb-3 text-lg font-bold text-white">
          How Qwen and ACAN work together
        </h3>
        <p className="mb-4 max-w-3xl text-sm text-white/60">
          ACAN remains the deterministic multi-agent investigation engine. Qwen is
          the LLM intelligence layer <span className="font-semibold text-cyan-300">around</span> it —
          Qwen understands, synthesizes and explains the structured information that
          ACAN produces. Qwen never replaces the agents or the arbitration logic.
        </p>
        <div className="overflow-hidden rounded-xl border border-white/10">
          {LAYERED_FLOW.map((f, i) => (
            <div
              key={f.step}
              className={`flex flex-wrap items-start gap-3 p-4 ${i % 2 === 0 ? "bg-white/[0.04]" : "bg-transparent"}`}
            >
              <span
                className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  f.layer === "Qwen"
                    ? "bg-cyan-400/15 text-cyan-300"
                    : "bg-indigo-400/15 text-indigo-300"
                }`}
              >
                {f.layer === "Qwen" ? <Bot className="h-3 w-3" /> : <Scale className="h-3 w-3" />}
                {f.layer}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{f.step}</div>
                <div className="mt-0.5 text-[13px] leading-relaxed text-white/60">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section>
        <h3 className="mb-3 text-lg font-bold text-white">The ACAN pipeline</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {STAGES.map((s) => (
            <div key={s.n} className="bg-card shadow-card flex gap-4 rounded-xl border border-slate-200/80 p-4">
              <div className="bg-gradient-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white">
                {s.n}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                <div className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section>
        <h3 className="mb-3 text-lg font-bold text-white">The six specialized agents</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.name} className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                  <a.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-semibold text-slate-900">{a.name}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Systems */}
      <section>
        <h3 className="mb-3 text-lg font-bold text-white">Simulated enterprise systems</h3>
        <p className="mb-4 text-sm text-white/60">
          The entire demo runs on simulated systems with realistic data — no external API keys required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEMS.map((s) => (
            <div key={s.name} className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-400">{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <GitBranch className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[13px] font-semibold text-slate-900">Evidence Store</div>
                <div className="text-[11px] text-slate-400">Verified evidence ledger</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Escalation */}
      <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
          <ShieldAlert className="h-4 w-4" />
          Confidence & escalation policy
        </div>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-rose-800/80">
          Arbitration decisions below the configured threshold (default 85%) are never auto-resolved.
          ACAN assembles the evidence summary, causal finding, policy result, recommended action and
          audit trail, then routes the case to a human reviewer.
        </p>
      </section>
    </div>
  );
}
