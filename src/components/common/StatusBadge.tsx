import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hammer,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { IssueStatus } from "@/types";
import { STATUS_LABEL } from "@/utils/format";
import { cn } from "@/lib/utils";

/** Status is never encoded by colour alone: pill + icon + text label. */
const CONFIG: Record<
  IssueStatus,
  { icon: typeof FileText; text: string; bg: string; border: string }
> = {
  reported: { icon: FileText, text: "text-status-reported", bg: "bg-muted", border: "border-border" },
  under_verification: {
    icon: ClipboardList,
    text: "text-status-verification",
    bg: "bg-status-verification/10",
    border: "border-status-verification/25",
  },
  verified: {
    icon: ShieldCheck,
    text: "text-status-verified",
    bg: "bg-status-verified/10",
    border: "border-status-verified/25",
  },
  assigned: {
    icon: UserCheck,
    text: "text-status-assigned",
    bg: "bg-status-assigned/10",
    border: "border-status-assigned/25",
  },
  in_progress: {
    icon: Hammer,
    text: "text-status-progress",
    bg: "bg-status-progress/10",
    border: "border-status-progress/25",
  },
  resolved: {
    icon: CheckCircle2,
    text: "text-status-resolved",
    bg: "bg-status-resolved/10",
    border: "border-status-resolved/25",
  },
  rejected: {
    icon: XCircle,
    text: "text-status-rejected",
    bg: "bg-status-rejected/10",
    border: "border-status-rejected/25",
  },
};

export function StatusBadge({
  status,
  className,
  size = "md",
}: {
  status: IssueStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const c = CONFIG[status] ?? CONFIG.reported;
  const Icon = c.icon ?? AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        c.bg,
        c.border,
        c.text,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
