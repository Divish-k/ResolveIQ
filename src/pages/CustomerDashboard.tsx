import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  FileText,
  Hourglass,
  PlusCircle,
  SearchCheck,
} from "lucide-react";
import { useListCases, useActivity } from "@/lib/api";
import { useCustomer } from "@/context/customer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDateTime } from "@/lib/format";
import { customerStatusLabel, firstLine, friendlyAction } from "@/lib/customer";

function subjectOf(c: { description?: string; category: string }): string {
  const line = firstLine(c.description ?? "").trim();
  return line.length > 0 ? line : c.category;
}

export default function CustomerDashboard() {
  const { customer } = useCustomer();
  const { data, isLoading } = useListCases();
  const { data: activity } = useActivity();

  const mine = (data?.cases ?? []).filter(
    (c) => c.customer_email?.toLowerCase() === customer.email.toLowerCase(),
  );
  const active = mine.filter((c) => c.status !== "resolved" && c.status !== "escalated");
  const investigating = mine.filter((c) => c.status === "investigating" || c.status === "verifying");
  const resolved = mine.filter((c) => c.status === "resolved");
  const escalated = mine.filter((c) => c.status === "escalated");

  const caseMap = activity?.cases ?? {};
  const updates = (activity?.audit ?? [])
    .filter((a) => a.case_id && caseMap[a.case_id])
    .map((a) => ({ entry: a, caseRow: caseMap[a.case_id] }))
    .filter((u) => u.caseRow.customer_email?.toLowerCase() === customer.email.toLowerCase())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {customer.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your complaints and resolutions in one place.
          </p>
        </div>
        <Link to="/customer/raise">
          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
            <PlusCircle className="h-4 w-4" />
            Raise Complaint
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card icon={FileText} label="Active Complaints" value={active.length} tone="text-cyan-600" />
          <Card icon={Hourglass} label="Under Investigation" value={investigating.length} tone="text-amber-600" />
          <Card icon={CheckCircle2} label="Resolved Complaints" value={resolved.length} tone="text-emerald-600" />
          <Card icon={Bell} label="Escalated" value={escalated.length} tone="text-rose-600" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Your complaints</h3>
            <Link to="/customer/complaints" className="text-xs font-medium text-cyan-600 hover:underline">
              View all
            </Link>
          </div>
          {mine.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No complaints yet.</p>
              <Link to="/customer/raise" className="mt-3 inline-block">
                <Button size="sm">Raise your first complaint</Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {mine.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/customer/track/${c.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        c.status === "resolved"
                          ? "bg-emerald-500"
                          : c.status === "escalated"
                            ? "bg-rose-500"
                            : "bg-cyan-500 animate-pulse"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {c.case_number}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {subjectOf(c)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {customerStatusLabel(c.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <SearchCheck className="h-4 w-4 text-cyan-600" />
            <h3 className="text-sm font-semibold text-slate-900">Latest updates</h3>
          </div>
          {updates.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No updates yet. Raise a complaint to get started.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {updates.map(({ entry, caseRow }) => (
                <li key={entry.id} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug text-slate-700">
                      <Link to={`/customer/track/${caseRow.id}`} className="font-semibold text-cyan-700 hover:underline">
                        {caseRow.case_number}
                      </Link>{" "}
                      — {friendlyAction(entry.action)}
                    </p>
                    <p className="text-[11px] text-slate-400">{fmtDateTime(entry.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-slate-200/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}
