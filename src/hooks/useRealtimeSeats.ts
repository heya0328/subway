import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../data/supabase';
import type { Direction, DepartureCount } from '../types';
import { getStationsInDirection } from '../data/stations';

export function useRealtimeSeats(
  line: string,
  direction: Direction | null,
  currentStation: string | null
) {
  const [departures, setDepartures] = useState<DepartureCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartures = useCallback(async () => {
    if (!direction || !currentStation) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('active_rides')
        .select('arrival_station')
        .eq('line', line)
        .eq('direction', direction)
        .in('status', ['riding', 'arriving_soon'])
        .gt('expires_at', new Date().toISOString());

      if (!data) { setDepartures([]); return; }

      const upcomingStations = getStationsInDirection(direction, currentStation);
      const counts = new Map<string, number>();
      for (const row of data) {
        if (upcomingStations.includes(row.arrival_station)) {
          counts.set(row.arrival_station, (counts.get(row.arrival_station) ?? 0) + 1);
        }
      }

      const result: DepartureCount[] = upcomingStations
        .filter((s) => counts.has(s))
        .map((s) => ({ arrival_station: s, departing_count: counts.get(s)! }));
      setDepartures(result);
    } catch {
      setDepartures([]);
    } finally {
      setIsLoading(false);
    }
  }, [line, direction, currentStation]);

  useEffect(() => { fetchDepartures(); }, [fetchDepartures]);

  useEffect(() => {
    if (!direction) return;
    const channel = supabase
      .channel('active-rides-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_rides', filter: `line=eq.${line}` }, () => { fetchDepartures(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [line, direction, fetchDepartures]);

  return { departures, isLoading, refresh: fetchDepartures };
}
