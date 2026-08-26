import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis, getRedisClient } from '../src/config/redis.js';

let ownerToken: string;
let ownerUserId: string;
let workspaceId: string;
let colleagueToken: string;
let colleagueUserId: string;
let boardPageId: string;
let list1Id: string;
let list2Id: string;
let cardId: string;

test.before(async () => {
  await connectDB();
  await initRedis();
});

test.after(async () => {
  try {
    const redis = getRedisClient();
    if (redis && typeof redis.disconnect === 'function') {
      redis.disconnect();
    }
    await mongoose.disconnect();
  } catch (e) {
    // Ignore teardown errors
  }
});

// ─── 1. AUTHENTICATION & JWT SUITE ──────────────────────────────────────────
test('1. Auth: Register new user + workspace', async () => {
  const email = `test_${Date.now()}@teamspace.dev`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Engineer',
      email,
      password: 'Password123!',
      workspaceName: 'Automated Test Lab',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.accessToken);
  assert.strictEqual(res.body.data.user.email, email);
  assert.ok(res.body.data.workspace.id);

  ownerToken = res.body.data.accessToken;
  ownerUserId = res.body.data.user.id;
  workspaceId = res.body.data.workspace.id;
});

test('2. Auth: Login with valid credentials', async () => {
  const email = `login_${Date.now()}@teamspace.dev`;
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Login User',
      email,
      password: 'Password123!',
      workspaceName: 'Login Lab',
    });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: 'Password123!',
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.accessToken);
});

test('3. Auth: Reject invalid password with 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'nonexistent@teamspace.dev',
      password: 'WrongPassword!',
    });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('4. Auth: Reject unauthenticated /me request with 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.strictEqual(res.status, 401);
});

// ─── 2. RBAC & PERMISSION SUITE ─────────────────────────────────────────────
test('5. RBAC: Register colleague and invite as viewer', async () => {
  const colleagueEmail = `colleague_${Date.now()}@teamspace.dev`;
  const colleagueRes = await request(app).post('/api/auth/register').send({
    name: 'Colleague User',
    email: colleagueEmail,
    password: 'Password123!',
    workspaceName: 'Colleague Personal',
  });
  colleagueToken = colleagueRes.body.data.accessToken;
  colleagueUserId = colleagueRes.body.data.user.id;

  const inviteRes = await request(app)
    .post(`/api/workspaces/${workspaceId}/invite`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      email: colleagueEmail,
      role: 'viewer',
    });

  assert.strictEqual(inviteRes.status, 200);
  assert.strictEqual(inviteRes.body.success, true);
});

test('6. RBAC: Owner passes requireRole(owner, admin)', async () => {
  const res = await request(app)
    .get(`/api/workspaces/${workspaceId}/test-role`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.membership.role, 'owner');
});

test('7. RBAC: Viewer is blocked with 403 Forbidden on requireRole(owner, admin)', async () => {
  const res = await request(app)
    .get(`/api/workspaces/${workspaceId}/test-role`)
    .set('Authorization', `Bearer ${colleagueToken}`);

  assert.strictEqual(res.status, 403);
});

test('8. RBAC: Owner promotes Viewer to Admin', async () => {
  const res = await request(app)
    .patch(`/api/workspaces/${workspaceId}/members/${colleagueUserId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ role: 'admin' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

// ─── 3. PAGES & HIERARCHY SUITE ─────────────────────────────────────────────
test('9. Pages: Create Board Page', async () => {
  const res = await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      workspaceId,
      title: 'Kanban Sprint Board',
      type: 'board',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  boardPageId = res.body.data._id || res.body.data.id;
  assert.ok(boardPageId);
});

test('10. Pages: Verify nested page tree endpoint', async () => {
  const res = await request(app)
    .get(`/api/pages/tree?workspaceId=${workspaceId}`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 1);
});

// ─── 4. TRANSACTIONS & AUDIT LOGS SUITE ─────────────────────────────────────
test('11. Transactions: Atomic card move across lists with session audit log', async () => {
  // Fetch default board lists
  const listsRes = await request(app)
    .get(`/api/lists?pageId=${boardPageId}`)
    .set('Authorization', `Bearer ${ownerToken}`);
  const lists = listsRes.body.data;
  list1Id = lists[0]._id || lists[0].id;
  list2Id = lists[1]._id || lists[1].id;

  // Create card
  const cardRes = await request(app)
    .post('/api/cards')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      pageId: boardPageId,
      listId: list1Id,
      title: 'Session Atomicity Test Card',
    });
  cardId = cardRes.body.data._id || cardRes.body.data.id;

  // Atomic move transaction
  const moveRes = await request(app)
    .patch(`/api/cards/${cardId}/move`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      targetListId: list2Id,
      targetPosition: 0,
    });

  assert.strictEqual(moveRes.status, 200);
  assert.strictEqual(moveRes.body.data.listId, list2Id);

  // Check Audit Log was atomically recorded in transaction
  const auditRes = await request(app)
    .get(`/api/audit-logs?workspaceId=${workspaceId}`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.strictEqual(auditRes.status, 200);
  const logs = auditRes.body.data.logs;
  const moveLog = logs.find((l: any) => l.action === 'CARD_MOVED' && l.targetId === cardId);
  assert.ok(moveLog, 'Expected CARD_MOVED audit log entry created in transaction');
});

// ─── 5. AGGREGATIONS ($facet) SUITE ─────────────────────────────────────────
test('12. Aggregations: Workspace $facet aggregation metrics', async () => {
  const res = await request(app)
    .get(`/api/workspaces/${workspaceId}/stats`)
    .set('Authorization', `Bearer ${ownerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.cardsByList));
  assert.ok(Array.isArray(res.body.data.membersByRole));
  assert.ok(res.body.data.membersByRole.length >= 2); // Owner + Colleague
});
