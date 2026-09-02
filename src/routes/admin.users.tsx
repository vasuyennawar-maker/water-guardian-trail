import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { DataTable } from "@/components/common/DataTable";
import { ErrorState, TableSkeleton } from "@/components/common/States";
import { EmptyState } from "@/components/common/States";
import { SearchBar } from "@/components/common/SearchBar";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/api/userService";
import { ROLE_LABEL } from "@/hooks/useRole";
import { formatDate } from "@/utils/format";
import type { AppUser, Role } from "@/types";
import { toast } from "sonner";
import { Users } from "lucide-react";

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

const ROLE_OPTIONS: Role[] = ["citizen", "verifier", "authority", "admin"];

function AdminUsers() {
  const { data, loading, error, retry, offline } = useAsync(() => userService.list(), []);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [pendingRole, setPendingRole] = useState<{ user: AppUser; role: Role } | null>(null);
  const [pendingActive, setPendingActive] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      if (q && !(r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))) return false;
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (statusFilter !== "all" && String(r.active) !== statusFilter) return false;
      return true;
    });
  }, [data, search, roleFilter, statusFilter]);

  return (
    <PageLayout title="Users" lead="Accounts, roles and activation status.">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email" className="sm:max-w-xs" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-10 w-full rounded-[6px] sm:w-44" aria-label="Filter by role"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map((x) => <SelectItem key={x} value={x}>{ROLE_LABEL[x]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full rounded-[6px] sm:w-44" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <TableSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {data ? (
        filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              rows={filtered}
              columns={[
                { key: "name", header: "Name", sortable: true, value: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "email", header: "Email", sortable: true, value: (r) => r.email, render: (r) => <span className="data-mono">{r.email}</span> },
                {
                  key: "role",
                  header: "Role",
                  sortable: true,
                  value: (r) => r.role,
                  render: (r) => (
                    <Select value={r.role} onValueChange={(v) => setPendingRole({ user: r, role: v as Role })}>
                      <SelectTrigger className="h-8 w-40 rounded-[6px] text-xs" aria-label={`Role for ${r.name}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((x) => <SelectItem key={x} value={x} className="text-xs">{ROLE_LABEL[x]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ),
                },
                { key: "joined", header: "Joined", sortable: true, value: (r) => +new Date(r.joinedAt), render: (r) => <span className="data-mono">{formatDate(r.joinedAt)}</span> },
                {
                  key: "status",
                  header: "Status",
                  sortable: true,
                  value: (r) => String(r.active),
                  render: (r) => <span className={r.active ? "text-status-resolved" : "text-muted-foreground"}>{r.active ? "Active" : "Deactivated"}</span>,
                },
                {
                  key: "act",
                  header: "",
                  render: (r) => (
                    <Button size="sm" variant="outline" className="rounded-[6px]" onClick={() => setPendingActive(r)}>
                      {r.active ? "Deactivate" : "Activate"}
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        )
      ) : null}

      <ConfirmationModal
        open={!!pendingRole}
        onOpenChange={(o) => !o && setPendingRole(null)}
        title="Change role"
        description={pendingRole ? `Set ${pendingRole.user.name}'s role to ${ROLE_LABEL[pendingRole.role]}? This changes what they can access.` : ""}
        confirmLabel="Change role"
        onConfirm={() => {
          if (!pendingRole) return;
          void userService.setRole(pendingRole.user.id, pendingRole.role);
          toast.success(`Role updated to ${ROLE_LABEL[pendingRole.role]}`);
          setPendingRole(null);
        }}
      />

      <ConfirmationModal
        open={!!pendingActive}
        onOpenChange={(o) => !o && setPendingActive(null)}
        title={pendingActive?.active ? "Deactivate user" : "Activate user"}
        description={
          pendingActive
            ? pendingActive.active
              ? `${pendingActive.name} will lose access to the platform. Continue?`
              : `${pendingActive.name} will regain access to the platform. Continue?`
            : ""
        }
        confirmLabel={pendingActive?.active ? "Deactivate" : "Activate"}
        destructive={pendingActive?.active === true}
        onConfirm={() => {
          if (!pendingActive) return;
          const next = !pendingActive.active;
          void userService.setActive(pendingActive.id, next);
          toast.success(next ? "User activated" : "User deactivated");
          setPendingActive(null);
        }}
      />
    </PageLayout>
  );
}
