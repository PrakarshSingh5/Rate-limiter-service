import { Rule, CreateRuleRequest, UpdateRuleRequest, RuleSchema } from '../models/rule';
import { Storage } from '../storage/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory cache for rules
 * In production, this could be backed by a database
 */
class RuleCache {
  private rules: Map<string, Rule> = new Map();

  set(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  get(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  getAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  delete(id: string): boolean {
    return this.rules.delete(id);
  }

  findByKey(key: string, _endpoint?: string): Rule | undefined {
    return Array.from(this.rules.values()).find(rule => {
      if (!rule.enabled) return false;
      
      // Check if rule matches the key
      return rule.keys.some(keyConfig => {
        if (keyConfig.value === '*') return true;
        return key.includes(keyConfig.value);
      });
    });
  }
}

/**
 * Rule management service
 */
export class RuleService {
  private cache: RuleCache;

  constructor(private storage: Storage) {
    this.cache = new RuleCache();
  }

  /**
   * Create a new rate limit rule
   */
  async createRule(request: CreateRuleRequest): Promise<Rule> {
    const rule: Rule = {
      ...request,
      id: request.id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      enabled: request.enabled ?? true,
      thresholds: request.thresholds ?? [80, 90, 100],
    };

    // Validate with Zod
    const validated = RuleSchema.parse(rule);

    // Store in cache
    this.cache.set(validated);

    // Persist to Redis
    await this.storage.set(
      `rule:${validated.id}`,
      JSON.stringify(validated)
    );

    return validated;
  }

  /**
   * Get a rule by ID
   */
  async getRule(id: string): Promise<Rule | null> {
    // Check cache first
    let rule = this.cache.get(id);
    if (rule) return rule;

    // Fallback to Redis
    const data = await this.storage.get(`rule:${id}`);
    if (!data) return null;

    rule = JSON.parse(data) as Rule;
    if (!rule) return null;
    
    this.cache.set(rule);
    return rule;
  }

  /**
   * Get all rules
   */
  async getAllRules(): Promise<Rule[]> {
    return this.cache.getAll();
  }

  /**
   * Update a rule
   */
  async updateRule(id: string, update: UpdateRuleRequest): Promise<Rule | null> {
    const existing = await this.getRule(id);
    if (!existing) return null;

    const updated: Rule = {
      ...existing,
      ...update,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    // Validate
    const validated = RuleSchema.parse(updated);

    // Update cache
    this.cache.set(validated);

    // Update Redis
    await this.storage.set(
      `rule:${id}`,
      JSON.stringify(validated)
    );

    return validated;
  }

  /**
   * Delete a rule
   */
  async deleteRule(id: string): Promise<boolean> {
    const exists = await this.getRule(id);
    if (!exists) return false;

    // Remove from cache
    this.cache.delete(id);

    // Remove from Redis
    await this.storage.del(`rule:${id}`);

    return true;
  }

  /**
   * Find a rule that matches the given key and endpoint
   */
  async findMatchingRule(key: string, endpoint?: string): Promise<Rule | undefined> {
    return this.cache.findByKey(key, endpoint);
  }
}
