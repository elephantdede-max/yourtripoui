import { supabase } from './supabase';

export const QUOTA_FREE = 7;
export const QUOTA_PREMIUM = 40;

export interface QuotaInfo {
  used: number;
  max: number;
  remaining: number;
  isPremium: boolean;
  canCreate: (nbDays: number) => boolean;
  resetDate: string; // ISO YYYY-MM-DD
}

/**
 * Charge l'info quota du user et reset si nécessaire (1er du mois)
 */
export async function getQuotaInfo(userId: string): Promise<QuotaInfo | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('quota_used_month, quota_reset_at, is_premium')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const resetAt = data.quota_reset_at || todayStr;

  let used = data.quota_used_month || 0;
  let resetDate = resetAt;

  // Si la date de reset est dépassée → reset auto
  if (resetAt && resetAt <= todayStr) {
    used = 0;
    // Calcul du prochain 1er du mois
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    resetDate = nextMonth.toISOString().split('T')[0];

    // Update en base
    await supabase
      .from('user_profiles')
      .update({ quota_used_month: 0, quota_reset_at: resetDate })
      .eq('id', userId);
  }

  const isPremium = data.is_premium === true;
  const max = isPremium ? QUOTA_PREMIUM : QUOTA_FREE;
  const remaining = Math.max(0, max - used);

  return {
    used,
    max,
    remaining,
    isPremium,
    canCreate: (nbDays: number) => remaining >= nbDays,
    resetDate,
  };
}

/**
 * Incrémente le quota après une génération réussie
 */
export async function incrementQuota(userId: string, nbDays: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('quota_used_month')
    .eq('id', userId)
    .single();
  if (error || !data) return false;

  const newUsed = (data.quota_used_month || 0) + nbDays;
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ quota_used_month: newUsed })
    .eq('id', userId);

  return !updateError;
}