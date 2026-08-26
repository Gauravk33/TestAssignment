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
    name: 'Search Tester',
    email: `search_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Search Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;

  // Create page with distinct title
  await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${token}`)
    .send({ workspaceId, title: 'Kubernetes Cluster Architecture', type: 'doc' });
});

test('Search Suite - Unified search matches indexed page title', async () => {
  const res = await request(app)
    .get(`/api/search?q=Kubernetes&workspaceId=${workspaceId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.pages));
  const matched = res.body.data.pages.find((p: any) => p.title.includes('Kubernetes'));
  assert.ok(matched);
});
