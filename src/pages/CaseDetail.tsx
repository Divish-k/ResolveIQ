import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useCaseDetail, useRunInvestigation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseHeader } from "@/components/case/CaseHeader";
import { WorkflowStepper } from "@/components/case/WorkflowStepper";
import { AgentsPanel } from "@/components/case/AgentsPanel";
import { CausalTimeline } from "@/components/case/CausalTimeline";
import { EvidencePanel } from "@/components/case/EvidencePanel";
import { DecisionPanel } from "@/components/case/DecisionPanel";
import { HistoryPanel } from "@/components/case/HistoryPanel";
import { OverviewPanel } from "@/components/case/OverviewPanel";

function smartDefaultTab(stage: string): string {
  switch (stage) {
    case "understand":
    case "investigate":
      return "investigation";
    case "verify":
      return "evidence";
    case "arbitrate":
      return "decision";
    case "resolved":
    case "verify_resolution":
      return "decision";
    case "escalated":
      return "decision";
    default:
      return "overview";
  }
}

const TABS = ["overview", "investigation", "timeline", "evidence", "decision", "history"];

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { data, isLoading, isError, refetch } = useCaseDetail(id ?? "");
  const runInv = useRunInvestigation();
  const [tab, setTab] = useState("overview");
  const tabParam = params.get("tab") ?? "";

  useEffect(() => {
    if (data)
      setTab(
        TABS.includes(tabParam)
          ? tabParam
          : smartDefaultTab(data.case.stage),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.case.id, tabParam]);

  // Auto-start the ACAN investigation when arriving from the complaint form.
  useEffect(() => {
    if (!data) return;
    const autoStart = params.get("autostart") === "1";
    const isFresh = data.case.stage === "understand" && data.findings.length === 0;
    if (autoStart && isFresh && !runInv.isPending) {
      runInv.mutate(data.case.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.case.id, data?.findings.length, params]);

  const hasDecision = Boolean(data?.decision);
  const conflictCount = useMemo(
    () => data?.evidence.filter((e) => e.status === "contradicted").length ?? 0,
    [data?.evidence],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/80 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-rose-500" />
        <p className="mt-2 text-sm font-medium text-rose-700">
          Could not load case. It may not exist.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { case: c, evidence, timeline, findings, actions, audit } = data;

  return (
    <div className="space-y-5">
      <Button variant="navy-ghost" size="sm" className="-mb-1 -ml-2" onClick={() => history.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <CaseHeader caseRow={c} />
      <WorkflowStepper stage={c.stage} escalated={c.escalated} />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-11 w-full justify-start overflow-x-auto bg-white/10 text-white/60">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="timeline">Causal Timeline</TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence{conflictCount > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-600">
                {conflictCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="decision">
            Decision{hasDecision ? " ✓" : ""}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel detail={data} />
        </TabsContent>

        <TabsContent value="investigation">
          <AgentsPanel caseId={c.id} findings={findings} />
        </TabsContent>

        <TabsContent value="timeline">
          <CausalTimeline events={timeline} />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidencePanel caseId={c.id} evidence={evidence} canVerify={c.status === "verifying"} />
        </TabsContent>

        <TabsContent value="decision">
          <DecisionPanel detail={data} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryPanel audit={audit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
