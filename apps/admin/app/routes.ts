import {
    type RouteConfig,
    index,
    layout,
    route
} from '@react-router/dev/routes';

export default [
    route('api/auth/*', './routes/api-auth.tsx'),
    layout('./routes/site-layout.tsx', [
        layout('./routes/protected-layout.tsx', [
            index('routes/dashboard.tsx'),
            route('profile', './routes/profile.tsx')
        ]),
        route('signin', './routes/signin.tsx'),
        route('signup', './routes/signup.tsx'),
        route('signout', './routes/signout.tsx'),
        route('no-access', './routes/no-access.tsx')
    ])
] satisfies RouteConfig;
