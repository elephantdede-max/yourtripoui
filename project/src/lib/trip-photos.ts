/**
 * Gestion des photos de voyage : upload, fetch, cover, caption, delete.
 *
 * Architecture :
 * - Bucket Storage privé `trip-photos`
 * - Chemin : {user_id}/{trip_id}/{uuid}.jpg
 * - Table DB `trip_photos` avec RLS
 * - Signed URLs générées à la demande (expirent après 1h, mises en cache côté composant)
 */

import { supabase } from './supabase';
import { compressImage } from './image-compression';

export interface TripPhoto {
  id: string;
  user_id: string;
  trip_id: string;
  step_id: string | null;
  day_index: number | null;
  storage_path: string;
  caption: string | null;
  is_cover: boolean;
  created_at: string;
  // Champ enrichi côté frontend (pas en DB)
  signed_url?: string;
}

interface UploadOptions {
  stepId?: string;
  dayIndex?: number;
  caption?: string;
}

const BUCKET = 'trip-photos';
const SIGNED_URL_TTL = 3600; // 1h

// ────────────────────────────────────────────────
// UPLOAD
// ────────────────────────────────────────────────

/**
 * Compresse l'image, l'upload dans le bucket, insère la ligne DB.
 * Retourne la photo créée avec signed_url.
 */
export async function uploadTripPhoto(
  tripId: string,
  file: File,
  options: UploadOptions = {},
): Promise<TripPhoto> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // 1. Compression (max 1920px, JPEG 0.8 — différent du 400px de l'avatar)
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'image/jpeg',
  });

  // 2. Chemin Storage : {user_id}/{trip_id}/{uuid}.jpg
  const photoId = crypto.randomUUID();
  const storagePath = `${user.id}/${tripId}/${photoId}.jpg`;

  // 3. Upload bucket
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) throw upErr;

  // 4. Insert DB
  const { data, error: dbErr } = await supabase
    .from('trip_photos')
    .insert({
      id: photoId,
      user_id: user.id,
      trip_id: tripId,
      step_id: options.stepId || null,
      day_index: options.dayIndex ?? null,
      storage_path: storagePath,
      caption: options.caption || null,
      is_cover: false,
    })
    .select()
    .single();
  if (dbErr) {
    // Rollback bucket si insert DB rate
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw dbErr;
  }

  // 5. Signed URL
  const signed_url = await getSignedUrl(storagePath);
  return { ...data, signed_url } as TripPhoto;
}

// ────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────

/** Toutes les photos d'un voyage (avec signed URLs) */
export async function getTripPhotos(tripId: string): Promise<TripPhoto[]> {
  const { data, error } = await supabase
    .from('trip_photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return enrichWithSignedUrls(data || []);
}

/** Photos globales (step_id IS NULL) — pour la galerie */
export async function getGlobalTripPhotos(tripId: string): Promise<TripPhoto[]> {
  const { data, error } = await supabase
    .from('trip_photos')
    .select('*')
    .eq('trip_id', tripId)
    .is('step_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return enrichWithSignedUrls(data || []);
}

/** Photos d'un step précis */
export async function getStepPhotos(tripId: string, stepId: string): Promise<TripPhoto[]> {
  const { data, error } = await supabase
    .from('trip_photos')
    .select('*')
    .eq('trip_id', tripId)
    .eq('step_id', stepId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return enrichWithSignedUrls(data || []);
}

/** Cover d'un voyage (ou null si aucune définie) */
export async function getCoverPhoto(tripId: string): Promise<TripPhoto | null> {
  const { data, error } = await supabase
    .from('trip_photos')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_cover', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const signed_url = await getSignedUrl(data.storage_path);
  return { ...data, signed_url } as TripPhoto;
}

// ────────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────────

/** Définit une photo comme cover (et unset l'ancienne) */
export async function setCoverPhoto(photoId: string, tripId: string): Promise<void> {
  // 1. Unset l'actuelle (s'il y en a une) — pour respecter l'unique index
  await supabase
    .from('trip_photos')
    .update({ is_cover: false })
    .eq('trip_id', tripId)
    .eq('is_cover', true);

  // 2. Set la nouvelle
  const { error } = await supabase
    .from('trip_photos')
    .update({ is_cover: true })
    .eq('id', photoId);
  if (error) throw error;
}

/** Retire le statut cover (revient au placeholder beige) */
export async function unsetCoverPhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_photos')
    .update({ is_cover: false })
    .eq('id', photoId);
  if (error) throw error;
}

/** Met à jour la légende */
export async function updatePhotoCaption(photoId: string, caption: string): Promise<void> {
  const { error } = await supabase
    .from('trip_photos')
    .update({ caption: caption.trim() || null })
    .eq('id', photoId);
  if (error) throw error;
}

/** Supprime une photo (bucket + DB) */
export async function deleteTripPhoto(photo: TripPhoto): Promise<void> {
  // 1. Supprimer du bucket d'abord
  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  // 2. Puis la ligne DB (cascade trigger si t'en ajoutes plus tard)
  const { error } = await supabase
    .from('trip_photos')
    .delete()
    .eq('id', photo.id);
  if (error) throw error;
}

/** Retourne un map { stepId: count } pour tous les steps d'un voyage */
export async function getStepPhotoCounts(tripId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('trip_photos')
    .select('step_id')
    .eq('trip_id', tripId)
    .not('step_id', 'is', null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    if (row.step_id) counts[row.step_id] = (counts[row.step_id] || 0) + 1;
  }
  return counts;
}

// ────────────────────────────────────────────────
// HELPERS PRIVÉS
// ────────────────────────────────────────────────

async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

async function enrichWithSignedUrls(photos: TripPhoto[]): Promise<TripPhoto[]> {
  // Batch parallèle pour éviter le N+1 séquentiel
  const urls = await Promise.all(photos.map(p => getSignedUrl(p.storage_path)));
  return photos.map((p, i) => ({ ...p, signed_url: urls[i] }));
}