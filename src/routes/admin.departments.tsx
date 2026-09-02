import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { DataTable } from "@/components/common/DataTable";
import { ErrorState, TableSkeleton } from "@/components/common/States";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/api/userService";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Digital Water Genome Nashik" },
      { name: "description", content: "Departments responsible for water body issues in Nashik District and their current assignment load." },
      { property: "og:title", content: "Departments — Digital Water Genome Nashik" },
      { property: "og:description", content: "Departments responsible for water body issues in Nashik District and their current assignment load." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDepartments,
});

function AdminDepartments() {
  const { data, loading, error, retry, offline } = useAsync(() => userService.departments(), []);
  return (
    <PageLayout allow={["admin"]} title="Departments" lead="Who is responsible for what, and how much is currently on their desk.">
      {loading ? <TableSkeleton rows={4} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {data ? (
        <DataTable rows={data} columns={[
          { key: "name", header: "Department", sortable: true, value: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
          { key: "resp", header: "Responsibility", value: (r) => r.responsibility },
          { key: "contact", header: "Contact", value: (r) => r.contact, render: (r) => <span className="data-mono">{r.contact}</span> },
          { key: "open", header: "Open assignments", sortable: true, value: (r) => r.openAssignments },
          { key: "members", header: "Members", sortable: true, value: (r) => r.members },
        ]} />
      ) : null}
    </PageLayout>
  );
}
