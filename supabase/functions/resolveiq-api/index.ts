// ─────────────────────────────────────────────────────────────────────────────
// ResolveIQ API — single self-contained backend function (ACAN pipeline).
// Deployed as one file because the platform bundles only the function's
// index.ts. All simulated enterprise systems, the scenario engine, and the
// ACAN pipeline steps live here and are dispatched by the `action` field.
// ─────────────────────────────────────────────────────────────────────────────

// ---------- HTTP helpers ----------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL / service key env");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------- Simulated enterprise systems ----------
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: string, salt: string): number {
  const h = hashSeed(seed + ":" + salt);
  return (h % 10000) / 10000;
}

function ref(prefix: string, seed: string, salt: string): string {
  return `${prefix}-${String(Math.floor(rand(seed, salt) * 1e9)).padStart(9, "0")}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const systems = {
  payment: {
    refund(seed: string, orderId: string, amount: number) {
      const ok = rand(seed, "refund-" + orderId) > 0.02;
      return {
        status: ok ? "success" : "failed",
        txnId: ref("TXN", seed, "refund"),
        amount,
        currency: "USD",
        confirmation: ok ? "confirmed" : "rejected",
        gateway: "Simulated Payment Gateway",
        settled: ok,
        at: nowIso(),
      };
    },
  },
  logistics: {
    redispatch(seed: string, orderId: string, address: string) {
      const drivers = ["R. Verma", "A. Khan", "S. Patel", "D. Nair"];
      const vehicle = rand(seed, "vehicle") > 0.5 ? "Refrigerated van RX-42" : "Cargo bike CB-11";
      return {
        status: "success",
        dispatchId: ref("DSP", seed, "dispatch"),
        driver: drivers[Math.floor(rand(seed, "driver") * drivers.length)],
        vehicle,
        etaMinutes: 45,
        destination: address,
        courier: "Logistics Network",
        at: nowIso(),
      };
    },
  },
  merchant: {
    replacement(seed: string, orderId: string, sku: string) {
      return {
        status: "success",
        replacementId: ref("RPL", seed, "replacement"),
        sku: sku || "line item",
        fulfillmentCenter: "WH-MUM-02",
        etaDays: 2,
        at: nowIso(),
      };
    },
  },
  communication: {
    notify(seed: string, channel: string, subject: string) {
      return {
        status: "success",
        messageId: ref("MSG", seed, "notify"),
        channel,
        subject,
        delivered: true,
        deliveredAt: nowIso(),
      };
    },
  },
  ticketing: {
    update(seed: string, ticketId: string, update: string) {
      return {
        status: "success",
        ticketId,
        state: "resolved",
        note: update,
        at: nowIso(),
      };
    },
  },
};

// ---------- Core pipeline ----------
const AGENTS = ["order", "payment", "logistics", "merchant", "policy", "risk"] as const;
type SB = Awaited<ReturnType<typeof adminClient>>;

async function insert(sb: SB, table: string, row: Record<string, unknown>): Promise<void> {
  const { error } = await sb.from(table).insert(row as never);
  if (error) console.error(`insert ${table} error: ${error.message}`);
}

async function updateById(
  sb: SB,
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await sb.from(table).update(patch as never).eq("id", id);
  if (error) console.error(`update ${table} error: ${error.message}`);
}

async function audit(
  sb: SB,
  caseId: string | null,
  actor: string,
  action: string,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await insert(sb, "resolveiq_audit_log", { case_id: caseId, actor, action, detail });
}

async function updateCase(
  sb: SB,
  caseId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await updateById(sb, "resolveiq_cases", caseId, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
}

async function getCaseRow(
  sb: SB,
  idOrNumber: string,
): Promise<Record<string, unknown> | null> {
  const byId = await sb.from("resolveiq_cases").select("*").eq("id", idOrNumber).maybeSingle();
  if (byId.data) return byId.data as Record<string, unknown>;
  const byNum = await sb.from("resolveiq_cases").select("*").eq("case_number", idOrNumber).maybeSingle();
  return (byNum.data as Record<string, unknown> | null) ?? null;
}

async function getSettings(sb: SB): Promise<Record<string, number>> {
  const { data } = await sb.from("resolveiq_settings").select("key, value");
  const out: Record<string, number> = { confidence_threshold: 85, auto_authorization_limit: 250 };
  for (const row of (data ?? []) as Array<{ key: string; value: unknown }>) {
    out[row.key] = Number(row.value);
  }
  return out;
}

function avg(arr: number[]): number {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// ── Qwen AI layer — Qwen is the ONLY LLM. Results are cached per case so each
//    analysis is generated at most once and reused on every later request.
const AI_MODEL = "alibaba/qwen-3.8-max";
const AI_ENDPOINT = "https://api.enter.pro/code/api/v1/ai/chat/completions";
const AI_PROJECT_HEADER = "2d24f4ea26b9405daf2f0c93418c2488";
const AI_SECRET = Deno.env.get("AI_API_TOKEN_2d24f4ea26b9") ?? "";

const SYSTEM_COMPLAINT = `You are the complaint-understanding module of ResolveIQ, a dispute-resolution platform.
Analyse the customer complaint and return STRICT JSON with exactly these keys:
{"summary": "...", "classification": "...", "priority_hint": "low|medium|high", "customer_message": "..."}
Be concise, factual, and customer-friendly. Do not invent facts not present in the complaint.`;

const SYSTEM_SYNTHESIS = `You are the investigation-synthesis module of ResolveIQ.
You are given structured multi-agent investigation results (agent findings, evidence with verification status, contradictions, decision).
Synthesize them into STRICT JSON with exactly these keys:
{"summary": "...", "supporting_evidence": ["..."], "contradicting_evidence": ["..."], "root_cause": "...", "confidence_explanation": "...", "risk": "low|medium|high", "recommended_action": "..."}
Base your synthesis ONLY on the provided data. Do not invent evidence. Be concise.`;

const SYSTEM_RESOLUTION = `You are the resolution-communication module of ResolveIQ.
Given a decided case, produce STRICT JSON with exactly these keys:
{"resolution_summary": "...", "customer_message": "...", "resolution_details": "..."}
The customer_message must be clear, empathetic and easy to understand for a non-technical customer.
Base everything ONLY on the provided case data. Be concise.`;

async function callQwen(system: string, user: string): Promise<string> {
  if (!AI_SECRET) throw new Error("Qwen AI token is not configured");
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_SECRET}`,
      "Content-Type": "application/json",
      "X-Session-ID": "resolveiq-" + crypto.randomUUID(),
      "X-Enter-Project-ID": AI_PROJECT_HEADER,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
      temperature: 0.2,
      max_tokens: 900,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = `Qwen service error (${response.status})`;
    try {
      const err = JSON.parse(text);
      message = err.error?.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  try {
    const data = JSON.parse(text);
    return (data.choices?.[0]?.message?.content ?? "").trim();
  } catch {
    throw new Error("Qwen returned an unparseable response");
  }
}

function parseJsonResult(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return { text };
  }
}

async function getQwenCached(
  sb: SB,
  caseId: string,
  type: string,
): Promise<Record<string, unknown> | null> {
  const { data } = await sb
    .from("resolveiq_qwen")
    .select("*")
    .eq("case_id", caseId)
    .eq("analysis_type", type)
    .maybeSingle();
  if (!data) return null;
  const row = data as { result: Record<string, unknown> };
  return row.result ?? null;
}

async function storeQwen(
  sb: SB,
  caseId: string,
  type: string,
  result: Record<string, unknown>,
): Promise<void> {
  await sb.from("resolveiq_qwen").upsert(
    { case_id: caseId, analysis_type: type, model: AI_MODEL, result },
    { onConflict: "case_id,analysis_type" },
  );
}

function compactCaseContext(c: Record<string, unknown>): string {
  return [
    `Case: ${c.case_number}`,
    `Category: ${c.category}`,
    `Complaint: ${c.description}`,
    `Order: ${c.order_id}`,
    `Severity: ${c.severity}`,
    `Location: ${c.location ?? "n/a"}`,
    `Incident: ${c.incident_at}`,
  ].join("\n");
}

