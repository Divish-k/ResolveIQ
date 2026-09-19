import { Link } from "react-router-dom";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Hourglass,
  SearchCheck,
  ShieldAlert,
} from "lucide-react";
import { useActivity } from "@/lib/api";
import { useCustomer } from "@/context/customer";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/StatCard";
import { fmtDateTime } from "@/lib/format";
import { friendlyAction } from "@/lib/customer";

export default function CustomerNotifications() {
  const { customer } = useCustomer();
  const { data, isLoading } = useActivity();

  const caseMap = data?.cases ?? {};
  const notifications = (data?.audit ?? [])
    .filter((a) => a.case_id && caseMap[a.case_id])
    .map((a) => ({ entry: a, caseRow: caseMap[a.case_id] }))
    .filter((u) => u.caseRow.customer_email?.toLowerCase() === customer.email.toLowerCase())
    .slice(0, 20);

  const iconFor = (action: string) => {
    if (action.includes("verified successfully")) return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (action.includes("Escalated")) return <ShieldAlert className="h-4 w-4 text-rose-600" />;
    if (action.includes("agents completed") || action.includes("verification"))
      return <Hourglass className="h-4 w-4 text-amber-600" />;
    if (action.includes("Executed") || action.includes("Arbitration decision"))
      return <SearchCheck className="h-4 w-4 text-cyan-600" />;
    return <BellRing className="h-4 w-4 text-slate-500" />;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Updates about your complaints — in plain language.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You'll see updates here as your complaints move through investigation and resolution."
        />
      ) : (
        <div className="bg-card rounded-xl border border-slate-200/80 shadow-sm">
          <ul className="divide-y divide-slate-100">
            {notifications.map(({ entry, caseRow }) => (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
                  {iconFor(entry.action)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-slate-700">
                    <Link
                      to={`/customer/track/${caseRow.id}`}
                      className="font-semibold text-cyan-700 hover:underline"
                    >
                      {caseRow.case_number}
                    </Link>{" "}
                    — {friendlyAction(entry.action)}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <Bell className="h-3 w-3" />
                    {fmtDateTime(entry.created_at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
