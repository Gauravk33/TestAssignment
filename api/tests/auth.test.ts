import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { initRedis } from '../src/config/redis.js';

let app: any;

test.before(async () => {
  await connectDB();
  await initRedis();
  app = createApp();
});

test('Auth Suite - Register new user and workspace', async () => {
  const email = `test_${Date.now()}@teamspace.dev`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Engineer',
      email,
      password: 'Password123!',
      workspaceName: 'Dev Testing Lab',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.accessToken);
  assert.strictEqual(res.body.data.user.email, email);
  assert.ok(res.body.data.workspace.id);
});

test('Auth Suite - Login with valid credentials', async () => {
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
  assert.ok(Array.isArray(res.body.data.workspaces));
});

test('Auth Suite - Reject invalid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'nonexistent@teamspace.dev',
      password: 'WrongPassword!',
    });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('Auth Suite - Reject unauthorized request without token', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.strictEqual(res.status, 401);
});
