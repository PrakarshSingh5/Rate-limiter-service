import { z } from 'zod';

// Rate limit check result schema
export const CheckResultSchema = z.object({
  allowed: z.boolean(),
  limit: z.number().int(),
  remaining: z.number().int(),
  resetAt: z.date(),
  retryAfter: z.number().int().optional(), // seconds until retry
  currentUsage: z.number().int(),
});

export type CheckResult = z.infer<typeof CheckResultSchema>;

// Rate limit check request schema
export const CheckRequestSchema = z.object({
  key: z.string().min(1),
  endpoint: z.string().optional(),
  ruleId: z.string().uuid().optional(),
  // Optional: specify algorithm and limits on-the-fly
  algorithm: z.enum(['token_bucket', 'fixed_window', 'sliding_window']).optional(),
  limit: z.number().int().positive().optional(),
  window: z.number().int().positive().optional(),
});

export type CheckRequest = z.infer<typeof CheckRequestSchema>;
