import { z } from 'zod';

export const donorSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type DonorInput = z.infer<typeof donorSchema>;

export const donorFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type DonorFiltersInput = z.infer<typeof donorFiltersSchema>;