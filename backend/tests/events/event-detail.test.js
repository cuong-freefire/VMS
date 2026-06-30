import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import app from '../../src/app.js';

let server;
let baseUrl;

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  return { response, body };
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Event Detail API', () => {
  it('returns public event detail without authentication', async () => {
    const { response, body } = await getJson('/api/v1/events/1');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.id, 1);
    assert.equal(body.data.title, 'Clean Beach Campaign');
    assert.equal(body.data.description, 'Join volunteers to clean Vung Tau beach and protect the coast.');
    assert.equal(body.data.remainingSlots, 27);
    assert.equal(body.data.status, 'PUBLISHED');
    assert.equal(body.data.organization.name, 'Green Earth');
    assert.equal(body.data.category.name, 'Environment');
    assert.deepEqual(body.data.skills, [{ id: 5, name: 'Physical fitness' }]);
    assert.equal(Object.hasOwn(body.data, 'event'), false);
  });

  it('returns 422 for invalid ids', async () => {
    for (const id of ['abc', '0', '-1']) {
      const { response, body } = await getJson(`/api/v1/events/${id}`);

      assert.equal(response.status, 422);
      assert.equal(body.success, false);
      assert.match(body.error, /id/);
    }
  });

  it('returns 404 for missing event', async () => {
    const { response, body } = await getJson('/api/v1/events/999');

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error, 'Event not found');
  });

  it('returns 404 for non-public events', async () => {
    for (const id of [4, 5, 6]) {
      const { response, body } = await getJson(`/api/v1/events/${id}`);

      assert.equal(response.status, 404);
      assert.equal(body.success, false);
      assert.equal(body.error, 'Event not found');
    }
  });
});
