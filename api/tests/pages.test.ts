import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let token: string;
let workspaceId: string;
let parentDocId: string;
let childDocId: string;

test.before(async () => {
  await connectDB();
  await initRedis();

  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Page Hierarchy Tester',
    email: `page_${Date.now()}@teamspace.dev`,
    password: 'Password123!',
    workspaceName: 'Page Tree Lab',
  });
  token = regRes.body.data.accessToken;
  workspaceId = regRes.body.data.workspace.id;
});

test('Page Suite - Create root doc page', async () => {
  const res = await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      workspaceId,
      title: 'Company Handbook',
      type: 'doc',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  parentDocId = res.body.data._id || res.body.data.id;
  assert.ok(parentDocId);
});

test('Page Suite - Create nested child page under parent', async () => {
  const res = await request(app)
    .post('/api/pages')
    .set('Authorization', `Bearer ${token}`)
    .send({
      workspaceId,
      parentId: parentDocId,
      title: 'Engineering Guidelines',
      type: 'doc',
    });

  assert.strictEqual(res.status, 201);
  childDocId = res.body.data._id || res.body.data.id;
  assert.ok(childDocId);
});

test('Page Suite - Recursive tree returns parent with populated children array', async () => {
  const res = await request(app)
    .get(`/api/pages/tree?workspaceId=${workspaceId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  const tree = res.body.data;
  const parent = tree.find((p: any) => (p._id || p.id) === parentDocId);
  assert.ok(parent);
  assert.ok(parent.children.length >= 1);
  assert.strictEqual(parent.children[0].title, 'Engineering Guidelines');
});