async function qwenAnalyze(sb: SB, caseId: string, type: string) {
  const cached = await getQwenCached(sb, caseId, type);
  if (cached) return { cached: true, model: AI_MODEL, result: cached };

  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");
  const scenario = scenarios[c.scenario_key as string] ?? null;

  let result: Record<string, unknown>;
  if (type === "complaint_understanding") {
    const text = await callQwen(SYSTEM_COMPLAINT, compactCaseContext(c));
    result = parseJsonResult(text);
  } else if (type === "investigation_synthesis" || type === "resolution_explanation") {
    const [findingsRes, evidenceRes, decisionRes] = await Promise.all([
      sb.from("resolveiq_agent_findings").select("*").eq("case_id", caseId),
      sb.from("resolveiq_evidence").select("*").eq("case_id", caseId),
      sb.from("resolveiq_decisions").select("*").eq("case_id", caseId).order("decision_at", { ascending: false }).limit(1),
    ]);
    const findings = (findingsRes.data ?? []) as Array<{ agent: string; finding: string; confidence: number }>;
    const evidence = (evidenceRes.data ?? []) as Array<{ source: string; title: string; status: string; confidence: number; finding: string | null }>;
    const decision = decisionRes.data?.[0] as
      | { recommended_actions: unknown; reasoning: string; confidence: number; risk_level: string }
      | undefined;

    if (type === "investigation_synthesis" && findings.length === 0) {
      throw new Error("Investigation not complete — run ACAN investigation first");
    }

    const context = [
      compactCaseContext(c),
      "",
      "AGENT FINDINGS:",
      ...findings.map((f) => `- ${f.agent}: ${f.finding} (confidence ${f.confidence}%)`),
      "",
      "EVIDENCE:",
      ...evidence.map((e) => `- [${e.status}] ${e.source} · ${e.title}: ${e.finding ?? e.status} (confidence ${e.confidence}%)`),
      "",
      decision
        ? `DECISION: ${JSON.stringify(decision.recommended_actions)} | reasoning: ${decision.reasoning} | confidence ${decision.confidence}% | risk ${decision.risk_level}`
        : "DECISION: none yet",
    ].join("\n");

    const text = await callQwen(
      type === "investigation_synthesis" ? SYSTEM_SYNTHESIS : SYSTEM_RESOLUTION,
      context,
    );
    result = parseJsonResult(text);
  } else {
    throw new Error(`Unknown analysis type: ${type}`);
  }

  await storeQwen(sb, caseId, type, result);
  await audit(sb, caseId, "Qwen", `Qwen analysis generated: ${type}`, { model: AI_MODEL });
  void scenario;
  return { cached: false, model: AI_MODEL, result };
}

// Step 2 — investigation + reconstruction
async function runInvestigation(sb: SB, caseId: string) {
  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");
  const scenario = scenarios[c.scenario_key as string];
  if (!scenario) throw new Error(`Unknown scenario ${c.scenario_key}`);
  const base = new Date(c.incident_at as string).getTime();
  const now = new Date().toISOString();

  for (let i = 0; i < scenario.timeline.length; i++) {
    const ev = scenario.timeline[i];
    await insert(sb, "resolveiq_timeline_events", {
      case_id: caseId,
      source: ev.source,
      title: ev.title,
      description: ev.description,
      event_at: new Date(base + ev.offsetMinutes * 60_000).toISOString(),
      role: ev.role ?? "context",
      flagged: ev.flagged ?? false,
      sort_order: i,
    });
  }
  for (const e of scenario.evidence) {
    await insert(sb, "resolveiq_evidence", {
      case_id: caseId,
      source: e.source,
      title: e.title,
      description: e.description,
      event_at: e.offsetMinutes != null ? new Date(base + e.offsetMinutes * 60_000).toISOString() : null,
      status: "pending",
      confidence: e.confidence,
      finding: null,
      detail: e.detail ?? {},
    });
  }
  const confs: number[] = [];
  for (const agent of AGENTS) {
    const f = scenario.findings[agent];
    confs.push(f.confidence);
    await insert(sb, "resolveiq_agent_findings", {
      case_id: caseId,
      agent,
      status: "completed",
      evidence_found: f.evidenceFound,
      finding: f.finding,
      confidence: f.confidence,
      ran_at: now,
    });
  }
  const a = avg(confs);
  await updateCase(sb, caseId, { status: "verifying", stage: "verify", confidence: a });
  await audit(sb, caseId, "ACAN · Investigate", "Six specialized agents completed investigation", {
    agents: AGENTS,
    avgConfidence: a,
  });
  return { caseId, status: "verifying", stage: "verify", avgConfidence: a };
}

// Step 4 — evidence verification + contradictions
async function verifyEvidence(sb: SB, caseId: string) {
  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");
  const scenario = scenarios[c.scenario_key as string];
  const now = new Date().toISOString();

  for (const e of scenario.evidence) {
    const { error } = await sb
      .from("resolveiq_evidence")
      .update({ status: e.verifyStatus, finding: e.finding, verified_at: now } as never)
      .eq("case_id", caseId)
      .eq("title", e.title);
    if (error) console.error("evidence update error:", error.message);
  }
  const conflicts = scenario.evidence.filter((e) => e.verifyStatus === "contradicted").length;
  const disputed = scenario.evidence.filter((e) => e.verifyStatus === "disputed").length;
  await updateCase(sb, caseId, { status: "arbitrating", stage: "arbitrate" });
  await audit(sb, caseId, "ACAN · Verify", "Cross-system evidence verification complete", {
    conflicts,
    disputed,
  });
  return { caseId, status: "arbitrating", stage: "arbitrate", conflicts, disputed };
}

// Step 5 — arbitration
async function arbitrate(sb: SB, caseId: string) {
  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");
  const scenario = scenarios[c.scenario_key as string];
  const settings = await getSettings(sb);
  const threshold = settings.confidence_threshold;
  const limit = settings.auto_authorization_limit;
  const d = scenario.decision;

  await insert(sb, "resolveiq_decisions", {
    case_id: caseId,
    recommended_actions: d.recommendedActions,
    reasoning: d.reasoning,
    confidence: d.confidence,
    policy_checks: d.policyChecks,
    risk_level: d.riskLevel,
    risk_detail: d.riskDetail,
    escalation_required: d.escalationRequired,
    escalation_reason: d.escalationReason ?? null,
  });

  if (d.escalationRequired) {
    await updateCase(sb, caseId, {
      status: "escalated",
      stage: "escalated",
      escalated: true,
      confidence: d.confidence,
    });
    await audit(sb, caseId, "ACAN · Arbitrate", "Escalated to human review — confidence below threshold", {
      confidence: d.confidence,
      threshold,
      reason: d.escalationReason,
    });
    return {
      caseId,
      status: "escalated",
      stage: "escalated",
      escalationRequired: true,
      confidence: d.confidence,
      threshold,
      reason: d.escalationReason,
    };
  }

  for (const a of d.recommendedActions) {
    const amount = a.amount ?? 0;
    const auto = d.riskLevel === "low" && d.confidence >= threshold && amount <= limit;
    await insert(sb, "resolveiq_actions", {
      case_id: caseId,
      action_type: a.type,
      label: a.label,
      amount: a.amount ?? null,
      authorization_mode: auto ? "auto" : "manual",
      status: "pending",
    });
  }
  await updateCase(sb, caseId, { status: "arbitrating", stage: "arbitrate", confidence: d.confidence });
  await audit(sb, caseId, "ACAN · Arbitrate", "Arbitration decision ready — awaiting authorized execution", {
    confidence: d.confidence,
    actions: d.recommendedActions.length,
  });
  return {
    caseId,
    status: "arbitrating",
    stage: "arbitrate",
    escalationRequired: false,
    confidence: d.confidence,
    threshold,
  };
}

function simulateExecution(seed: string, action: { type: string; amount?: number }, c: Record<string, unknown>) {
  switch (action.type) {
    case "refund":
      return systems.payment.refund(seed, c.order_id as string, action.amount ?? 0);
    case "redispatch":
      return systems.logistics.redispatch(seed, c.order_id as string, c.location as string);
    case "replacement":
      return systems.merchant.replacement(seed, c.order_id as string, "");
    case "notify_customer":
      return systems.communication.notify(seed, "email", `Update on ${c.case_number}`);
    case "update_ticket":
      return systems.ticketing.update(seed, c.case_number as string, "Resolution applied");
    default:
      return { status: "failed", reason: "Unknown action type" };
  }
}

// Step 6 — execute resolution
async function executeAction(sb: SB, caseId: string, actionType?: string) {
  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");

  const query = sb.from("resolveiq_actions").select("*").eq("case_id", caseId).eq("status", "pending");
  const { data } = actionType ? await query.eq("action_type", actionType) : await query;
  const pending = (data ?? []) as Array<{
    id: string;
    action_type: string;
    label: string;
    amount: number | null;
  }>;
  if (pending.length === 0) throw new Error("No pending actions to execute");

  const executed: Array<Record<string, unknown>> = [];
  for (const a of pending) {
    await updateById(sb, "resolveiq_actions", a.id, { status: "executing" });
    const result = simulateExecution(c.case_number as string, { type: a.action_type, amount: a.amount ?? undefined }, c);
    await updateById(sb, "resolveiq_actions", a.id, {
      status: "completed",
      execution_detail: result,
      executed_at: new Date().toISOString(),
    });
    await audit(sb, caseId, "ACAN · Resolve", `Executed ${a.action_type}: ${a.label}`, { result });
    executed.push({ action_type: a.action_type, label: a.label, result });
  }
  await updateCase(sb, caseId, { status: "resolving", stage: "resolve" });
  return { caseId, executed };
}

