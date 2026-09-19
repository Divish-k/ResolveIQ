// Customer-facing helpers: friendly labels + category helpers for the customer dashboard.

export function customerStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Received",
    investigating: "Under Investigation",
    verifying: "Under Investigation",
    arbitrating: "Under Review",
    resolving: "Being Resolved",
    resolved: "Resolved",
    escalated: "Escalated",
  };
  return map[status] ?? status;
}

export function friendlyAction(action: string): string {
  if (action.includes("Complaint submitted")) return "Complaint received by ResolveIQ";
  if (action.includes("agents completed")) return "Investigation started";
  if (action.includes("verification complete")) return "Evidence verification in progress";
  if (action.includes("Arbitration decision ready")) return "Decision completed";
  if (action.includes("verified successfully")) return "Case resolved";
  if (action.includes("Escalated")) return "Case escalated for review";
  if (action.includes("Executed")) return "Resolution applied";
  if (action.includes("arbitration")) return "Decision in progress";
  return action;
}

export const CUSTOMER_CATEGORIES = [
  "Payment Issue",
  "Delivery Issue",
  "Wrong Item",
  "Damaged Item",
  "Missing Item",
  "Refund Issue",
  "Service Issue",
  "Other",
] as const;

export const PREFERRED_RESOLUTIONS = [
  "Refund",
  "Replacement",
  "Re-dispatch / Delivery",
  "Apology & Follow-up",
  "Investigate Further",
  "Other",
] as const;

// Customer category → priority (severity) used when the case is created.
export function priorityForCategory(category: string): string {
  const high = ["Delivery Issue", "Damaged Item", "Missing Item"];
  const low = ["Service Issue", "Other"];
  if (high.includes(category)) return "high";
  if (low.includes(category)) return "low";
  return "medium";
}

export function firstLine(s: string): string {
  return s.split("\n")[0];
}
