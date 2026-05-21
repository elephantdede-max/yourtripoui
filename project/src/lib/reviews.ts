import { supabase } from './supabase';

export interface PlaceReviewData {
  placeId: string;
  rating: number;
  comment?: string;
}

/**
 * Save a review for a place
 */
export async function saveReview(userId: string, placeId: string, rating: number, comment?: string) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert({
      place_id: placeId,
      user_id: userId,
      rating,
      comment: comment || null,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get reviews for a place
 */
export async function getPlaceReviews(placeId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('place_id', placeId);

  if (error) throw error;
  return data || [];
}

/**
 * Get user's own reviews
 */
export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

/**
 * Persist pending review to localStorage
 */
export function savePendingReview(dayId: string, places: any[]) {
  localStorage.setItem('pending_review', JSON.stringify({
    dayId,
    places,
    timestamp: Date.now(),
  }));
}

/**
 * Get pending review from localStorage
 */
export function getPendingReview() {
  try {
    const pending = localStorage.getItem('pending_review');
    if (!pending) return null;

    const data = JSON.parse(pending);
    // Consider it stale if older than 24 hours
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('pending_review');
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear pending review from localStorage
 */
export function clearPendingReview() {
  localStorage.removeItem('pending_review');
}

/**
 * Submit batch of reviews
 */
export async function submitBatchReviews(
  userId: string,
  reviews: Array<{ placeId: string; rating: number }>,
  comment?: string
) {
  const results = [];

  for (const review of reviews) {
    try {
      const result = await saveReview(userId, review.placeId, review.rating, comment);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error });
    }
  }

  return results;
}
