import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { useListCases } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/shared/StatCard";
import { StatusBadge, SeverityBadge } from "@/components/shared/Badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "investigating", label: "Investigating" },
  { key: "verifying", label: "Verification" },
  { key: "arbitrating", label: "Arbitration" },
  { key: "resolving", label: "Resolving" },
  { key: "resolved", label: "Resolved" },
  { key: "escalated", label: "Escalated" },
];

export default function Cases() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status") ?? "all";
  const searchParam = params.get("search") ?? "";
  const [search, setSearch] = useState(searchParam);

  useEffect(() => setSearch(searchParam), [searchParam]);

  const { data, isLoading } = useListCases({
    status: status === "all" ? undefined : status,
    search: searchParam || undefined,
  });

  const cases = useMemo(() => data?.cases ?? [], [data]);

  const stats = useMemo(() => {
    const total = cases.length;
    const escalated = cases.filter((c) => c.escalated).length;
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const confidences = cases.map((c) => c.confidence).filter((c): c is number => c != null);
    const avg = confidences.length
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : null;
    return { total, escalated, resolved, avg };
  }, [cases]);

  const applyFilter = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === "all") next.delete("status");
    else next.set("status", key);
    setParams(next, { replace: true });
  };

  const applySearch = () => {
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("search", search.trim());
    else next.delete("search");
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cases"
        subtitle={`${stats.total} case${stats.total === 1 ? "" : "s"} · ${stats.resolved} resolved · ${stats.escalated} escalated · avg confidence ${stats.avg ?? "—"}%`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                placeholder="Search cases…"
                className="w-56 pl-9"
              />
            </div>
            <Button variant="outline" onClick={applySearch}>
              Search
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => applyFilter(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              status === f.key
                ? "border-cyan-500 bg-cyan-500 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card shadow-card overflow-hidden rounded-xl border border-slate-200/80">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <EmptyState
            title="No cases found"
            description="Try a different filter or submit a new complaint."
            action={
              <Link to="/submit">
                <Button size="sm">New Complaint</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-semibold">Case</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Category</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Confidence</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Updated</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => navigate(`/cases/${c.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{c.case_number}</td>
                    <td className="px-4 py-3.5 text-slate-600">{c.customer_name}</td>
                    <td className="px-4 py-3.5 font-mono text-[13px] text-slate-500">{c.order_id}</td>
                    <td className="hidden max-w-[220px] truncate px-4 py-3.5 text-slate-500 lg:table-cell">
                      {c.category}
                    </td>
                    <td className="px-4 py-3.5">
                      <SeverityBadge severity={c.severity} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                      {c.confidence != null ? `${Math.round(c.confidence)}%` : "—"}
                    </td>
                    <td className="hidden px-4 py-3.5 text-[13px] text-slate-400 md:table-cell">
                      {fmtDateTime(c.updated_at)}
                    </td>
                    <td className="pr-4">
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
