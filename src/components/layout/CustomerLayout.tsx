import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, FileText, LayoutDashboard, Menu, PlusCircle, Scale, UserRound, Waypoints } from "lucide-react";
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

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span className="hidden md:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
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
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4">
              <SheetTitle className="sr-only">Customer navigation</SheetTitle>
              <div className="flex items-center gap-2 px-2 pb-4 pt-2">
                <div className="bg-gradient-primary flex h-8 w-8 items-center justify-center rounded-lg text-white">
                  <Scale className="h-4 w-4" />
                </div>
                <span className="font-semibold text-slate-900">ResolveIQ</span>
              </div>
              <div className="flex flex-col items-start gap-1">
                <NavItems onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-lg text-white">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-slate-900">
                Resolve<span className="text-cyan-600">IQ</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Customer Care
              </div>
            </div>
          </div>

          <div className="ml-auto hidden lg:block">
            <NavItems />
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
              {customer.name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold text-slate-800">{customer.name}</div>
              <div className="text-[11px] text-slate-400">{customer.email}</div>
            </div>
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
