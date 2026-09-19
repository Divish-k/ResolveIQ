import { Link } from "react-router-dom";
import { ArrowRight, Building2, Scale, UserRound } from "lucide-react";
import { useOperator } from "@/context/operator";

export default function Entry() {
  const { operator } = useOperator();

  return (
    <div className="bg-gradient-subtle relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-10">
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

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary shadow-glow flex h-12 w-12 items-center justify-center rounded-xl text-white">
            <Scale className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-white">
            Resolve<span className="text-primary-glow">IQ</span>
          </div>
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold leading-tight text-white md:text-4xl">
          Intelligent Resolution. <span className="text-gradient">Verified by Evidence.</span>
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm leading-relaxed text-white/60">
          Resolve customer complaints through intelligent investigation, evidence
          verification and coordinated resolution — powered by Qwen.
        </p>

        <div className="mt-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-200">
          Qwen Understanding → ACAN Agents → Qwen Synthesis → Arbitration → Qwen Explanation
        </div>

        {/* Two options */}
        <div className="mt-10 grid w-full gap-6 md:grid-cols-2">
          <Link
            to="/customer"
            className="group bg-card shadow-card flex flex-col rounded-2xl border border-slate-200/80 p-8 transition-all hover:-translate-y-1 hover:border-cyan-300"
          >
            <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/5 flex h-14 w-14 items-center justify-center rounded-2xl text-cyan-600">
              <UserRound className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Customer</h2>
            <p className="mt-1 text-sm text-slate-500">
              Raise and track your complaint
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors group-hover:from-cyan-600 group-hover:to-blue-700">
              Enter Customer Dashboard
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to={operator ? "/business" : "/login"}
            className="group bg-card shadow-card flex flex-col rounded-2xl border border-slate-200/80 p-8 transition-all hover:-translate-y-1 hover:border-blue-300"
          >
            <div className="bg-gradient-to-br from-blue-500/15 to-indigo-500/5 flex h-14 w-14 items-center justify-center rounded-2xl text-blue-600">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Business</h2>
            <p className="mt-1 text-sm text-slate-500">
              Receive, investigate and resolve complaints
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors group-hover:from-slate-800 group-hover:to-black">
              Enter Business Dashboard
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>

        <p className="mt-10 text-center text-[11px] text-white/40">
          One deployment. Two experiences. A single shared case from complaint to verified resolution.
        </p>
      </div>
    </div>
  );
}
