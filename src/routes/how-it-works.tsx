import { createFileRoute, Link } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { TimelineExplainer } from "@/components/common/Timeline";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Digital Water Genome Nashik" },
      { name: "description", content: "The seven-stage accountability trail every water pollution report follows, from field report to evidence-backed resolution." },
      { property: "og:title", content: "How It Works — Digital Water Genome Nashik" },
      { property: "og:description", content: "The seven-stage accountability trail every water pollution report follows, from field report to evidence-backed resolution." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <PageLayout title="How a report travels" lead="Seven stages, each timestamped and attributable. Nothing closes without evidence.">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="surface-card p-6"><TimelineExplainer /></div>
        <aside className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">What stays visible</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
              <li>The original evidence, unedited</li>
              <li>Who verified the report and what they found</li>
              <li>Which department it was assigned to, and when</li>
              <li>How long each stage took</li>
              <li>The closure evidence</li>
            </ul>
          </div>
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Ready to report?</h2>
            <p className="mt-1 text-sm text-muted-foreground">It takes about two minutes on a phone at the site.</p>
            <Button asChild className="mt-3 w-full rounded-[6px]"><Link to="/report">Report an Issue</Link></Button>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}
