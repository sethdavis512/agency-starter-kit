import { PageHeader } from "@repo/ui/page-header";
import { Card } from "@repo/ui/card";
import { BRAND_NAME } from "@repo/utils/brand";

export default function Dashboard() {
  return (
    <>
      <title>Dashboard | {BRAND_NAME}</title>
      <PageHeader title="Dashboard" className="mb-4" />
      <Card>
        <p className="text-neutral/60">
          Welcome to your dashboard. This is where your content will live.
        </p>
      </Card>
    </>
  );
}
