import { useAnalytics } from "@/lib/api";
import { PageHeader } from "@/components/shared/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  new: "#0ea5e9",
  investigating: "#6366f1",
  verifying: "#f59e0b",
  arbitrating: "#8b5cf6",
  resolving: "#06b6d4",
  resolved: "#10b981",
  escalated: "#f43f5e",
};

export default function Analytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const statusData = Object.entries(data.statusCounts).map(([name, count]) => ({
    name: label(name),
    count,
    color: STATUS_COLORS[name] ?? "#94a3b8",
  }));

  const typeData = Object.entries(data.resolutionTypes).map(([name, count]) => ({
    name: typeLabel(name),
    count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Operational intelligence across the ACAN pipeline — resolution performance, confidence and evidence conflicts."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Avg confidence" value={`${data.avgConfidence}%`} sub={`threshold ${data.threshold}%`} tone="text-cyan-600" />
        <Tile label="Avg investigation time" value={formatMin(data.avgInvestigationTime)} sub="intake → decision" tone="text-violet-600" />
        <Tile label="Escalated cases" value={data.escalatedCount} sub="human review required" tone="text-rose-600" />
        <Tile label="Evidence conflicts" value={data.evidenceConflicts} sub={`${data.evidenceStatus.verified ?? 0} verified · ${data.evidenceStatus.disputed ?? 0} disputed`} tone="text-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Cases by status">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                stroke="none"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {statusData.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.name} · {s.count}
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Resolution types executed">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(14,165,233,0.06)" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#0ea5e9" maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Confidence distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.confidenceBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.06)" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#6366f1" maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-400">
            Decisions below the {data.threshold}% threshold are escalated rather than auto-resolved.
          </p>
        </ChartCard>

        <ChartCard title="Evidence verification state">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={[
                  { name: "Verified", value: data.evidenceStatus.verified ?? 0, color: "#10b981" },
                  { name: "Contradicted", value: data.evidenceStatus.contradicted ?? 0, color: "#f43f5e" },
                  { name: "Disputed", value: data.evidenceStatus.disputed ?? 0, color: "#f59e0b" },
                  { name: "Pending", value: data.evidenceStatus.pending ?? 0, color: "#94a3b8" },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {[
                  { color: "#10b981" },
                  { color: "#f43f5e" },
                  { color: "#f59e0b" },
                  { color: "#94a3b8" },
                ].map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[
              { name: "Verified", value: data.evidenceStatus.verified ?? 0, color: "#10b981" },
              { name: "Contradicted", value: data.evidenceStatus.contradicted ?? 0, color: "#f43f5e" },
              { name: "Disputed", value: data.evidenceStatus.disputed ?? 0, color: "#f59e0b" },
              { name: "Pending", value: data.evidenceStatus.pending ?? 0, color: "#94a3b8" },
            ].map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                {s.name} · {s.value}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function label(status: string): string {
  const map: Record<string, string> = {
    new: "New",
    investigating: "Investigating",
    verifying: "Verification",
    arbitrating: "Arbitration",
    resolving: "Resolving",
    resolved: "Resolved",
    escalated: "Escalated",
  };
  return map[status] ?? status;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    refund: "Refund",
    redispatch: "Re-dispatch",
    replacement: "Replacement",
    notify_customer: "Notify",
    update_ticket: "Ticket",
  };
  return map[type] ?? type;
}

function formatMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function Tile({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone: string }) {
  return (
    <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
      <div className={cn("text-3xl font-bold tracking-tight", tone)}>{value}</div>
      <div className="mt-1 text-[13px] font-medium text-slate-600">{label}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-5">
      <div className="mb-4 text-sm font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}
