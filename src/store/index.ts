import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { flushQueue, queueSize } from '../lib/sync';
import type { Item, Discrepancy } from '../types';

type StoreState = {
  items: Item[];
  discrepancies: Discrepancy[];
  online: boolean;
  pending: number;
  loadItems: () => Promise<void>;
  loadDiscrepancies: () => Promise<void>;
  setOnline: (v: boolean) => void;
  refreshPending: () => Promise<void>;
};

let state: StoreState = {
  items: [],
  discrepancies: [],
  online: navigator.onLine,
  pending: 0,
  loadItems: async () => {},
  loadDiscrepancies: async () => {},
  setOnline: () => {},
  refreshPending: async () => {},
};

const listeners = new Set<() => void>();

function setState(partial: Partial<StoreState>) {
  state = { ...state, ...partial };
  listeners.forEach((fn) => fn());
}

async function doLoadItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name');
  if (!error && data) setState({ items: data as Item[] });
}

async function doLoadDiscrepancies() {
  const { data, error } = await supabase
    .from('discrepancies')
    .select('*, items(name)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (!error && data) setState({ discrepancies: data as Discrepancy[] });
}

async function doRefreshPending() {
  setState({ pending: await queueSize() });
}

state.loadItems = doLoadItems;
state.loadDiscrepancies = doLoadDiscrepancies;
state.refreshPending = doRefreshPending;
state.setOnline = (v: boolean) => setState({ online: v });

export function useStore(): StoreState {
  const [, forceRender] = useState({});
  useEffect(() => {
    const fn = () => forceRender({});
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return state;
}

export function subscribeRealtime() {
  supabase
    .channel('items-rt')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items' },
      () => doLoadItems()
    )
    .subscribe();

  supabase
    .channel('disc-rt')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'discrepancies' },
      () => doLoadDiscrepancies()
    )
    .subscribe();

  supabase
    .channel('sales-rt')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sales' },
      () => {}
    )
    .subscribe();
}

export async function trySync() {
  await flushQueue();
  await doRefreshPending();
}

export function useNetworkStatus() {
  const store = useStore();

  useEffect(() => {
    const handleOnline = () => {
      store.setOnline(true);
      trySync();
    };
    const handleOffline = () => store.setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [store]);
}

export { doLoadItems, doLoadDiscrepancies };
