import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let app: any;
let token: string;
let workspaceId: string;
let boardPageId: string;
let list1Id: string;
let list2Id: string;
let cardId: string;

test.before(async () => {
  await connectDB();
  await initRedis();
  app = createApp();

  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Transaction Tester',
    email: `txn_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Transaction Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;

  // Create board page
  const pageRes = await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      workspaceId,
      title: 'Kanban Sprint',
      type: 'board',
    });
  boardPageId = pageRes.body.data._id || pageRes.body.data.id;

  // Get auto-created lists
  const listsRes = await request(app)
    .get(`/api/lists?pageId=${boardPageId}`)
    .set('Authorization', `Bearer ${token}`);
  const lists = listsRes.body.data;
  list1Id = lists[0]._id || lists[0].id;
  list2Id = lists[1]._id || lists[1].id;

  // Create card in list1
  const cardRes = await request(app)
    .post('/api/cards')
    .set('Authorization', `Bearer ${token}`)
    .send({
      pageId: boardPageId,
      listId: list1Id,
      title: 'Atomic Transaction Test Card',
      description: 'Verifying session commit and audit log creation',
    });
  cardId = cardRes.body.data._id || cardRes.body.data.id;
});

test('Transactions Suite - Move card atomically updates listId, position & writes AuditLog', async () => {
  const moveRes = await request(app)
    .patch(`/api/cards/${cardId}/move`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      targetListId: list2Id,
      targetPosition: 0,
    });

  assert.strictEqual(moveRes.status, 200);
  assert.strictEqual(moveRes.body.success, true);
  assert.strictEqual(moveRes.body.data.listId, list2Id);

  // Confirm card is in list2
  const checkCard = await request(app)
    .get(`/api/cards/${cardId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(checkCard.body.data.listId, list2Id);

  // Confirm audit log was written atomically in the same session
  const auditRes = await request(app)
    .get(`/api/audit-logs?workspaceId=${workspaceId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(auditRes.status, 200);
  const logs = auditRes.body.data.logs;
  const moveLog = logs.find((l: any) => l.action === 'CARD_MOVED' && l.targetId === cardId);
  assert.ok(moveLog, 'Expected CARD_MOVED audit log entry created in transaction');
  assert.strictEqual(moveLog.metadata.toListId, list2Id);
});
