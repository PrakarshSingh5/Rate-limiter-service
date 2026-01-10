import { CheckRequest, CheckResult } from '../models/result';
import { AlgorithmFactory } from '../algorithms/factory';
import { Storage } from '../storage/types';
import { RuleService } from '../cache/rule-service';
import { AlgorithmType } from '../algorithms/types';

/**
 * Core rate limiter service
 */
export class RateLimiterService {
  constructor(
    private storage: Storage,
    private ruleService: RuleService
  ) {}

  /**
   * Check if a request is allowed
   */
  async check(request: CheckRequest): Promise<CheckResult> {
    let algorithm: AlgorithmType;
    let limit: number;
    let window: number;

    // If ruleId is provided, use the rule configuration
    if (request.ruleId) {
      const rule = await this.ruleService.getRule(request.ruleId);
      if (!rule) {
        throw new Error(`Rule not found: ${request.ruleId}`);
      }
      if (!rule.enabled) {
        throw new Error(`Rule is disabled: ${request.ruleId}`);
      }

      algorithm = rule.algorithm;
      limit = rule.limit;
      window = rule.window;
    } 
    // Otherwise, use inline parameters or find matching rule
    else if (request.algorithm && request.limit && request.window) {
      algorithm = request.algorithm;
      limit = request.limit;
      window = request.window;
    }
    // Try to find a matching rule
    else {
      const matchingRule = await this.ruleService.findMatchingRule(
        request.key,
        request.endpoint
      );
      
      if (!matchingRule) {
        throw new Error('No matching rule found and no inline parameters provided');
      }

      algorithm = matchingRule.algorithm;
      limit = matchingRule.limit;
      window = matchingRule.window;
    }

    // Get the appropriate algorithm
    const limiter = AlgorithmFactory.get(algorithm, this.storage);

    // Build the full key
    const fullKey = request.endpoint 
      ? `${request.key}:${request.endpoint}`
      : request.key;

    // Perform the rate limit check
    return limiter.check(fullKey, limit, window);
  }
}
