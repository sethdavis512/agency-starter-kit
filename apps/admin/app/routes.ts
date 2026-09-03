import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

// No public sign-up on the admin app: admin accounts are created with
// `bun run cli user:create --role admin`.
export default [
  route("api/auth/*", "./routes/api-auth.tsx"),
  route("health", "./routes/health.tsx"),
  layout("./routes/site-layout.tsx", [
    index("routes/landing.tsx"),
    layout("./routes/protected-layout.tsx", [
      route("dashboard", "./routes/dashboard.tsx"),
      route("profile", "./routes/profile.tsx"),
    ]),
    route("sign-in", "./routes/sign-in.tsx"),
    route("sign-out", "./routes/sign-out.tsx"),
  ]),
] satisfies RouteConfig;
