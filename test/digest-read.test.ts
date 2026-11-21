import { describe, expect, it } from 'vitest';
import { digest, readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads runs/2026-10-28.jsonl: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n).not.toBeNull();
    expect(n!.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(n!.badLines).toBe(1);
    const refresh = n!.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(refresh).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(n!.rows.find((r) => r.job === 'notes/backup')).toMatchObject({ fails: 1, lastStatus: 'fail' });
    expect(n!.rows.find((r) => r.job === 'digest/render')!.owner).toBeNull();
    expect(refresh.first).toBe('2026-10-29T01:30:00+01:00');
  });

  it('returns null for a night with no file, or a name that is not a night', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });

  it('an empty file is a night with no rows', () => {
    expect(digest('x', '')).toEqual({ night: 'x', rows: [], badLines: 0, counts: { ok: 0, retry: 0, fail: 0 } });
  });

  it('counts lines with the wrong shape as bad, never throws', () => {
    const n = digest('x', '{"at":"t","job":"a","status":"maybe","owner":null}\n[1]\nnull\n');
    expect(n.badLines).toBe(3);
    expect(n.rows).toEqual([]);
  });
});