// Step 7 — verify resolution
async function verifyResolution(sb: SB, caseId: string) {
  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");
  const { data } = await sb
    .from("resolveiq_actions")
    .select("*")
    .eq("case_id", caseId)
    .eq("status", "completed");
  const actions = (data ?? []) as Array<{
    id: string;
    action_type: string;
    execution_detail: Record<string, unknown> | null;
  }>;
  if (actions.length === 0) throw new Error("No completed actions to verify");
  const now = new Date().toISOString();

  const verified: Array<Record<string, unknown>> = [];
  for (const a of actions) {
    const detail = (a.execution_detail ?? {}) as Record<string, unknown>;
    const ok = detail.status === "success" && detail.confirmation !== "rejected";
    const check = {
      action: a.action_type,
      ok,
      confirmation: detail.confirmation ?? detail.delivered ?? "confirmed",
      system: detail.gateway ?? detail.courier ?? detail.fulfillmentCenter ?? "Simulated System",
      verifiedAt: now,
    };
    await updateById(sb, "resolveiq_actions", a.id, {
      verification: check,
      verification_status: ok ? "successful" : "failed",
      verified_at: now,
    });
    verified.push(check);
  }
  const allOk = verified.every((v) => v.ok);
  await updateCase(sb, caseId, { status: "resolved", stage: "verify_resolution" });
  await audit(sb, caseId, "ACAN · Verify Resolution", allOk ? "Resolution verified successfully" : "Resolution verification failed", {
    verified,
  });
  return { caseId, verified, allOk };
}

async function escalateCase(sb: SB, caseId: string, reason?: string) {
  const c = await getCaseRow(sb, caseId);
  if (!c) throw new Error("Case not found");
  await updateCase(sb, caseId, { status: "escalated", stage: "escalated", escalated: true });
  await audit(sb, caseId, "ACAN · Escalate", "Case escalated to human review", { reason: reason ?? null });
  return { caseId, status: "escalated" };
}

// ---------- Scenario engine ----------
type AgentKey = "order" | "payment" | "logistics" | "merchant" | "policy" | "risk";
type EvidenceStatus = "pending" | "verified" | "contradicted" | "disputed";

interface Scenario {
  key: string;
  label: string;
  category: string;
  timeline: {
    source: string;
    title: string;
    description: string;
    offsetMinutes: number;
    role?: "trigger" | "outcome" | "context";
    flagged?: boolean;
  }[];
  evidence: {
    source: string;
    title: string;
    description: string;
    offsetMinutes?: number;
    confidence: number;
    verifyStatus: EvidenceStatus;
    finding: string;
    detail?: Record<string, unknown>;
  }[];
  findings: Record<AgentKey, { evidenceFound: { ref: string; summary: string }[]; finding: string; confidence: number }>;
  decision: {
    recommendedActions: { type: string; label: string; amount?: number }[];
    reasoning: string;
    confidence: number;
    policyChecks: { policy: string; status: string; detail: string }[];
    riskLevel: "low" | "medium" | "high";
    riskDetail: string;
    escalationRequired: boolean;
    escalationReason?: string;
  };
}

