import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, FileText, LayoutDashboard, LogOut, Menu, PlusCircle, Scale, UserRound, Waypoints } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCustomer } from "@/context/customer";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/customer", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/customer/raise", label: "Raise Complaint", icon: PlusCircle },
  { to: "/customer/complaints", label: "My Complaints", icon: FileText },
  { to: "/customer/track", label: "Track Case", icon: Waypoints },
  { to: "/customer/notifications", label: "Notifications", icon: Bell },
  { to: "/customer/profile", label: "Profile", icon: UserRound },
];

function NavItems({ onNavigate, vertical = false }: { onNavigate?: () => void; vertical?: boolean }) {
  return (
    <nav className={cn("flex items-center", vertical ? "flex-col items-start gap-1" : "whitespace-nowrap")}>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SignOutButton({ className, onSignedOut }: { className?: string; onSignedOut?: () => void }) {
  const { signOut } = useCustomer();
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-2 text-slate-500 hover:text-rose-600", className)}
      onClick={() => {
        signOut();
        onSignedOut?.();
        navigate("/login?role=customer");
      }}
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}

export default function CustomerLayout() {
  const { customer } = useCustomer();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      {/* Full-viewport light backdrop so the navy body never shows at edges/gutter */}
      <div className="bg-slate-50 fixed inset-0 -z-10" />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4">
              <SheetTitle className="sr-only">Customer navigation</SheetTitle>
              <div className="flex items-center gap-2 px-2 pb-5 pt-2">
                <div className="bg-gradient-primary flex h-8 w-8 items-center justify-center rounded-lg text-white">
                  <Scale className="h-4 w-4" />
                </div>
                <span className="font-semibold text-slate-900">ResolveIQ</span>
              </div>
              <NavItems vertical onNavigate={() => setOpen(false)} />
              <div className="mt-6 border-t border-slate-100 pt-4">
                <SignOutButton onSignedOut={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-gradient-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white">
              <Scale className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold text-slate-900">
                Resolve<span className="text-cyan-600">IQ</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Customer Care
              </div>
            </div>
          </div>

          {/* Desktop nav — pushed right, followed by account */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <NavItems />
            <div className="mx-1 h-6 w-px shrink-0 bg-slate-200" />
            <div className="flex items-center gap-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
                {customer.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <SignOutButton className="px-2" />
            </div>
          </div>

          {/* Mobile account row */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
              {customer.name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <SignOutButton className="px-2" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-[11px] text-slate-400">
          <span>ResolveIQ — Intelligent Resolution. Verified by Evidence.</span>
          <span>Powered by Qwen</span>
        </div>
      </footer>
    </div>
  );
}
