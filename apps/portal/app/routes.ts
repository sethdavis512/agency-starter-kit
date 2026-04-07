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
            index('routes/repairs.tsx'),
            route('repairs/:id', './routes/repair-detail.tsx'),
            route('vehicles', './routes/vehicles.tsx'),
            route('vehicles/new', './routes/vehicle-new.tsx'),
            route('vehicles/:id', './routes/vehicle-detail.tsx'),
            route('vehicles/:id/edit', './routes/vehicle-edit.tsx'),
            route(
                'vehicles/:id/appointments/new',
                './routes/vehicle-new-appointment.tsx'
            ),
            route('appointments', './routes/appointments.tsx'),
            route('appointments/new', './routes/appointment-new.tsx'),
            route('notifications', './routes/notifications.tsx'),
            route('profile', './routes/profile.tsx')
        ]),
        route('signin', './routes/signin.tsx'),
        route('signup', './routes/signup.tsx'),
        route('signout', './routes/signout.tsx')
    ])
] satisfies RouteConfig;
