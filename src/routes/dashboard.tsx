import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheckBig, ClipboardList, FileText, Hammer, Plus } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { IssueCard } from "@/components/common/IssueCard";
import { CardListSkeleton, EmptyState, ErrorState, StatGridSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { issueService } from "@/services/api/issueService";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Citizen Dashboard — Digital Water Genome Nashik" },
      { name: "description", content: "Your submitted reports, what is under verification, what is under action and what has been resolved." },
      { property: "og:title", content: "Citizen Dashboard — Digital Water Genome Nashik" },
      { property: "og:description", content: "Your submitted reports, what is under verification, what is under action and what has been resolved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CitizenDashboard,
});

function CitizenDashboard() {
  const stats = useAsync(() => issueService.citizenStats("Anjali Deshmukh"), []);
  const recent = useAsync(() => issueService.list({ reportedBy: "Anjali Deshmukh" }), []);

  return (
    <PageLayout allow={["citizen","admin"]} title="Your dashboard" lead="What you have reported, and where each report currently stands."
      actions={<Button asChild className="rounded-[6px]"><Link to="/report"><Plus className="mr-1.5 h-4 w-4" /> Report an Issue</Link></Button>}>
      {stats.loading ? <StatGridSkeleton /> : null}
      {stats.error ? <ErrorState message={stats.error} onRetry={stats.retry} offline={stats.offline} /> : null}
      {stats.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Submitted" value={stats.data.submitted} icon={FileText} hint="Reports you have filed" />
          <StatCard label="Under verification" value={stats.data.underVerification} icon={ClipboardList} tone="water" hint="Awaiting a field verifier" />
          <StatCard label="Under action" value={stats.data.underAction} icon={Hammer} tone="warning" hint="With a department now" />
          <StatCard label="Resolved" value={stats.data.resolved} icon={CircleCheckBig} tone="resolved" hint="Closed with evidence" />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent reports</h2>
          {recent.loading ? <CardListSkeleton rows={3} /> : null}
          {recent.error ? <ErrorState message={recent.error} onRetry={recent.retry} /> : null}
          {!recent.loading && !recent.error && (recent.data?.length ?? 0) === 0 ? (
            <EmptyState icon={FileText} title="No reports yet" description="No reports yet — report an issue to start tracking it here."
              action={<Button asChild className="rounded-[6px]"><Link to="/report">Report an Issue</Link></Button>} />
          ) : null}
          <div className="grid gap-3">{(recent.data ?? []).slice(0, 4).map((i) => <IssueCard key={i.id} issue={i} compact />)}</div>
        </section>
        <aside className="surface-card h-fit p-5">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <div className="mt-3 grid gap-2">
            <Button asChild className="rounded-[6px]"><Link to="/report">Report an issue</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/map">Open the map</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/explore">Browse water bodies</Link></Button>
            <Button asChild variant="ghost" className="rounded-[6px]"><Link to="/reports">All my reports</Link></Button>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
