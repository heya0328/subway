import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../data/supabase';
import { getTravelTimeSeconds, getRemainingStationCount } from '../data/stations';
import { ARRIVING_SOON_SECONDS, RIDE_TTL_MINUTES } from '../constants';
import type { ActiveRide, Direction, RideStatus } from '../types';

export function useActiveRide(userId: string | null) {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    async function fetch() {
      try {
        const { data } = await supabase
          .from('active_rides')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['riding', 'arriving_soon'])
          .order('activated_at', { ascending: false })
          .limit(1)
          .single();
        setRide(data);
      } catch {
        setRide(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [userId]);

  useEffect(() => {
    if (!ride || ride.status !== 'riding') return;
    const arrivingSoonAt = new Date(ride.estimated_arrival).getTime() - ARRIVING_SOON_SECONDS * 1000;
    const delay = arrivingSoonAt - Date.now();
    if (delay <= 0) {
      updateStatus('arriving_soon');
      return;
    }
    timerRef.current = setTimeout(() => updateStatus('arriving_soon'), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [ride]);

  const startRide = useCallback(
    async (params: { direction: Direction; departure_station: string; arrival_station: string }) => {
      if (!userId) return null;
      const travelSeconds = getTravelTimeSeconds(params.direction, params.departure_station, params.arrival_station);
      const now = new Date();
      const estimatedArrival = new Date(now.getTime() + travelSeconds * 1000);
      const expiresAt = new Date(estimatedArrival.getTime() + RIDE_TTL_MINUTES * 60 * 1000);

      const { data, error } = await supabase
        .from('active_rides')
        .insert({
          user_id: userId,
          line: '2호선',
          direction: params.direction,
          departure_station: params.departure_station,
          arrival_station: params.arrival_station,
          status: 'riding',
          estimated_arrival: estimatedArrival.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      setRide(data);
      return data;
    },
    [userId]
  );

  const updateStatus = useCallback(
    async (status: RideStatus) => {
      if (!ride) return;
      const { data, error } = await supabase
        .from('active_rides')
        .update({ status })
        .eq('id', ride.id)
        .select()
        .single();
      if (error) throw error;
      setRide(data);
    },
    [ride]
  );

  const cancelRide = useCallback(async () => {
    if (!ride) return;
    await supabase.from('active_rides').delete().eq('id', ride.id);
    setRide(null);
  }, [ride]);

  const getRemainingInfo = useCallback(() => {
    if (!ride) return { stations: 0, minutes: 0 };
    const now = Date.now();
    const arrival = new Date(ride.estimated_arrival).getTime();
    const remainingMs = Math.max(0, arrival - now);
    return {
      stations: getRemainingStationCount(ride.direction as Direction, ride.departure_station, ride.arrival_station),
      minutes: Math.ceil(remainingMs / 60000),
    };
  }, [ride]);

  return { ride, isLoading, startRide, updateStatus, cancelRide, getRemainingInfo };
}
