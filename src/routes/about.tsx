import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Digital Water Genome Nashik" },
      { name: "description", content: "Why Nashik's water bodies need a traceable, public record of pollution reports and the actions taken on them." },
      { property: "og:title", content: "About — Digital Water Genome Nashik" },
      { property: "og:description", content: "Why Nashik's water bodies need a traceable, public record of pollution reports and the actions taken on them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageLayout title="About the platform" lead="A public record of what was reported, what was verified, and what was actually done.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {[
            ["The problem", "Nashik District holds the headwaters of the Godavari, the drinking-water reservoirs that supply the city, and a Ramsar-listed wetland. Most pollution response begins downstream, after damage has already spread. Reports are made by phone or in person, land in one department's inbox, and disappear from public view."],
            ["The principle", "Don't clean the end. Protect the beginning. The cheapest intervention is the earliest one — at the outfall, the dumping site, the encroachment — and that requires the district to know about problems while they are still small."],
            ["What this platform does", "It gives every reported issue a single identifier and a visible lifecycle. A citizen submits evidence from the field. An assessment layer suggests priority. A field verifier confirms it on site. A department is assigned, records its action, and closes the report with evidence. Every one of those steps is timestamped and attributable."],
            ["On the assessment layer", "The automated assessment is a triage aid, not a finding. It suggests a possible issue, a possible cause, an estimated severity and a confidence figure, always in hedged language. Field verifiers and department officers make every determination that carries consequence."],
            ["Scope", "Nashik District is the initial dataset, not a limitation of the system. The registry, map and workflow are region-agnostic and can be extended to other districts."],
          ].map(([h, p]) => (
            <section key={h} className="surface-card p-5">
              <h2 className="text-lg font-semibold">{h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p}</p>
            </section>
          ))}
        </div>
        <aside className="surface-card h-fit p-5">
          <h2 className="text-sm font-semibold">Who uses it</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {[["Citizens", "Report issues with photo evidence and follow them to closure."],
              ["Field verifiers", "Confirm or reject reports on site and record what they found."],
              ["Departments", "Receive assigned issues, log action and close with evidence."],
              ["Administrators", "Manage the registry, departments, roles and the audit trail."],
              ["Public viewers", "Explore the registry and the map without an account."]].map(([t, d]) => (
              <div key={t}><dt className="font-medium">{t}</dt><dd className="text-muted-foreground">{d}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </PageLayout>
  );
}
