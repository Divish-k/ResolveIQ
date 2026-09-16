import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AnalyticsData,
  AuditEntry,
  CaseDetail,
  CaseListItem,
  CaseRow,
  Settings,
} from "./types";

async function call<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("resolveiq-api", {
    body: { action, ...body },
  });
  if (error) {
    throw new Error(`ResolveIQ API (${action}): ${error.message}`);
  }
  const payload = data as { error?: string } | null;
  if (payload?.error) {
    throw new Error(payload.error);
  }
  return data as T;
}

// ── Queries ──────────────────────────────────────────────────────────────────
export const useListCases = (filters?: { status?: string; search?: string }) =>
  useQuery({
    queryKey: ["cases", filters?.status ?? "all", filters?.search ?? ""],
    queryFn: () =>
      call<{ cases: CaseListItem[]; settings: Settings }>("list-cases", filters ?? {}),
  });

export const useCaseDetail = (id: string) =>
  useQuery({
    queryKey: ["case", id],
    queryFn: () => call<CaseDetail>("get-case", { id }),
    enabled: Boolean(id),
  });

export const useAnalytics = () =>
  useQuery({
    queryKey: ["analytics"],
    queryFn: () => call<AnalyticsData>("analytics"),
  });

export const useEnsureSeed = () => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["seed"],
    queryFn: () => call<{ seeded?: boolean; skipped?: boolean; existing?: number }>("seed"),
    staleTime: Infinity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};

export const useActivity = () =>
  useQuery({
    queryKey: ["activity"],
    queryFn: () =>
      call<{
        audit: AuditEntry[];
        cases: Record<string, { id: string; case_number: string; customer_name: string }>;
      }>("list-audit"),
  });

// ── Mutations ────────────────────────────────────────────────────────────────
export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      call<{ case: CaseRow; case_number: string; scenario: string }>("create-case", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useRunInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => call("run-investigation", { caseId }),
    onSuccess: (_data, caseId) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useVerifyEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => call("verify-evidence", { caseId }),
    onSuccess: (_data, caseId) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useArbitrate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => call("arbitrate", { caseId }),
    onSuccess: (_data, caseId) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useExecuteAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { caseId: string; actionType?: string }) =>
      call("execute-action", args),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ["case", args.caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useVerifyResolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => call("verify-resolution", { caseId }),
    onSuccess: (_data, caseId) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useEscalate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { caseId: string; reason?: string }) => call("escalate", args),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ["case", args.caseId] });
      qc.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}
