import { useState } from "react";
import { toast } from "sonner";
import { Save, ShieldCheck, UserRound } from "lucide-react";
import { useCustomer } from "@/context/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CustomerProfile() {
  const { customer, updateCustomer } = useCustomer();
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);

  const save = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    updateCustomer({ name: name.trim(), email: email.trim() });
    toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          The identity you use to raise and track complaints.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white">
            {customer.name
              .split(/\s+/)
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">{customer.name}</div>
            <div className="text-sm text-slate-500">{customer.email}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] text-slate-600">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] text-slate-600">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" onClick={save}>
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-[13px] leading-relaxed text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
        <span>
          ResolveIQ keeps your data in a single shared case workspace. Your
          complaint and its status are visible to the business team who investigates
          it — and everything stays on your case ID.
        </span>
      </div>
    </div>
  );
}
