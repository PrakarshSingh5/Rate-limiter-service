import Bull, { Queue, Job } from 'bull';
import { config } from '../config';
import { WebhookNotifier, WebhookPayload } from './notifier';

interface WebhookJob {
  url: string;
  payload: WebhookPayload;
  secret?: string;
}

/**
 * Webhook queue for reliable async delivery
 */
export class WebhookQueue {
  private queue: Queue<WebhookJob>;
  private notifier: WebhookNotifier;

  constructor() {
    this.notifier = new WebhookNotifier();
    
    // Create Bull queue
    this.queue = new Bull<WebhookJob>('webhook-delivery', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
      },
      defaultJobOptions: {
        attempts: config.webhook.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: config.webhook.retryDelay,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for debugging
      },
    });

    // Process webhook jobs
    this.queue.process(async (job: Job<WebhookJob>) => {
      await this.notifier.notify(job.data.url, job.data.payload, job.data.secret);
    });

    // Event handlers
    this.queue.on('completed', (job) => {
      console.log(`Webhook delivered successfully: ${job.id}`);
    });

    this.queue.on('failed', (job, error) => {
      console.error(`Webhook delivery failed: ${job?.id}`, error);
    });
  }

  /**
   * Add webhook to queue
   */
  async enqueue(url: string, payload: WebhookPayload, secret?: string): Promise<void> {
    await this.queue.add({
      url,
      payload,
      secret,
    });
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    await this.queue.close();
  }
}
