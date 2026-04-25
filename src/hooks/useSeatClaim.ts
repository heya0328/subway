import { useState, useCallback } from 'react';
import { supabase } from '../data/supabase';

export function useSeatClaim() {
  const [isClaiming, setIsClaiming] = useState(false);

  const claimSeat = useCallback(async (seatShareId: string, userId: string) => {
    setIsClaiming(true);
    try {
      // Check if already claimed
      const { data: existing } = await supabase
        .from('seat_claims')
        .select('id')
        .eq('seat_share_id', seatShareId)
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (existing) {
        return { alreadyClaimed: true };
      }

      // Insert claim as pending (매칭은 "내려요" 버튼에서 실행)
      const { error } = await supabase
        .from('seat_claims')
        .insert({
          seat_share_id: seatShareId,
          user_id: userId,
          status: 'pending',
        });

      if (error) throw error;

      return { claimed: true };
    } catch (err) {
      throw err;
    } finally {
      setIsClaiming(false);
    }
  }, []);

  const getMyClaimStatus = useCallback(async (seatShareId: string, userId: string) => {
    try {
      const { data } = await supabase
        .from('seat_claims')
        .select('status')
        .eq('seat_share_id', seatShareId)
        .eq('user_id', userId)
        .limit(1)
        .single();
      return data?.status ?? null;
    } catch {
      return null;
    }
  }, []);

  return { claimSeat, getMyClaimStatus, isClaiming };
}
