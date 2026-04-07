import { z } from 'zod';

export const createAppointmentSchema = z.object({
    scheduledFor: z
        .string({ message: 'Please select a date and time' })
        .min(1, 'Please select a date and time')
        .refine(
            function (val) {
                return new Date(val) > new Date();
            },
            { message: 'Appointment must be scheduled in the future' }
        ),
    type: z.enum(['DROP_OFF', 'PICKUP', 'INSPECTION']).default('DROP_OFF'),
    notes: z.string().trim().optional().or(z.literal(''))
});
