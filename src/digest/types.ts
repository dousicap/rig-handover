// Plan morning-digest § 1. The shape every part of § 2 builds on.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, once parsed.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as —
  runs: number; // lines for this job
  retries: number; // lines with status retry
  fails: number; // lines with status fail
  lastStatus: RunStatus;
  lastError: string | null; // the latest error seen for this job
  first: string; // `at` of the first line, offset kept
  last: string; // `at` of the last line, offset kept
};

export type Night = {
  night: string;
  rows: DigestRow[]; // sorted by job; empty for a file with no lines ("nothing ran")
  badLines: number; // lines that did not parse, counted, never thrown
  counts: Record<RunStatus, number>; // lines per status, for the status board
};

// null = no file for that night (404). A night with an empty file is a Night with no rows.
export type ReadNight = (runsDir: string, night: string) => Night | null;
