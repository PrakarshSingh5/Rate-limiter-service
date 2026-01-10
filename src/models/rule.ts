import { z } from 'zod';

// Key configuration schema
export const KeyConfigSchema = z.object({
  type: z.enum(['user', 'ip', 'endpoint', 'custom']),
  value: z.string(), // specific value or "*" for all
});

export type KeyConfig = z.infer<typeof KeyConfigSchema>;

// Rate limit rule schema
export const RuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  algorithm: z.enum(['token_bucket', 'fixed_window', 'sliding_window']),
  limit: z.number().int().positive(),
  window: z.number().int().positive(), // in seconds
  keys: z.array(KeyConfigSchema).min(1),
  webhookUrl: z.string().url().optional(),
  thresholds: z.array(z.number().int().min(0).max(100)).default([80, 90, 100]),
  enabled: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Rule = z.infer<typeof RuleSchema>;

// Create rule request schema (without auto-generated fields)
export const CreateRuleSchema = RuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: z.string().uuid().optional(),
});

export type CreateRuleRequest = z.infer<typeof CreateRuleSchema>;

// Update rule request schema
export const UpdateRuleSchema = RuleSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type UpdateRuleRequest = z.infer<typeof UpdateRuleSchema>;
