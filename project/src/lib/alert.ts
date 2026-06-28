// Webhook Discord pour les alertes d'erreur en prod
const DISCORD_WEBHOOK = import.meta.env.VITE_DISCORD_ALERT_WEBHOOK || '';

export type AlertLevel = 'error' | 'warning' | 'info';

export async function sendAlert(
  message: string,
  context?: Record<string, any>,
  level: AlertLevel = 'error',
) {
  // En dev, juste log dans la console — pas de spam Discord
  if (import.meta.env.DEV) {
    console.warn(`[alert:${level}]`, message, context);
    return;
  }
  if (!DISCORD_WEBHOOK) return;

  const emoji = level === 'error' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
  const safeContext = JSON.stringify(context || {}, null, 2).slice(0, 1500);

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `${emoji} **${message}**\n\`\`\`json\n${safeContext}\n\`\`\``,
      }),
    });
  } catch (e) {
    // On ne fait surtout pas crasher l'app si l'alerte échoue
    console.warn('[alert] failed to send', e);
  }
}