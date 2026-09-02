import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ClipboardList, Hammer, CircleCheckBig } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState, ErrorState, StatGridSkeleton, TableSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { issueService } from "@/services/api/issueService";
import { relativeAge } from "@/utils/format";

export const Route = createFileRoute("/authority/")({
  head: () => ({
    meta: [
      { title: "Authority Dashboard — Digital Water Genome Nashik" },
      { name: "description", content: "Action-first view of verified water body issues: what needs action today, priority queue and assignment workflow." },
      { property: "og:title", content: "Authority Dashboard — Digital Water Genome Nashik" },
      { property: "og:description", content: "Action-first view of verified water body issues: what needs action today, priority queue and assignment workflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthorityDashboard,
});

function AuthorityDashboard() {
  const stats = useAsync(() => issueService.authorityStats(), []);
  const issues = useAsync(() => issueService.list({ sort: "severity" }), []);

  return (
    <PageLayout allow={["authority","admin"]} title="Department dashboard" lead="Framed as next actions, not as counts.">
      {stats.loading ? <StatGridSkeleton /> : null}
      {stats.error ? <ErrorState message={stats.error} onRetry={stats.retry} offline={stats.offline} /> : null}
      {stats.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Needs action today" value={stats.data.needsActionToday} icon={AlertTriangle} tone="critical"
            hint={`${stats.data.needsActionToday} high-priority issues need action today`} />
          <StatCard label="Awaiting verification" value={stats.data.awaitingVerification} icon={ClipboardList} tone="water" hint="Send a verifier before they age out" />
          <StatCard label="Work in progress" value={stats.data.inProgress} icon={Hammer} tone="warning" hint="Log an update to keep them current" />
          <StatCard label="Resolved this month" value={stats.data.resolvedThisMonth} icon={CircleCheckBig} tone="resolved" hint="Closed with evidence attached" />
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Priority issues</h2>
          <Button asChild variant="outline" size="sm" className="rounded-[6px]"><Link to="/authority/issues">Open issue management</Link></Button>
        </div>
        {issues.loading ? <TableSkeleton /> : null}
        {issues.error ? <ErrorState message={issues.error} onRetry={issues.retry} /> : null}
        {issues.data ? (
          <DataTable
            rows={issues.data}
            emptyState={<EmptyState icon={CircleCheckBig} title="Nothing is waiting on your department" description="Newly verified issues assigned to you will appear at the top of this list." />}
            columns={[
              { key: "id", header: "Report ID", sortable: true, value: (r) => r.id, render: (r) => <span className="data-mono">{r.id}</span> },
              { key: "title", header: "Issue", sortable: true, value: (r) => r.title, render: (r) => <span className="font-medium">{r.title}</span> },
              { key: "wb", header: "Location", sortable: true, value: (r) => r.waterBodyName },
              { key: "sev", header: "Severity", sortable: true, value: (r) => ({ critical: 0, high: 1, medium: 2, low: 3 })[r.severity], render: (r) => <SeverityBadge severity={r.severity} /> },
              { key: "status", header: "Status", sortable: true, value: (r) => r.status, render: (r) => <StatusBadge status={r.status} size="sm" /> },
              { key: "age", header: "Age", sortable: true, value: (r) => +new Date(r.reportedAt), render: (r) => <span className="data-mono">{relativeAge(r.reportedAt)}</span> },
              { key: "act", header: "", render: (r) => <Link to="/reports/$id" params={{ id: r.id }} className="text-sm font-medium text-water hover:underline">View</Link> },
            ]}
          />
        ) : null}
      </section>
    </PageLayout>
  );
}
