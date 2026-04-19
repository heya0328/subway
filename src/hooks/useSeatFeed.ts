import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../data/supabase';
import type { Direction, SeatShare } from '../types';

export function useSeatFeed(
  line: string,
  direction: Direction | null,
  currentStation: string | null
) {
  const [shares, setShares] = useState<SeatShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchShares = useCallback(async () => {
    if (!direction || !currentStation) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('seat_shares')
        .select('*')
        .eq('line', line)
        .eq('direction', direction)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      setShares(data ?? []);
    } catch {
      setShares([]);
    } finally {
      setIsLoading(false);
    }
  }, [line, direction, currentStation]);

  useEffect(() => { fetchShares(); }, [fetchShares]);

  useEffect(() => {
    if (!direction) return;
    const channel = supabase
      .channel('seat-shares-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_shares', filter: `line=eq.${line}` }, () => { fetchShares(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [line, direction, fetchShares]);

  const createShare = useCallback(async (params: {
    userId: string;
    direction: Direction;
    currentStation: string;
    exitStation: string;
    exitMinutes: number;
    message: string;
  }) => {
    const expiresAt = new Date(Date.now() + (params.exitMinutes + 5) * 60 * 1000);
    const { error } = await supabase.from('seat_shares').insert({
      user_id: params.userId,
      line,
      direction: params.direction,
      current_station: params.currentStation,
      exit_station: params.exitStation,
      exit_minutes: params.exitMinutes,
      message: params.message,
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw error;
    fetchShares();
  }, [line, fetchShares]);

  return { shares, isLoading, createShare, refresh: fetchShares };
}
