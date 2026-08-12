import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { Timeline } from "@/components/common/Timeline";
import { AIAnalysisCard } from "@/components/common/AIAnalysisCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { issueService } from "@/services/api/issueService";
import { CATEGORY_LABEL, formatCoords, formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/reports/$id")({
  head: () => ({
    meta: [
      { title: "Report Detail — Digital Water Genome Nashik" },
      { name: "description", content: "Full lifecycle of a water pollution report: evidence, AI assessment, verification notes, assignment, action notes and resolution evidence." },
      { property: "og:title", content: "Report Detail — Digital Water Genome Nashik" },
      { property: "og:description", content: "Full lifecycle of a water pollution report: evidence, AI assessment, verification notes, assignment, action notes and resolution evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { data, loading, error, retry, offline } = useAsync(() => issueService.get(id), [id]);

  if (loading) return <PageLayout><Skeleton className="h-96 w-full rounded-[10px]" /></PageLayout>;
  if (error || !data) return <PageLayout><ErrorState message={error ?? "Report unavailable."} onRetry={retry} offline={offline} /></PageLayout>;

  return (
    <PageLayout>
      <header className="mb-6">
        <p className="data-mono text-muted-foreground">{data.id}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <StatusBadge status={data.status} />
          <SeverityBadge severity={data.severity} />
          <span className="text-sm text-muted-foreground">{CATEGORY_LABEL[data.category]}</span>
          <span className="data-mono text-muted-foreground">{formatDateTime(data.reportedAt)}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold">Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">Evidence submitted</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.evidence.map((e) => (
                <li key={e.id} className="surface-card overflow-hidden">
                  <img src={e.url} alt={e.caption ?? "Report evidence"} loading="lazy" className="h-32 w-full object-cover" />
                  <p className="data-mono px-2 py-1.5 text-muted-foreground">{formatDateTime(e.capturedAt)}</p>
                </li>
              ))}
            </ul>
          </section>

          {data.ai ? <AIAnalysisCard assessment={data.ai} /> : null}

          {data.verificationNote ? (
            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Field verification note</h2>
              <p className="mt-2 text-sm text-muted-foreground">{data.verificationNote}</p>
            </section>
          ) : null}

          {data.actionNotes?.length ? (
            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Action notes</h2>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{data.actionNotes.map((n, i) => <li key={i}>• {n}</li>)}</ul>
            </section>
          ) : null}

          {data.resolutionEvidence?.length ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold">Resolution evidence</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.resolutionEvidence.map((e) => (
                  <li key={e.id} className="surface-card overflow-hidden">
                    <img src={e.url} alt={e.caption ?? "Resolution evidence"} loading="lazy" className="h-32 w-full object-cover" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Accountability trail</h2>
            <div className="mt-4"><Timeline events={data.timeline} current={data.status === "resolved" ? "done" : undefined} /></div>
          </div>
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[["Water body", data.waterBodyName], ["Location", data.locationLabel], ["Coordinates", formatCoords(data.location)],
                ["Reported by", data.reportedBy], ["Assigned to", data.assignedDepartment ?? "Not yet assigned"],
                ["Last update", formatDateTime(data.updatedAt)]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5">{v}</dd></div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
