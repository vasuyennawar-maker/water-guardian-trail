import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { DataTable } from "@/components/common/DataTable";
import { ErrorState, TableSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/api/userService";
import { ROLE_LABEL } from "@/hooks/useRole";
import { formatDate } from "@/utils/format";
import type { Role } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Digital Water Genome Nashik" },
      { name: "description", content: "View accounts, assign roles and activate or deactivate users of the district water platform." },
      { property: "og:title", content: "Users — Digital Water Genome Nashik" },
      { property: "og:description", content: "View accounts, assign roles and activate or deactivate users of the district water platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { data, loading, error, retry, offline } = useAsync(() => userService.list(), []);
  return (
    <PageLayout title="Users" lead="Accounts, roles and activation status.">
      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {data ? (
        <DataTable rows={data} columns={[
          { key: "name", header: "Name", sortable: true, value: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "email", header: "Email", sortable: true, value: (r) => r.email, render: (r) => <span className="data-mono">{r.email}</span> },
          { key: "role", header: "Role", sortable: true, value: (r) => r.role, render: (r) => (
            <Select defaultValue={r.role} onValueChange={(v) => { void userService.setRole(r.id, v as Role); toast.success("Role updated"); }}>
              <SelectTrigger className="h-8 w-40 rounded-[6px] text-xs" aria-label={`Role for ${r.name}`}><SelectValue /></SelectTrigger>
              <SelectContent>{(["citizen", "verifier", "authority", "admin"] as Role[]).map((x) => <SelectItem key={x} value={x} className="text-xs">{ROLE_LABEL[x]}</SelectItem>)}</SelectContent>
            </Select>) },
          { key: "joined", header: "Joined", sortable: true, value: (r) => +new Date(r.joinedAt), render: (r) => <span className="data-mono">{formatDate(r.joinedAt)}</span> },
          { key: "status", header: "Status", sortable: true, value: (r) => String(r.active), render: (r) => (
            <span className={r.active ? "text-status-resolved" : "text-muted-foreground"}>{r.active ? "Active" : "Deactivated"}</span>) },
          { key: "act", header: "", render: (r) => (
            <Button size="sm" variant="outline" className="rounded-[6px]" onClick={() => { void userService.setActive(r.id, !r.active); toast.success(r.active ? "User deactivated" : "User activated"); }}>
              {r.active ? "Deactivate" : "Activate"}</Button>) },
        ]} />
      ) : null}
    </PageLayout>
  );
}
