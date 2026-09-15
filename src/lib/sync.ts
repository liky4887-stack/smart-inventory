import { supabase } from './supabase';

type SyncOp = {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  ts: number;
};

const QUEUE_KEY = 'smart-inv-sync-queue';

function getQueue(): SyncOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: SyncOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export async function enqueue(op: Omit<SyncOp, 'id' | 'ts'>) {
  const q = getQueue();
  q.push({ ...op, id: Math.random().toString(36).slice(2), ts: Date.now() });
  saveQueue(q);
}

export async function flushQueue(): Promise<{ ok: number; fail: number }> {
  const q = getQueue();
  if (q.length === 0) return { ok: 0, fail: 0 };

  const remaining: SyncOp[] = [];
  let ok = 0;
  let fail = 0;

  for (const op of q) {
    try {
      const { error } = await supabase.from(op.table).insert(op.payload);
      if (error) throw error;
      ok++;
    } catch {
      remaining.push(op);
      fail++;
    }
  }
  saveQueue(remaining);
  return { ok, fail };
}

export async function queueSize(): Promise<number> {
  return getQueue().length;
}
