import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/layouts/PageLayout";
import { ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsync } from "@/hooks/useAsync";
import { userService } from "@/services/api/userService";
import { ROLE_LABEL } from "@/hooks/useRole";
import { formatDate } from "@/utils/format";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Digital Water Genome Nashik" },
      { name: "description", content: "Your account details and reporting history on the Nashik water body platform." },
      { property: "og:title", content: "Profile — Digital Water Genome Nashik" },
      { property: "og:description", content: "Your account details and reporting history on the Nashik water body platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, loading, error, retry } = useAsync(() => userService.profile(), []);
  if (loading) return <PageLayout><Skeleton className="h-64 w-full rounded-[10px]" /></PageLayout>;
  if (error || !data) return <PageLayout><ErrorState message={error ?? "Profile unavailable."} onRetry={retry} /></PageLayout>;

  return (
    <PageLayout title="Profile" lead="Your account details.">
      <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
        <form className="surface-card space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }}>
          <div><Label htmlFor="n">Name</Label><Input id="n" defaultValue={data.name} className="mt-1.5 rounded-[6px]" /></div>
          <div><Label htmlFor="e">Email</Label><Input id="e" defaultValue={data.email} className="mt-1.5 rounded-[6px]" /></div>
          <Button type="submit" className="rounded-[6px]">Save changes</Button>
        </form>
        <div className="surface-card h-fit p-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Role</dt><dd>{ROLE_LABEL[data.role]}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Member since</dt><dd className="data-mono">{formatDate(data.joinedAt)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Reports filed</dt><dd>{data.reportsSubmitted ?? 0}</dd></div>
          </dl>
        </div>
      </div>
    </PageLayout>
  );
}
