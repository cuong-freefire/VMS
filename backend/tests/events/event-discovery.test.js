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

describe('Event Discovery API', () => {
  it('returns only public active events', async () => {
    const { response, body } = await getJson('/api/v1/events');

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.items.every((event) => event.status === 'PUBLISHED'), true);
    assert.equal(body.data.items.some((event) => event.title.includes('Draft')), false);
    assert.equal(body.data.pagination.totalItems, 3);
  });

  it('searches by trimmed keyword', async () => {
    const { response, body } = await getJson('/api/v1/events?keyword=%20beach%20');

    assert.equal(response.status, 200);
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].title, 'Clean Beach Campaign');
  });

  it('filters by availability', async () => {
    const { response, body } = await getJson('/api/v1/events?availability=FULL');

    assert.equal(response.status, 200);
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].remainingSlots, 0);
  });

  it('returns 422 for invalid query params', async () => {
    const { response, body } = await getJson('/api/v1/events?page=abc');

    assert.equal(response.status, 422);
    assert.equal(body.success, false);
    assert.match(body.error, /page/);
  });
});
