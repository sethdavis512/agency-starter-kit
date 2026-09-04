import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AppLink } from "@repo/ui/app-link";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Container } from "@repo/ui/container";
import { BRAND_NAME } from "@repo/utils/brand";
import { useNonce } from "@repo/utils/nonce";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  // Set by entry.server.tsx; matches the `nonce-…` in the CSP header so the
  // inline scripts below are allowed to run.
  const nonce = useNonce();

  return (
    <html lang="en" className="h-screen">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/**
 * Shown when `requireAdmin` rejects a signed-in account without the admin
 * role. Root-level error boundaries render outside the site layout, so this
 * page carries its own container and a sign-out link.
 */
function ForbiddenPage() {
  return (
    <>
      <title>Admin access required | {BRAND_NAME} Admin</title>
      <Container className="flex min-h-screen items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>You need an admin account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral/60">
            <p>
              You are signed in, but this account does not have the admin role,
              so it cannot access the {BRAND_NAME} admin portal.
            </p>
            <p>
              Admin accounts are created by an administrator with{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-neutral">
                cli user:create --role admin
              </code>
              . Sign out to switch accounts.
            </p>
          </CardContent>
          <CardFooter>
            <AppLink to="/sign-out">
              <Button variant="primary">Sign Out</Button>
            </AppLink>
          </CardFooter>
        </Card>
      </Container>
    </>
  );
}

/**
 * Last-resort boundary. Root-level error boundaries render outside the site
 * layout, so this page carries its own container and a way back home. Stack
 * traces are dev-only; production users only ever see the generic copy while
 * the real error is logged by `handleError` in entry.server.tsx.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let details = "An unexpected error occurred. Please try again.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 403) {
      return <ForbiddenPage />;
    }

    title = error.status === 404 ? "404" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <>
      <title>{`${title} | ${BRAND_NAME} Admin`}</title>
      <Container className="flex min-h-screen items-center justify-center py-8">
        <Card className={stack ? "w-full max-w-3xl" : "w-full max-w-md"}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral/60">
            <p>{details}</p>
            {stack && (
              <pre className="overflow-x-auto rounded bg-muted p-4 text-xs text-neutral">
                <code>{stack}</code>
              </pre>
            )}
          </CardContent>
          <CardFooter>
            <AppLink to="/">
              <Button variant="primary">Back to home</Button>
            </AppLink>
          </CardFooter>
        </Card>
      </Container>
    </>
  );
}
