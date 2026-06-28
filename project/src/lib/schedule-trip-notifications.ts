import { supabase } from './supabase';

interface DayPlan {
  date?: string;
  startTime?: string;
  endTime?: string;
  steps?: any[];
}

interface MultiDayPlan {
  city: string;
  days: DayPlan[];
}

/**
 * Parse "HH:MM" ou "HHhMM" → { h, m }
 */
function parseTime(s: string): { h: number; m: number } {
  const clean = (s || '').replace('h', ':');
  const [h, m] = clean.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

/**
 * Construit un Date ISO à partir d'une date YYYY-MM-DD et d'une heure HH:MM,
 * dans le fuseau local du device.
 */
function buildDateTime(dateStr: string, timeStr: string, offsetMin: number = 0): Date {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const { h, m } = parseTime(timeStr);
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  dt.setMinutes(dt.getMinutes() + offsetMin);
  return dt;
}

/**
 * À appeler après savePlan(). Insère les notifs dans scheduled_notifications.
 * - 1 notif "début" 30 min avant chaque startTime de chaque jour
 * - 1 notif "fin" 30 min après chaque endTime de chaque jour
 * Skip les notifs déjà dans le passé.
 */
export async function scheduleNotificationsForTrip(tripId: string, plan: MultiDayPlan): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const inserts: any[] = [];

  for (const day of plan.days || []) {
    if (!day.date || !day.startTime || !day.endTime) continue;

    const startDt = buildDateTime(day.date, day.startTime, -30); // 30 min avant
    const endDt = buildDateTime(day.date, day.endTime, +30);     // 30 min après

    if (startDt > now) {
      inserts.push({
        user_id: user.id,
        trip_id: tripId,
        scheduled_at: startDt.toISOString(),
        kind: 'day_start',
        title: `Ta journée à ${plan.city} commence bientôt`,
        body: `Départ prévu à ${day.startTime} · ${day.steps?.length || 0} étapes`,
        url: '/',
      });
    }

    if (endDt > now) {
      inserts.push({
        user_id: user.id,
        trip_id: tripId,
        scheduled_at: endDt.toISOString(),
        kind: 'day_end',
        title: `Comment était ta journée à ${plan.city} ?`,
        body: 'Note tes étapes en quelques tapotements.',
        url: '/',
      });
    }
  }

  if (inserts.length === 0) return;

  const { error } = await supabase.from('scheduled_notifications').insert(inserts);
  if (error) console.error('[schedule notifs] error:', error);
  else console.log(`[schedule notifs] ${inserts.length} notifs planifiées pour le trip ${tripId}`);
}

/**
 * À appeler quand un voyage est supprimé. Vire toutes ses notifs futures.
 */
export async function unscheduleNotificationsForTrip(tripId: string): Promise<void> {
  await supabase
    .from('scheduled_notifications')
    .delete()
    .eq('trip_id', tripId)
    .is('sent_at', null);
}