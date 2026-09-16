# ResolveIQ — ACAN Autonomous Causal Arbitration (Hackathon 2026 Prototype)

## Context

Build a complete, working full-stack demo for the Microsoft Hackathon 2026 track
"Agentic AI for Customer Support & Dispute Resolution". ResolveIQ does not just
answer complaints — it runs a simulated multi-agent investigation across enterprise
systems (Order, Payment, Merchant, Logistics, GPS, Weather, Communication), verifies
evidence, reconstructs a causal timeline, arbitrates against policy, executes a safe
resolution, and verifies it succeeded.

The current project is the stock Vite + React + TS + Tailwind + shadcn template
(single `Index.tsx` page). The entire app must be built from scratch. No external
API keys: all enterprise systems and the six investigation agents are **simulated
deterministically** inside backend functions on a real persistent database (Enter
Cloud). The user explicitly requested a real backend, so **Enter Cloud must be
enabled as the first implementation step**.

Stack constraints: React 19, Vite, Tailwind 3, TypeScript, react-router-dom 7,
@tanstack/react-query, recharts, lucide-react (icons only — no emoji).

---

## Architecture

### ACAN pipeline (per case)
```
Understand → Investigate → Reconstruct → Verify → Arbitrate → Resolve → Verify Resolution
   1st stage    6 agents      timeline      evidence   decision    action      completion check
```
Escalation: if arbitration confidence < threshold (configurable, default 85), the case
goes to `escalated` and shows "Human Review Required" instead of auto-resolving.

### Backend — Enter Cloud (Supabase)

**Tables** (`supabase/migrations/0001_resolveiq.sql`):
- `cases` — case_number, customer, order_id, category, description, incident_at, location, severity, status (new | investigating | verifying | arbitrating | resolving | resolved | escalated), stage, confidence, scenario_key, timestamps.
- `evidence_items` — case_id, source (Order/Payment/Merchant/Logistics/GPS/Weather/Communication/Policy), title, description, event_at, status (pending | verified | contradicted | disputed), confidence, finding (verification result), detail jsonb.
- `timeline_events` — case_id, source, title, description, event_at, role (trigger/outcome/context), flagged (anomaly).
- `agent_findings` — case_id, agent (order/payment/logistics/merchant/policy/risk), status, evidence_found jsonb, finding, confidence, ran_at.
- `decisions` — case_id, recommended_actions jsonb, reasoning, confidence, policy_checks jsonb, risk_level, escalation_required, escalation_reason.
- `resolution_actions` — case_id, action_type (refund | redispatch | replacement | notify_customer | update_ticket), label, amount, authorization (auto | manual), status (pending | executing | completed | failed), execution_detail jsonb, verification jsonb, verification_status, executed_at, verified_at.
- `audit_log` — case_id, actor, action, detail jsonb, created_at.
- `settings` — key/value (e.g. `confidence_threshold` = 85).

RLS: demo app — functions access via service role; enable RLS with no public access.

**Shared modules** (`supabase/functions/_shared/`):
- `systems.ts` — simulated enterprise system APIs (`order.get`, `payment.refund`, `logistics.track`, `gps.lastKnown`, `weather.conditions`, `comm.log`, `evidence.store`) returning realistic structured responses with confirmation codes. This is where "system integration" feel comes from.
- `scenarios.ts` — the deterministic scenario engine. Each scenario key defines: timeline events (with source/times/anomaly flags), evidence items (incl. designed contradictions), the six agent findings + confidence, and the arbitration result (actions, reasoning, policy checks, risk, confidence, escalation). Engine is shared by seed + runtime pipeline so behavior is identical.
- `engine.ts` — pipeline steps: `runInvestigation(case)` writes agent findings + timeline + evidence; `verifyEvidence(case)` cross-checks (e.g. Logistics "Delivered" vs GPS stationary → contradiction), sets evidence statuses; `arbitrate(case)` combines findings + policy + risk into a `decisions` row.

