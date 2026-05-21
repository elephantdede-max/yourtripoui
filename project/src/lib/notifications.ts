/**
 * YOUR TRIP — Système de notifications
 * Niveau 1: Rappels planning (30min avant activité)
 * Niveau 2: Fin de journée → review
 * Niveau 3: Réengagement
 */

export interface NotifConfig {
  planning: boolean;
  review: boolean;
  reengagement: boolean;
}

// Demander la permission
export async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Notification planning — 30min avant une activité
export function scheduleActivityReminder(activityName: string, activityTime: string, icon = '📍') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const [h, m] = activityTime.replace('h', ':').split(':').map(Number);
  const activityDate = new Date();
  activityDate.setHours(h, m, 0, 0);
  const reminderTime = activityDate.getTime() - 30 * 60 * 1000;
  const delay = reminderTime - Date.now();

  if (delay > 0) {
    setTimeout(() => {
      new Notification('Your Trip ✨', {
        body: `Dans 30 minutes : ${activityName} ${icon}`,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: `activity-${activityName}`,
        silent: false,
      });
    }, delay);
  }
}

// Notification fin de journée → review
export function scheduleEndOfDayReview(lastActivityEndTime: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const [h, m] = lastActivityEndTime.replace('h', ':').split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(h, m + 15, 0, 0); // 15min après la fin
  const delay = endDate.getTime() - Date.now();

  if (delay > 0) {
    setTimeout(() => {
      new Notification('Your Trip ✨', {
        body: "Comment s'est passée ta journée ? Note tes activités !",
        icon: '/vite.svg',
        tag: 'end-of-day-review',
      });
    }, delay);
  }
}

// Notification réengagement (24h sans activité)
export function scheduleReengagement(city: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const delay = 24 * 60 * 60 * 1000; // 24h
  setTimeout(() => {
    new Notification('Your Trip ✨', {
      body: `Prêt pour une nouvelle journée à ${city} ? 🗺️`,
      icon: '/vite.svg',
      tag: 'reengagement',
    });
  }, delay);
}

// Programmer toutes les notifs d'un planning
export function schedulePlanNotifications(plan: any, config: NotifConfig) {
  if (!plan?.days) return;
  plan.days.forEach((day: any) => {
    day.steps?.forEach((step: any) => {
      if (config.planning) {
        const icon = step.type === 'food' ? '🍽️' : step.type === 'culture' ? '🎨' : step.type === 'chill' ? '🌿' : '📍';
        scheduleActivityReminder(step.name, step.time, icon);
      }
    });
    const lastStep = day.steps?.[day.steps.length - 1];
    if (lastStep && config.review) {
      scheduleEndOfDayReview(lastStep.endTime || '22:00');
    }
  });
  if (config.reengagement) {
    scheduleReengagement(plan.city || 'Paris');
  }
}
