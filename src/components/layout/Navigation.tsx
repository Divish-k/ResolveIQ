import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ClipboardPlus,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperator } from "@/context/operator";
import { initials } from "@/lib/format";

// eslint-disable-next-line react-refresh/only-export-components
export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/submit", label: "New Complaint", icon: ClipboardPlus },
  { to: "/cases", label: "My Cases", icon: FolderKanban },
  { to: "/investigation", label: "Investigation", icon: Activity },
  { to: "/evidence", label: "Evidence", icon: Scale },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/help", label: "Help", icon: HelpCircle },
];

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      className={cn(
        "bg-gradient-primary shadow-glow flex shrink-0 items-center justify-center rounded-lg text-white",
        size === "lg" ? "h-12 w-12" : "h-9 w-9",
      )}
    >
      <ShieldCheck className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </div>
  );
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-white shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive ? "text-primary-glow" : "text-sidebar-foreground/50 group-hover:text-primary-glow",
                )}
              />
              <span>{label}</span>
              {isActive && (
                <span className="bg-primary-glow ml-auto h-5 w-1 rounded-full shadow-glow" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function SidebarFooter() {
  const { operator, signOut } = useOperator();
  const navigate = useNavigate();
  return (
    <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
      <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-glow">
          ACAN Architecture
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-sidebar-foreground/60">
          Understand → Investigate → Reconstruct → Verify → Arbitrate →
          Resolve → Verify Resolution
        </div>
      </div>
      <div className="flex items-center gap-3 px-1">
        <div className="bg-gradient-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
          {operator ? initials(operator.name) : "OP"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">
            {operator?.name ?? "Operator"}
          </div>
          <div className="truncate text-[11px] text-sidebar-foreground/50">
            {operator?.role ?? "Support Agent"}
          </div>
        </div>
        <button
          onClick={() => {
            signOut();
            navigate("/login");
          }}
          className="rounded-md p-1.5 text-sidebar-foreground/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
