import { Card } from '@repo/ui/card';
import { ShieldX, ExternalLink } from '@repo/utils/icons';

const PORTAL_URL =
    typeof process !== 'undefined' && process.env.PORTAL_URL
        ? process.env.PORTAL_URL
        : 'http://localhost:5174';

export default function NoAccess() {
    return (
        <>
            <title>Access Denied | Stealthy Chicken</title>
            <div className="flex-1 flex items-center justify-center my-8">
                <Card className="max-w-md w-full text-center space-y-6 p-8">
                    <div className="flex justify-center">
                        <ShieldX className="h-16 w-16 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-zinc-600">
                        Your account does not have administrator privileges.
                        This area is restricted to admin users only.
                    </p>
                    <a
                        href={PORTAL_URL}
                        className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                        Go to Portal
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </Card>
            </div>
        </>
    );
}
