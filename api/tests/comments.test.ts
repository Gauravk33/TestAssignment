import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let token: string;
let workspaceId: string;
let pageId: string;
let parentCommentId: string;

test.before(async () => {
  await connectDB();
  await initRedis();

  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Commenter User',
    email: `comment_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Comment Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;

  const pageRes = await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${token}`)
    .send({ workspaceId, title: 'Comment Target Doc', type: 'doc' });
  pageId = pageRes.body.data._id || pageRes.body.data.id;
});

test('Comments Suite - Create root comment on page entity', async () => {
  const res = await request(app)
    .post('/api/comments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      workspaceId,
      targetType: 'page',
      targetId: pageId,
      content: 'This architecture looks solid!',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  parentCommentId = res.body.data._id || res.body.data.id;
  assert.ok(parentCommentId);
});

test('Comments Suite - Create threaded child reply to comment', async () => {
  const res = await request(app)
    .post('/api/comments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      workspaceId,
      targetType: 'page',
      targetId: pageId,
      parentId: parentCommentId,
      content: 'Agreed, ready to deploy.',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.parentId, parentCommentId);
});

test('Comments Suite - Fetch comments by target entity', async () => {
  const res = await request(app)
    .get(`/api/comments?targetId=${pageId}&targetType=page`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 2);
});
