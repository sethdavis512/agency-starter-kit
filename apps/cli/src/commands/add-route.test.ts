import { describe, expect, it } from "vitest";
import { insertProtectedRoute, insertPublicRoute } from "./add-route";

const ROUTES_FIXTURE = `import {
    type RouteConfig,
    index,
    layout,
    route
} from '@react-router/dev/routes';

export default [
    route('api/auth/*', './routes/api-auth.tsx'),
    layout('./routes/site-layout.tsx', [
        index('routes/landing.tsx'),
        layout('./routes/protected-layout.tsx', [
            route('dashboard', './routes/dashboard.tsx'),
            route('profile', './routes/profile.tsx')
        ]),
        route('sign-in', './routes/sign-in.tsx'),
        route('sign-up', './routes/sign-up.tsx'),
        route('sign-out', './routes/sign-out.tsx')
    ])
] satisfies RouteConfig;
`;

describe("insertPublicRoute", () => {
  it("adds the new route as a sibling of sign-in/sign-out, not a child of protected-layout", () => {
    const updated = insertPublicRoute(
      ROUTES_FIXTURE,
      "route('settings', './routes/settings.tsx')"
    );

    expect(updated).not.toBeNull();

    // The protected-layout array itself is untouched by a public-route insert.
    const protectedBlock = updated!.match(
      /layout\('\.\/routes\/protected-layout\.tsx',\s*\[([\s\S]*?)\]\)/
    )?.[1];
    expect(protectedBlock).not.toContain("settings");

    // The new route must land as a sibling of sign-in/sign-out, after the
    // protected-layout array closes — not inside it.
    const protectedCloseIndex = updated!.indexOf("]),", updated!.indexOf("protected-layout"));
    const settingsIndex = updated!.indexOf("route('settings', './routes/settings.tsx')");
    expect(settingsIndex).toBeGreaterThan(protectedCloseIndex);
    expect(updated).toContain(
      "route('sign-out', './routes/sign-out.tsx'),\n        route('settings', './routes/settings.tsx')"
    );
  });

  it("preserves the existing routes", () => {
    const updated = insertPublicRoute(
      ROUTES_FIXTURE,
      "route('settings', './routes/settings.tsx')"
    );

    expect(updated).toContain("route('sign-in', './routes/sign-in.tsx')");
    expect(updated).toContain("route('dashboard', './routes/dashboard.tsx')");
  });
});

describe("insertProtectedRoute", () => {
  it("adds the new route inside protected-layout", () => {
    const updated = insertProtectedRoute(
      ROUTES_FIXTURE,
      "route('billing', './routes/billing.tsx')"
    );

    const protectedBlock = updated!.match(
      /layout\('\.\/routes\/protected-layout\.tsx',\s*\[([\s\S]*?)\]\)/
    )?.[1];
    expect(protectedBlock).toContain("route('billing', './routes/billing.tsx')");
  });
});
