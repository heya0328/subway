import { useState, useEffect, useCallback } from 'react';
import { fetchArrivalInfo } from '../data/seoulMetroApi';
import type { ArrivalInfo } from '../types/metro';

export function useArrivalInfo(stationName: string | null) {
  const [arrivals, setArrivals] = useState<ArrivalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!stationName) return;
    setIsLoading(true);
    try {
      const data = await fetchArrivalInfo(stationName);
      setArrivals(data);
    } catch {
      setArrivals([]);
    } finally {
      setIsLoading(false);
    }
  }, [stationName]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { arrivals, isLoading, refresh };
}
