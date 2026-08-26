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
    name: 'Stats User',
    email: `stats_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Analytics Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;
});

test('Stats Suite - Workspace $facet aggregation returns cards, messages, blocks & member breakdowns', async () => {
  const res = await request(app)
    .get(`/api/workspaces/${workspaceId}/stats`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  const data = res.body.data;

  assert.ok(Array.isArray(data.cardsByList));
  assert.ok(Array.isArray(data.blocksByType));
  assert.ok(Array.isArray(data.membersByRole));
  assert.ok(Array.isArray(data.messagesPerDay));

  // At least 1 member (the owner)
  assert.ok(data.membersByRole.length >= 1);
});
