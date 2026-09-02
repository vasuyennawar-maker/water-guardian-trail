import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { AIAnalysisCard } from "@/components/common/AIAnalysisCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { CardListSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAsync } from "@/hooks/useAsync";
import { issueService } from "@/services/api/issueService";
import { CATEGORY_LABEL, formatCoords, relativeAge } from "@/utils/format";
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

function VerificationQueue() {
  const { data, loading, error, retry, offline } = useAsync(() => issueService.verificationQueue(), []);
  const [open, setOpen] = useState<{ id: string; decision: "verify" | "reject" | "more_info" } | null>(null);
  const [note, setNote] = useState("");

  async function confirm() {
    if (!open) return;
    await issueService.verify(open.id, open.decision, note);
    toast.success(open.decision === "verify" ? "Report verified" : open.decision === "reject" ? "Report rejected" : "More information requested");
    setOpen(null); setNote(""); retry();
  }

  return (
    <PageLayout allow={["verifier","authority","admin"]} title="Verification queue" lead="Reports awaiting a field decision, highest estimated severity first.">
      {loading ? <CardListSkeleton rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {!loading && !error && (data?.length ?? 0) === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Queue is clear" description="No reports are waiting on verification right now. New submissions will appear here automatically." />
      ) : null}

      <div className="grid gap-4">
        {(data ?? []).map((i) => (
          <article key={i.id} className="surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="data-mono text-muted-foreground">{i.id} · submitted {relativeAge(i.reportedAt)}</p>
                <h2 className="mt-1 text-base font-semibold">{i.title}</h2>
                <p className="data-mono mt-1 text-muted-foreground">{i.locationLabel} · {formatCoords(i.location)}</p>
              </div>
              <div className="flex flex-col items-end gap-2"><StatusBadge status={i.status} size="sm" /><SeverityBadge severity={i.severity} /></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{i.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Category: {CATEGORY_LABEL[i.category]}</p>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {i.evidence.map((e) => <li key={e.id}><img src={e.url} alt={e.caption ?? "Evidence"} loading="lazy" className="h-20 w-full rounded-[6px] border border-border object-cover" /></li>)}
            </ul>
            {i.ai ? <div className="mt-4"><AIAnalysisCard assessment={i.ai} /></div> : null}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button className="rounded-[6px]" onClick={() => setOpen({ id: i.id, decision: "verify" })}>Verify</Button>
              <Button variant="outline" className="rounded-[6px]" onClick={() => setOpen({ id: i.id, decision: "more_info" })}>Request more info</Button>
              <Button variant="ghost" className="rounded-[6px] text-destructive" onClick={() => setOpen({ id: i.id, decision: "reject" })}>Reject</Button>
              <Button asChild variant="ghost" className="ml-auto rounded-[6px]"><Link to="/reports/$id" params={{ id: i.id }}>Open full report</Link></Button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmationModal
        open={open !== null} onOpenChange={(o) => !o && setOpen(null)}
        title={open?.decision === "verify" ? "Verify this report?" : open?.decision === "reject" ? "Reject this report?" : "Request more information?"}
        description="Your decision and note are recorded on the report's public accountability trail with your name and the time."
        confirmLabel={open?.decision === "verify" ? "Verify" : open?.decision === "reject" ? "Reject" : "Request info"}
        destructive={open?.decision === "reject"} onConfirm={confirm}
      />
      {open ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 rounded-[10px] border border-border bg-card p-3 shadow-overlay">
          <label htmlFor="vnote" className="text-xs font-medium">Field note</label>
          <Textarea id="vnote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 rounded-[6px]" placeholder="What did you observe on site?" />
        </div>
      ) : null}
    </PageLayout>
  );
}
