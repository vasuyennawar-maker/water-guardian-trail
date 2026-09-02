import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { NotificationPanel } from "@/components/common/NotificationPanel";
import { CardListSkeleton, ErrorState } from "@/components/common/States";
import { useAsync } from "@/hooks/useAsync";
import { notificationService } from "@/services/api/notificationService";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Digital Water Genome Nashik" },
      { name: "description", content: "Status changes, assignments and assessment updates on the water body reports you follow." },
      { property: "og:title", content: "Notifications — Digital Water Genome Nashik" },
      { property: "og:description", content: "Status changes, assignments and assessment updates on the water body reports you follow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, loading, error, retry, offline } = useAsync(() => notificationService.list(), []);
  return (
    <PageLayout allow={["citizen","verifier","authority","admin"]} title="Notifications" lead="Every change of stage on reports you follow.">
      {loading ? <CardListSkeleton rows={4} /> : null}
      {error ? <ErrorState message={error} onRetry={retry} offline={offline} /> : null}
      {data ? <NotificationPanel items={data} onMarkAllRead={() => { void notificationService.markAllRead(); toast.success("All notifications marked read"); }} /> : null}
    </PageLayout>
  );
}