**Edge functions** (one per endpoint):
- `resolveiq-seed` — idempotent seed: 5 sample cases in varied states (resolved / escalated / verifying / investigating / arbitrated) + the primary demo case RIQ-2026-0142 (grocery/dairy delivery) ready to run the full flow. Safe to re-run (skip if exists).
- `resolveiq-create-case` — create case from complaint form → status `new`, audit entry.
- `resolveiq-run-investigation` — writes timeline, agent findings, evidence; status → `verifying`.
- `resolveiq-verify-evidence` — cross-check + contradiction detection; status → `arbitrating`.
- `resolveiq-arbitrate` — policy engine + risk + confidence; writes decision; status → `resolved` (auto action executed) or `escalated` (needs review) or `awaiting_action`.
- `resolveiq-execute-action` — executes one resolution action via simulated systems (refund txn id, re-dispatch id, notification id), writes `resolution_actions` + audit; status → `verifying_resolution`.
- `resolveiq-verify-resolution` — confirms action succeeded (payment confirmation etc.); status → `resolved`.
- `resolveiq-escalate` — manual escalation; status → `escalated`.
- `resolveiq-get-case` — full case payload (case + evidence + timeline + findings + decision + actions + audit) for the case page.
- `resolveiq-list-cases` — list with status filter + search.
- `resolveiq-analytics` — SQL aggregations (status counts, resolution-type counts, avg investigation time, confidence buckets, escalated count, evidence conflicts count).

### Frontend (React)

**Design system** (edit `src/index.css`, `tailwind.config.ts`, `index.html`):
- Deep navy enterprise background, cyan/blue accents, white cards, subtle gradients.
- Tokens: `--background: 226 55% 9%` (navy), `--card: 0 0% 100%` (white cards with navy text), `--primary: 199 89% 48%` (cyan), gradient tokens (`--gradient-primary`), soft shadows, `--radius: 0.625rem`.
- Font stack: `"Segoe UI", "Segoe UI Variable Text", system-ui, ...` (Microsoft feel, zero runtime deps).
- Dark sidebar chrome, light data cards — professional Microsoft enterprise look.

**Files**:
- `src/lib/types.ts` — shared TS types mirroring DB rows.
- `src/lib/api.ts` — backend client (fetch to edge functions) with react-query hooks + query keys. Auto-invokes `resolveiq-seed` on first load when case table is empty.
- `src/context/operator.tsx` — mock auth: login screen with "Demo access" stores operator in localStorage; route guard redirects to `/login`.
- `src/components/layout/AppLayout.tsx` (+ `Sidebar`, `TopBar`) — deep navy sidebar, nav: Dashboard / New Complaint / My Cases / Investigation / Evidence / Analytics / Help; topbar shows operator + ACAN badge.
- Pages:
  - `Login.tsx` — enterprise login card, product name ResolveIQ, tagline "Support shouldn't guess. Support should investigate.", Demo Access button.
  - `Dashboard.tsx` — stat cards (Total Cases, Investigating, Awaiting Verification, Resolved, Escalated, Avg Confidence), recent cases table, investigation activity feed (audit log), quick actions.
  - `Submit.tsx` — complaint form (customer, order ID, category, description, datetime, location, severity, evidence notes) + a "Load demo complaint" fill button (the grocery/dairy example). Submit → create case → navigate to case → auto-start investigation.
  - `Cases.tsx` — "My Cases" list with status filter chips + search.
  - `CaseDetail.tsx` — the hub. Tabs: Overview / Investigation / Causal Timeline / Evidence / Decision / Resolution / Escalation / History. Built from focused components under `src/components/case/`:
    - `CaseHeader` — case ID, customer, order, severity, confidence meter, stage.
    - `WorkflowStepper` — visual 7-step ACAN progress (Understand→…→Verify).
    - `AgentsPanel` — six agent cards (Order/Payment/Logistics/Merchant/Policy/Risk) each with status, evidence found, timestamp, finding, confidence; animated sequential reveal on run.
    - `CausalTimeline` — multi-system event timeline with source chips, anomaly flags, and "likely cause" panel.
    - `EvidencePanel` — evidence cards by source with status/confidence/verification + highlighted contradiction callouts.
    - `DecisionPanel` — arbitration result: recommended action, confidence, reasoning summary, policy checks, risk level; action buttons (Refund / Re-dispatch / Replacement / Notify Customer / Update Ticket) enabled only when authorized; executes via API with running/success/failure state.
    - `ResolutionPanel` — verification step after execution (payment confirmation, notification sent, case status) → "Resolution verified successfully."
    - `EscalationPanel` — "Human Review Required": evidence summary, causal finding, policy result, recommended action, uncertainty, audit trail.
    - `HistoryPanel` — full audit trail timeline.
  - `Investigation.tsx` — pipeline view: all in-flight cases with stage progress.
  - `Evidence.tsx` — cross-case evidence & contradiction summary, click through to cases.
  - `Analytics.tsx` — recharts: cases by status (donut), resolution types (bar), avg investigation time, confidence distribution (histogram), escalated cases, evidence conflicts.
  - `Help.tsx` — ACAN architecture explainer + scenario reference.
