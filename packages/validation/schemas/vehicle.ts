import { z } from 'zod';

export const createVehicleSchema = z.object({
    year: z
        .number({ message: 'Year is required' })
        .int()
        .min(1900, 'Year must be 1900 or later')
        .max(
            new Date().getFullYear() + 2,
            'Year cannot be that far in the future'
        ),
    make: z
        .string({ message: 'Make is required' })
        .trim()
        .min(1, 'Make is required'),
    model: z
        .string({ message: 'Model is required' })
        .trim()
        .min(1, 'Model is required'),
    vin: z
        .string()
        .trim()
        .length(17, 'VIN must be exactly 17 characters')
        .optional()
        .or(z.literal('')),
    color: z.string().trim().optional().or(z.literal(''))
});
