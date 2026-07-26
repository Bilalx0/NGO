import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ORG_ADMIN', 'STAFF'], {
    required_error: 'Please select a role',
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;