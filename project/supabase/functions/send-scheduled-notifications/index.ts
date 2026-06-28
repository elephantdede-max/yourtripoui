// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@yourtrip.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const now = new Date();
  const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // 1. Récupérer les notifs à envoyer (planifiées dans les 5 prochaines min, pas encore envoyées)
  const { data: notifs, error } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .lte("scheduled_at", fiveMinFromNow.toISOString())
    .is("sent_at", null)
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!notifs || notifs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: "No pending notifs" }));
  }

  // 2. Récupérer les abonnements push de tous les users concernés
  const userIds = [...new Set(notifs.map((n) => n.user_id))];
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);

  const subsByUser = new Map<string, any[]>();
  for (const s of subs || []) {
    const arr = subsByUser.get(s.user_id) || [];
    arr.push(s);
    subsByUser.set(s.user_id, arr);
  }

  // 3. Grouper les notifs day_end par user_id + jour (1 seule notif fin groupée si plusieurs voyages le même jour)
  const groupKey = (n: any) => {
    if (n.kind === "day_end") {
      const dayKey = n.scheduled_at.slice(0, 10);
      return `${n.user_id}_day_end_${dayKey}`;
    }
    return n.id; // day_start = 1 notif par voyage
  };

  const groups = new Map<string, any[]>();
  for (const n of notifs) {
    const k = groupKey(n);
    const arr = groups.get(k) || [];
    arr.push(n);
    groups.set(k, arr);
  }

  let sentCount = 0;
  let failedCount = 0;
  const sentIds: string[] = [];

  // 4. Pour chaque groupe, envoyer 1 push aux subs du user
  for (const [, groupNotifs] of groups) {
    const first = groupNotifs[0];
    const userSubs = subsByUser.get(first.user_id) || [];
    if (userSubs.length === 0) {
      // Pas d'abonnement, on marque quand même comme "envoyé" pour ne pas réessayer en boucle
      sentIds.push(...groupNotifs.map((n) => n.id));
      continue;
    }

    // Construire le payload (regrouper les titres si plusieurs)
    let title = first.title;
    let body = first.body;
    if (groupNotifs.length > 1 && first.kind === "day_end") {
      title = "Comment était ta journée ?";
      body = `${groupNotifs.length} voyages à noter.`;
    }

    const payload = JSON.stringify({
      title,
      body,
      url: first.url || "/",
      tag: first.kind,
    });

    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sentCount++;
      } catch (err: any) {
        failedCount++;
        // Si subscription expirée (410), la supprimer
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        console.error("[push] send error:", err.statusCode, err.body);
      }
    }

    sentIds.push(...groupNotifs.map((n) => n.id));
  }

  // 5. Marquer les notifs comme envoyées
  if (sentIds.length > 0) {
    await supabase
      .from("scheduled_notifications")
      .update({ sent_at: now.toISOString() })
      .in("id", sentIds);
  }

  return new Response(JSON.stringify({
    sent: sentCount,
    failed: failedCount,
    processed: sentIds.length,
  }));
});