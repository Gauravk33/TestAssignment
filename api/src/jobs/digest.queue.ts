import { Queue } from 'bullmq';
import { getBullMQConnection } from '../config/redis.js';

export const DIGEST_QUEUE_NAME = 'weekly-digest';

let digestQueue: Queue | null = null;

export function getDigestQueue(): Queue {
  if (!digestQueue) {
    const connection = getBullMQConnection();
    digestQueue = new Queue(DIGEST_QUEUE_NAME, {
      connection,
    });
  }
  return digestQueue;
}

export async function enqueueWeeklyDigest(workspaceId: string) {
  try {
    const queue = getDigestQueue();
    const job = await queue.add(
      'process-workspace-digest',
      { workspaceId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      }
    );
    console.log(`[BullMQ] Enqueued weekly digest job ${job.id} for workspace ${workspaceId}`);
    return job;
  } catch (error) {
    console.warn('[BullMQ] Failed to enqueue digest job:', error);
    return null;
  }
}
