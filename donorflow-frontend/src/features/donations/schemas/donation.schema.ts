import { z } from 'zod';

export const recordDonationSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least 1'),
  currency: z.string().default('PKR'),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  donorId: z.coerce.number().optional(),
  campaignId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type RecordDonationInput = z.infer<typeof recordDonationSchema>;

export const donationFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  campaignId: z.coerce.number().optional(),
  paymentMethod: z.string().optional(),
});

export type DonationFiltersInput = z.infer<typeof donationFiltersSchema>;