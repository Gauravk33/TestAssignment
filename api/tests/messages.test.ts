import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let token: string;
let workspaceId: string;
let channelPageId: string;

test.before(async () => {
  await connectDB();
  await initRedis();

  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Chat Tester',
    email: `chat_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Chat Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;

  const pageRes = await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${token}`)
    .send({ workspaceId, title: 'dev-chat', type: 'channel' });
  channelPageId = pageRes.body.data._id || pageRes.body.data.id;
});

test('Chat Suite - Send real-time channel message', async () => {
  const res = await request(app)
    .post(`/api/pages/${channelPageId}/messages`)
    .set('Authorization', `Bearer ${token}`)
    .send({ content: 'Hello World from test suite!' });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.content, 'Hello World from test suite!');
});

test('Chat Suite - Cursor pagination returns messages stream', async () => {
  const res = await request(app)
    .get(`/api/pages/${channelPageId}/messages?limit=10`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.messages));
  assert.ok(res.body.data.messages.length >= 1);
});
