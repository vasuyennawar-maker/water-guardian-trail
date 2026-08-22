import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, LayoutGrid, List } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterPanel } from "@/components/common/FilterPanel";
import { WaterBodyCard } from "@/components/common/WaterBodyCard";
import { CardListSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { waterBodyService } from "@/services/api/waterBodyService";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Water Bodies Explorer — Digital Water Genome Nashik" },
      { name: "description", content: "Search, filter and compare the rivers, dams, lakes, ponds and reservoirs of Nashik District and their reported issues." },
      { property: "og:title", content: "Water Bodies Explorer — Digital Water Genome Nashik" },
      { property: "og:description", content: "Search, filter and compare the rivers, dams, lakes, ponds and reservoirs of Nashik District and their reported issues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ type: "all", taluka: "all", sort: "name" });
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data, loading, error, retry, offline } = useAsync(
    () => waterBodyService.list({ search, type: filters["type"] ?? "all", taluka: filters["taluka"] ?? "all", sort: (filters["sort"] ?? "name") as never }),
    [search, filters["type"], filters["taluka"], filters["sort"]],
  );
  const talukas = useAsync(() => waterBodyService.talukas(), []);

  return (
    <PageLayout
      title="Water Bodies of Nashik District"
      lead="Every registered river, dam, lake, pond and reservoir in the district registry, with its current condition indicator and open issue count."
      actions={
        <div className="flex gap-1 rounded-[6px] border border-border bg-card p-1">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" className="rounded-[4px]" onClick={() => setView("grid")}>
            <LayoutGrid className="h-4 w-4" aria-hidden /> <span className="ml-1.5 hidden sm:inline">Grid</span>
          </Button>
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="rounded-[4px]" onClick={() => setView("list")}>
            <List className="h-4 w-4" aria-hidden /> <span className="ml-1.5 hidden sm:inline">List</span>
          </Button>
        </div>
      }
    >
      <div className="mb-5 grid gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or taluka" className="max-w-md" />
        <FilterPanel
          values={filters}
          onChange={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
          onReset={() => { setFilters({ type: "all", taluka: "all", sort: "name" }); setSearch(""); }}
          filters={[
            { key: "type", label: "Type", options: [
              { value: "all", label: "All types" }, { value: "river", label: "Rivers" }, { value: "dam", label: "Dams" },
              { value: "lake", label: "Lakes" }, { value: "pond", label: "Ponds" }, { value: "reservoir", label: "Reservoirs" }] },
            { key: "taluka", label: "Taluka", options: [{ value: "all", label: "All talukas" }, ...(talukas.data ?? []).map((t) => ({ value: t, label: t }))] },
            { key: "sort", label: "Sort", options: [
              { value: "name", label: "Sort: Name" }, { value: "health", label: "Sort: Most stressed" }, { value: "issues", label: "Sort: Most open issues" }] },
          ]}
        />
      </div>

      {loading ? <CardListSkeleton rows={4} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState icon={Droplets} title="No water bodies match these filters"
          description="Try clearing the taluka or type filter, or search for a different name."
          action={<Button variant="outline" className="rounded-[6px]" onClick={() => { setFilters({ type: "all", taluka: "all", sort: "name" }); setSearch(""); }}>Clear filters</Button>} />
      ) : null}
      {!loading && !error && data && data.length > 0 ? (
        <div className={view === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3"}>
          {data.map((wb) => <WaterBodyCard key={wb.id} wb={wb} view={view} />)}
        </div>
      ) : null}
    </PageLayout>
  );
}
