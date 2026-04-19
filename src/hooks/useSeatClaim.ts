import { useState, useCallback } from 'react';
import { supabase } from '../data/supabase';

export function useSeatClaim() {
  const [isClaming, setIsClaiming] = useState(false);

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

      // Insert claim
      const { error } = await supabase
        .from('seat_claims')
        .insert({
          seat_share_id: seatShareId,
          user_id: userId,
          status: 'pending',
        });

      if (error) throw error;

      // Try to match: check how many claims exist
      const { data: claims } = await supabase
        .from('seat_claims')
        .select('id, user_id')
        .eq('seat_share_id', seatShareId)
        .eq('status', 'pending');

      if (claims && claims.length > 0) {
        // Random pick from all pending claims
        const winner = claims[Math.floor(Math.random() * claims.length)];

        // Update winner to matched
        await supabase
          .from('seat_claims')
          .update({ status: 'matched' })
          .eq('id', winner.id);

        // Update seat_share with matched_user_id
        await supabase
          .from('seat_shares')
          .update({ matched_user_id: winner.user_id })
          .eq('id', seatShareId);

        // Reject all others
        await supabase
          .from('seat_claims')
          .update({ status: 'rejected' })
          .eq('seat_share_id', seatShareId)
          .neq('id', winner.id)
          .eq('status', 'pending');

        return { matched: winner.user_id === userId };
      }

      return { matched: false };
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

  return { claimSeat, getMyClaimStatus, isClaiming: isClaming };
}
