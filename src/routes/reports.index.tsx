import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { IssueCard } from "@/components/common/IssueCard";
import { CardListSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { issueService } from "@/services/api/issueService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "My Reports — Digital Water Genome Nashik" },
      { name: "description", content: "Track every water pollution report you have filed in Nashik District through verification, assignment, action and resolution." },
      { property: "og:title", content: "My Reports — Digital Water Genome Nashik" },
      { property: "og:description", content: "Track every water pollution report you have filed in Nashik District through verification, assignment, action and resolution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyReports,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "under_verification", label: "Under verification" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

function MyReports() {
  const [tab, setTab] = useState("all");
  const { data, loading, error, retry, offline } = useAsync(() => issueService.list({ status: tab as never }), [tab]);

  return (
    <PageLayout allow={["citizen","verifier","authority","admin"]} title="My reports" lead="Every report you have filed, with its current stage in the accountability trail."
      actions={<Button asChild className="rounded-[6px]"><Link to="/report">Report an Issue</Link></Button>}>
      <div className="mb-5 flex flex-wrap gap-1 rounded-[6px] border border-border bg-card p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("rounded-[4px] px-3 py-1.5 text-sm", tab === t.key ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted")}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? <CardListSkeleton rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {!loading && !error && (data?.length ?? 0) === 0 ? (
        <EmptyState icon={FileText} title="No reports in this view"
          description="No reports yet — report an issue to start tracking it here."
          action={<Button asChild className="rounded-[6px]"><Link to="/report">Report an Issue</Link></Button>} />
      ) : null}
      <div className="grid gap-3">{(data ?? []).map((i) => <IssueCard key={i.id} issue={i} />)}</div>
    </PageLayout>
  );
}
