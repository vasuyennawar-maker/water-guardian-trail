import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FileText, ScrollText, Users } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { ErrorState, StatGridSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/api/userService";
import { waterBodyService } from "@/services/api/waterBodyService";
import { formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Digital Water Genome Nashik" },
      { name: "description", content: "Manage users, departments, the water body registry, reports and the system audit trail." },
      { property: "og:title", content: "Admin Dashboard — Digital Water Genome Nashik" },
      { property: "og:description", content: "Manage users, departments, the water body registry, reports and the system audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const users = useAsync(() => userService.list(), []);
  const depts = useAsync(() => userService.departments(), []);
  const wbs = useAsync(() => waterBodyService.stats(), []);
  const log = useAsync(() => userService.auditLog(), []);

  return (
    <PageLayout allow={["admin"]} title="Administration" lead="Registry, people and system activity.">
      {users.loading || wbs.loading ? <StatGridSkeleton /> : null}
      {users.error ? <ErrorState message={users.error} onRetry={users.retry} /> : null}
      {users.data && wbs.data && depts.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users" value={users.data.length} icon={Users} hint={`${users.data.filter((u) => !u.active).length} deactivated`} />
          <StatCard label="Departments" value={depts.data.length} icon={Building2} tone="water" hint="With assigned responsibility" />
          <StatCard label="Water bodies" value={wbs.data.total} icon={FileText} hint="In the district registry" />
          <StatCard label="Open issues" value={wbs.data.openIssues} icon={ScrollText} tone="warning" hint="Across all water bodies" />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="text-sm font-semibold">Manage</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/admin/users">Users &amp; roles</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/admin/departments">Departments</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/explore">Water body registry</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/authority/issues">Reports</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/analytics">Analytics</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/admin/audit">Audit logs</Link></Button>
          </div>
        </section>
        <section className="surface-card p-5">
          <h2 className="text-sm font-semibold">Recent system activity</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(log.data ?? []).slice(0, 5).map((l) => (
              <li key={l.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <span><span className="data-mono">{l.action}</span> — {l.target}</span>
                <span className="data-mono shrink-0 text-muted-foreground">{formatDateTime(l.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageLayout>
  );
}
