import { Link } from "react-router-dom";
import { ChevronRight, FileText } from "lucide-react";
import { useListCases } from "@/lib/api";
import { useCustomer } from "@/context/customer";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { customerStatusLabel, firstLine } from "@/lib/customer";

// Subject = first line of the complaint description (customer form puts the
// subject on its own line); falls back to the category for legacy cases.
function subjectOf(c: { description: string; category: string }): string {
  const line = firstLine(c.description).trim();
  return line.length > 0 ? line : c.category;
}

export default function MyComplaints() {
  const { customer } = useCustomer();
  const { data, isLoading } = useListCases();

  const mine = (data?.cases ?? [])
    .filter((c) => c.customer_email?.toLowerCase() === customer.email.toLowerCase())
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Complaints</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every complaint you've raised, and where it stands now.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : mine.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          description="When you raise a complaint it will appear here with its case ID and live status."
          action={
            <Link to="/customer/raise">
              <Button size="sm">Raise a Complaint</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {mine.map((c) => (
            <Link
              key={c.id}
              to={`/customer/track/${c.id}`}
              className="bg-card flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all hover:border-cyan-300 hover:shadow"
            >
              <div className="bg-cyan-50 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-cyan-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{c.case_number}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      c.severity === "high" || c.severity === "critical"
                        ? "bg-rose-50 text-rose-700"
                        : c.severity === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Priority: {c.severity.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {customerStatusLabel(c.status)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[13px] text-slate-600">
                  {subjectOf(c)} · {c.category}
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[11px] text-slate-400">
                  {fmtDateTime(c.created_at)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  updated {fmtDateTime(c.updated_at)}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
