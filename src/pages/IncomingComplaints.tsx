import { Link } from "react-router-dom";
import { ArrowRight, Inbox } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { SeverityBadge } from "@/components/shared/Badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { firstLine } from "@/lib/customer";

function subjectOf(c: { description?: string; category: string }): string {
  const line = firstLine(c.description ?? "").trim();
  return line.length > 0 ? line : c.category;
}

export default function IncomingComplaints() {
  const { data, isLoading } = useListCases({ status: "new" });
  const incoming = data?.cases ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Complaints"
        subtitle="Complaints just received from the Customer Dashboard — same case, same data, ready for ACAN investigation."
        actions={
          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">
            {incoming.length} awaiting intake
          </span>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : incoming.length === 0 ? (
        <EmptyState
          title="No incoming complaints"
          description="When a customer raises a complaint from the Customer Dashboard, it appears here instantly with its Case ID."
          action={
            <Link to="/customer/raise">
              <Button size="sm">Try the Customer flow</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {incoming.map((c) => (
            <div key={c.id} className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  <Inbox className="h-3 w-3" />
                  New Complaint Received
                </span>
                <SeverityBadge severity={c.severity} className="ml-auto" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                <Info k="Case" v={c.case_number} strong />
                <Info k="Customer" v={c.customer_name} />
                <Info k="Category" v={c.category} />
                <Info k="Priority" v={c.severity.toUpperCase()} />
              </div>
              <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600">
                {subjectOf(c)}
              </p>
              <Link
                to={`/business/cases/${c.id}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:from-cyan-700 hover:to-blue-700"
              >
                Open Case
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{k}</div>
      <div className={`truncate text-slate-800 ${strong ? "font-bold" : ""}`}>{v}</div>
    </div>
  );
}
