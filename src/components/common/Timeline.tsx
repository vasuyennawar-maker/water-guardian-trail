import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Hammer,
  Sparkles,
  UserCheck,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { TimelineEvent } from "@/types";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

/**
 * Signature component: the accountability trail.
 * Reported -> AI Analyzed -> Verification Requested -> Verified -> Assigned ->
 * Action Initiated -> Resolved.
 * `mode="explainer"` renders the static landing-page version.
 */
export type Stage =
  | "reported"
  | "ai_analyzed"
  | "under_verification"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export const STAGES: { stage: Stage; label: string; blurb: string; icon: typeof FileText }[] = [
  { stage: "reported", label: "Reported", blurb: "A citizen submits location, photos and a description from the field.", icon: FileText },
  { stage: "ai_analyzed", label: "AI Analyzed", blurb: "An assessment suggests a possible issue, cause and severity — as a hint, not a verdict.", icon: Sparkles },
  { stage: "under_verification", label: "Verification Requested", blurb: "The report enters the field verification queue with its evidence intact.", icon: ClipboardList },
  { stage: "verified", label: "Verified", blurb: "A field verifier confirms or rejects the report on site, with notes.", icon: ShieldCheck },
  { stage: "assigned", label: "Assigned", blurb: "The verified issue is routed to the department responsible for it.", icon: UserCheck },
  { stage: "in_progress", label: "Action Initiated", blurb: "The department records what it is doing and when it started.", icon: Hammer },
  { stage: "resolved", label: "Resolved", blurb: "Closure requires evidence, so resolution is visible and checkable.", icon: CheckCircle2 },
];

const ICONS: Record<Stage, typeof FileText> = {
  reported: FileText,
  ai_analyzed: Sparkles,
  under_verification: ClipboardList,
  verified: ShieldCheck,
  assigned: UserCheck,
  in_progress: Hammer,
  resolved: CheckCircle2,
  rejected: XCircle,
};

function stageTone(stage: Stage) {
  if (stage === "resolved") return "text-status-resolved border-status-resolved bg-status-resolved/10";
  if (stage === "rejected") return "text-status-rejected border-status-rejected bg-status-rejected/10";
  if (stage === "ai_analyzed") return "text-ai border-ai bg-ai/10";
  if (stage === "in_progress") return "text-status-progress border-status-progress bg-status-progress/10";
  if (stage === "assigned") return "text-status-assigned border-status-assigned bg-status-assigned/10";
  if (stage === "verified") return "text-status-verified border-status-verified bg-status-verified/10";
  if (stage === "under_verification")
    return "text-status-verification border-status-verification bg-status-verification/10";
  return "text-primary border-primary bg-primary/10";
}

export function Timeline({ events, current }: { events: TimelineEvent[]; current?: string }) {
  const reached = new Set(events.map((e) => e.stage));
  const remaining = STAGES.filter(
    (s) => !reached.has(s.stage as never) && !reached.has("rejected" as never),
  );

  return (
    <ol className="relative">
      {events.map((e, i) => {
        const Icon = ICONS[e.stage as Stage] ?? FileText;
        const isLast = i === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                  stageTone(e.stage as Stage),
                  isLast && current !== "done" && "ring-4 ring-primary/10",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {(!isLast || remaining.length > 0) && (
                <span className="w-px flex-1 bg-border" aria-hidden />
              )}
            </div>
            <div className="-mt-0.5 pb-1">
              <p className="text-sm font-semibold">{e.label}</p>
              <p className="data-mono mt-0.5 text-muted-foreground">{formatDateTime(e.at)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.actor}</p>
              {e.note ? <p className="mt-1 text-sm">{e.note}</p> : null}
            </div>
          </li>
        );
      })}

      {remaining.map((s, i) => (
        <li key={s.stage} className="relative flex gap-4 pb-6 last:pb-0 opacity-45">
          <div className="flex flex-col items-center">
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground">
              <s.icon className="h-4 w-4" aria-hidden />
            </span>
            {i < remaining.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
          </div>
          <div className="-mt-0.5">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Not yet reached</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Static explainer variant used on the landing page and How It Works. */
export function TimelineExplainer() {
  return (
    <ol className="relative grid gap-0">
      {STAGES.map((s, i) => (
        <li key={s.stage} className="relative flex gap-5 pb-8 last:pb-0">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2",
                stageTone(s.stage),
              )}
            >
              <s.icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            {i < STAGES.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden />}
          </div>
          <div className="pt-1.5">
            <div className="flex items-baseline gap-2">
              <span className="data-mono text-muted-foreground">0{i + 1}</span>
              <h3 className="text-base font-semibold">{s.label}</h3>
            </div>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">{s.blurb}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
