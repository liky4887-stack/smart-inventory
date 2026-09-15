import { supabase } from './supabase';
import type { RunoutPrediction } from '../types';

export async function predictRunout(
  itemId: string,
  currentQty: number
): Promise<RunoutPrediction> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await supabase
    .from('sales')
    .select('qty, created_at')
    .eq('item_id', itemId)
    .gte('created_at', since);

  if (!data || data.length === 0)
    return { days: Infinity, velocity: 0, severity: 'stable' };

  const total = data.reduce((s, r) => s + Number(r.qty), 0);
  const velocity = total / 30;
  const days = velocity > 0 ? currentQty / velocity : Infinity;

  let severity: RunoutPrediction['severity'] = 'stable';
  if (days < 3) severity = 'critical';
  else if (days < 7) severity = 'warn';
  else if (days < 14) severity = 'ok';

  return { days, velocity, severity };
}
