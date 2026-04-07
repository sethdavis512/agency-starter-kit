import {
    PrismaClient,
    RepairStatus,
    PaymentMethod,
    AppointmentType,
    AppointmentStatus
} from '@prisma/client';
import { auth } from '@repo/auth/server';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'asdfasdf';

const users = [
    { email: 'seth@mail.com', name: 'Seth Davis', role: 'admin' },
    {
        email: 'diana.martinez@example.com',
        name: 'Diana Martinez',
        role: 'admin'
    },
    { email: 'ethan.brown@example.com', name: 'Ethan Brown', role: 'user' },
    { email: 'fiona.wilson@example.com', name: 'Fiona Wilson', role: 'user' },
    { email: 'george.taylor@example.com', name: 'George Taylor', role: 'user' },
    {
        email: 'hannah.anderson@example.com',
        name: 'Hannah Anderson',
        role: 'user'
    },
    { email: 'ivan.thomas@example.com', name: 'Ivan Thomas', role: 'user' },
    { email: 'julia.jackson@example.com', name: 'Julia Jackson', role: 'user' },
    { email: 'kevin.white@example.com', name: 'Kevin White', role: 'user' },
    { email: 'laura.harris@example.com', name: 'Laura Harris', role: 'user' },
    { email: 'marcus.clark@example.com', name: 'Marcus Clark', role: 'user' },
    { email: 'nina.lewis@example.com', name: 'Nina Lewis', role: 'user' },
    {
        email: 'oscar.robinson@example.com',
        name: 'Oscar Robinson',
        role: 'user'
    },
    {
        email: 'patricia.walker@example.com',
        name: 'Patricia Walker',
        role: 'user'
    },
    { email: 'quinn.hall@example.com', name: 'Quinn Hall', role: 'user' },
    { email: 'rachel.allen@example.com', name: 'Rachel Allen', role: 'user' },
    { email: 'samuel.young@example.com', name: 'Samuel Young', role: 'user' },
    { email: 'tina.king@example.com', name: 'Tina King', role: 'user' },
    {
        email: 'ulysses.wright@example.com',
        name: 'Ulysses Wright',
        role: 'user'
    },
    {
        email: 'victoria.lopez@example.com',
        name: 'Victoria Lopez',
        role: 'user'
    }
];

