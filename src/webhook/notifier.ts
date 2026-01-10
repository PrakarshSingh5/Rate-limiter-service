import axios, { AxiosError } from 'axios';
import crypto from 'crypto';
import { config } from '../config';

export interface WebhookPayload {
  key: string;
  endpoint?: string;
  limit: number;
  currentUsage: number;
  threshold: number;
  timestamp: string;
  message: string;
}

/**
 * Webhook notification service
 */
export class WebhookNotifier {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor() {
    this.timeout = config.webhook.timeout;
    this.maxRetries = config.webhook.maxRetries;
    this.retryDelay = config.webhook.retryDelay;
  }

  /**
   * Send webhook notification
   */
  async notify(url: string, payload: WebhookPayload, secret?: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.sendWebhook(url, payload, secret);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    console.error(`Webhook delivery failed after ${this.maxRetries} retries:`, lastError);
    throw lastError;
  }

  /**
   * Send webhook with signature
   */
  private async sendWebhook(url: string, payload: WebhookPayload, secret?: string): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RateLimiter-Webhook/1.0',
    };

    // Add HMAC signature if secret is provided
    if (secret) {
      const signature = this.generateSignature(payload, secret);
      headers['X-Webhook-Signature'] = signature;
    }

    try {
      await axios.post(url, payload, {
        headers,
        timeout: this.timeout,
        validateStatus: (status) => status >= 200 && status < 300,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `Webhook request failed: ${axiosError.response?.status} ${axiosError.response?.statusText}`
        );
      }
      throw error;
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if usage has crossed a threshold
   */
  shouldNotify(currentUsage: number, limit: number, thresholds: number[]): number | null {
    const percentage = (currentUsage / limit) * 100;
    
    // Find the highest threshold that has been crossed
    const crossedThresholds = thresholds
      .filter(t => percentage >= t)
      .sort((a, b) => b - a);

    return crossedThresholds.length > 0 ? crossedThresholds[0] : null;
  }

  /**
   * Create webhook payload
   */
  createPayload(
    key: string,
    limit: number,
    currentUsage: number,
    threshold: number,
    endpoint?: string
  ): WebhookPayload {
    return {
      key,
      endpoint,
      limit,
      currentUsage,
      threshold,
      timestamp: new Date().toISOString(),
      message: `Rate limit ${threshold}% threshold reached for ${key}`,
    };
  }
}
