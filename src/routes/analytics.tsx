import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageLayout } from "@/layouts/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { ErrorState, StatGridSkeleton } from "@/components/common/States";
import { useAsync } from "@/hooks/useAsync";
import { analyticsService } from "@/services/api/analyticsService";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Digital Water Genome Nashik" },
      { name: "description", content: "Issue trends by time, category, severity, water body and geography, with resolution rate and average resolution time." },
      { property: "og:title", content: "Analytics — Digital Water Genome Nashik" },
      { property: "og:description", content: "Issue trends by time, category, severity, water body and geography, with resolution rate and average resolution time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, loading, error, retry, offline } = useAsync(() => analyticsService.bundle(), []);

  return (
    <PageLayout title="Analytics" lead="All figures below are illustrative sample data for demonstration, not official district statistics.">
      {loading ? <StatGridSkeleton /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Resolution rate" value={`${data.resolutionRatePct}%`} hint="Sample data" />
            <StatCard label="Avg resolution time" value={`${data.avgResolutionDays} days`} hint="From report to closure" tone="water" />
            <StatCard label="Active issues" value={data.active} tone="warning" hint="Open across the district" />
            <StatCard label="Resolved" value={data.resolved} tone="resolved" hint="Closed with evidence" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Issues over time</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.overTime}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }} />
                    <Line type="monotone" dataKey="reported" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resolved" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Issues by category</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis type="category" dataKey="category" width={130} stroke="var(--muted-foreground)" fontSize={10} />
                    <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }} />
                    <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Issues by severity</h2>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.bySeverity}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="severity" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }} />
                    <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="surface-card p-5">
              <h2 className="text-sm font-semibold">Pollution hotspots</h2>
              <p className="mt-1 text-xs text-muted-foreground">Water bodies with the highest concentration of open issues.</p>
              <ul className="mt-4 space-y-3">
                {data.hotspots.map((h) => (
                  <li key={h.name}>
                    <div className="flex items-center justify-between text-sm"><span>{h.name}</span><span className="data-mono text-muted-foreground">{Math.round(h.intensity * 100)}%</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-sev-critical" style={{ width: `${h.intensity * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </PageLayout>
  );
}
