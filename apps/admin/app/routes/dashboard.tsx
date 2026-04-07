import { PageHeader } from '@repo/ui/page-header';
import { Card } from '@repo/ui/card';

export default function Dashboard() {
    return (
        <>
            <title>Dashboard | Stealthy Chicken Admin</title>
            <PageHeader title="Dashboard" className="mb-4" />
            <Card>
                <p className="text-neutral/60">
                    Welcome to the admin dashboard. This is where your content
                    will live.
                </p>
            </Card>
        </>
    );
}
