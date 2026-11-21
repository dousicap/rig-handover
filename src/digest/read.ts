import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunLine, RunStatus } from './types.js';

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly RunStatus[] = ['ok', 'retry', 'fail'];

// Parse at the edge: a line is a RunLine or it is a bad line.
export function parseLine(line: string): RunLine | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (!STATUSES.includes(o.status as RunStatus)) return null;
  if (o.owner !== null && o.owner !== undefined && typeof o.owner !== 'string') return null;
  if (o.error !== undefined && typeof o.error !== 'string') return null;
  return {
    at: o.at,
    job: o.job,
    status: o.status as RunStatus,
    owner: (o.owner as string | null | undefined) ?? null,
    ...(o.error !== undefined ? { error: o.error as string } : {}),
  };
}

export function digest(night: string, text: string): Night {
  const rows = new Map<string, DigestRow>();
  const counts: Record<RunStatus, number> = { ok: 0, retry: 0, fail: 0 };
  let badLines = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const l = parseLine(raw);
    if (!l) {
      badLines++;
      continue;
    }
    counts[l.status]++;
    const r = rows.get(l.job);
    if (!r) {
      rows.set(l.job, {
        job: l.job,
        owner: l.owner,
        runs: 1,
        retries: l.status === 'retry' ? 1 : 0,
        fails: l.status === 'fail' ? 1 : 0,
        lastStatus: l.status,
        lastError: l.error ?? null,
        first: l.at,
        last: l.at,
      });
      continue;
    }
    r.runs++;
    if (l.status === 'retry') r.retries++;
    if (l.status === 'fail') r.fails++;
    r.lastStatus = l.status;
    if (l.error !== undefined) r.lastError = l.error;
    if (l.owner !== null) r.owner = l.owner;
    r.last = l.at;
  }
  const sorted = [...rows.values()].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
  return { night, rows: sorted, badLines, counts };
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!NIGHT.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }
  return digest(night, text);
};
