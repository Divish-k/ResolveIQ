import {
  Building2,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  User,
} from "lucide-react";
import type { CaseRow } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { ConfidenceGauge } from "@/components/shared/ConfidenceGauge";
import { SeverityBadge, StatusBadge } from "@/components/shared/Badges";

export function CaseHeader({ caseRow }: { caseRow: CaseRow }) {
  return (
    <div className="bg-gradient-subtle shadow-card rounded-xl border border-white/10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              {caseRow.case_number}
            </h2>
            <StatusBadge status={caseRow.status} />
            <SeverityBadge severity={caseRow.severity} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
            {caseRow.category}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            <Fact icon={User} label="Customer" value={caseRow.customer_name} />
            <Fact icon={Mail} label="Email" value={caseRow.customer_email} />
            <Fact icon={Phone} label="Phone" value={caseRow.customer_phone ?? "—"} />
            <Fact icon={ShoppingBag} label="Order" value={caseRow.order_id} />
            <Fact icon={Building2} label="Merchant" value={caseRow.merchant ?? "—"} />
            <Fact icon={MapPin} label="Location" value={caseRow.location ?? "—"} />
            <Fact
              icon={CalendarClock}
              label="Incident"
              value={fmtDateTime(caseRow.incident_at)}
            />
            <Fact
              icon={CalendarClock}
              label="Submitted"
              value={fmtDateTime(caseRow.created_at)}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
            <ConfidenceGauge
              value={caseRow.confidence}
              size={92}
              className="text-white"
            />
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-cyan-200">
            Investigation confidence
          </span>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-white/40">
          {label}
        </div>
        <div className="truncate text-[13px] font-medium text-white">{value}</div>
      </div>
    </div>
  );
}
