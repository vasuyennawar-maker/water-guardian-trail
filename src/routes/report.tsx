import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CircleCheckBig, Loader2, MapPin, Sparkles } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import { MapContainer } from "@/components/map/MapContainer";
import { EvidenceUploader, type LocalEvidence } from "@/components/common/EvidenceUploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_LAYERS, mapService } from "@/services/api/mapService";
import { issueService } from "@/services/api/issueService";
import { useAsync } from "@/hooks/useAsync";
import { CATEGORY_LABEL, formatCoords, formatDateTime } from "@/utils/format";
import type { IssueCategory, LatLng } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an Issue — Digital Water Genome Nashik" },
      { name: "description", content: "Report water pollution in Nashik District in five steps: location, photo evidence, description, category and review." },
      { property: "og:title", content: "Report an Issue — Digital Water Genome Nashik" },
      { property: "og:description", content: "Report water pollution in Nashik District in five steps: location, photo evidence, description, category and review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportFlow,
});

const STEPS = ["Location", "Evidence", "Description", "Category", "Review"];

function ReportFlow() {
  const features = useAsync(() => mapService.features(), []);
  const [step, setStep] = useState(0);
  const [point, setPoint] = useState<LatLng | null>(null);
  const [waterBodyId, setWaterBodyId] = useState<string>("");
  const [photos, setPhotos] = useState<LocalEvidence[]>([]);
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; submittedAt: string } | null>(null);

  const bodies = features.data?.waterBodies ?? [];
  const selectedBody = bodies.find((b) => b.id === waterBodyId) ?? (point ? mapService.nearestWaterBody(point) : null);
  const canNext = [Boolean(point || waterBodyId), true, desc.trim().length > 15, Boolean(category), true][step];

  async function submit() {
    setBusy(true);
    try {
      const res = await issueService.submit({ description: desc, category: category as IssueCategory });
      setReceipt(res);
      toast.success("Report submitted");
    } catch { toast.error("Submission failed. Your report was not sent — try again."); }
    finally { setBusy(false); }
  }

  if (receipt) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-resolved/10 text-status-resolved"><CircleCheckBig className="h-6 w-6" aria-hidden /></span>
          <h1 className="mt-4 text-2xl font-semibold">Report submitted</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep this report ID. You can follow every stage of it from My Reports.</p>
          <dl className="surface-card mt-6 space-y-3 p-5 text-left text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Report ID</dt><dd className="data-mono font-semibold">{receipt.id}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Water body</dt><dd>{selectedBody?.name ?? "Nearest body"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Submitted</dt><dd className="data-mono">{formatDateTime(receipt.submittedAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd>Reported</dd></div>
          </dl>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai-soft px-3 py-1.5 text-xs text-ai">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden /> AI is analysing your report
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild className="rounded-[6px]"><Link to="/reports">View my reports</Link></Button>
            <Button asChild variant="outline" className="rounded-[6px]"><Link to="/map">Back to map</Link></Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Report an issue" lead="Five short steps. Works on a phone at the site.">
      <div className="mx-auto max-w-2xl">
        <ol className="mb-6 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-1">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-xs sm:block", i === step ? "font-medium" : "text-muted-foreground")}>{s}</span>
              {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
            </li>
          ))}
        </ol>

        <div className="surface-card p-5">
          {step === 0 ? (
            <div>
              <h2 className="text-sm font-semibold">Where is the issue?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tap the map to drop a pin, use your current location, or pick a known water body.</p>
              <div className="mt-3 h-64 overflow-hidden rounded-[6px] border border-border">
                <MapContainer viewport={{ center: { lat: 20.02, lng: 73.82 }, zoom: 10.6 }} waterBodies={bodies} issues={[]} layers={DEFAULT_LAYERS} pin={point} onMapClick={setPoint} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" className="rounded-[6px]" onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => toast.error("Location unavailable. Drop a pin on the map instead."));
                }}><MapPin className="mr-1.5 h-4 w-4" /> Use my location</Button>
                <Select value={waterBodyId} onValueChange={setWaterBodyId}>
                  <SelectTrigger className="h-9 w-56 rounded-[6px]" aria-label="Select water body"><SelectValue placeholder="Or select a water body" /></SelectTrigger>
                  <SelectContent>{bodies.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {point ? <p className="data-mono mt-2 text-muted-foreground">Pin: {formatCoords(point)}</p> : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="text-sm font-semibold">Add photo evidence</h2>
              <p className="mt-1 mb-3 text-sm text-muted-foreground">Photos are what make a report verifiable. Capture the source if it is safe to do so.</p>
              <EvidenceUploader items={photos} onChange={setPhotos} />
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="text-sm font-semibold">Describe what you saw</h2>
              <p className="mt-1 text-sm text-muted-foreground">What is happening, how long has it been going on, and how large is it? Avoid naming individuals.</p>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} className="mt-3 rounded-[6px]"
                placeholder="e.g. A pipe is discharging grey water into the river about 200 m downstream of the footbridge. Strong smell each morning for the past week." />
              <p className="mt-1 text-xs text-muted-foreground">{desc.trim().length}/15 characters minimum</p>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-sm font-semibold">What kind of issue is it?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABEL) as IssueCategory[]).map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={cn("rounded-full border px-3 py-1.5 text-sm", category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted")}>
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 className="text-sm font-semibold">Review and submit</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Location</dt><dd className="data-mono">{point ? formatCoords(point) : selectedBody?.name}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Water body</dt><dd>{selectedBody?.name ?? "Nearest registered body"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Evidence</dt><dd>{photos.length} photo{photos.length === 1 ? "" : "s"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Category</dt><dd>{category ? CATEGORY_LABEL[category] : "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Description</dt><dd className="text-muted-foreground">{desc}</dd></div>
              </dl>
            </div>
          ) : null}

          <div className="mt-6 flex justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" className="rounded-[6px]" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            {step < 4 ? (
              <Button type="button" className="rounded-[6px]" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</Button>
            ) : (
              <Button type="button" className="rounded-[6px]" disabled={busy} onClick={submit}>
                {busy ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Submitting…</> : "Submit report"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
