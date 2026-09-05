import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { AIAnalysisCard } from "@/components/common/AIAnalysisCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { CardListSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { EvidenceUploader, type LocalEvidence } from "@/components/common/EvidenceUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAsync } from "@/hooks/useAsync";
import { useRole } from "@/hooks/useRole";
import { issueService } from "@/services/api/issueService";
import { userService } from "@/services/api/userService";
import { CATEGORY_LABEL, formatCoords, relativeAge } from "@/utils/format";
import type { Evidence, Issue, IssueCategory, Severity } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verification Queue — Digital Water Genome Nashik" },
      { name: "description", content: "Field verification queue: confirm, reject or request more information on reported water body issues." },
      { property: "og:title", content: "Verification Queue — Digital Water Genome Nashik" },
      { property: "og:description", content: "Field verification queue: confirm, reject or request more information on reported water body issues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationQueue,
});

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const CATEGORIES = Object.keys(CATEGORY_LABEL) as IssueCategory[];

type Decision = "verified" | "rejected" | "inconclusive";

function localToEvidence(items: LocalEvidence[]): Evidence[] {
  const at = new Date().toISOString();
  return items.map((f) => ({ id: f.id, url: f.url, caption: f.name, capturedAt: at }));
}

function QueueCard({
  issue,
  onStart,
  onVerify,
  onMoreInfo,
  onReject,
  onMap,
  completed,
}: {
  issue: Issue;
  onStart?: () => void;
  onVerify?: () => void;
  onMoreInfo?: () => void;
  onReject?: () => void;
  onMap?: () => void;
  completed?: boolean;
}) {
  return (
    <article className="surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="data-mono truncate text-muted-foreground">{issue.id} · {relativeAge(issue.reportedAt)}</p>
          <h2 className="mt-1 truncate text-sm font-semibold sm:text-base">{issue.title}</h2>
          <p className="data-mono mt-1 truncate text-muted-foreground">{issue.locationLabel} · {formatCoords(issue.location)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={issue.status} size="sm" />
          <SeverityBadge severity={issue.severity} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
      <p className="mt-1 text-xs text-muted-foreground">Category: {CATEGORY_LABEL[issue.category]}</p>
      {issue.evidence.length ? (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {issue.evidence.slice(0, 6).map((e) => (
            <li key={e.id}>
              <img src={e.url} alt={e.caption ?? "Evidence"} loading="lazy" className="h-16 w-full rounded-[6px] border border-border object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
      {issue.ai ? <div className="mt-3"><AIAnalysisCard assessment={issue.ai} /></div> : null}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        {completed ? null : onStart ? (
          <Button size="sm" className="rounded-[6px]" onClick={onStart}>Start verification</Button>
        ) : (
          <>
            <Button size="sm" className="rounded-[6px]" onClick={onVerify}>Complete field verification</Button>
            <Button size="sm" variant="outline" className="rounded-[6px]" onClick={onMoreInfo}>Request more information</Button>
            <Button size="sm" variant="ghost" className="rounded-[6px] text-destructive" onClick={onReject}>Reject</Button>
          </>
        )}
        <Button size="sm" variant="ghost" className="rounded-[6px]" onClick={onMap}>View on map</Button>
        <Button asChild size="sm" variant="ghost" className="ml-auto rounded-[6px]">
          <Link to="/reports/$id" params={{ id: issue.id }}>Open full report</Link>
        </Button>
      </div>
    </article>
  );
}

function VerificationQueue() {
  const navigate = useNavigate();
  const { user } = useRole();
  const verifierId = user?.id ?? "verifier";
  const verifierName = user?.name ?? "Field Verifier";
  const { data, loading, error, retry, offline } = useAsync(
    () => issueService.verificationQueue(verifierId),
    [verifierId],
  );
  const departments = useAsync(() => userService.departments(), []);

  const [active, setActive] = useState<{ issue: Issue; decision: Decision } | null>(null);
  const [visitedAt, setVisitedAt] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [cats, setCats] = useState<IssueCategory[]>([]);
  const [observations, setObservations] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [evidence, setEvidence] = useState<LocalEvidence[]>([]);
  const [department, setDepartment] = useState("");
  const [lab, setLab] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pending = data?.pending ?? [];
  const mine = data?.mine ?? [];
  const completed = data?.completed ?? [];

  function openModal(issue: Issue, decision: Decision) {
    setActive({ issue, decision });
    setVisitedAt(new Date().toISOString().slice(0, 16));
    setSeverity(issue.severity);
    setCats(issue.categories?.length ? issue.categories : [issue.category]);
    setObservations("");
    setLat(String(issue.location.lat));
    setLng(String(issue.location.lng));
    setEvidence([]);
    setDepartment(issue.ai?.suggestedDepartment ?? "");
    setLab(false);
    setRemarks("");
    setFormError(null);
  }

  function closeModal() {
    setActive(null);
    setFormError(null);
  }

  async function start(issue: Issue) {
    try {
      await issueService.startVerification(issue.id, verifierId, verifierName);
      toast.success(`${issue.id} moved to “Assigned to me”.`);
      retry();
    } catch {
      toast.error("Could not start verification. Please try again.");
    }
  }

  function viewOnMap(issue: Issue) {
    navigate({ to: "/map", search: { issue: issue.id } as never }).catch(() => {});
  }

  async function submit() {
    if (!active) return;
    const { issue, decision } = active;
    if (!visitedAt) return setFormError("Enter the date and time of your site visit.");
    if (!cats.length) return setFormError("Select at least one confirmed category.");
    if (!observations.trim()) return setFormError("Field observations are required.");
    const nLat = Number(lat), nLng = Number(lng);
    if (Number.isNaN(nLat) || Number.isNaN(nLng)) return setFormError("Corrected coordinates must be numbers.");
    if (decision === "verified" && evidence.length === 0) {
      return setFormError("Attach at least one site photo to verify a report.");
    }
    if (decision !== "verified" && evidence.length === 0 && observations.trim().length < 40) {
      return setFormError("Without photos, give a detailed reason of at least 40 characters.");
    }

    setSaving(true);
    setFormError(null);
    try {
      await issueService.recordVerification({
        issueId: issue.id,
        decision,
        visitedAt: new Date(visitedAt).toISOString(),
        waterBodyId: issue.waterBodyId,
        waterBodyName: issue.waterBodyName,
        confirmedSeverity: severity,
        confirmedCategories: cats,
        observations: observations.trim(),
        correctedLocation: { lat: nLat, lng: nLng },
        evidence: localToEvidence(evidence),
        ...(department ? { suggestedDepartment: department } : {}),
        labTestingRequested: lab,
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        verifierName,
        recordedAt: new Date().toISOString(),
      });
      toast.success(
        decision === "verified"
          ? `${issue.id} verified and sent to the department queue.`
          : decision === "rejected"
            ? `${issue.id} rejected with your field reason.`
            : `More information requested on ${issue.id}.`,
      );
      closeModal();
      retry();
    } catch {
      setFormError("Saving failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const emptyBlock = (title: string, description: string) => (
    <EmptyState icon={ClipboardCheck} title={title} description={description} />
  );

  return (
    <PageLayout
      allow={["verifier", "authority", "admin"]}
      title="Verification queue"
      lead="Reports awaiting a field decision, highest estimated severity first."
    >
      {loading ? <CardListSkeleton rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}

      {!loading && !error ? (
        <>
          <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Awaiting verification", pending.length],
              ["Assigned to me", mine.length],
              ["Completed by me", completed.length],
              ["High or critical", [...pending, ...mine].filter((i) => ["high", "critical"].includes(i.severity)).length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-[6px] border border-border bg-card p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <Tabs defaultValue="pending">
            <TabsList className="mb-4 flex w-full overflow-x-auto">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="mine">Assigned to me ({mine.length})</TabsTrigger>
              <TabsTrigger value="done">Completed ({completed.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="grid gap-4">
              {pending.length === 0
                ? emptyBlock("Queue is clear", "No unassigned reports are waiting on verification right now.")
                : pending.map((i) => (
                    <QueueCard key={i.id} issue={i} onStart={() => start(i)} onMap={() => viewOnMap(i)} />
                  ))}
            </TabsContent>

            <TabsContent value="mine" className="grid gap-4">
              {mine.length === 0
                ? emptyBlock("Nothing assigned to you", "Start verification on a pending report and it will appear here.")
                : mine.map((i) => (
                    <QueueCard
                      key={i.id}
                      issue={i}
                      onVerify={() => openModal(i, "verified")}
                      onMoreInfo={() => openModal(i, "inconclusive")}
                      onReject={() => openModal(i, "rejected")}
                      onMap={() => viewOnMap(i)}
                    />
                  ))}
            </TabsContent>

            <TabsContent value="done" className="grid gap-4">
              {completed.length === 0
                ? emptyBlock("No completed verifications yet", "Decisions you record will be listed here with their evidence.")
                : completed.map((i) => <QueueCard key={i.id} issue={i} completed onMap={() => viewOnMap(i)} />)}
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={active !== null} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[10px] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {active?.decision === "verified"
                ? "Complete field verification"
                : active?.decision === "rejected"
                  ? "Reject after field visit"
                  : "Request more information"}
            </DialogTitle>
            <DialogDescription>
              {active ? `${active.issue.id} · ${active.issue.title} · ${active.issue.waterBodyName}` : ""}
            </DialogDescription>
          </DialogHeader>

          {active ? (
            <div className="grid gap-4">
              <div className="rounded-[6px] bg-muted p-3 text-xs text-muted-foreground">
                Reported {relativeAge(active.issue.reportedAt)} by {active.issue.reportedBy} · {active.issue.locationLabel}
                <span className="mt-1 block">{active.issue.description}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="visitedAt">Visit date and time</Label>
                  <Input id="visitedAt" type="datetime-local" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} className="mt-1 rounded-[6px]" />
                </div>
                <div>
                  <Label htmlFor="dept">Suggested department</Label>
                  <select
                    id="dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 w-full rounded-[6px] border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Not specified</option>
                    {(departments.data ?? []).map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Confirmed severity</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      aria-pressed={severity === s}
                      className={`rounded-full border px-3 py-1 text-xs ${severity === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                    >
                      {s[0]!.toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Confirmed categories</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = cats.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setCats((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                        className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                      >
                        {CATEGORY_LABEL[c]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Field observations</Label>
                <Textarea id="obs" rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} className="mt-1 rounded-[6px]" placeholder="What did you see, smell and measure on site?" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="lat">Corrected latitude</Label>
                  <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} className="mt-1 rounded-[6px]" inputMode="decimal" />
                </div>
                <div>
                  <Label htmlFor="lng">Corrected longitude</Label>
                  <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} className="mt-1 rounded-[6px]" inputMode="decimal" />
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Site evidence</span>
                <p className="mb-2 text-xs text-muted-foreground">
                  {active.decision === "verified"
                    ? "At least one site photo is required to verify a report."
                    : "Attach photos, or write a detailed reason of at least 40 characters."}
                </p>
                <EvidenceUploader items={evidence} onChange={setEvidence} />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={lab} onCheckedChange={(v) => setLab(v === true)} />
                Request laboratory water testing for this location
              </label>

              <div>
                <Label htmlFor="remarks">Remarks for the department (optional)</Label>
                <Textarea id="remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 rounded-[6px]" />
              </div>

              <p className="text-xs text-muted-foreground">
                Your decision, notes and evidence are recorded on the report&apos;s public accountability trail with your name and the time.
              </p>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" className="rounded-[6px]" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button
              className={`rounded-[6px] ${active?.decision === "rejected" ? "bg-destructive hover:bg-destructive/90" : ""}`}
              onClick={submit}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : active?.decision === "verified"
                  ? "Save verification"
                  : active?.decision === "rejected"
                    ? "Reject report"
                    : "Request information"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
