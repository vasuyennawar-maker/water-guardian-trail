import { Sparkles } from "lucide-react";
import type { AIAssessment } from "@/types";
import { SEVERITY_LABEL, formatDateTime } from "@/utils/format";
import { SeverityBadge } from "./SeverityBadge";

/**
 * AI output is always presented as a hedged assessment, never a verdict.
 * Distinct accent border + "AI" chip so it can't be mistaken for verified fact.
 */
export function AIAnalysisCard({ assessment }: { assessment: AIAssessment }) {
  return (
    <section className="rounded-[10px] border border-ai/30 bg-ai-soft/60 p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-ai px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary-foreground">
            <Sparkles className="h-3 w-3" aria-hidden /> AI
          </span>
          <h3 className="text-sm font-semibold">AI assessment — not a verified finding</h3>
        </div>
        <span className="data-mono text-muted-foreground">
          {Math.round(assessment.confidence * 100)}% confidence
        </span>
      </header>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Possible issue
          </dt>
          <dd className="mt-1 text-sm">{assessment.possibleIssue}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Estimated severity
          </dt>
          <dd className="mt-1 flex items-center gap-2 text-sm">
            <SeverityBadge severity={assessment.estimatedSeverity} />
            <span className="text-muted-foreground">(estimate: {SEVERITY_LABEL[assessment.estimatedSeverity]})</span>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Possible cause
          </dt>
          <dd className="mt-1 text-sm">{assessment.possibleCause}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Reason
          </dt>
          <dd className="mt-1 text-sm text-muted-foreground">{assessment.reason}</dd>
        </div>
      </dl>

      <footer className="mt-4 border-t border-ai/20 pt-3">
        <p className="data-mono text-muted-foreground">
          {assessment.model} · {formatDateTime(assessment.generatedAt)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          A field verifier or department officer makes the final determination. This assessment only
          helps prioritise what to inspect first.
        </p>
      </footer>
    </section>
  );
}
