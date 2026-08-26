import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let app: any;
let ownerToken: string;
let colleagueToken: string;
let colleagueUserId: string;
let workspaceId: string;

test.before(async () => {
  await connectDB();
  await initRedis();
  app = createApp();

  // Create Owner
  const ownerRes = await request(app).post('/api/auth/register').send({
    name: 'RBAC Owner',
    email: `owner_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'RBAC Lab',
  });
  ownerToken = ownerRes.body.data.accessToken;
  workspaceId = ownerRes.body.data.workspace.id;

  // Create Colleague
  const colleagueEmail = `colleague_${Date.now()}@teamspace.dev`;
  const colleagueRes = await request(app).post('/api/auth/register').send({
    name: 'Colleague User',
    email: colleagueEmail,
    password: 'Password123!',
    workspaceName: 'Colleague Personal',
  });
  colleagueToken = colleagueRes.body.data.accessToken;
  colleagueUserId = colleagueRes.body.data.user.id;

  // Invite Colleague as viewer
  await request(app)
    .post(`/api/workspaces/${workspaceId}/invite`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      email: colleagueEmail,
      role: 'viewer',
    });
});

test('RBAC Suite - Owner passes requireRole(owner, admin) check', async () => {
  const res = await request(app)
    .get(`/api/workspaces/${workspaceId}/test-role`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.role, 'owner');
});

test('RBAC Suite - Viewer fails requireRole(owner, admin) check with 403 Forbidden', async () => {
  const res = await request(app)
    .get(`/api/workspaces/${workspaceId}/test-role`)
    .set('Authorization', `Bearer ${colleagueToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
});

test('RBAC Suite - Owner can promote viewer to admin', async () => {
  const res = await request(app)
    .patch(`/api/workspaces/${workspaceId}/members/${colleagueUserId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ role: 'admin' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Now colleague passes admin check
  const checkRes = await request(app)
    .get(`/api/workspaces/${workspaceId}/test-role`)
    .set('Authorization', `Bearer ${colleagueToken}`);

  assert.strictEqual(checkRes.status, 200);
});