const scenarios: Record<string, Scenario> = {
  grocery_delivery_disrupted: {
    key: "grocery_delivery_disrupted",
    label: "Grocery delivery disruption (perishables)",
    category: "Delivery — Order Not Received",
    timeline: [
      { source: "Order", title: "Order placed", description: "14 grocery line items (incl. milk, yogurt, paneer). Total $86.40. Delivery window 10:30–12:00.", offsetMinutes: -93, role: "trigger" },
      { source: "Merchant", title: "Merchant accepted order", description: "FreshMart Metro confirmed stock and packing at 10:05.", offsetMinutes: -90, role: "context" },
      { source: "Logistics", title: "Driver assigned", description: "Courier driver allocated to ORD-88213; ETA 11:20.", offsetMinutes: -55, role: "context" },
      { source: "GPS", title: "Driver reached delivery area", description: "Vehicle entered Andheri West zone at 11:15.", offsetMinutes: -20, role: "context" },
      { source: "GPS", title: "GPS: vehicle stationary", description: "Telemetry shows no movement from 11:25. Vehicle never entered customer geofence.", offsetMinutes: -10, role: "context", flagged: true },
      { source: "Weather", title: "External flood signal", description: "Heavy rain + localized waterlogging advisory active in delivery zone at 11:28.", offsetMinutes: -7, role: "context" },
      { source: "Communication", title: "Driver message (11:32)", description: "\"Road flooded near the drop point, cannot reach gate.\"", offsetMinutes: -3, role: "context" },
      { source: "Communication", title: "Customer message (11:34)", description: "\"Please confirm where my delivery is — driver is not moving.\"", offsetMinutes: -1, role: "context" },
      { source: "Order", title: "Customer complaint created", description: "Order marked delivered but not received; dairy at risk.", offsetMinutes: 0, role: "trigger" },
      { source: "Logistics", title: "Delivery marked complete", description: "System recorded 'Delivered' at 11:40 — no destination scan, no proof of delivery.", offsetMinutes: 5, role: "outcome", flagged: true },
    ],
    evidence: [
      { source: "Order", title: "Order line items", description: "14 items including dairy (milk 2L, yogurt, paneer). Total $86.40.", offsetMinutes: -93, confidence: 98, verifyStatus: "verified", finding: "Order is valid and fully paid; perishable dairy items at risk." },
      { source: "Order", title: "Delivery promise", description: "Scheduled arrival no later than 12:00 local.", offsetMinutes: -93, confidence: 96, verifyStatus: "verified", finding: "Delivery window 10:30–12:00 confirmed on order record." },
      { source: "Payment", title: "Charge ORD-88213", description: "Full amount $86.40 captured at 10:03. No refund issued.", offsetMinutes: -92, confidence: 99, verifyStatus: "verified", finding: "Payment captured in full; no prior refund." },
      { source: "Logistics", title: "Delivery closure event", description: "System recorded 'Delivered' at 11:40, 5 minutes after complaint creation.", offsetMinutes: 5, confidence: 60, verifyStatus: "contradicted", finding: "Delivery closure is unsupported — no destination scan or proof of delivery exists.", detail: { contradicts: ["GPS vehicle telemetry", "Logistics scan history"] } },
      { source: "Logistics", title: "Scan history", description: "No destination-area scan or POD signature recorded before closure.", offsetMinutes: 5, confidence: 91, verifyStatus: "verified", finding: "No scan or POD evidence preceding the closure event." },
      { source: "GPS", title: "Vehicle telemetry 11:15–11:40", description: "Driver vehicle stationary at 19.1149N 72.8662E from 11:25; never entered customer geofence.", offsetMinutes: -20, confidence: 94, verifyStatus: "verified", finding: "GPS contradicts the declared delivery — vehicle never reached the drop point.", detail: { contradicts: ["Logistics delivery closure event"] } },
      { source: "Weather", title: "Flood advisory", description: "Heavy rain + localized waterlogging advisory in delivery zone from 11:28.", offsetMinutes: -7, confidence: 89, verifyStatus: "verified", finding: "External conditions plausibly disrupted last-mile access." },
      { source: "Communication", title: "Driver message", description: "Driver reported flooded road at 11:32.", offsetMinutes: -3, confidence: 93, verifyStatus: "verified", finding: "Driver message corroborates the weather signal and stationary GPS." },
      { source: "Communication", title: "Customer message", description: "Customer asked about the stalled driver at 11:34.", offsetMinutes: -1, confidence: 92, verifyStatus: "verified", finding: "Customer followed up before the closure event — consistent timeline." },
      { source: "Merchant", title: "Fulfilment handoff", description: "Order packed and handed to courier at 10:38.", offsetMinutes: -57, confidence: 95, verifyStatus: "verified", finding: "Merchant fulfilled correctly; responsibility passed to logistics." },
    ],
    findings: {
      order: { evidenceFound: [{ ref: "Order line items", summary: "14 items, dairy at risk" }, { ref: "Delivery promise", summary: "Window 10:30–12:00" }], finding: "Order is valid and fully paid. Perishable items now at risk.", confidence: 98 },
      payment: { evidenceFound: [{ ref: "Charge ORD-88213", summary: "$86.40 captured, no refund" }], finding: "Full payment captured; refund amount in scope is $86.40.", confidence: 99 },
      logistics: { evidenceFound: [{ ref: "Delivery closure event", summary: "'Delivered' at 11:40, unsupported" }, { ref: "Scan history", summary: "No destination scan or POD" }], finding: "Delivery closure is unsupported by scan/POD evidence; declared delivery cannot be trusted.", confidence: 87 },
      merchant: { evidenceFound: [{ ref: "Fulfilment handoff", summary: "Packed & handed to courier 10:38" }], finding: "Merchant fulfilled correctly; no merchant fault.", confidence: 95 },
      policy: { evidenceFound: [{ ref: "Policy PD-04", summary: "Perishables delivery assurance" }], finding: "Policy PD-04 mandates refund + re-dispatch when delivery closure is unsupported.", confidence: 97 },
      risk: { evidenceFound: [{ ref: "Customer impact", summary: "High — perishables" }, { ref: "Fraud indicators", summary: "Low" }], finding: "Customer impact high, fraud risk low. Refund within auto-authorization limit.", confidence: 90 },
    },
    decision: {
      recommendedActions: [
        { type: "refund", label: "Refund $86.40", amount: 86.4 },
        { type: "redispatch", label: "Re-dispatch order", amount: 0 },
        { type: "notify_customer", label: "Notify customer", amount: 0 },
      ],
      reasoning: "Delivery closure is unsupported by GPS and logistics evidence. External conditions (flood advisory) disrupted last-mile access and the driver reported the issue. Perishable items are at risk and customer impact is high. Policy PD-04 mandates a full refund plus re-dispatch.",
      confidence: 92,
      policyChecks: [
        { policy: "PD-04", status: "passed", detail: "Undelivered perishables → refund + re-dispatch" },
        { policy: "AUTH-02", status: "passed", detail: "Refund $86.40 within auto-authorization limit" },
        { policy: "FRAUD-01", status: "passed", detail: "No fraud indicators; verified identity" },
      ],
      riskLevel: "low",
      riskDetail: "Monetary impact limited to order value; customer verified; no repeat-offender pattern.",
      escalationRequired: false,
    },
  },

  wrong_item_shipped: {
    key: "wrong_item_shipped",
    label: "Wrong item shipped (pick error)",
    category: "Wrong Item Received",
    timeline: [
      { source: "Order", title: "Order placed", description: "HP 65W laptop charger (SKU-2218), $29.99.", offsetMinutes: -120, role: "trigger" },
      { source: "Payment", title: "Payment captured", description: "$29.99 charged successfully.", offsetMinutes: -112, role: "context" },
      { source: "Merchant", title: "Item picked at warehouse", description: "Operator scanned SKU-3390 (tablet stand) instead of SKU-2218.", offsetMinutes: -98, role: "trigger", flagged: true },
      { source: "Logistics", title: "Weight scan", description: "Outbound weight 0.42 kg vs expected 0.31 kg for SKU-2218.", offsetMinutes: -90, role: "context", flagged: true },
      { source: "Logistics", title: "Delivered", description: "Package delivered to customer address.", offsetMinutes: -30, role: "context" },
      { source: "Order", title: "Complaint created", description: "Customer received a tablet stand instead of the charger.", offsetMinutes: 0, role: "trigger" },
    ],
    evidence: [
      { source: "Order", title: "Line item vs received", description: "Ordered SKU-2218 laptop charger. Customer received SKU-3390 tablet stand.", offsetMinutes: -120, confidence: 98, verifyStatus: "verified", finding: "Received item does not match the ordered line item." },
      { source: "Logistics", title: "Package weight scan", description: "Outbound weight 0.42 kg vs expected 0.31 kg.", offsetMinutes: -90, confidence: 90, verifyStatus: "verified", finding: "Weight deviation is consistent with a different item shipped." },
      { source: "Merchant", title: "Pick station log", description: "SKU-2218 and SKU-3390 share adjacent bins; operator scanned SKU-3390.", offsetMinutes: -98, confidence: 92, verifyStatus: "verified", finding: "Root cause is a pick-station bin mix-up; merchant accepts responsibility." },
      { source: "Payment", title: "Charge record", description: "$29.99 charged; no refund processed.", offsetMinutes: -112, confidence: 99, verifyStatus: "verified", finding: "Charge is correct for the ordered item." },
    ],
    findings: {
      order: { evidenceFound: [{ ref: "Line item vs received", summary: "SKU mismatch" }], finding: "Ordered SKU-2218; received SKU-3390. Clear mismatch.", confidence: 97 },
      payment: { evidenceFound: [{ ref: "Charge record", summary: "$29.99 no refund" }], finding: "Payment correct; no refund yet.", confidence: 99 },
      logistics: { evidenceFound: [{ ref: "Package weight scan", summary: "0.42kg vs 0.31kg" }], finding: "Weight deviation supports a different item in the box.", confidence: 90 },
      merchant: { evidenceFound: [{ ref: "Pick station log", summary: "Adjacent bin mix-up" }], finding: "Merchant pick error confirmed; merchant accepts responsibility.", confidence: 94 },
      policy: { evidenceFound: [{ ref: "Policy RT-02", summary: "Wrong item → replacement/refund" }], finding: "Policy RT-02 allows replacement or refund at customer choice.", confidence: 96 },
      risk: { evidenceFound: [{ ref: "Fraud indicators", summary: "None" }, { ref: "Amount", summary: "$29.99" }], finding: "Low risk; no fraud pattern; replacement within limits.", confidence: 92 },
    },
    decision: {
      recommendedActions: [
        { type: "replacement", label: "Ship replacement (laptop charger)", amount: 29.99 },
        { type: "notify_customer", label: "Notify customer", amount: 0 },
      ],
      reasoning: "The received item does not match the order and merchant pick logs confirm a bin mix-up. Policy RT-02 grants replacement or refund. Replacement is the least-disruptive resolution for the customer.",
      confidence: 88,
      policyChecks: [
        { policy: "RT-02", status: "passed", detail: "Wrong item → replacement or refund" },
        { policy: "AUTH-02", status: "passed", detail: "Replacement value within limit" },
      ],
      riskLevel: "low",
      riskDetail: "Single pick error; no fraud signal; value well within auto-authorization limit.",
      escalationRequired: false,
    },
  },

  billing_error: {
    key: "billing_error",
    label: "Duplicate subscription charge",
    category: "Billing — Unexpected Charge",
    timeline: [
      { source: "Order", title: "Subscription renewed", description: "Streamly Premium annual renewal due.", offsetMinutes: -2160, role: "trigger" },
      { source: "Payment", title: "Charge attempt (retry)", description: "Gateway retry after network timeout produced a second capture.", offsetMinutes: -2159, role: "trigger", flagged: true },
      { source: "Payment", title: "Duplicate charge", description: "Two identical $19.00 charges, 0.8 s apart.", offsetMinutes: -2159, role: "outcome", flagged: true },
      { source: "Communication", title: "Duplicate receipts", description: "Two identical receipts emailed to customer.", offsetMinutes: -2159, role: "context" },
      { source: "Order", title: "Complaint created", description: "Customer flagged unexpected double charge.", offsetMinutes: 0, role: "trigger" },
    ],
    evidence: [
      { source: "Payment", title: "Charge events", description: "Two identical $19.00 charges 0.8 s apart on renewal date.", offsetMinutes: -2159, confidence: 97, verifyStatus: "verified", finding: "Duplicate capture confirmed — idempotency key collision." },
      { source: "Order", title: "Subscription state", description: "Single active Streamly Premium subscription; no add-on purchase.", offsetMinutes: -2160, confidence: 95, verifyStatus: "verified", finding: "Only one entitlement exists; no basis for two charges." },
      { source: "Communication", title: "Receipts", description: "Two receipts sent 0.8 s apart; retry produced a duplicate.", offsetMinutes: -2159, confidence: 93, verifyStatus: "verified", finding: "Duplicate notification corroborates the duplicate charge." },
    ],
    findings: {
      order: { evidenceFound: [{ ref: "Subscription state", summary: "Single entitlement" }], finding: "One subscription entitlement; duplicate charge is erroneous.", confidence: 95 },
      payment: { evidenceFound: [{ ref: "Charge events", summary: "Two captures 0.8s apart" }], finding: "Gateway retry after timeout re-sent the capture with a new request ID.", confidence: 94 },
      logistics: { evidenceFound: [], finding: "Not applicable — no physical fulfillment in scope.", confidence: 99 },
      merchant: { evidenceFound: [], finding: "Not applicable — subscription billing.", confidence: 99 },
      policy: { evidenceFound: [{ ref: "Policy BL-01", summary: "Duplicate charge auto-refund" }], finding: "Policy BL-01 mandates automatic refund of duplicate charges.", confidence: 98 },
      risk: { evidenceFound: [{ ref: "Amount", summary: "$19.00" }, { ref: "System error", summary: "Confirmed gateway retry" }], finding: "Low risk; clear system error; small amount.", confidence: 91 },
    },
    decision: {
      recommendedActions: [
        { type: "refund", label: "Refund duplicate $19.00", amount: 19 },
        { type: "update_ticket", label: "Update billing ticket", amount: 0 },
        { type: "notify_customer", label: "Notify customer", amount: 0 },
      ],
      reasoning: "Two captures 0.8 s apart with a single subscription entitlement confirm a gateway retry error. Policy BL-01 requires automatic refund of the duplicate charge and closure of the billing ticket.",
      confidence: 93,
      policyChecks: [
        { policy: "BL-01", status: "passed", detail: "Duplicate charge → auto-refund" },
        { policy: "AUTH-02", status: "passed", detail: "Amount within auto-authorization limit" },
      ],
      riskLevel: "low",
      riskDetail: "Confirmed system error; amount minimal; no fraud signal.",
      escalationRequired: false,
    },
  },

  double_charge_dispute: {
    key: "double_charge_dispute",
    label: "Double charge at checkout",
    category: "Payment — Double Charge",
    timeline: [
      { source: "Order", title: "Order placed", description: "UrbanMunch order ORD-88107, $32.50.", offsetMinutes: -75, role: "trigger" },
      { source: "Payment", title: "First capture", description: "TXN-A9… captured $32.50.", offsetMinutes: -70, role: "context" },
      { source: "Payment", title: "Second capture", description: "TXN-B2… captured $32.50 again 31 s later.", offsetMinutes: -69.5, role: "trigger", flagged: true },
      { source: "Logistics", title: "Order delivered", description: "Food order delivered to customer.", offsetMinutes: -10, role: "context" },
      { source: "Order", title: "Complaint created", description: "Customer noticed double charge on statement.", offsetMinutes: 0, role: "trigger" },
    ],
    evidence: [
      { source: "Payment", title: "Capture history", description: "ORD-88107 charged $32.50 twice (TXN-A9… and TXN-B2…) 31 s apart.", offsetMinutes: -69, confidence: 97, verifyStatus: "verified", finding: "Duplicate capture confirmed." },
      { source: "Order", title: "Order total", description: "Single order; subtotal $32.50.", offsetMinutes: -75, confidence: 99, verifyStatus: "verified", finding: "Order value supports a single charge only." },
      { source: "Payment", title: "Gateway idempotency log", description: "Checkout retry on network timeout re-sent with a new request ID.", offsetMinutes: -69, confidence: 96, verifyStatus: "verified", finding: "Gateway retry produced the duplicate; merchant did not double-charge intentionally." },
    ],
    findings: {
      order: { evidenceFound: [{ ref: "Order total", summary: "$32.50 single" }], finding: "Single order; second charge has no matching order line.", confidence: 99 },
      payment: { evidenceFound: [{ ref: "Capture history", summary: "Two captures 31s apart" }], finding: "Duplicate capture confirmed; one charge erroneous.", confidence: 95 },
      logistics: { evidenceFound: [], finding: "Not applicable.", confidence: 99 },
      merchant: { evidenceFound: [{ ref: "Gateway log", summary: "Retry, new request ID" }], finding: "No merchant fault; gateway retry caused the duplicate.", confidence: 94 },
      policy: { evidenceFound: [{ ref: "Policy BL-01", summary: "Duplicate charge auto-refund" }], finding: "Policy BL-01 → refund the duplicate charge automatically.", confidence: 98 },
      risk: { evidenceFound: [{ ref: "Amount", summary: "$32.50" }, { ref: "Pattern", summary: "One-off" }], finding: "Low risk; clear system error; no pattern.", confidence: 93 },
    },
    decision: {
      recommendedActions: [
        { type: "refund", label: "Refund duplicate $32.50", amount: 32.5 },
        { type: "notify_customer", label: "Notify customer", amount: 0 },
      ],
      reasoning: "One order was charged twice through a gateway retry. The duplicate capture is confirmed and has no order basis. Policy BL-01 mandates refunding the erroneous charge and notifying the customer.",
      confidence: 95,
      policyChecks: [
        { policy: "BL-01", status: "passed", detail: "Duplicate charge → auto-refund" },
        { policy: "AUTH-02", status: "passed", detail: "$32.50 within auto-authorization limit" },
      ],
      riskLevel: "low",
      riskDetail: "One-off gateway error; small amount; customer verified.",
      escalationRequired: false,
    },
  },

  signed_delivery_dispute: {
    key: "signed_delivery_dispute",
    label: "Signed delivery disputed by customer",
    category: "Delivery — Not Received (Signed POD)",
    timeline: [
      { source: "Order", title: "Order placed", description: "HomeStyle Furnishings order ORD-88051.", offsetMinutes: -95, role: "trigger" },
      { source: "Logistics", title: "Driver dispatched", description: "Courier assigned for evening delivery.", offsetMinutes: -60, role: "context" },
      { source: "GPS", title: "Arrived at address", description: "Vehicle entered the delivery geofence.", offsetMinutes: -15, role: "context" },
      { source: "Logistics", title: "POD signature recorded", description: "Signature 'K. Rao' captured 8 s after arrival flag.", offsetMinutes: -10, role: "outcome", flagged: true },
      { source: "Order", title: "Complaint created", description: "Customer states no one received the package.", offsetMinutes: 0, role: "trigger" },
    ],
    evidence: [
      { source: "Logistics", title: "POD signature", description: "Signature 'K. Rao' recorded 8 seconds after the driver arrival flag.", offsetMinutes: -10, confidence: 78, verifyStatus: "disputed", finding: "Closure was implausibly fast; signature credibility is questionable.", detail: { issue: "8s between arrival flag and signature" } },
      { source: "GPS", title: "Vehicle track", description: "Vehicle reached the address geofence and stayed 4 minutes.", offsetMinutes: -15, confidence: 90, verifyStatus: "verified", finding: "Vehicle was physically at the address." },
      { source: "Communication", title: "Customer statement", description: "Customer: 'No one at the door; no package seen; neighbor confirms no drop.'", offsetMinutes: 0, confidence: 85, verifyStatus: "verified", finding: "Customer denies receipt; neighbor corroborates." },
      { source: "Policy", title: "Driver POD pattern", description: "2 of 9 recent PODs for this driver show similarly fast closures.", offsetMinutes: 0, confidence: 70, verifyStatus: "disputed", finding: "Elevated fast-close rate for the same driver suggests a possible pattern.", detail: { rate: "2/9 fast closures" } },
    ],
    findings: {
      order: { evidenceFound: [{ ref: "Order", summary: "ORD-88051 valid" }], finding: "Order valid; delivery claim is the only dispute point.", confidence: 95 },
      payment: { evidenceFound: [], finding: "No payment anomaly.", confidence: 99 },
      logistics: { evidenceFound: [{ ref: "POD signature", summary: "8s after arrival" }, { ref: "Vehicle track", summary: "Vehicle at address" }], finding: "Vehicle was present, but the POD was captured implausibly fast with no scan-based proof.", confidence: 74 },
      merchant: { evidenceFound: [], finding: "Not applicable.", confidence: 99 },
      policy: { evidenceFound: [{ ref: "Policy VD-03", summary: "Fast-close → manual review" }], finding: "Policy VD-03: fast-close delivery patterns require manual review before refund or charge-back.", confidence: 88 },
      risk: { evidenceFound: [{ ref: "Driver POD pattern", summary: "2/9 fast closures" }], finding: "Elevated anomaly rate for this driver; possible premature closure.", confidence: 72 },
    },
    decision: {
      recommendedActions: [
        { type: "replacement", label: "Replacement pending manual review", amount: 0 },
        { type: "notify_customer", label: "Notify customer of investigation", amount: 0 },
      ],
      reasoning: "The vehicle was at the address, but the POD signature was recorded 8 s after arrival and the same driver shows an elevated fast-close rate. Signature credibility cannot be established from available evidence. Confidence is below the auto-resolution threshold — the case must be reviewed by a human before any refund or charge-back.",
      confidence: 74,
      policyChecks: [
        { policy: "VD-03", status: "manual", detail: "Fast-close delivery pattern → manual review required" },
        { policy: "FRAUD-01", status: "manual", detail: "Signature identity unverified" },
      ],
      riskLevel: "medium",
      riskDetail: "Ambiguous receipt: refund risks paying twice; charge-back risks penalizing an innocent driver.",
      escalationRequired: true,
      escalationReason: "Confidence 74% is below the 85% threshold. POD signature credibility is uncertain and the driver has an elevated fast-close rate.",
    },
  },

  damaged_goods: {
    key: "damaged_goods",
    label: "Damaged goods — conflicting photos",
    category: "Damaged on Arrival",
    timeline: [
      { source: "Order", title: "Order placed", description: "Glassware set (6 glass carafes), $118.00.", offsetMinutes: -130, role: "trigger" },
      { source: "Merchant", title: "Handed to courier", description: "Outer box noted dented at warehouse scan; condition not recorded.", offsetMinutes: -40, role: "context", flagged: true },
      { source: "Logistics", title: "Delivered", description: "Package delivered to customer.", offsetMinutes: -15, role: "context" },
      { source: "Order", title: "Complaint created", description: "Customer photo shows shattered carafe; driver photo shows intact box.", offsetMinutes: 0, role: "trigger" },
    ],
    evidence: [
      { source: "Logistics", title: "Driver handoff photo", description: "Box appears intact at customer door.", offsetMinutes: -15, confidence: 88, verifyStatus: "verified", finding: "Exterior appeared intact at delivery." },
      { source: "Communication", title: "Customer damage photo", description: "Carafe shattered inside; inner padding displaced.", offsetMinutes: 0, confidence: 86, verifyStatus: "verified", finding: "Interior damage is real, but timing of damage is unclear." },
      { source: "Logistics", title: "Handoff condition flag", description: "Outer box dented at warehouse scan; no condition note recorded.", offsetMinutes: -40, confidence: 72, verifyStatus: "disputed", finding: "Damage may predate transit — handoff condition was never recorded.", detail: { issue: "Condition at courier handoff unverified" } },
    ],
    findings: {
      order: { evidenceFound: [{ ref: "Order", summary: "Glassware, $118" }], finding: "Order valid; item is fragile glassware.", confidence: 97 },
      payment: { evidenceFound: [], finding: "No payment anomaly.", confidence: 99 },
      logistics: { evidenceFound: [{ ref: "Handoff condition flag", summary: "Unrecorded" }, { ref: "Driver handoff photo", summary: "Intact exterior" }], finding: "Evidence conflict: intact exterior vs damaged interior; handoff condition was never recorded.", confidence: 69 },
      merchant: { evidenceFound: [{ ref: "Order", summary: "Fragile item" }], finding: "Fragile item; packaging quality not assessable from records.", confidence: 80 },
      policy: { evidenceFound: [{ ref: "Policy DG-01", summary: "Inspection when condition unverified" }], finding: "Policy DG-01 requires inspection when condition at handoff is unverified.", confidence: 91 },
      risk: { evidenceFound: [{ ref: "Photo conflict", summary: "Intact vs damaged" }], finding: "Inconsistent photos; damage cannot be attributed to transit vs handling.", confidence: 66 },
    },
    decision: {
      recommendedActions: [
        { type: "replacement", label: "Replacement subject to inspection", amount: 118 },
        { type: "notify_customer", label: "Notify customer", amount: 0 },
      ],
      reasoning: "The exterior was intact at delivery but the interior is damaged and the condition at courier handoff was never recorded. The damage cannot be attributed with confidence to transit or handling. Policy DG-01 requires a physical inspection before replacement or rejection.",
      confidence: 68,
      policyChecks: [
        { policy: "DG-01", status: "manual", detail: "Damage attribution requires physical inspection" },
        { policy: "AUTH-02", status: "manual", detail: "Amount above fast-path for ambiguous liability" },
      ],
      riskLevel: "medium",
      riskDetail: "Conflicting photo evidence; replacement without inspection risks paying twice or masking a fraud pattern.",
      escalationRequired: true,
      escalationReason: "Confidence 68% is below the 85% threshold. Condition at courier handoff is unverified and photo evidence conflicts — manual inspection required.",
    },
  },
};

