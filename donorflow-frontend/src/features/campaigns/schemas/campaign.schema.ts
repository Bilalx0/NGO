import { z } from 'zod';

export const CAMPAIGN_TYPES = [
  'DONATION',
  'ZAKAT',
  'SADQAH',
  'EMERGENCY_RELIEF',
  'EDUCATION',
  'HEALTHCARE',
  'FOOD_DRIVE',
  'OTHER',
] as const;

export const campaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  goalAmount: z.coerce.number().min(1, 'Goal amount must be at least 1'),
  category: z.string().optional(),
  bannerImageUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Completed']).default('Draft'),
  type: z.enum(CAMPAIGN_TYPES).default('DONATION'), // ✅ ADDED THIS
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const campaignFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Completed']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  type: z.enum(CAMPAIGN_TYPES).optional(), // ✅ Now uses shared constant
});

export type CampaignFiltersInput = z.infer<typeof campaignFiltersSchema>;