async function seed() {
    console.log(`Seeding ${users.length} users...`);

    let created = 0;
    let skipped = 0;
    const createdUsers: { id: string; email: string; role: string }[] = [];

    for (const user of users) {
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
        });

        if (existingUser) {
            skipped++;
            createdUsers.push({
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role
            });
            continue;
        }

        const result = await auth.api.signUpEmail({
            body: {
                name: user.name,
                email: user.email,
                password: DEFAULT_PASSWORD
            }
        });

        if (result.user) {
            await prisma.user.update({
                where: { id: result.user.id },
                data: { role: user.role }
            });
            createdUsers.push({
                id: result.user.id,
                email: user.email,
                role: user.role
            });
            created++;
        }
    }

    console.log(`Done: ${created} created, ${skipped} already existed.`);

    // Use the first 10 non-admin users for vehicles
    const sampleUsers = createdUsers
        .filter((u) => u.role === 'user')
        .slice(0, 10);

    const vehicleData = [
        {
            year: 2019,
            make: 'Toyota',
            model: 'Camry',
            color: 'Silver',
            vin: '1HGBH41JXMN109186'
        },
        {
            year: 2021,
            make: 'Honda',
            model: 'Civic',
            color: 'Blue',
            vin: '2HGFC2F59MH522344'
        },
        {
            year: 2017,
            make: 'Ford',
            model: 'F-150',
            color: 'Black',
            vin: '1FTEW1EP5HFA12345'
        },
        { year: 2020, make: 'Chevrolet', model: 'Malibu', color: 'White' },
        { year: 2022, make: 'Hyundai', model: 'Tucson', color: 'Red' },
        { year: 2018, make: 'Nissan', model: 'Altima', color: 'Gray' },
        { year: 2023, make: 'Kia', model: 'Sorento', color: 'Green' },
        { year: 2016, make: 'BMW', model: '3 Series', color: 'Black' },
        { year: 2020, make: 'Subaru', model: 'Outback', color: 'Blue' },
        { year: 2015, make: 'Jeep', model: 'Wrangler', color: 'Orange' }
    ];

    console.log('Seeding vehicles...');
    const vehicles = [];
    for (let i = 0; i < sampleUsers.length; i++) {
        const vehicle = await prisma.vehicle.create({
            data: { ...vehicleData[i], userId: sampleUsers[i].id }
        });
        vehicles.push(vehicle);
    }

    // Add more vehicles for users with multiple cars
    const additionalVehicles = [
        {
            year: 2019,
            make: 'Mazda',
            model: 'CX-5',
            color: 'Blue',
            userId: sampleUsers[0].id
        },
        {
            year: 2022,
            make: 'Tesla',
            model: 'Model 3',
            color: 'White',
            userId: sampleUsers[1].id
        },
        {
            year: 2018,
            make: 'Volkswagen',
            model: 'Jetta',
            color: 'Silver',
            userId: sampleUsers[2].id
        }
    ];

    for (const vehicleData of additionalVehicles) {
        const vehicle = await prisma.vehicle.create({ data: vehicleData });
        vehicles.push(vehicle);
    }

    console.log(`Created ${vehicles.length} vehicles.`);

    // Seed repairs in various statuses with historical data
    const now = new Date();
    const daysAgo = (days: number) =>
        new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const daysFromNow = (days: number) =>
        new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const repairData: {
        description: string;
        notes?: string;
        status: RepairStatus;
        quoteAmount?: number;
        quoteDescription?: string;
        quoteApprovedAt?: Date;
        scheduledDropOff?: Date;
        scheduledPickup?: Date;
        estimatedCompletion?: Date;
        createdAt?: Date;
        vehicleId?: string;
        userId?: string;
    }[] = [
        // User 0 (Bob Smith) - Multiple repair history
        {
            description: 'Oil change and tire rotation - 30k mile service',
            status: RepairStatus.PAID,
            quoteAmount: 89,
            quoteDescription: 'Full synthetic oil change + tire rotation',
            quoteApprovedAt: daysAgo(90),
            scheduledDropOff: daysAgo(91),
            scheduledPickup: daysAgo(90),
            notes: 'Used 5W-30 synthetic. Tires rotated front to back. All fluids topped off.',
            createdAt: daysAgo(95),
            vehicleId: vehicles[0].id,
            userId: sampleUsers[0].id
        },
        {
            description: 'AC not blowing cold air',
            status: RepairStatus.PAID,
            quoteAmount: 450,
            quoteDescription: 'Recharge AC system and replace compressor belt',
            quoteApprovedAt: daysAgo(60),
            scheduledDropOff: daysAgo(58),
            scheduledPickup: daysAgo(58),
            notes: 'Recharged system. Belt replaced. System operating at optimal temperature.',
            createdAt: daysAgo(65),
            vehicleId: vehicles[0].id,
            userId: sampleUsers[0].id
        },
        {
            description:
                'Check engine light on, code P0301 - misfire cylinder 1',
            status: RepairStatus.IN_PROGRESS,
            quoteAmount: 275,
            quoteDescription:
                'Replace ignition coil pack cylinder 1 and spark plugs',
            quoteApprovedAt: daysAgo(2),
            scheduledDropOff: daysAgo(1),
            estimatedCompletion: daysFromNow(1),
            notes: 'Coil pack ordered, arriving tomorrow. Will complete by end of day.',
            createdAt: daysAgo(3),
            vehicleId: vehicles[0].id,
            userId: sampleUsers[0].id
        },
        {
            description: 'Brake pads worn, squealing when stopping',
            status: RepairStatus.QUOTED,
            quoteAmount: 385,
            quoteDescription:
                'Replace front and rear brake pads and resurface rotors',
            scheduledDropOff: daysFromNow(7),
            createdAt: daysAgo(2),
            vehicleId: vehicles[0].id,
            userId: sampleUsers[0].id
        },

        // User 1 (Charlie Davis) - Multiple repairs on different vehicles
        {
            description: 'Transmission fluid flush',
            status: RepairStatus.PAID,
            quoteAmount: 200,
            quoteDescription:
                'Full transmission fluid flush and filter replacement',
            quoteApprovedAt: daysAgo(120),
            scheduledDropOff: daysAgo(118),
            scheduledPickup: daysAgo(118),
            notes: 'Fluid was very dark. Recommend next flush at 60k miles.',
            createdAt: daysAgo(125),
            vehicleId: vehicles[1].id,
            userId: sampleUsers[1].id
        },
        {
            description: 'Replace worn wiper blades',
            status: RepairStatus.PAID,
            quoteAmount: 45,
            quoteDescription: 'Replace front wiper blades with premium blades',
            quoteApprovedAt: daysAgo(75),
            notes: 'Installed Bosch Icon blades per customer request.',
            createdAt: daysAgo(76),
            vehicleId: vehicles[1].id,
            userId: sampleUsers[1].id
        },
        {
            description: '60k mile major service',
            status: RepairStatus.COMPLETED,
            quoteAmount: 525,
            quoteDescription:
                'Oil change, tire rotation, brake inspection, fluid top-off, filter replacements',
            quoteApprovedAt: daysAgo(15),
            scheduledDropOff: daysAgo(10),
            scheduledPickup: daysAgo(10),
            notes: 'All major service items completed. Vehicle in excellent condition.',
            createdAt: daysAgo(20),
            vehicleId: vehicles[1].id,
            userId: sampleUsers[1].id
        },
        {
            description: 'Tesla battery diagnostics and software update',
            status: RepairStatus.APPROVED,
            quoteAmount: 150,
            quoteDescription: 'Battery health check and firmware update',
            quoteApprovedAt: daysAgo(1),
            scheduledDropOff: daysFromNow(3),
            estimatedCompletion: daysFromNow(3),
            createdAt: daysAgo(5),
            vehicleId: vehicles[11].id,
            userId: sampleUsers[1].id
        },

        // User 2 (Ethan Brown) - Under warranty repair and pending issue
        {
            description: 'Recall repair - fuel pump replacement',
            status: RepairStatus.PAID,
            quoteAmount: 0,
            quoteDescription: 'Replace fuel pump under manufacturer recall',
            quoteApprovedAt: daysAgo(45),
            scheduledDropOff: daysAgo(40),
            scheduledPickup: daysAgo(40),
            notes: 'Completed under recall. No charge to customer.',
            createdAt: daysAgo(50),
            vehicleId: vehicles[2].id,
            userId: sampleUsers[2].id
        },
        {
            description: 'Engine making rattling noise at idle',
            status: RepairStatus.PENDING,
            notes: 'Customer reports noise started 2 days ago. Need to diagnose.',
            createdAt: daysAgo(1),
            vehicleId: vehicles[2].id,
            userId: sampleUsers[2].id
        },
        {
            description: 'VW timing belt replacement - 100k mile service',
            status: RepairStatus.QUOTED,
            quoteAmount: 1250,
            quoteDescription: 'Replace timing belt, water pump, and tensioners',
            notes: 'Critical maintenance at 100k miles. Recommended not to delay.',
            createdAt: daysAgo(7),
            vehicleId: vehicles[12].id,
            userId: sampleUsers[2].id
        },

        // User 3 (Fiona Wilson)
        {
            description: 'Annual state inspection',
            status: RepairStatus.PAID,
            quoteAmount: 35,
            quoteDescription: 'Annual safety and emissions inspection',
            quoteApprovedAt: daysAgo(180),
            notes: 'Passed inspection.',
            createdAt: daysAgo(182),
            vehicleId: vehicles[3].id,
            userId: sampleUsers[3].id
        },
        {
            description: "Replace battery - car won't start",
            status: RepairStatus.PAID,
            quoteAmount: 185,
            quoteDescription: 'Replace battery and test alternator',
            quoteApprovedAt: daysAgo(30),
            scheduledDropOff: daysAgo(28),
            notes: 'Battery tested dead. Alternator functioning properly.',
            createdAt: daysAgo(32),
            vehicleId: vehicles[3].id,
            userId: sampleUsers[3].id
        },
        {
            description: 'Alignment after hitting pothole',
            status: RepairStatus.IN_PROGRESS,
            quoteAmount: 120,
            quoteDescription: 'Four wheel alignment',
            quoteApprovedAt: daysAgo(1),
            scheduledDropOff: daysAgo(0),
            estimatedCompletion: daysFromNow(0),
            notes: 'In progress. Should be done by end of day.',
            createdAt: daysAgo(2),
            vehicleId: vehicles[3].id,
            userId: sampleUsers[3].id
        },

        // User 4 (George Taylor)
        {
            description: 'Headlight bulb replacement - driver side',
            status: RepairStatus.PAID,
            quoteAmount: 55,
            quoteDescription: 'Replace driver side headlight bulb',
            quoteApprovedAt: daysAgo(100),
            notes: 'LED bulb installed.',
            createdAt: daysAgo(101),
            vehicleId: vehicles[4].id,
            userId: sampleUsers[4].id
        },
        {
            description: 'Coolant leak inspection',
            status: RepairStatus.COMPLETED,
            quoteAmount: 425,
            quoteDescription: 'Replace radiator hose and top off coolant',
            quoteApprovedAt: daysAgo(8),
            scheduledDropOff: daysAgo(5),
            scheduledPickup: daysAgo(5),
            notes: 'Found cracked upper radiator hose. Replaced and pressure tested system.',
            createdAt: daysAgo(12),
            vehicleId: vehicles[4].id,
            userId: sampleUsers[4].id
        },

        // User 5 (Hannah Anderson) - Scheduled future appointment
        {
            description: 'Pre-purchase inspection for potential buyer',
            status: RepairStatus.PAID,
            quoteAmount: 150,
            quoteDescription: 'Comprehensive pre-purchase inspection',
            quoteApprovedAt: daysAgo(14),
            notes: 'Full inspection completed. Report provided to customer.',
            createdAt: daysAgo(16),
            vehicleId: vehicles[5].id,
            userId: sampleUsers[5].id
        },
        {
            description: 'Oil change and multi-point inspection',
            status: RepairStatus.APPROVED,
            quoteAmount: 75,
            quoteDescription: 'Conventional oil change with inspection',
            quoteApprovedAt: now,
            scheduledDropOff: daysFromNow(5),
            scheduledPickup: daysFromNow(5),
            estimatedCompletion: daysFromNow(5),
            createdAt: daysAgo(3),
            vehicleId: vehicles[5].id,
            userId: sampleUsers[5].id
        },

        // Additional users with single repairs
        {
            description: 'Exhaust system repair - loud noise',
            status: RepairStatus.IN_PROGRESS,
            quoteAmount: 350,
            quoteDescription: 'Replace muffler and exhaust pipe section',
            quoteApprovedAt: daysAgo(1),
            estimatedCompletion: daysFromNow(2),
            notes: 'Parts on order. Should arrive tomorrow.',
            createdAt: daysAgo(4),
            vehicleId: vehicles[6].id,
            userId: sampleUsers[6].id
        },
        {
            description: 'Replace cabin air filter - musty smell',
            status: RepairStatus.QUOTED,
            quoteAmount: 35,
            quoteDescription: 'Replace cabin air filter',
            createdAt: daysAgo(1),
            vehicleId: vehicles[7].id,
            userId: sampleUsers[7].id
        },
        {
            description: 'Suspension noise diagnosis',
            status: RepairStatus.PENDING,
            notes: 'Customer reports clunking noise over bumps.',
            createdAt: daysAgo(0),
            vehicleId: vehicles[8].id,
            userId: sampleUsers[8].id
        },
        {
            description: 'Customer changed mind about transmission repair',
            status: RepairStatus.CANCELLED,
            quoteAmount: 2500,
            quoteDescription: 'Transmission rebuild',
            createdAt: daysAgo(20),
            vehicleId: vehicles[9].id,
            userId: sampleUsers[9].id
        }
    ];

    console.log('Seeding repairs...');
    const repairs = [];
    for (const data of repairData) {
        const repair = await prisma.repair.create({ data });
        repairs.push(repair);
    }
    console.log(`Created ${repairs.length} repairs.`);

    // Add transactions for PAID repairs
    const paidRepairs = repairs.filter((r) => r.status === RepairStatus.PAID);
    console.log('Seeding transactions...');
    const paymentMethods = [
        PaymentMethod.CARD,
        PaymentMethod.CASH,
        PaymentMethod.CHECK,
        PaymentMethod.CARD,
        PaymentMethod.CARD
    ];
    for (let i = 0; i < paidRepairs.length; i++) {
        const repair = paidRepairs[i];
        await prisma.transaction.create({
            data: {
                amount: repair.quoteAmount ?? 100,
                method: paymentMethods[i % paymentMethods.length],
                repairId: repair.id
            }
        });
    }
    console.log(`Created ${paidRepairs.length} transactions.`);

    // Seed appointments
    console.log('Seeding appointments...');
    const appointmentData = [
        {
            scheduledFor: daysFromNow(1),
            type: AppointmentType.DROP_OFF,
            status: AppointmentStatus.CONFIRMED,
            notes: 'Customer will arrive around 9am',
            userId: sampleUsers[0].id,
            vehicleId: vehicles[0].id,
            repairId: repairs[3].id
        },
        {
            scheduledFor: daysFromNow(2),
            type: AppointmentType.INSPECTION,
            status: AppointmentStatus.SCHEDULED,
            notes: 'New customer - first visit',
            userId: sampleUsers[1].id,
            vehicleId: vehicles[1].id
        },
        {
            scheduledFor: daysFromNow(3),
            type: AppointmentType.DROP_OFF,
            status: AppointmentStatus.SCHEDULED,
            notes: 'Pre-approved oil change appointment',
            userId: sampleUsers[5].id,
            vehicleId: vehicles[5].id,
            repairId: repairs[17].id
        },
        {
            scheduledFor: daysAgo(1),
            type: AppointmentType.PICKUP,
            status: AppointmentStatus.COMPLETED,
            notes: 'Vehicle ready at bay 3',
            userId: sampleUsers[3].id,
            vehicleId: vehicles[3].id
        },
        {
            scheduledFor: daysAgo(2),
            type: AppointmentType.DROP_OFF,
            status: AppointmentStatus.COMPLETED,
            userId: sampleUsers[2].id,
            vehicleId: vehicles[2].id,
            repairId: repairs[9].id
        },
        {
            scheduledFor: daysAgo(3),
            type: AppointmentType.DROP_OFF,
            status: AppointmentStatus.NO_SHOW,
            userId: sampleUsers[4].id,
            vehicleId: vehicles[4].id
        },
        {
            scheduledFor: daysFromNow(0),
            type: AppointmentType.DROP_OFF,
            status: AppointmentStatus.IN_PROGRESS,
            notes: 'Customer dropped off at 8am, exhaust repair in progress',
            userId: sampleUsers[6].id,
            vehicleId: vehicles[6].id,
            repairId: repairs[18].id
        },
        {
            scheduledFor: daysFromNow(5),
            type: AppointmentType.INSPECTION,
            status: AppointmentStatus.SCHEDULED,
            notes: 'Annual inspection due',
            userId: sampleUsers[7].id,
            vehicleId: vehicles[7].id
        },
        {
            scheduledFor: daysAgo(5),
            type: AppointmentType.PICKUP,
            status: AppointmentStatus.CANCELLED,
            notes: 'Customer rescheduled',
            userId: sampleUsers[8].id,
            vehicleId: vehicles[8].id
        },
        {
            scheduledFor: daysFromNow(7),
            type: AppointmentType.DROP_OFF,
            status: AppointmentStatus.CONFIRMED,
            notes: 'Timing belt replacement - will need vehicle for 2 days',
            userId: sampleUsers[2].id,
            vehicleId: vehicles[12].id,
            repairId: repairs[10].id
        }
    ];

    for (const data of appointmentData) {
        await prisma.appointment.create({ data });
    }
    console.log(`Created ${appointmentData.length} appointments.`);
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
