import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../data/supabase';
import type { Routine, Direction } from '../types';

export function useRoutine(userId: string | null) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    async function fetch() {
      try {
        const { data } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        setRoutine(data);
      } catch {
        setRoutine(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, [userId]);

  const createRoutine = useCallback(
    async (params: {
      direction: Direction;
      departure_station: string;
      arrival_station: string;
      departure_time: string;
      days_of_week: number[];
    }) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          line: '2호선',
          ...params,
        })
        .select()
        .single();
      if (error) throw error;
      setRoutine(data);
      return data;
    },
    [userId]
  );

  return { routine, isLoading, createRoutine };
}
