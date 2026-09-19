import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Building2, Fingerprint, Scale, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOperator } from "@/context/operator";
import { useCustomer } from "@/context/customer";
import { BrandMark } from "@/components/layout/Navigation";
import { cn } from "@/lib/utils";

const ROLES = ["Support Agent", "Dispute Analyst", "Team Lead", "Hackathon Judge"];

export default function Login() {
  const { signIn } = useOperator();
  const { customer, updateCustomer } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const roleParam = params.get("role");

  const [tab, setTab] = useState<"customer" | "company">(
    roleParam === "company" ? "company" : "customer",
  );

  // Customer fields
  const [custName, setCustName] = useState(customer.name);
  const [custEmail, setCustEmail] = useState(customer.email);

  // Company fields
  const [opName, setOpName] = useState("Alex Morgan");
  const [opEmail, setOpEmail] = useState("alex.morgan@resolveiq.demo");
  const [opRole, setOpRole] = useState(ROLES[0]);

  const [entering, setEntering] = useState(false);
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (roleParam === "customer") setTab("customer");
    if (roleParam === "company") setTab("company");
  }, [roleParam]);

  const enterCustomer = () => {
    if (!custName.trim() || !custEmail.trim()) return;
    setEntering(true);
    window.setTimeout(() => {
      updateCustomer({ name: custName.trim(), email: custEmail.trim() });
      navigate("/customer", { replace: true });
    }, 350);
  };

  const enterCompany = () => {
    setEntering(true);
    window.setTimeout(() => {
      signIn({ name: opName.trim() || "Demo Operator", email: opEmail, role: opRole });
      navigate(from ?? "/business", { replace: true });
    }, 350);
  };

  return (
    <div className="bg-gradient-subtle relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(199 92% 60% / 0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(199 92% 60% / 0.18) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-8%] h-[380px] w-[380px] rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="relative grid w-full max-w-4xl gap-10 lg:grid-cols-2">
        {/* Left: brand + value prop */}
        <div className="hidden flex-col justify-center lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark size="lg" />
            <div className="text-2xl font-bold tracking-tight text-white">
              Resolve<span className="text-primary-glow">IQ</span>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight text-white">
            Support shouldn't guess.
            <br />
            <span className="text-gradient">Support should investigate.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Customers raise complaints. Companies investigate them with the ACAN
            multi-agent engine and Qwen intelligence — one shared case, from
            complaint to verified resolution.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Customer raises", "ACAN investigates", "Qwen synthesizes", "Resolved"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Right: role login */}
        <div className="bg-card shadow-card w-full rounded-2xl border border-slate-200/80 p-8">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Sign in to ResolveIQ</h2>
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
              Build Bengaluru · Demo
            </span>
          </div>

          {/* Role selector */}
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
            <button
              onClick={() => setTab("customer")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                tab === "customer" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <UserRound className="h-4 w-4" />
              Customer
            </button>
            <button
              onClick={() => setTab("company")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                tab === "company" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Building2 className="h-4 w-4" />
              Company
            </button>
          </div>

          {/* Customer form */}
          {tab === "customer" ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-500">
                Raise and track your complaints. Enter the name and email you used to raise them.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="cname" className="text-[13px] text-slate-600">
                  Full name
                </Label>
                <Input id="cname" value={custName} onChange={(e) => setCustName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cemail" className="text-[13px] text-slate-600">
                  Email
                </Label>
                <Input
                  id="cemail"
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
                size="lg"
                onClick={enterCustomer}
                disabled={entering}
              >
                <UserRound className="h-4 w-4" />
                {entering ? "Entering…" : "Continue to Customer Dashboard"}
                {!entering && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="text-center text-[11px] text-slate-400">
                Demo access — no credentials required
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-500">
                Enterprise operations console for the company team — investigate and
                resolve complaints.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[13px] text-slate-600">
                  Full name
                </Label>
                <Input id="name" value={opName} onChange={(e) => setOpName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] text-slate-600">
                  Work email
                </Label>
                <Input id="email" type="email" value={opEmail} onChange={(e) => setOpEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-600">Role</Label>
                <Select value={opRole} onValueChange={setOpRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-slate-700 to-slate-900"
                size="lg"
                onClick={enterCompany}
                disabled={entering}
              >
                <Fingerprint className="h-4 w-4" />
                {entering ? "Entering…" : "Enter Business Dashboard"}
                {!entering && <ArrowRight className="h-4 w-4" />}
              </Button>
              <p className="text-center text-[11px] text-slate-400">
                Demo access — simulated company workspace
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Scale className="h-3.5 w-3.5" />
            One shared case · ACAN investigation · Qwen intelligence
          </div>
        </div>
      </div>
    </div>
  );
}
