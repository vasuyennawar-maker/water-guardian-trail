import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Issue } from "@/types";
import { CATEGORY_LABEL, relativeAge } from "@/utils/format";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";

export function IssueCard({ issue, compact }: { issue: Issue; compact?: boolean }) {
  return (
    <Link
      to="/reports/$id"
      params={{ id: issue.id }}
      className="surface-card block p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="data-mono text-muted-foreground">{issue.id}</p>
          <h3 className="mt-1 text-sm font-semibold">{issue.title}</h3>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden /> {issue.waterBodyName} · {issue.locationLabel}
          </p>
        </div>
        <StatusBadge status={issue.status} size="sm" />
      </div>

      {!compact ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{issue.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
        <SeverityBadge severity={issue.severity} />
        <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[issue.category]}</span>
        <span className="ml-auto data-mono text-muted-foreground">{relativeAge(issue.reportedAt)}</span>
      </div>
    </Link>
  );
}
