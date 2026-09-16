// Formatting helpers shared across ResolveIQ pages.

export function fmtMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes === 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const STAGE_LABELS: { key: string; label: string }[] = [
  { key: "understand", label: "Understand" },
  { key: "investigate", label: "Investigate" },
  { key: "reconstruct", label: "Reconstruct" },
  { key: "verify", label: "Verify" },
  { key: "arbitrate", label: "Arbitrate" },
  { key: "resolve", label: "Resolve" },
  { key: "verify_resolution", label: "Verify" },
];

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  investigating: "Investigating",
  verifying: "Awaiting Verification",
  arbitrating: "Arbitration",
  resolving: "Resolving",
  resolved: "Resolved",
  escalated: "Escalated",
};

export const AGENT_LABELS: Record<string, string> = {
  order: "Order Agent",
  payment: "Payment Agent",
  logistics: "Logistics Agent",
  merchant: "Merchant Agent",
  policy: "Policy Agent",
  risk: "Risk Agent",
};
