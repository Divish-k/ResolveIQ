import { useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOperator } from "@/context/operator";
import { useEnsureSeed } from "@/lib/api";
import { BrandMark, NavLinks, SidebarFooter } from "./Navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/submit": "New Complaint",
  "/cases": "My Cases",
  "/investigation": "Investigation",
  "/evidence": "Evidence",
  "/analytics": "Analytics",
  "/help": "Help",
};

function titleFor(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/cases/")) return "Investigation Case";
  return "ResolveIQ";
}

function TopBar() {
  const { operator } = useOperator();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 backdrop-blur md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="navy-ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar p-4 text-sidebar-foreground">
          <SheetTitle className="sr-only">ResolveIQ navigation</SheetTitle>
          <div className="flex items-center gap-3 px-2 pb-6 pt-2">
            <BrandMark />
            <div>
              <div className="text-base font-semibold text-white">ResolveIQ</div>
              <div className="text-[11px] text-sidebar-foreground/50">
                Support shouldn't guess.
              </div>
            </div>
          </div>
          <NavLinks onNavigate={() => setMobileOpen(false)} />
          <div className="h-6" />
          <SidebarFooter />
        </SheetContent>
      </Sheet>

      <h1 className="text-base font-semibold text-white md:text-lg">
        {titleFor(useLocation().pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <form
          className="relative hidden md:block"
          onSubmit={(e) => {
            e.preventDefault();
            if (search.trim()) navigate(`/cases?search=${encodeURIComponent(search.trim())}`);
          }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case, order, customer…"
            className="h-9 w-64 rounded-full border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/40"
          />
        </form>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
            <span className="bg-success relative inline-flex h-2 w-2 rounded-full" />
          </span>
          <span className="text-xs font-medium text-white/80">Demo Mode</span>
        </div>
        <div className="bg-gradient-primary hidden h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white sm:flex">
          {operator?.name
            ? operator.name
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : "OP"}
        </div>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const { operator } = useOperator();
  const location = useLocation();
  const [params] = useSearchParams();
  // Deep-link demo mode: `?demo=true` renders the workspace with a transient
  // operator so the hackathon demo can be reached directly. Normal users sign in.
  const authed = Boolean(operator) || params.get("demo") === "true";
  // Ensure the demo dataset exists in Enter Cloud (idempotent; runs once).
  useEnsureSeed();

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col border-r border-sidebar-border px-4 py-5 md:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandMark />
          <div>
            <div className="text-base font-semibold tracking-tight text-white">
              Resolve<span className="text-primary-glow">IQ</span>
            </div>
            <div className="text-[11px] text-sidebar-foreground/50">
              Causal Arbitration
            </div>
          </div>
        </div>
        <div className="h-8" />
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
