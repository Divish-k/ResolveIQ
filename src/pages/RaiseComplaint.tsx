import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, PlusCircle } from "lucide-react";
import { useCreateCase } from "@/lib/api";
import { useCustomer } from "@/context/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CUSTOMER_CATEGORIES, PREFERRED_RESOLUTIONS, priorityForCategory } from "@/lib/customer";
import type { CreateCaseResponse } from "@/lib/types";

export default function RaiseComplaint() {
  const { customer } = useCustomer();
  const navigate = useNavigate();
  const create = useCreateCase();
  const [created, setCreated] = useState<CreateCaseResponse | null>(null);

  const [form, setForm] = useState({
    category: "",
    subject: "",
    description: "",
    orderId: "",
    incidentAt: new Date().toISOString().slice(0, 16),
    location: "",
    preferredResolution: "",
    evidence: "",
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    if (!form.category || !form.subject.trim() || !form.description.trim() || !form.orderId.trim()) {
      toast.error("Please complete the required fields.");
      return;
    }
    const fullDescription = [
      form.subject.trim(),
      form.description.trim(),
      form.preferredResolution ? `Preferred resolution: ${form.preferredResolution}` : null,
      form.evidence.trim() ? `Additional information: ${form.evidence.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    create.mutate(
      {
        customerName: customer.name,
        customerEmail: customer.email,
        orderId: form.orderId.trim(),
        merchant: null,
        category: form.category,
        description: fullDescription,
        incidentAt: new Date(form.incidentAt).toISOString(),
        location: form.location.trim() || null,
        severity: priorityForCategory(form.category),
      },
      {
        onSuccess: (res) => setCreated(res),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (created) {
    const qwen = created.qwen?.result;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="bg-card rounded-2xl border border-emerald-200 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Complaint Submitted
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your complaint has been received by ResolveIQ.
          </p>
          <p className="text-sm text-slate-600">Your investigation has started.</p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 py-5">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Your Case ID
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-cyan-700">
              {created.case_number}
            </div>
          </div>

          {qwen?.customer_message && (
            <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
                </span>
                Powered by Qwen
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                {qwen.customer_message}
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={`/customer/track/${created.case.id}`}>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">
                Track My Case
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" onClick={() => navigate("/customer/complaints")}>
              My Complaints
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Raise a Complaint</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us what went wrong. ResolveIQ will investigate and keep you updated.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Complaint Category *">
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Subject *">
            <Input value={form.subject} onChange={set("subject")} placeholder="e.g. Package marked delivered but not received" />
          </Field>

          <Field label="Description *" className="sm:col-span-2">
            <Textarea
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe what happened in as much detail as you can."
            />
          </Field>

          <Field label="Order / Transaction ID *">
            <Input value={form.orderId} onChange={set("orderId")} placeholder="e.g. ORD-88213" />
          </Field>

          <Field label="Date of Incident *">
            <Input type="datetime-local" value={form.incidentAt} onChange={set("incidentAt")} />
          </Field>

          <Field label="Location">
            <Input value={form.location} onChange={set("location")} placeholder="City / area" />
          </Field>

          <Field label="Preferred Resolution">
            <Select
              value={form.preferredResolution}
              onValueChange={(v) => setForm((f) => ({ ...f, preferredResolution: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="How would you like this resolved?" />
              </SelectTrigger>
              <SelectContent>
                {PREFERRED_RESOLUTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Evidence / Additional Information" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.evidence}
              onChange={set("evidence")}
              placeholder="Receipt numbers, screenshots, tracking details, anything that helps."
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            className="bg-gradient-to-r from-cyan-600 to-blue-600"
            size="lg"
            onClick={submit}
            disabled={create.isPending}
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {create.isPending ? "Submitting…" : "Submit Complaint"}
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Your complaint is submitted as {customer.name} · {customer.email}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-[13px] text-slate-600">{label}</Label>
      {children}
    </div>
  );
}
