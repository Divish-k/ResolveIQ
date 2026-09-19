import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CustomerIdentity } from "@/lib/types";

const STORAGE_KEY = "resolveiq_customer";

const DEFAULT_IDENTITY: CustomerIdentity = {
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  joinedAt: new Date().toISOString(),
};

interface CustomerContextValue {
  customer: CustomerIdentity;
  updateCustomer: (patch: Partial<Pick<CustomerIdentity, "name" | "email">>) => void;
  isDemoIdentity: boolean;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

function readStored(): CustomerIdentity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CustomerIdentity;
  } catch {
    // fall through to default
  }
  return DEFAULT_IDENTITY;
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerIdentity>(() => readStored());

  const value = useMemo<CustomerContextValue>(
    () => ({
      customer,
      isDemoIdentity: customer.email.toLowerCase() === "priya.sharma@example.com",
      updateCustomer: (patch) => {
        const next = { ...customer, ...patch };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setCustomer(next);
      },
    }),
    [customer],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
