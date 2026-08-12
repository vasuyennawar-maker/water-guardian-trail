import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, CircleAlert, Sparkles, UserCheck } from "lucide-react";
import type { AppNotification } from "@/types";
import { formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./States";
import { cn } from "@/lib/utils";

const ICON = { status: CircleAlert, assignment: UserCheck, system: Sparkles };

export function NotificationPanel({
  items,
  onMarkAllRead,
}: {
  items: AppNotification[];
  onMarkAllRead?: () => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="Updates on your reports — verification, assignment, action and resolution — will appear here."
      />
    );
  }

  return (
    <div className="surface-card divide-y divide-border">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold">
          {items.filter((i) => !i.read).length} unread
        </p>
        {onMarkAllRead ? (
          <Button variant="ghost" size="sm" className="rounded-[6px]" onClick={onMarkAllRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden /> Mark all read
          </Button>
        ) : null}
      </div>
      <ul>
        {items.map((n) => {
          const Icon = ICON[n.kind];
          const body = (
            <div className={cn("flex gap-3 px-4 py-3", !n.read && "bg-water/5")}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {n.title}
                  {!n.read ? <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-water align-middle" /> : null}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <p className="data-mono mt-1 text-muted-foreground">{formatDateTime(n.at)}</p>
              </div>
            </div>
          );
          return (
            <li key={n.id} className="border-b border-border last:border-0">
              {n.issueId ? (
                <Link to="/reports/$id" params={{ id: n.issueId }} className="block hover:bg-muted/40">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
