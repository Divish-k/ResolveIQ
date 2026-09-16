import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200",
  investigating: "bg-indigo-50 text-indigo-700 border-indigo-200",
  verifying: "bg-amber-50 text-amber-700 border-amber-200",
  arbitrating: "bg-violet-50 text-violet-700 border-violet-200",
  resolving: "bg-cyan-50 text-cyan-700 border-cyan-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  escalated: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border font-medium", STATUS_STYLES[status] ?? "", className)}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function EvidenceStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600 border-slate-200",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    contradicted: "bg-rose-50 text-rose-700 border-rose-200",
    disputed: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    verified: "Verified",
    contradicted: "Contradicted",
    disputed: "Disputed",
  };
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border font-medium", styles[status] ?? "", className)}
    >
      {labels[status] ?? status}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-600 border-slate-200",
    medium: "bg-sky-50 text-sky-700 border-sky-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border capitalize font-medium",
        styles[severity] ?? "",
        className,
      )}
    >
      {severity}
    </Badge>
  );
}
