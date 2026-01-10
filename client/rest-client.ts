import axios, { AxiosInstance } from 'axios';

export interface CheckRequest {
  key: string;
  endpoint?: string;
  ruleId?: string;
  algorithm?: 'token_bucket' | 'fixed_window' | 'sliding_window';
  limit?: number;
  window?: number;
}

export interface CheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfter?: number;
  currentUsage: number;
}

export interface Rule {
  id: string;
  name: string;
  algorithm: 'token_bucket' | 'fixed_window' | 'sliding_window';
  limit: number;
  window: number;
  keys: Array<{ type: string; value: string }>;
  webhookUrl?: string;
  thresholds: number[];
  enabled: boolean;
}

export interface CreateRuleRequest {
  name: string;
  algorithm: 'token_bucket' | 'fixed_window' | 'sliding_window';
  limit: number;
  window: number;
  keys: Array<{ type: string; value: string }>;
  webhookUrl?: string;
  thresholds?: number[];
  enabled?: boolean;
}

/**
 * REST client for Rate Limiter Service
 */
export class RateLimiterClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if a request is allowed
   */
  async check(request: CheckRequest): Promise<CheckResult> {
    const response = await this.client.post<CheckResult>('/v1/check', request);
    return response.data;
  }

  /**
   * Create a new rate limit rule
   */
  async createRule(rule: CreateRuleRequest): Promise<Rule> {
    const response = await this.client.post<Rule>('/v1/rules', rule);
    return response.data;
  }

  /**
   * Get a rule by ID
   */
  async getRule(id: string): Promise<Rule> {
    const response = await this.client.get<Rule>(`/v1/rules/${id}`);
    return response.data;
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<Rule[]> {
    const response = await this.client.get<{ rules: Rule[] }>('/v1/rules');
    return response.data.rules;
  }

  /**
   * Update a rule
   */
  async updateRule(id: string, update: Partial<CreateRuleRequest>): Promise<Rule> {
    const response = await this.client.put<Rule>(`/v1/rules/${id}`, update);
    return response.data;
  }

  /**
   * Delete a rule
   */
  async deleteRule(id: string): Promise<void> {
    await this.client.delete(`/v1/rules/${id}`);
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; redis: string }> {
    const response = await this.client.get('/v1/health');
    return response.data;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    public retryAfter: number,
    public limit: number,
    public resetAt: string
  ) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
  }
}

/**
 * Helper function to check rate limit and throw error if exceeded
 */
export async function checkRateLimit(
  client: RateLimiterClient,
  request: CheckRequest
): Promise<void> {
  const result = await client.check(request);
  
  if (!result.allowed) {
    throw new RateLimitError(
      result.retryAfter || 0,
      result.limit,
      result.resetAt
    );
  }
}