- `src/router.tsx` — add routes inside an `AppLayout` route wrapper; update `Index.tsx` to redirect to `/` (dashboard).

**Simulated systems + agents are NOT an LLM**: the demo needs no AI capability; all
agent logic is deterministic scenario data stored on submission/run. No external API keys.

---

## Demo flow (the primary case)

1. Login via Demo Access.
2. Dashboard → "New Complaint" → load demo complaint (grocery dairy delivery) → Submit.
3. Case page auto-runs ACAN: six agents investigate sequentially (animated), timeline reconstructs the causal story, evidence verification flags the "Delivered vs GPS stationary" contradiction.
4. Arbitration recommends **Refund + Re-dispatch** (confidence 92%, risk low, policy PD-04) → click "Execute".
5. Execution simulates payment refund + re-dispatch + customer notification; verification confirms success → case `Resolved` → "Resolution verified successfully."
6. Escalation path demoed by seeded cases (e.g. delivery with contradictory signature, confidence < threshold) showing "Human Review Required".

---

## Implementation checklist

- [ ] Enable Enter Cloud (`supabase_enable`), then load the `enter_cloud` skill and follow it for migrations/functions.
- [ ] `supabase/migrations/0001_resolveiq.sql` — create tables above (cases, evidence_items, timeline_events, agent_findings, decisions, resolution_actions, audit_log, settings) with RLS enabled.
- [ ] `supabase/functions/_shared/systems.ts` — simulated enterprise system API responses.
- [ ] `supabase/functions/_shared/scenarios.ts` + `engine.ts` — scenario engine covering: grocery/dairy delivery (primary demo), wrong item shipped, double-charge dispute, damaged goods (escalate), signature-contradiction delivery (escalate), billing error.
- [ ] Edge functions: seed, create-case, run-investigation, verify-evidence, arbitrate, execute-action, verify-resolution, escalate, get-case, list-cases, analytics.
- [ ] Deploy migrations + functions; run `resolveiq-seed` and verify rows exist.
- [ ] `src/index.css` + `tailwind.config.ts` + `index.html` — navy/cyan design tokens, gradients, shadows, font stack, radius.
- [ ] `src/lib/types.ts`, `src/lib/api.ts` (react-query hooks), `src/context/operator.tsx` (mock auth + guard).
- [ ] `AppLayout` + `Sidebar` + `TopBar` navigation shell.
- [ ] Pages: Login, Dashboard, Submit, Cases, CaseDetail (+ case components), Investigation, Evidence, Analytics, Help.
- [ ] Router update (`Index` redirect to `/`, layout-route wrapper, `/login` public).
- [ ] Analytics page wired to `resolveiq-analytics`.

## Verification checklist

- [ ] `pnpm run check` passes (eslint + tsc) and `pnpm run build` succeeds.
- [ ] Login page renders; Demo Access lands on Dashboard with seeded stats (6+ cases).
- [ ] Submit demo complaint → case created → investigation runs → agents complete → evidence flags the "Delivered vs GPS" contradiction.
- [ ] Arbitration shows Refund + Re-dispatch @ 92% confidence; Execute button runs; Resolution panel shows "Resolution verified successfully."; case status = Resolved.
- [ ] A seeded low-confidence case shows "Human Review Required" (escalated) instead of auto-resolution.
- [ ] Audit trail records every step; Case History tab shows complaint → investigation → evidence → decision → action → verification with timestamps.
- [ ] Analytics charts render with seeded data (status donut, resolution types, confidence distribution, conflicts).
- [ ] Screenshot the affected routes at desktop_1280 (primary) and mobile_390 (layout responsive check) — desktop-first enterprise layout.
- [ ] No console errors on the primary demo run; every button performs a real API action (no dead buttons).
