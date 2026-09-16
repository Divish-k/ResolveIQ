import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Fingerprint, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOperator } from "@/context/operator";
import { BrandMark } from "@/components/layout/Navigation";
import type { Operator } from "@/lib/types";

const ROLES = [
  "Support Agent",
  "Dispute Analyst",
  "Team Lead",
  "Hackathon Judge",
];

export default function Login() {
  const { signIn } = useOperator();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex.morgan@resolveiq.demo");
  const [role, setRole] = useState(ROLES[0]);
  const [entering, setEntering] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const enterDemo = () => {
    setEntering(true);
    const operator: Operator = { name: name.trim() || "Demo Operator", email, role };
    // small delay for effect
    window.setTimeout(() => {
      signIn(operator);
      navigate(from, { replace: true });
    }, 450);
  };

  return (
    <div className="bg-gradient-subtle relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Decorative grid + glows */}
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
            ACAN — Autonomous Causal Arbitration Architecture. ResolveIQ
            reconstructs what actually happened across enterprise systems,
            verifies evidence, arbitrates against policy and proves the
            resolution succeeded.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Understand", "Investigate", "Reconstruct", "Verify", "Arbitrate", "Resolve", "Verify"].map(
              (s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200"
                >
                  {i + 1}. {s}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Right: login card */}
        <div className="bg-card shadow-card w-full rounded-2xl border border-slate-200/80 p-8">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
              <Sparkles className="h-3 w-3" />
              Microsoft Hackathon 2026
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Enterprise support operations console — demo workspace.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[13px] text-slate-600">
                Full name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] text-slate-600">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-slate-600">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
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
              className="bg-gradient-primary w-full hover:opacity-90"
              size="lg"
              onClick={enterDemo}
              disabled={entering}
            >
              {entering ? (
                <Fingerprint className="h-4 w-4 animate-pulse" />
              ) : (
                <Fingerprint className="h-4 w-4" />
              )}
              {entering ? "Entering demo workspace…" : "Demo access"}
              {!entering && <ArrowRight className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              simulated auth for the live demo · no credentials required
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