const CATEGORY_TO_SCENARIO: Record<string, string> = {
  "Delivery — Order Not Received": "grocery_delivery_disrupted",
  "Wrong Item Received": "wrong_item_shipped",
  "Payment — Double Charge": "double_charge_dispute",
  "Billing — Unexpected Charge": "billing_error",
  "Delivery — Not Received (Signed POD)": "signed_delivery_dispute",
  "Damaged on Arrival": "damaged_goods",
  // Customer-facing categories map onto the same investigation scenarios
  "Payment Issue": "double_charge_dispute",
  "Delivery Issue": "grocery_delivery_disrupted",
  "Wrong Item": "wrong_item_shipped",
  "Damaged Item": "damaged_goods",
  "Missing Item": "grocery_delivery_disrupted",
  "Refund Issue": "double_charge_dispute",
  "Service Issue": "billing_error",
  "Other": "grocery_delivery_disrupted",
};

function scenarioForCategory(category: string): Scenario {
  return scenarios[CATEGORY_TO_SCENARIO[category] ?? "grocery_delivery_disrupted"];
}

// ---------- Create case ----------
async function createCase(sb: SB, body: Record<string, unknown>) {
  const required = ["customerName", "customerEmail", "orderId", "category", "description", "incidentAt"];
  for (const key of required) {
    if (!body[key]) throw new Error(`Missing required field: ${key}`);
  }
  const year = new Date().getFullYear();
  const { data: existing } = await sb
    .from("resolveiq_cases")
    .select("case_number")
    .like("case_number", `RIQ-${year}-%`)
    .order("case_number", { ascending: false })
    .limit(1);
  const nextSeq =
    existing && existing.length > 0
      ? Number((existing[0] as { case_number: string }).case_number.split("-").pop()) + 1
      : 142;
  const caseNumber = `RIQ-${year}-${String(nextSeq).padStart(5, "0")}`;
  const scenario = scenarioForCategory(String(body.category));

  const { data: row, error } = await sb
    .from("resolveiq_cases")
    .insert({
      case_number: caseNumber,
      customer_name: String(body.customerName),
      customer_email: String(body.customerEmail),
      customer_phone: body.customerPhone ? String(body.customerPhone) : null,
      order_id: String(body.orderId),
      merchant: body.merchant ? String(body.merchant) : null,
      category: String(body.category),
      description: String(body.description),
      incident_at: String(body.incidentAt),
      location: body.location ? String(body.location) : null,
      severity: String(body.severity ?? "medium"),
      status: "new",
      stage: "understand",
      scenario_key: scenario.key,
    })
    .select()
    .single();
  if (error || !row) throw new Error(error?.message ?? "Failed to create case");

  await audit(sb, (row as { id: string }).id, "Operator", "Complaint submitted — case created", {
    case_number: caseNumber,
    category: body.category,
    severity: body.severity ?? "medium",
  });

  // Best-effort Qwen complaint understanding (generated once, cached, reused).
  // Never blocks case creation if Qwen is unavailable.
  let qwen = null;
  try {
    qwen = await qwenAnalyze(sb, (row as { id: string }).id, "complaint_understanding");
  } catch (err) {
    console.error("Qwen complaint understanding failed:", (err as Error).message);
  }

  return { case: row, case_number: caseNumber, scenario: scenario.key, qwen };
}

