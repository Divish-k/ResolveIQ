// ResolveIQ shared frontend types (mirrors the backend rows).

export type Severity = "low" | "medium" | "high" | "critical";
export type AgentKey = "order" | "payment" | "logistics" | "merchant" | "policy" | "risk";
export type EvidenceStatus = "pending" | "verified" | "contradicted" | "disputed";
export type ActionType = "refund" | "redispatch" | "replacement" | "notify_customer" | "update_ticket";

export interface CaseRow {
  id: string;
  case_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  order_id: string;
  merchant: string | null;
  category: string;
  description: string;
  incident_at: string;
  location: string | null;
  severity: Severity;
  status: string;
  stage: string;
  confidence: number | null;
  scenario_key: string;
  escalated: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  id: string;
  case_id: string;
  source: string;
  title: string;
  description: string;
  event_at: string | null;
  status: EvidenceStatus;
  confidence: number;
  finding: string | null;
  detail: Record<string, unknown>;
  verified_at: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  source: string;
  title: string;
  description: string;
  event_at: string;
  role: "trigger" | "outcome" | "context";
  flagged: boolean;
  sort_order: number;
  created_at: string;
}

export interface AgentFinding {
  id: string;
  case_id: string;
  agent: AgentKey;
  status: "running" | "completed" | "failed";
  evidence_found: { ref: string; summary: string }[];
  finding: string;
  confidence: number;
  ran_at: string;
  created_at: string;
}

export interface PolicyCheck {
  policy: string;
  status: "passed" | "failed" | "manual";
  detail: string;
}

export interface RecommendedAction {
  type: ActionType;
  label: string;
  amount?: number;
}

export interface Decision {
  id: string;
  case_id: string;
  recommended_actions: RecommendedAction[];
  reasoning: string;
  confidence: number;
  policy_checks: PolicyCheck[];
  risk_level: "low" | "medium" | "high";
  risk_detail: string | null;
  escalation_required: boolean;
  escalation_reason: string | null;
  decision_at: string;
  created_at: string;
}

export interface ResolutionAction {
  id: string;
  case_id: string;
  action_type: ActionType;
  label: string;
  amount: number | null;
  authorization_mode: "auto" | "manual";
  status: "pending" | "executing" | "completed" | "failed";
  execution_detail: Record<string, unknown> | null;
  executed_at: string | null;
  verification: Record<string, unknown> | null;
  verification_status: "pending" | "successful" | "failed" | null;
  verified_at: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  case_id: string | null;
  actor: string;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface Settings {
  confidence_threshold: number;
  auto_authorization_limit: number;
}

export interface QwenAnalysis {
  summary?: string;
  classification?: string;
  priority_hint?: string;
  customer_message?: string;
  supporting_evidence?: string[];
  contradicting_evidence?: string[];
  root_cause?: string;
  confidence_explanation?: string;
  risk?: string;
  recommended_action?: string;
  resolution_summary?: string;
  resolution_details?: string;
  model?: string;
  generated_at?: string;
  text?: string;
}

export interface CaseDetail {
  case: CaseRow;
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  findings: AgentFinding[];
  decision: Decision | null;
  actions: ResolutionAction[];
  audit: AuditEntry[];
  qwen?: Partial<Record<"complaint_understanding" | "investigation_synthesis" | "resolution_explanation", QwenAnalysis>>;
  settings: Settings;
}

export interface CreateCaseResponse {
  case: CaseRow;
  case_number: string;
  scenario: string;
  qwen: { cached: boolean; model: string; result: QwenAnalysis } | null;
}

export interface CaseListItem {
  id: string;
  case_number: string;
  customer_name: string;
  customer_email: string | null;
  order_id: string;
  category: string;
  description: string;
  severity: Severity;
  status: string;
  stage: string;
  confidence: number | null;
  escalated: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  totalCases: number;
  avgConfidence: number;
  statusCounts: Record<string, number>;
  resolutionTypes: Record<string, number>;
  avgInvestigationTime: number;
  confidenceBuckets: { bucket: string; count: number }[];
  evidenceStatus: Record<string, number>;
  evidenceConflicts: number;
  escalatedCount: number;
  resolvedCount: number;
  auditEvents: number;
  threshold: number;
  agentActivity: { agent: string; finding: string; confidence: number; ran_at: string; case_number: string }[];
}

export interface Operator {
  name: string;
  email: string;
  role: string;
  signedInAt: string;
}

export interface CustomerIdentity {
  name: string;
  email: string;
  joinedAt: string;
}
