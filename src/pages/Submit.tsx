import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useCreateCase } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/StatCard";
import { toast } from "sonner";

const CATEGORIES = [
  "Delivery — Order Not Received",
  "Wrong Item Received",
  "Payment — Double Charge",
  "Billing — Unexpected Charge",
  "Delivery — Not Received (Signed POD)",
  "Damaged on Arrival",
];

const SEVERITIES = ["low", "medium", "high", "critical"];

const DEMO_COMPLAINT = {
  customerName: "Priya Sharma",
  customerEmail: "priya.sharma@example.com",
  customerPhone: "+91 99002 88765",
  orderId: "ORD-88213",
  merchant: "FreshMart Metro",
  category: "Delivery — Order Not Received",
  description:
    "Customer ordered grocery delivery. Driver has been stationary for a long period and dairy products may be at risk. Customer claims the order was marked delivered but was not received.",
  incidentAt: "2026-09-14T11:35",
  location: "Andheri West, Mumbai",
  severity: "high",
};

export default function Submit() {
  const navigate = useNavigate();
  const create = useCreateCase();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    orderId: "",
    merchant: "",
    category: "",
    description: "",
    incidentAt: new Date().toISOString().slice(0, 16),
    location: "",
    severity: "medium",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const loadDemo = () =>
    setForm((f) => ({
      ...f,
      ...DEMO_COMPLAINT,
      incidentAt: "2026-09-14T11:35",
    }));

  const submit = () => {
    const missing = [
      form.customerName,
      form.customerEmail,
      form.orderId,
      form.category,
      form.description,
      form.incidentAt,
    ].some((v) => !v.trim());
    if (missing) {
      toast.error("Please complete the required fields.");
      return;
    }
    create.mutate(
      { ...form, incidentAt: new Date(form.incidentAt).toISOString() },
      {
        onSuccess: (data) => {
          toast.success(`Case ${data.case_number} created — investigation starting.`);
          navigate(`/cases/${data.case.id}?autostart=1`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const previewValid = form.customerName && form.orderId && form.category;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Complaint"
        subtitle="Log a customer complaint. ResolveIQ creates a case and routes it into the ACAN investigation workflow."
        actions={
          <Button variant="outline" onClick={loadDemo}>
            <Sparkles className="h-4 w-4 text-cyan-600" />
            Load demo complaint
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="bg-card shadow-card rounded-xl border border-slate-200/80 p-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name *">
              <Input value={form.customerName} onChange={set("customerName")} placeholder="e.g. Priya Sharma" />
            </Field>
            <Field label="Customer email *">
              <Input type="email" value={form.customerEmail} onChange={set("customerEmail")} placeholder="customer@example.com" />
            </Field>
            <Field label="Phone">
              <Input value={form.customerPhone} onChange={set("customerPhone")} placeholder="+91 …" />
            </Field>
            <Field label="Order ID *">
              <Input value={form.orderId} onChange={set("orderId")} placeholder="e.g. ORD-88213" />
            </Field>
            <Field label="Merchant">
              <Input value={form.merchant} onChange={set("merchant")} placeholder="e.g. FreshMart Metro" />
            </Field>
            <Field label="Complaint category *">
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Incident date & time *">
              <Input
                type="datetime-local"
                value={form.incidentAt}
                onChange={set("incidentAt")}
              />
            </Field>
            <Field label="Severity">
              <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location" className="sm:col-span-2">
              <Input value={form.location} onChange={set("location")} placeholder="City / area" />
            </Field>
            <Field label="Complaint description *" className="sm:col-span-2">
              <Textarea
                rows={5}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe what happened, what the customer expects, and any supporting details."
              />
            </Field>
            <Field label="Supporting evidence notes" className="sm:col-span-2">
              <Textarea
                rows={3}
                placeholder="Links, receipts, photos, timestamps the customer provided…"
                value={form.evidenceNotes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, evidenceNotes: e.target.value }))}
              />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/cases")}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-primary"
              size="lg"
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {create.isPending ? "Creating case…" : "Submit & start investigation"}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-gradient-subtle rounded-xl border border-white/10 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Case preview
            </div>
            {previewValid ? (
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <Row k="Customer" v={form.customerName} />
                <Row k="Order" v={form.orderId} />
                <Row k="Category" v={form.category} />
                <Row k="Severity" v={form.severity} />
                <Row k="Location" v={form.location || "—"} />
                <p className="mt-3 line-clamp-4 rounded-lg bg-white/5 p-3 text-[13px] leading-relaxed text-white/70">
                  {form.description || "Complaint description will appear here."}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/50">
                Fill in the required fields to see a preview. Try{" "}
                <button className="text-cyan-300 underline" onClick={loadDemo}>
                  loading the demo complaint
                </button>{" "}
                for the full live walkthrough.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-cyan-200/30 bg-cyan-500/5 p-4 text-[13px] leading-relaxed text-white/70">
            After submission, the six ACAN agents investigate across simulated
            Order, Payment, Merchant, Logistics, GPS, Weather and Communication
            systems — no external APIs required.
          </div>
        </div>
      </div>
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1.5">
      <span className="text-[11px] uppercase tracking-wider text-white/40">{k}</span>
      <span className="max-w-[60%] truncate font-medium text-white">{v}</span>
    </div>
  );
}
