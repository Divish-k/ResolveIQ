import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Operator } from "@/lib/types";

const STORAGE_KEY = "resolveiq_operator";

interface OperatorContextValue {
  operator: Operator | null;
  signIn: (operator: Operator) => void;
  signOut: () => void;
}

const OperatorContext = createContext<OperatorContextValue | null>(null);

function readStored(): Operator | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Operator) : null;
  } catch {
    return null;
  }
}

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(() => readStored());

  const value = useMemo<OperatorContextValue>(
    () => ({
      operator,
      signIn: (op) => {
        const withTime = { ...op, signedInAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withTime));
        setOperator(withTime);
      },
      signOut: () => {
        localStorage.removeItem(STORAGE_KEY);
        setOperator(null);
      },
    }),
    [operator],
  );

  return (
    <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOperator() {
  const ctx = useContext(OperatorContext);
  if (!ctx) throw new Error("useOperator must be used within OperatorProvider");
  return ctx;
}
