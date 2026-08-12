import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { MapContainer } from "@/components/map/MapContainer";
import { IssueCard } from "@/components/common/IssueCard";
import { CardListSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { waterBodyService } from "@/services/api/waterBodyService";
import { issueService } from "@/services/api/issueService";
import { DEFAULT_LAYERS } from "@/services/api/mapService";
import { WATER_BODY_LABEL, formatCoords, formatDate } from "@/utils/format";

export const Route = createFileRoute("/water-bodies/$id")({
  head: () => ({
    meta: [
      { title: "Water Body Record — Digital Water Genome Nashik" },
      { name: "description", content: "Condition indicator, geography, reported issues and monitoring history for a registered water body in Nashik District." },
      { property: "og:title", content: "Water Body Record — Digital Water Genome Nashik" },
      { property: "og:description", content: "Condition indicator, geography, reported issues and monitoring history for a registered water body in Nashik District." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WaterBodyDetail,
});

function WaterBodyDetail() {
  const { id } = Route.useParams();
  const wb = useAsync(() => waterBodyService.get(id), [id]);
  const issues = useAsync(() => issueService.list({ waterBodyId: id }), [id]);

  if (wb.loading) return <PageLayout><Skeleton className="h-64 w-full rounded-[10px]" /></PageLayout>;
  if (wb.error || !wb.data) return <PageLayout><ErrorState message={wb.error ?? "Record unavailable."} onRetry={wb.retry} offline={wb.offline} /></PageLayout>;
  const w = wb.data;

  return (
    <PageLayout
      title={w.name}
      lead={w.description}
      actions={<Button asChild className="rounded-[6px]"><Link to="/report">Report an issue here</Link></Button>}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="surface-card h-72 overflow-hidden">
            <MapContainer viewport={{ center: w.center, zoom: 12 }} waterBodies={[w]} issues={issues.data ?? []} layers={DEFAULT_LAYERS} interactive={false} />
          </div>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Reported issues</h2>
            {issues.loading ? <CardListSkeleton rows={2} /> : null}
            {issues.error ? <ErrorState message={issues.error} onRetry={issues.retry} /> : null}
            {!issues.loading && !issues.error && (issues.data?.length ?? 0) === 0 ? (
              <EmptyState icon={FileText} title="No issues reported for this water body"
                description="Nothing has been filed here yet. If you see a problem on site, report it and it will be tracked from here."
                action={<Button asChild className="rounded-[6px]"><Link to="/report">Report an issue</Link></Button>} />
            ) : null}
            <div className="grid gap-3">{(issues.data ?? []).map((i) => <IssueCard key={i.id} issue={i} compact />)}</div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Registry record</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[["Type", WATER_BODY_LABEL[w.type]], ["Taluka", w.taluka], ["Centre", formatCoords(w.center)],
                ["Extent", w.areaSqKm ? `${w.areaSqKm} sq km` : `${w.lengthKm} km`], ["Last surveyed", formatDate(w.lastSurveyedAt)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="data-mono text-right">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Condition indicator</h2>
            <p className="mt-1 text-3xl font-semibold">{w.healthScore}<span className="text-base text-muted-foreground">/100</span></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${w.healthScore}%` }} /></div>
            <p className="mt-2 text-xs text-muted-foreground">Composite sample indicator derived from open issues, severity and time since last survey. Not an official water quality measurement.</p>
          </div>
          <div className="surface-card grid grid-cols-2 gap-3 p-5">
            <div><p className="text-xs text-muted-foreground">Open</p><p className="text-2xl font-semibold">{w.openIssues}</p></div>
            <div><p className="text-xs text-muted-foreground">Resolved</p><p className="text-2xl font-semibold">{w.resolvedIssues}</p></div>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
