/**
 * BACKEND TEST SUITE
 * Tests: Health endpoints, Task CRUD, validation, error handling
 * Run: NODE_ENV=test jest --forceExit
 */
const request = require('supertest');
const app     = require('../src/app');
const TaskStore = require('../src/models/TaskStore');

// Reset store before each test for isolation
beforeEach(() => TaskStore._reset());

// ══════════════════════════════════════════════════════════════════
// HEALTH ENDPOINTS
// ══════════════════════════════════════════════════════════════════
describe('GET /health', () => {
  test('returns 200 with health object', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('backend-api');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('GET /health/ready returns 200', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════
// GET ALL TASKS
// ══════════════════════════════════════════════════════════════════
describe('GET /api/tasks', () => {
  test('returns all 3 seed tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(3);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('filters by status=pending', async () => {
    const res = await request(app).get('/api/tasks?status=pending');
    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.status === 'pending')).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test('filters by priority=high', async () => {
    const res = await request(app).get('/api/tasks?priority=high');
    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.priority === 'high')).toBe(true);
  });

  test('returns empty array when no matches', async () => {
    const res = await request(app).get('/api/tasks?status=done');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════
// GET SINGLE TASK
// ══════════════════════════════════════════════════════════════════
describe('GET /api/tasks/:id', () => {
  test('returns task by id', async () => {
    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe('1');
    expect(res.body.data.title).toBeDefined();
  });

  test('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/api/tasks/9999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not found/i);
  });
});

// ══════════════════════════════════════════════════════════════════
// CREATE TASK
// ══════════════════════════════════════════════════════════════════
describe('POST /api/tasks', () => {
  test('creates task with all fields', async () => {
    const payload = { title: 'Run Trivy scan', status: 'pending', priority: 'high' };
    const res = await request(app).post('/api/tasks').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Run Trivy scan');
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.priority).toBe('high');
  });

  test('creates task with defaults when only title provided', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Minimal task' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.priority).toBe('medium');
  });

  test('trims whitespace from title', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '  Trimmed title  ' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Trimmed title');
  });

  test('400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ status: 'pending' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/title/i);
  });

  test('400 when title is empty string', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  test('400 when title exceeds 200 chars', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x'.repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/200/);
  });

  test('400 for invalid status', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test', status: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });

  test('400 for invalid priority', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test', priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/priority/i);
  });

  test('all 3 valid statuses accepted', async () => {
    for (const status of ['pending', 'in-progress', 'done']) {
      const res = await request(app).post('/api/tasks').send({ title: `Task ${status}`, status });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(status);
    }
  });

  test('all 3 valid priorities accepted', async () => {
    for (const priority of ['low', 'medium', 'high']) {
      const res = await request(app).post('/api/tasks').send({ title: `Task ${priority}`, priority });
      expect(res.status).toBe(201);
      expect(res.body.data.priority).toBe(priority);
    }
  });

  test('created task appears in GET /api/tasks', async () => {
    await request(app).post('/api/tasks').send({ title: 'Check visibility' });
    const res = await request(app).get('/api/tasks');
    expect(res.body.data.some(t => t.title === 'Check visibility')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════
// UPDATE TASK
// ══════════════════════════════════════════════════════════════════
describe('PUT /api/tasks/:id', () => {
  test('updates status', async () => {
    const res = await request(app).put('/api/tasks/1').send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('done');
  });

  test('updates title', async () => {
    const res = await request(app).put('/api/tasks/1').send({ title: 'Updated title' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated title');
  });

  test('updates priority', async () => {
    const res = await request(app).put('/api/tasks/1').send({ priority: 'low' });
    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('low');
  });

  test('partial update preserves other fields', async () => {
    const original = (await request(app).get('/api/tasks/1')).body.data;
    await request(app).put('/api/tasks/1').send({ status: 'done' });
    const updated = (await request(app).get('/api/tasks/1')).body.data;
    expect(updated.title).toBe(original.title);
    expect(updated.priority).toBe(original.priority);
    expect(updated.status).toBe('done');
  });

  test('404 for non-existent id', async () => {
    const res = await request(app).put('/api/tasks/9999').send({ status: 'done' });
    expect(res.status).toBe(404);
  });

  test('400 for invalid status in update', async () => {
    const res = await request(app).put('/api/tasks/1').send({ status: 'broken' });
    expect(res.status).toBe(400);
  });

  test('ignores unknown fields (no prototype pollution)', async () => {
    const res = await request(app).put('/api/tasks/1').send({ title: 'Safe', __proto__: { hacked: true }, constructor: 'bad' });
    expect(res.status).toBe(200);
    expect(res.body.data.hacked).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════
// DELETE TASK
// ══════════════════════════════════════════════════════════════════
describe('DELETE /api/tasks/:id', () => {
  test('deletes existing task', async () => {
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('deleted task no longer returned', async () => {
    await request(app).delete('/api/tasks/2');
    const res = await request(app).get('/api/tasks/2');
    expect(res.status).toBe(404);
  });

  test('404 for non-existent id', async () => {
    const res = await request(app).delete('/api/tasks/9999');
    expect(res.status).toBe(404);
  });

  test('count decreases after delete', async () => {
    const before = (await request(app).get('/api/tasks')).body.count;
    await request(app).delete('/api/tasks/1');
    const after = (await request(app).get('/api/tasks')).body.count;
    expect(after).toBe(before - 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// 404 HANDLER
// ══════════════════════════════════════════════════════════════════
describe('404 handler', () => {
  test('unknown route returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('includes path in response', async () => {
    const res = await request(app).get('/bad/route');
    expect(res.body.path).toBe('/bad/route');
  });
});

// ══════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ══════════════════════════════════════════════════════════════════
describe('Security headers (helmet)', () => {
  test('X-Content-Type-Options header present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('X-Frame-Options header present', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════
// CONTENT-TYPE ENFORCEMENT
// ══════════════════════════════════════════════════════════════════
describe('Content-Type', () => {
  test('responses are application/json', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
