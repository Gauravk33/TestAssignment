import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let token: string;
let workspaceId: string;

test.before(async () => {
  await connectDB();
  await initRedis();

  const regRes = await request(app).post('/api/auth/register').send({
    name: 'BullMQ Tester',
    email: `job_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Job Queue Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;
});

test('Jobs Suite - Enqueue weekly digest job in BullMQ Redis queue', async () => {
  const res = await request(app)
    .post('/api/jobs/weekly-digest')
    .set('Authorization', `Bearer ${token}`)
    .send({ workspaceId });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.jobId);
});

test('Jobs Suite - Fetch weekly digest execution history', async () => {
  const res = await request(app)
    .get(`/api/jobs/weekly-digest/logs?workspaceId=${workspaceId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});