// ---------- Get / list ----------
async function getCase(sb: SB, body: Record<string, unknown>) {
  const refValue = String(body.id ?? body.caseId ?? "");
  if (!refValue) throw new Error("Missing id or caseId");
  const row = await getCaseRow(sb, refValue);
  if (!row) throw new Error("Case not found");
  const caseId = row.id as string;

  const [evidence, timeline, findings, decisions, actions, auditRows, qwenRows] = await Promise.all([
    sb.from("resolveiq_evidence").select("*").eq("case_id", caseId).order("event_at", { ascending: true }),
    sb.from("resolveiq_timeline_events").select("*").eq("case_id", caseId).order("event_at", { ascending: true }),
    sb.from("resolveiq_agent_findings").select("*").eq("case_id", caseId).order("ran_at", { ascending: true }),
    sb.from("resolveiq_decisions").select("*").eq("case_id", caseId).order("decision_at", { ascending: false }).limit(1),
    sb.from("resolveiq_actions").select("*").eq("case_id", caseId).order("created_at", { ascending: true }),
    sb.from("resolveiq_audit_log").select("*").eq("case_id", caseId).order("created_at", { ascending: false }).limit(50),
    sb.from("resolveiq_qwen").select("*").eq("case_id", caseId),
  ]);

  const qwen = (qwenRows.data ?? []).reduce<Record<string, Record<string, unknown>>>((acc, q) => {
    const row = q as { analysis_type: string; result: Record<string, unknown>; model: string; created_at: string };
    acc[row.analysis_type] = { ...row.result, model: row.model, generated_at: row.created_at };
    return acc;
  }, {});

  return {
    case: row,
    evidence: evidence.data ?? [],
    timeline: timeline.data ?? [],
    findings: findings.data ?? [],
    decision: decisions.data?.[0] ?? null,
    actions: actions.data ?? [],
    audit: auditRows.data ?? [],
    qwen,
    settings: await getSettings(sb),
  };
}

