import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplets, Shield, Sparkles, TriangleAlert } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { TimelineExplainer } from "@/components/common/Timeline";
import { MapContainer } from "@/components/map/MapContainer";
import { IssueCard } from "@/components/common/IssueCard";
import { CardListSkeleton } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/useAsync";
import { mapService, DEFAULT_LAYERS } from "@/services/api/mapService";
import { issueService } from "@/services/api/issueService";
import { waterBodyService } from "@/services/api/waterBodyService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Water Genome — Nashik District Water Accountability" },
      { name: "description", content: "Report, verify and track pollution in the rivers, dams and lakes of Nashik District. Every issue carries a visible lifecycle from report to evidence-backed resolution." },
      { property: "og:title", content: "Digital Water Genome — Nashik District Water Accountability" },
      { property: "og:description", content: "A public accountability trail for Nashik's water bodies: report an issue, watch it get verified, assigned, acted on and resolved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const features = useAsync(() => mapService.features(), []);
  const recent = useAsync(() => issueService.list({ sort: "recent" }), []);
  const stats = useAsync(() => waterBodyService.stats(), []);

  return (
    <PageLayout wide>
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <Droplets className="h-3.5 w-3.5 text-water" aria-hidden /> Nashik District · Maharashtra
            </p>
            <h1 className="font-display mt-5 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
              Digital Water Genome
            </h1>
            <p className="font-display mt-4 text-xl text-water sm:text-2xl">Don't clean the end. Protect the beginning.</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              A public record of pollution in the district's rivers, dams, lakes and ponds — and of what was
              actually done about each report. Every issue is traceable from the moment it is filed to the
              evidence that closes it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-[6px]"><Link to="/explore">Explore Water Bodies</Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-[6px]"><Link to="/report">Report an Issue</Link></Button>
            </div>
          </div>
          <div className="surface-card h-80 overflow-hidden lg:h-full">
            {features.data ? (
              <MapContainer viewport={{ center: { lat: 20.05, lng: 73.87 }, zoom: 9.6 }} waterBodies={features.data.waterBodies}
                issues={features.data.issues} layers={DEFAULT_LAYERS} interactive={false} />
            ) : <div className="h-full w-full animate-pulse bg-muted" />}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">The problem starts upstream</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nashik holds the headwaters of the Godavari, the reservoirs that supply the city's drinking water,
              and a Ramsar-listed wetland. Most response begins downstream, once damage has already spread.
              Reports are made by phone, land in a single inbox, and vanish from public view. Nobody outside the
              department can tell whether anything happened.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This platform makes the first report and the last action part of the same visible record.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 self-start">
            {[["Registered water bodies", stats.data?.total], ["Under monitoring", stats.data?.monitored],
              ["Open issues", stats.data?.openIssues], ["Resolved with evidence", stats.data?.resolvedIssues]].map(([l, v]) => (
              <div key={String(l)} className="surface-card p-4">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">{l}</dt>
                <dd className="mt-2 text-3xl font-semibold tabular-nums">{v ?? "—"}</dd>
              </div>
            ))}
            <p className="col-span-2 text-xs text-muted-foreground">Sample dataset for demonstration, not official statistics.</p>
          </dl>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold">The accountability trail</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Seven stages. Each one timestamped, attributable, and visible to the person who filed the report.</p>
          <div className="mt-8 max-w-2xl"><TimelineExplainer /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold">Recently reported</h2>
          <Link to="/reports" className="inline-flex items-center gap-1 text-sm font-medium text-water hover:underline">All reports <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {recent.loading ? <CardListSkeleton rows={3} /> : (
          <div className="grid gap-3 lg:grid-cols-3">{(recent.data ?? []).slice(0, 3).map((i) => <IssueCard key={i.id} issue={i} compact />)}</div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-sev-critical/10 text-sev-critical"><TriangleAlert className="h-4 w-4" aria-hidden /></span>
            <h2 className="mt-3 text-lg font-semibold">Pollution hotspots</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Repeat reports cluster around a small number of stretches — the urban Godavari ghats, the Satpur
              industrial feeder, and the Waldevi channel. The map's heat layer shows where attention concentrates.
            </p>
            <Button asChild variant="outline" className="mt-4 rounded-[6px]"><Link to="/map">Open the map</Link></Button>
          </div>
          <div className="rounded-[10px] border border-ai/30 bg-ai-soft/60 p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-ai/10 text-ai"><Sparkles className="h-4 w-4" aria-hidden /></span>
            <h2 className="mt-3 text-lg font-semibold">Assessment, not verdict</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Each new report receives an automated assessment suggesting a possible issue, a possible cause, an
              estimated severity and a confidence figure. It exists to help verifiers decide what to inspect first.
              It never decides anything on its own — a person always makes the call.
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5" aria-hidden /> Human verification is required at every consequential step.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary-foreground">Saw something at the water's edge?</h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">Two minutes on your phone at the site is enough to start a traceable record.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-[6px]"><Link to="/report">Report an Issue</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-[6px] border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link to="/how-it-works">How it works</Link></Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
