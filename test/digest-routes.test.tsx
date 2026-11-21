import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

// A temp runs dir: runs/ is read-only.
let dir: string;
let app: ReturnType<typeof createApp>;
const line = (job: string, status: string, owner: string | null = 'rook') =>
  JSON.stringify({ at: '2026-10-30T01:00:00+01:00', job, status, owner });

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(join(dir, '2026-10-30.jsonl'), [line('b/job', 'ok'), line('a/job', 'fail', null)].join('\n') + '\n');
  writeFileSync(join(dir, '2026-10-31.jsonl'), '');
  writeFileSync(join(dir, '2026-11-01.jsonl'), line('a/job', 'ok') + '\n{"at":"2026-11-01T02:00\n');
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('GET /digest/:night', () => {
  it('200 with the rows sorted by job, a fail marked, a null owner as —', async () => {
    const res = await app.request('/digest/2026-10-30');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('<tr class="warn"><td>a/job</td><td>—</td>');
  });
  it('404 for a night with no file', async () => {
    expect((await app.request('/digest/2026-12-25')).status).toBe(404);
  });
  it('the empty night renders "nothing ran"', async () => {
    const res = await app.request('/digest/2026-10-31');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
  it('a night with a bad line still renders and counts it', async () => {
    const res = await app.request('/digest/2026-11-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('a/job');
    expect(html).toContain('1 line(s) did not parse');
  });
});

describe('GET /api/digest/:night', () => {
  it('200 with the same jobs, in the same order, as the page', async () => {
    const json = (await (await app.request('/api/digest/2026-10-30')).json()) as { rows: { job: string }[] };
    const html = await (await app.request('/digest/2026-10-30')).text();
    const pageJobs = [...html.matchAll(/<tr[^>]*><td>([^<]+)<\/td>/g)].map((m) => m[1]);
    expect(json.rows.map((r) => r.job)).toEqual(pageJobs);
  });
  it('404 for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-12-25')).status).toBe(404);
  });
  it('the empty night has no rows', async () => {
    const json = (await (await app.request('/api/digest/2026-10-31')).json()) as { rows: unknown[] };
    expect(json.rows).toEqual([]);
  });
  it('a night with a bad line counts it', async () => {
    const json = (await (await app.request('/api/digest/2026-11-01')).json()) as { badLines: number };
    expect(json.badLines).toBe(1);
  });
});
