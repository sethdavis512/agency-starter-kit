import { z } from 'zod';

export const createRepairSchema = z.object({
    description: z
        .string({ message: 'Description is required' })
        .trim()
        .min(1, 'Description is required'),
    notes: z.string().trim().optional().or(z.literal('')),
    userId: z.string().min(1, 'Customer is required'),
    vehicleId: z.string().min(1, 'Vehicle is required')
});

export const setQuoteSchema = z.object({
    quoteAmount: z
        .number({ message: 'Quote amount is required' })
        .positive('Quote amount must be positive'),
    quoteDescription: z
        .string({ message: 'Quote description is required' })
        .trim()
        .min(1, 'Quote description is required')
});

export const createTransactionSchema = z.object({
    amount: z
        .number({ message: 'Amount is required' })
        .positive('Amount must be positive'),
    method: z.enum(['CASH', 'CARD', 'CHECK', 'OTHER']).default('CASH'),
    note: z.string().trim().optional().or(z.literal(''))
});
