import { Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import { getBullMQConnection } from '../config/redis.js';
import { DIGEST_QUEUE_NAME } from './digest.queue.js';
import { DigestLog } from '../models/DigestLog.js';
import { Card } from '../models/Card.js';
import { Message } from '../models/Message.js';
import { Block } from '../models/Block.js';
import { Membership } from '../models/Membership.js';

let digestWorker: Worker | null = null;

export function initDigestWorker(): Worker {
  if (digestWorker) return digestWorker;

  const connection = getBullMQConnection();

  digestWorker = new Worker(
    DIGEST_QUEUE_NAME,
    async (job: Job) => {
      console.log(`[BullMQ Worker] Processing digest job ${job.id} for workspace ${job.data.workspaceId}`);
      const workspaceId = job.data.workspaceId;

      try {
        const wsObjectId = new Types.ObjectId(workspaceId);

        const [cardsCount, messagesCount, blocksCount, membersCount] = await Promise.all([
          Card.countDocuments({ workspaceId: wsObjectId }),
          Message.countDocuments({ workspaceId: wsObjectId }),
          Block.countDocuments({ workspaceId: wsObjectId }),
          Membership.countDocuments({ workspaceId: wsObjectId }),
        ]);

        const digestLog = await DigestLog.create({
          workspaceId: wsObjectId,
          jobId: job.id?.toString() || 'job-unknown',
          status: 'completed',
          summary: {
            cardsCount,
            messagesCount,
            blocksCount,
            membersCount,
          },
          processedAt: new Date(),
        });

        console.log(`[BullMQ Worker] Digest completed for workspace ${workspaceId}:`, digestLog.summary);
        return digestLog;
      } catch (err: any) {
        console.error(`[BullMQ Worker] Digest job ${job.id} failed:`, err);
        await DigestLog.create({
          workspaceId: new Types.ObjectId(workspaceId),
          jobId: job.id?.toString() || 'job-failed',
          status: 'failed',
          summary: { cardsCount: 0, messagesCount: 0, blocksCount: 0, membersCount: 0 },
          processedAt: new Date(),
        });
        throw err;
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );

  digestWorker.on('completed', (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
  });

  digestWorker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  return digestWorker;
}