async function listCases(sb: SB, body: Record<string, unknown>) {
  const status = body.status ? String(body.status) : undefined;
  const search = body.search ? String(body.search).toLowerCase() : undefined;
  let query = sb
    .from("resolveiq_cases")
    .select("id, case_number, customer_name, customer_email, order_id, category, description, severity, status, stage, confidence, escalated, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as Record<string, unknown>[];
  if (search) {
    rows = rows.filter((r) =>
      [r.case_number, r.customer_name, r.order_id, r.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(search))
    );
  }
  return { cases: rows, settings: await getSettings(sb) };
}

// ---------- Analytics ----------
async function analytics(sb: SB) {
  const [casesRes, evidenceRes, actionsRes, decisionsRes, auditRes, findingsRes, casesAllRes] = await Promise.all([
    sb.from("resolveiq_cases").select("id, status, escalated, created_at"),
    sb.from("resolveiq_evidence").select("status"),
    sb.from("resolveiq_actions").select("action_type, executed_at"),
    sb.from("resolveiq_decisions").select("case_id, confidence, decision_at"),
    sb.from("resolveiq_audit_log").select("created_at"),
    sb.from("resolveiq_agent_findings").select("case_id, agent, finding, confidence, ran_at").order("ran_at", { ascending: false }).limit(30),
    sb.from("resolveiq_cases").select("id, case_number"),
  ]);
  const cases = (casesRes.data ?? []) as Array<Record<string, unknown>>;
  const evidence = (evidenceRes.data ?? []) as Array<{ status: string }>;
  const actions = (actionsRes.data ?? []) as Array<{ action_type: string; executed_at: string | null }>;
  const decisions = (decisionsRes.data ?? []) as Array<{ case_id: string; confidence: number; decision_at: string }>;
  const auditRows = auditRes.data ?? [];
  const findings = (findingsRes.data ?? []) as Array<{ case_id: string; agent: string; finding: string; confidence: number; ran_at: string }>;
  const caseNumbers = Object.fromEntries((casesAllRes.data ?? []).map((r) => [r.id, r.case_number]));

  const agentActivity = findings.map((f) => ({
    agent: f.agent,
    finding: f.finding,
    confidence: Math.round(f.confidence),
    ran_at: f.ran_at,
    case_number: caseNumbers[f.case_id] ?? "",
  }));

  const statusCounts = cases.reduce<Record<string, number>>((acc, c) => {
    acc[String(c.status)] = (acc[String(c.status)] ?? 0) + 1;
    return acc;
  }, {});
  const resolutionTypes = actions.reduce<Record<string, number>>((acc, a) => {
    acc[a.action_type] = (acc[a.action_type] ?? 0) + 1;
    return acc;
  }, {});

  // Investigation duration per case: decision_at − case created_at (matched by case_id).
  const decisionByCase = new Map(decisions.map((d) => [d.case_id, d.decision_at]));
  const durations: number[] = [];
  for (const c of cases) {
    const decided = decisionByCase.get(String(c.id));
    if (!decided) continue;
    const created = new Date(String(c.created_at)).getTime();
    const d = new Date(decided).getTime();
    if (d > created) durations.push((d - created) / 60000);
  }
  const avgInvestigationTime = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const buckets = [
    { bucket: "0–50%", min: 0, max: 50 },
    { bucket: "50–70%", min: 50, max: 70 },
    { bucket: "70–85%", min: 70, max: 85 },
    { bucket: "85–100%", min: 85, max: 100 },
  ];
  const confidenceBuckets = buckets.map((b) => ({
    bucket: b.bucket,
    count: decisions.filter((d) => d.confidence >= b.min && d.confidence < b.max).length,
  }));

  const evidenceStatus = evidence.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  const avgConfidence =
    decisions.length > 0 ? Math.round(decisions.reduce((a, d) => a + d.confidence, 0) / decisions.length) : 0;
  const settings = await getSettings(sb);

  return {
    totalCases: cases.length,
    avgConfidence,
    statusCounts,
    resolutionTypes,
    avgInvestigationTime,
    confidenceBuckets,
    evidenceStatus,
    evidenceConflicts: evidenceStatus["contradicted"] ?? 0,
    escalatedCount: cases.filter((c) => c.escalated === true).length,
    resolvedCount: cases.filter((c) => String(c.status) === "resolved").length,
    auditEvents: auditRows.length,
    threshold: settings.confidence_threshold,
    agentActivity,
  };
}

// ---------- Seed ----------
interface SeedCase {
  caseNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderId: string;
  merchant: string;
  category: string;
  description: string;
  incidentAt: string;
  location: string;
  severity: "low" | "medium" | "high" | "critical";
  scenarioKey: string;
  stage: "new" | "verifying" | "arbitrating" | "resolved" | "escalated";
}

const SEED_CASES: SeedCase[] = [
  {
    caseNumber: "RIQ-2026-0134",
    customerName: "Rahul Mehta",
    customerEmail: "rahul.mehta@example.com",
    customerPhone: "+91 98200 11421",
    orderId: "ORD-88412",
    merchant: "TechNest Electronics",
    category: "Wrong Item Received",
    description: "Ordered an HP 65W laptop charger (SKU-2218) but received a tablet stand (SKU-3390). Requesting the correct item.",
    incidentAt: "2026-09-10T14:20:00+05:30",
    location: "Powai, Mumbai",
    severity: "medium",
    scenarioKey: "wrong_item_shipped",
    stage: "resolved",
  },
  {
    caseNumber: "RIQ-2026-0135",
    customerName: "Kavita Desai",
    customerEmail: "kavita.desai@example.com",
    customerPhone: "+91 99870 45213",
    orderId: "SUB-2281",
    merchant: "Streamly Media",
    category: "Billing — Unexpected Charge",
    description: "Streamly Premium was renewed once but my card was charged twice ($19.00 each) at the same moment.",
    incidentAt: "2026-09-11T09:05:00+05:30",
    location: "Bandra, Mumbai",
    severity: "low",
    scenarioKey: "billing_error",
    stage: "verifying",
  },
  {
    caseNumber: "RIQ-2026-0136",
    customerName: "Ananya Iyer",
    customerEmail: "ananya.iyer@example.com",
    customerPhone: "+91 99604 77890",
    orderId: "ORD-88107",
    merchant: "UrbanMunch",
    category: "Payment — Double Charge",
    description: "My order was charged $32.50 twice on my statement, 31 seconds apart. I was only charged once at checkout.",
    incidentAt: "2026-09-12T13:45:00+05:30",
    location: "Hiranandani, Mumbai",
    severity: "medium",
    scenarioKey: "double_charge_dispute",
    stage: "arbitrating",
  },
  {
    caseNumber: "RIQ-2026-0137",
    customerName: "Vikram Nair",
    customerEmail: "vikram.nair@example.com",
    customerPhone: "+91 98111 20398",
    orderId: "ORD-88051",
    merchant: "HomeStyle Furnishings",
    category: "Delivery — Not Received (Signed POD)",
    description: "System shows the parcel signed for by 'K. Rao' but no one at my address signed or received anything.",
    incidentAt: "2026-09-12T18:10:00+05:30",
    location: "Juhu, Mumbai",
    severity: "high",
    scenarioKey: "signed_delivery_dispute",
    stage: "escalated",
  },
  {
    caseNumber: "RIQ-2026-0138",
    customerName: "Sneha Kulkarni",
    customerEmail: "sneha.kulkarni@example.com",
    customerPhone: "+91 99303 56112",
    orderId: "ORD-88309",
    merchant: "Brew & Bloom",
    category: "Damaged on Arrival",
    description: "Glass carafe set arrived with one carafe shattered. Driver photo shows intact box; my photo shows internal damage.",
    incidentAt: "2026-09-13T11:30:00+05:30",
    location: "Versova, Mumbai",
    severity: "high",
    scenarioKey: "damaged_goods",
    stage: "escalated",
  },
  {
    caseNumber: "RIQ-2026-0142",
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@example.com",
    customerPhone: "+91 99002 88765",
    orderId: "ORD-88213",
    merchant: "FreshMart Metro",
    category: "Delivery — Order Not Received",
    description: "Customer ordered grocery delivery. Driver has been stationary for a long period and dairy products may be at risk. Customer claims the order was marked delivered but was not received.",
    incidentAt: "2026-09-14T11:35:00+05:30",
    location: "Andheri West, Mumbai",
    severity: "high",
    scenarioKey: "grocery_delivery_disrupted",
    stage: "new",
  },
];

const STAGE_CREATED_AT: Record<string, string> = {
  "RIQ-2026-0134": "2026-09-10T14:22:00Z",
  "RIQ-2026-0135": "2026-09-11T09:07:00Z",
  "RIQ-2026-0136": "2026-09-12T13:47:00Z",
  "RIQ-2026-0137": "2026-09-12T18:12:00Z",
  "RIQ-2026-0138": "2026-09-13T11:32:00Z",
  "RIQ-2026-0142": "2026-09-14T11:36:00Z",
};

async function seedIfEmpty(sb: SB) {
  const { count } = await sb.from("resolveiq_cases").select("*", { count: "exact", head: true });
  if (count && count > 0) return { seeded: false, skipped: true, existing: count };

  for (const c of SEED_CASES) {
    await materialize(sb, c, STAGE_CREATED_AT[c.caseNumber]);
  }
  return { seeded: true, created: SEED_CASES.length };
}

async function materialize(sb: SB, c: SeedCase, createdIso: string) {
  const scenario = scenarios[c.scenarioKey];
  const base = new Date(c.incidentAt).getTime();
  const hasInvestigation = c.stage !== "new";
  const hasVerification = c.stage !== "new" && c.stage !== "verifying";
  const hasDecision = ["arbitrating", "resolved", "escalated"].includes(c.stage);

  const { data: caseRow, error } = await sb
    .from("resolveiq_cases")
    .insert({
      case_number: c.caseNumber,
      customer_name: c.customerName,
      customer_email: c.customerEmail,
      customer_phone: c.customerPhone,
      order_id: c.orderId,
      merchant: c.merchant,
      category: c.category,
      description: c.description,
      incident_at: c.incidentAt,
      location: c.location,
      severity: c.severity,
      status:
        c.stage === "resolved" ? "resolved"
        : c.stage === "escalated" ? "escalated"
        : c.stage === "arbitrating" ? "arbitrating"
        : c.stage === "verifying" ? "verifying"
        : "new",
      stage:
        c.stage === "resolved" ? "verify_resolution"
        : c.stage === "escalated" ? "escalated"
        : c.stage === "arbitrating" ? "arbitrate"
        : c.stage === "verifying" ? "verify"
        : "understand",
      escalated: c.stage === "escalated",
      confidence: hasDecision ? scenario.decision.confidence : null,
      scenario_key: c.scenarioKey,
      created_at: createdIso,
      updated_at: createdIso,
    })
    .select()
    .single();
  if (error || !caseRow) throw new Error(error?.message ?? `Failed to seed ${c.caseNumber}`);
  const caseId = (caseRow as { id: string }).id;

  await insert(sb, "resolveiq_audit_log", {
    case_id: caseId,
    actor: "Operator",
    action: "Complaint submitted — case created",
    detail: { case_number: c.caseNumber, category: c.category, severity: c.severity },
    created_at: createdIso,
  });

  if (!hasInvestigation) return caseRow;

  for (let i = 0; i < scenario.timeline.length; i++) {
    const ev = scenario.timeline[i];
    await insert(sb, "resolveiq_timeline_events", {
      case_id: caseId,
      source: ev.source,
      title: ev.title,
      description: ev.description,
      event_at: new Date(base + ev.offsetMinutes * 60_000).toISOString(),
      role: ev.role ?? "context",
      flagged: ev.flagged ?? false,
      sort_order: i,
    });
  }

  for (const e of scenario.evidence) {
    await insert(sb, "resolveiq_evidence", {
      case_id: caseId,
      source: e.source,
      title: e.title,
      description: e.description,
      event_at: e.offsetMinutes != null ? new Date(base + e.offsetMinutes * 60_000).toISOString() : null,
      status: hasVerification ? e.verifyStatus : "pending",
      confidence: e.confidence,
      finding: hasVerification ? e.finding : null,
      detail: e.detail ?? {},
      verified_at: hasVerification ? new Date(Date.parse(createdIso) + 3 * 60_000).toISOString() : null,
    });
  }

  const confs: number[] = [];
  for (const agent of AGENTS) {
    const f = scenario.findings[agent];
    confs.push(f.confidence);
    await insert(sb, "resolveiq_agent_findings", {
      case_id: caseId,
      agent,
      status: "completed",
      evidence_found: f.evidenceFound,
      finding: f.finding,
      confidence: f.confidence,
      ran_at: new Date(Date.parse(createdIso) + 2 * 60_000).toISOString(),
    });
  }
  const avgConfidence = avg(confs);
  await insert(sb, "resolveiq_audit_log", {
    case_id: caseId,
    actor: "ACAN · Investigate",
    action: "Six specialized agents completed investigation",
    detail: { agents: AGENTS, avgConfidence },
    created_at: new Date(Date.parse(createdIso) + 2 * 60_000).toISOString(),
  });

  if (hasVerification) {
    await insert(sb, "resolveiq_audit_log", {
      case_id: caseId,
      actor: "ACAN · Verify",
      action: "Cross-system evidence verification complete",
      detail: { conflicts: scenario.evidence.filter((e) => e.verifyStatus === "contradicted").length },
      created_at: new Date(Date.parse(createdIso) + 3 * 60_000).toISOString(),
    });
  }

  if (!hasDecision) {
    await updateCase(sb, caseId, { status: "verifying", stage: "verify", confidence: avgConfidence });
    return caseRow;
  }

  const d = scenario.decision;
  const decisionAt = new Date(Date.parse(createdIso) + 4 * 60_000).toISOString();
  await insert(sb, "resolveiq_decisions", {
    case_id: caseId,
    recommended_actions: d.recommendedActions,
    reasoning: d.reasoning,
    confidence: d.confidence,
    policy_checks: d.policyChecks,
    risk_level: d.riskLevel,
    risk_detail: d.riskDetail,
    escalation_required: d.escalationRequired,
    escalation_reason: d.escalationReason ?? null,
    decision_at: decisionAt,
    created_at: decisionAt,
  });

  if (d.escalationRequired) {
    await updateCase(sb, caseId, { status: "escalated", stage: "escalated", escalated: true, confidence: d.confidence });
    await insert(sb, "resolveiq_audit_log", {
      case_id: caseId,
      actor: "ACAN · Arbitrate",
      action: "Escalated to human review — confidence below threshold",
      detail: { confidence: d.confidence, reason: d.escalationReason },
      created_at: decisionAt,
    });
    return caseRow;
  }

  if (c.stage === "arbitrating") {
    const settings = await getSettings(sb);
    const threshold = settings.confidence_threshold;
    const limit = settings.auto_authorization_limit;
    for (const a of d.recommendedActions) {
      const amount = a.amount ?? 0;
      const auto = d.riskLevel === "low" && d.confidence >= threshold && amount <= limit;
      await insert(sb, "resolveiq_actions", {
        case_id: caseId,
        action_type: a.type,
        label: a.label,
        amount: a.amount ?? null,
        authorization_mode: auto ? "auto" : "manual",
        status: "pending",
        created_at: decisionAt,
      });
    }
    await insert(sb, "resolveiq_audit_log", {
      case_id: caseId,
      actor: "ACAN · Arbitrate",
      action: "Arbitration decision ready — awaiting authorized execution",
      detail: { confidence: d.confidence },
      created_at: decisionAt,
    });
    await updateCase(sb, caseId, { status: "arbitrating", stage: "arbitrate", confidence: d.confidence });
    return caseRow;
  }

  const executedAt = new Date(Date.parse(decisionAt) + 5 * 60_000).toISOString();
  for (const a of d.recommendedActions) {
    const result = simulate(a, c);
    const ok = result.status === "success" && result.confirmation !== "rejected";
    const check = {
      action: a.type,
      ok,
      confirmation: result.confirmation ?? result.delivered ?? "confirmed",
      system: result.gateway ?? result.courier ?? result.fulfillmentCenter ?? "Simulated System",
      verifiedAt: executedAt,
    };
    await insert(sb, "resolveiq_actions", {
      case_id: caseId,
      action_type: a.type,
      label: a.label,
      amount: a.amount ?? null,
      authorization_mode: "auto",
      status: "completed",
      execution_detail: result,
      executed_at: executedAt,
      verification: check,
      verification_status: "successful",
      verified_at: executedAt,
      created_at: decisionAt,
    });
    await insert(sb, "resolveiq_audit_log", {
      case_id: caseId,
      actor: "ACAN · Resolve",
      action: `Executed ${a.type}: ${a.label}`,
      detail: { result },
      created_at: executedAt,
    });
  }
  await insert(sb, "resolveiq_audit_log", {
    case_id: caseId,
    actor: "ACAN · Verify Resolution",
    action: "Resolution verified successfully",
    detail: {},
    created_at: executedAt,
  });
  await updateCase(sb, caseId, { status: "resolved", stage: "verify_resolution", confidence: d.confidence });
  return caseRow;
}

function simulate(a: { type: string; amount?: number }, c: SeedCase) {
  switch (a.type) {
    case "refund":
      return systems.payment.refund(c.caseNumber, c.orderId, a.amount ?? 0);
    case "redispatch":
      return systems.logistics.redispatch(c.caseNumber, c.orderId, c.location ?? "");
    case "replacement":
      return systems.merchant.replacement(c.caseNumber, c.orderId, "");
    case "notify_customer":
      return systems.communication.notify(c.caseNumber, "email", `Update on ${c.caseNumber}`);
    case "update_ticket":
      return systems.ticketing.update(c.caseNumber, c.caseNumber, "Resolution applied");
    default:
      return { status: "failed", reason: "Unknown action" };
  }
}

// ---------- Router ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      // no body
    }
    const sb = adminClient();
    const action = String(body.action ?? "");
    const caseId = () => String(body.caseId ?? body.id ?? "");

    switch (action) {
      case "seed":
        return json(await seedIfEmpty(sb));
      case "create-case":
        return json(await createCase(sb, body));
      case "list-cases":
        return json(await listCases(sb, body));
      case "list-audit": {
        const { data: auditRows } = await sb
          .from("resolveiq_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30);
        const caseIds = [
          ...new Set((auditRows ?? []).map((r) => (r as { case_id: string | null }).case_id).filter(Boolean)),
        ] as string[];
        const { data: caseRows } = caseIds.length
          ? await sb.from("resolveiq_cases").select("id, case_number, customer_name, customer_email").in("id", caseIds)
          : { data: [] };
        const caseMap = Object.fromEntries((caseRows ?? []).map((r) => [r.id, r]));
        return json({ audit: auditRows ?? [], cases: caseMap });
      }
      case "get-case":
        return json(await getCase(sb, body));
      case "run-investigation":
        return json(await runInvestigation(sb, caseId()));
      case "verify-evidence":
        return json(await verifyEvidence(sb, caseId()));
      case "arbitrate":
        return json(await arbitrate(sb, caseId()));
      case "execute-action":
        return json(await executeAction(sb, caseId(), body.actionType ? String(body.actionType) : undefined));
      case "verify-resolution":
        return json(await verifyResolution(sb, caseId()));
      case "escalate":
        return json(await escalateCase(sb, caseId(), body.reason ? String(body.reason) : undefined));
      case "analytics":
        return json(await analytics(sb));
      case "qwen-analyze": {
        const type = String(body.type ?? "");
        if (!["complaint_understanding", "investigation_synthesis", "resolution_explanation"].includes(type)) {
          return json({ error: `Unknown qwen type: ${type}` }, 400);
        }
        return json(await qwenAnalyze(sb, caseId(), type));
      }
      case "ping":
        return json({ ok: true, service: "ResolveIQ API" });
      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("ResolveIQ API error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
