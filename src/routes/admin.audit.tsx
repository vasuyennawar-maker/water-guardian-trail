import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { DataTable } from "@/components/common/DataTable";
import { ErrorState, TableSkeleton } from "@/components/common/States";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/api/userService";
import { formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Digital Water Genome Nashik" },
      { name: "description", content: "Every administrative and workflow action on the platform, timestamped and attributable." },
      { property: "og:title", content: "Audit Logs — Digital Water Genome Nashik" },
      { property: "og:description", content: "Every administrative and workflow action on the platform, timestamped and attributable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminAudit,
});

function AdminAudit() {
  const { data, loading, error, retry, offline } = useAsync(() => userService.auditLog(), []);
  return (
    <PageLayout title="Audit logs" lead="Every administrative and workflow action, timestamped and attributable.">
      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {data ? (
        <DataTable rows={data} columns={[
          { key: "at", header: "Time", sortable: true, value: (r) => +new Date(r.at), render: (r) => <span className="data-mono">{formatDateTime(r.at)}</span> },
          { key: "actor", header: "Actor", sortable: true, value: (r) => r.actor },
          { key: "action", header: "Action", sortable: true, value: (r) => r.action, render: (r) => <span className="data-mono">{r.action}</span> },
          { key: "target", header: "Target", value: (r) => r.target },
          { key: "ip", header: "Source", value: (r) => r.ip, render: (r) => <span className="data-mono text-muted-foreground">{r.ip}</span> },
        ]} />
      ) : null}
    </PageLayout>
  );
}
