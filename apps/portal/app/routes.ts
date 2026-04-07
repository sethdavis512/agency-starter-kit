import {
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
