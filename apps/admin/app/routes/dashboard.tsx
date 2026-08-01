import { PageHeader } from "@repo/ui/page-header";
import { Card } from "@repo/ui/card";
import { BRAND_NAME } from "@repo/utils/brand";

export default function Dashboard() {
  return (
    <>
      <title>Dashboard | {BRAND_NAME} Admin</title>
      <PageHeader title="Dashboard" className="mb-4" />
      <Card>
        <p className="text-neutral/60">
          Welcome to the admin dashboard. This is where your content will live.
        </p>
      </Card>
    </>
  );
}
