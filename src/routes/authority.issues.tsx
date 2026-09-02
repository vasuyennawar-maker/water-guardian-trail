import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "@/layouts/PageLayout";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { AIAnalysisCard } from "@/components/common/AIAnalysisCard";
import { CardListSkeleton, ErrorState } from "@/components/common/States";
import { FilterPanel } from "@/components/common/FilterPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAsync } from "@/hooks/useAsync";
import { issueService } from "@/services/api/issueService";
import { userService } from "@/services/api/userService";
import { relativeAge } from "@/utils/format";
import { toast } from "sonner";

export const Route = createFileRoute("/authority/issues")({
  head: () => ({
    meta: [
      { title: "Issue Management — Digital Water Genome Nashik" },
      { name: "description", content: "Review, assign, act on and resolve verified water body issues with evidence at every step." },
      { property: "og:title", content: "Issue Management — Digital Water Genome Nashik" },
      { property: "og:description", content: "Review, assign, act on and resolve verified water body issues with evidence at every step." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IssueManagement,
});

function IssueManagement() {
  const [filters, setFilters] = useState<Record<string, string>>({ status: "all", severity: "all" });
  const { data, loading, error, retry, offline } = useAsync(
    () => issueService.list({ status: filters["status"] as never, severity: filters["severity"] as never, sort: "severity" }),
    [filters["status"], filters["severity"]]);
  const depts = useAsync(() => userService.departments(), []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dept, setDept] = useState("");

  return (
    <PageLayout allow={["authority","admin"]} title="Issue management" lead="View, assign, act, resolve — each step is recorded on the public trail.">
      <div className="mb-5">
        <FilterPanel values={filters} onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onReset={() => setFilters({ status: "all", severity: "all" })}
          filters={[
            { key: "status", label: "Status", options: [{ value: "all", label: "All statuses" }, { value: "verified", label: "Verified" }, { value: "assigned", label: "Assigned" }, { value: "in_progress", label: "In progress" }, { value: "resolved", label: "Resolved" }] },
            { key: "severity", label: "Severity", options: [{ value: "all", label: "All severities" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }] },
          ]} />
      </div>

      {loading ? <CardListSkeleton rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}

      <div className="grid gap-4">
        {(data ?? []).map((i) => (
          <article key={i.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="data-mono text-muted-foreground">{i.id} · {relativeAge(i.reportedAt)}</p>
                <h2 className="mt-1 text-base font-semibold">{i.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{i.waterBodyName} · {i.locationLabel}</p>
              </div>
              <div className="flex flex-col items-end gap-2"><StatusBadge status={i.status} size="sm" /><SeverityBadge severity={i.severity} /></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{i.description}</p>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {i.evidence.map((e) => <li key={e.id}><img src={e.url} alt={e.caption ?? "Evidence"} loading="lazy" className="h-20 w-full rounded-[6px] border border-border object-cover" /></li>)}
            </ul>
            {i.ai ? <div className="mt-4"><AIAnalysisCard assessment={i.ai} /></div> : null}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button asChild variant="outline" className="rounded-[6px]"><Link to="/reports/$id" params={{ id: i.id }}>View</Link></Button>
              <Button className="rounded-[6px]" onClick={() => setOpenId(openId === i.id ? null : i.id)}>{openId === i.id ? "Close panel" : "Assign / Act / Resolve"}</Button>
              {i.assignedDepartment ? <span className="self-center text-xs text-muted-foreground">Assigned to {i.assignedDepartment}</span> : null}
            </div>

            {openId === i.id ? (
              <div className="mt-4 grid gap-3 rounded-[6px] border border-border bg-muted/40 p-4">
                <div>
                  <label className="text-xs font-medium">Assign to department</label>
                  <Select value={dept} onValueChange={setDept}>
                    <SelectTrigger className="mt-1 h-9 rounded-[6px] bg-card" aria-label="Assign department"><SelectValue placeholder="Select a department" /></SelectTrigger>
                    <SelectContent>{(depts.data ?? []).map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium" htmlFor={`n-${i.id}`}>Action note</label>
                  <Textarea id={`n-${i.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 rounded-[6px] bg-card" placeholder="What is being done, by whom, and when?" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-[6px]" onClick={async () => { await issueService.assign(i.id, dept); toast.success("Issue assigned"); }} disabled={!dept}>Assign</Button>
                  <Button size="sm" variant="outline" className="rounded-[6px]" onClick={async () => { await issueService.act(i.id, note); toast.success("Action recorded"); }} disabled={!note}>Record action</Button>
                  <Button size="sm" variant="outline" className="rounded-[6px]" onClick={async () => { await issueService.resolve(i.id, note); toast.success("Issue resolved"); retry(); }}>Resolve issue</Button>
                </div>
                <p className="text-xs text-muted-foreground">Resolution requires closure evidence in production; this prototype records the note only.</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </PageLayout>
  );
}
