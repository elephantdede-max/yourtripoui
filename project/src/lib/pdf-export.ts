import jsPDF from 'jspdf';
import type { MultiDayPlan, BudgetType } from '../types';

// ─── Palette DA Carnet de voyage ───
// Aligné sur ton mockup HTML : fond crème chaud, encre profonde, doré subtil
const COL_BG       = [251, 247, 238] as const; // #FBF7EE fond crème
const COL_TEXT     = [33, 27, 18] as const;    // #211B12 encre principale
const COL_MUTED    = [120, 110, 95] as const;  // #786E5F texte secondaire
const COL_FAINT    = [154, 140, 114] as const; // #9A8C72 eyebrow / labels
const COL_ACCENT   = [168, 136, 74] as const;  // #A8884A doré ville/date
const COL_RULE     = [210, 196, 164] as const; // #D2C4A4 filets / ronds

// Couleurs catégories (cohérentes avec l'app)
const CAT_COLORS: Record<string, [number, number, number]> = {
  food:    [197, 123, 94],
  chill:   [138, 156, 118],
  culture: [123, 149, 176],
  view:    [180, 150, 90],
  social:  [155, 106, 130],
  leisure: [200, 145, 85],
  nature:  [110, 138, 90],
};

const CAT_LABELS: Record<string, string> = {
  food: 'Gastronomie',
  chill: 'Détente',
  culture: 'Culture',
  view: 'Vue',
  social: 'Convivial',
  leisure: 'Loisirs',
  nature: 'Nature',
};

const MOOD_LABELS: Record<string, string> = {
  chill: 'Chill',
  date: 'Romantique',
  romantique: 'Romantique',
  aventure: 'Aventure',
  culturel: 'Culture',
  culture: 'Culture',
  gastronomie: 'Foodie',
  foodie: 'Foodie',
  nature: 'Nature',
  amusement: 'Fun',
  fun: 'Fun',
};

export function exportTripToPDF(plan: MultiDayPlan, lang: string = 'fr'): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();  // 297

  const M = 18;                   // marge latérale
  const CONTENT_W = pageW - 2 * M;

  const today = new Date();
  const editedDate =
    `${String(today.getDate()).padStart(2, '0')} · ` +
    `${String(today.getMonth() + 1).padStart(2, '0')} · ` +
    `${today.getFullYear()}`;

  // ─── Helpers de dessin ─────────────────────────────────────────

  /** Fond crème + filet doré tout en haut (1mm) */
  const paintBg = () => {
    doc.setFillColor(COL_BG[0], COL_BG[1], COL_BG[2]);
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.setFillColor(COL_ACCENT[0], COL_ACCENT[1], COL_ACCENT[2]);
    doc.rect(0, 0, pageW, 1, 'F');
  };

  /** Header haut de page : "Your Trip" + "CARNET DE VOYAGE / Édité le …" + "suite" si pas page 1 */
  const drawTopHeader = (dayIdx: number, isContinuation: boolean) => {
    // Bandeau "Y · Your Trip" à gauche
    if (!isContinuation) {
      // Petit Y stylisé
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(COL_ACCENT[0], COL_ACCENT[1], COL_ACCENT[2]);
      doc.text('Y', M, 13);

      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
      doc.text('Your Trip', M + 5, 13);

      // Bloc droit "CARNET DE VOYAGE / Édité le …"
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text('CARNET DE VOYAGE', pageW - M, 10, { align: 'right' });
      doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
      doc.text(`Édité le ${editedDate}`, pageW - M, 15, { align: 'right' });
    } else {
      // Pages de continuation : "SOIRÉE · NUIT" à gauche, ville · suite à droite
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text('SUITE', M, 13);

      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text(`${plan.city} · suite`, pageW - M, 13, { align: 'right' });

      // Petit filet doré sous le header continuation
      doc.setDrawColor(COL_RULE[0], COL_RULE[1], COL_RULE[2]);
      doc.setLineWidth(0.2);
      doc.line(M, 17, pageW - M, 17);
    }
  };

  /** Footer : "Your Trip" italique + "VILLE · DATE" + "X / Y" pagination */
  const drawFooter = (currentPage: number, totalPages: number, day: any) => {
    const y = pageH - 12;

    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(COL_ACCENT[0], COL_ACCENT[1], COL_ACCENT[2]);
    doc.text('Your Trip', M, y);

    // Centre : VILLE · DATE
    if (day?.date) {
      const d = new Date(day.date + 'T00:00:00');
      const dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text(`${plan.city.toUpperCase()} · ${dateStr}`, pageW / 2, y, { align: 'center' });
    }

    // Pagination droite
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
    doc.text(`${currentPage} / ${totalPages}`, pageW - M, y, { align: 'right' });
  };

  // ─── Helpers métiers ───────────────────────────────────────────

  const computeDistance = (steps: any[]): number => {
    if (!steps?.length) return 0;
    let total = 0;
    for (const s of steps) {
      if (s.tr?.txt) {
        const km = parseFloat(s.tr.txt.match(/(\d+(?:\.\d+)?)\s*km/i)?.[1] || '0');
        total += km;
      }
    }
    return Math.round(total) || Math.round(steps.length * 1.5);
  };

  const generateDayDescription = (day: any): string => {
    const types = new Set<string>(day.steps?.map((s: any) => s.type) || []);
    const elements: string[] = [];
    if (types.has('culture')) elements.push('culture');
    if (types.has('food')) elements.push('gastronomie');
    if (types.has('nature') || types.has('chill')) elements.push('nature');
    if (types.has('social') || types.has('leisure')) elements.push('nuit');
    const list = elements.length > 0 ? elements.join(', ') : 'découvertes';
    return `Une journée tout en flânerie — ${list}. Pensée pour t'accompagner sans friction, du premier café à la dernière table.`;
  };

  const cleanTime = (t?: string) => (t || '').replace('h', ':');

  const cleanTransport = (tr?: { icon: string; txt: string }): { mode: string; mins: string } | null => {
    if (!tr?.txt) return null;
    const txt = tr.txt;
    let mode = 'À PIED';
    if (/m[ée]tro|train|🚇|🚊/i.test(tr.icon || '') || /m[ée]tro|RER/i.test(txt)) mode = 'MÉTRO';
    else if (/bus|🚌/i.test(tr.icon || '') || /bus/i.test(txt)) mode = 'BUS';
    else if (/v[ée]lo|🚴/i.test(tr.icon || '') || /v[ée]lo/i.test(txt)) mode = 'VÉLO';
    else if (/voiture|🚗/i.test(tr.icon || '') || /voiture|taxi/i.test(txt)) mode = 'TAXI';
    else if (/🚶|pied|walk/i.test(tr.icon || '') || /\bpied\b|marche/i.test(txt)) mode = 'À PIED';
    const minsMatch = txt.match(/(\d+)\s*min/i);
    const mins = minsMatch ? `${minsMatch[1]} MIN` : '';
    return { mode, mins };
  };

  /** Encadré arrondi, plus discret que le rect par défaut */
  const roundedRect = (x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD') => {
    doc.roundedRect(x, y, w, h, r, r, style);
  };

  // ─── Calcul nombre total de pages (pour la pagination footer) ──
  // On simule le rendu pour compter, puis on re-rend en posant les bons footers
  // Approche simple : on calcule à la louche : page 1 contient ~5-6 steps + entête, suite ~10 steps
  // Plus robuste : on track au fur et à mesure et on rajoute la pagination après coup via insertion.
  // jsPDF supporte la mise à jour à la fin via getNumberOfPages() — on dessinera les footers à la toute fin.

  const dayPageRanges: Array<{ start: number; end: number; day: any }> = [];

  // ─── Rendu jour par jour ──────────────────────────────────────
  (plan.days || []).forEach((day, dayIdx) => {
    if (dayIdx > 0) doc.addPage();
    paintBg();
    drawTopHeader(dayIdx, false);

    const dayStartPage = doc.getNumberOfPages();

    let y = 24;

    // ─── BLOC TÊTE : "▲ DESTINATION" + ville énorme + bloc "JOUR N / date / Plage / Étapes / Distance / Mood"
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
    doc.text('//  DESTINATION', M, y);

    // À droite : "JOUR N · X" (X = numéro / total)
    doc.text(`JOUR ${dayIdx + 1} · ${dayIdx + 1}`, pageW - M, y, { align: 'right' });

    y += 4;

    // Ville énorme italique serif
    doc.setFont('times', 'italic');
    doc.setFontSize(64);
    doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
    doc.text(plan.city, M, y + 22);

    // Bloc date à droite (sous "JOUR N")
    if (day.date) {
      const d = new Date(day.date + 'T00:00:00');
      const weekday = d.toLocaleDateString(lang, { weekday: 'long' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString(lang, { month: 'long' });
      const year = d.getFullYear();

      doc.setFont('times', 'italic');
      doc.setFontSize(15);
      doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
      doc.text(weekday, pageW - M, y + 8, { align: 'right' });
      doc.setTextColor(COL_ACCENT[0], COL_ACCENT[1], COL_ACCENT[2]);
      doc.text(`${dayNum} ${month}`, pageW - M, y + 14, { align: 'right' });
      doc.text(String(year), pageW - M, y + 20, { align: 'right' });
    }

    y += 30;

    // Description italique sous le titre (à gauche)
    const desc = generateDayDescription(day);
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(COL_MUTED[0], COL_MUTED[1], COL_MUTED[2]);
    const descLines = doc.splitTextToSize(`« ${desc} »`, 95);
    doc.text(descLines.slice(0, 4), M, y);
    const descBlockHeight = Math.min(descLines.length, 4) * 4.5;

    // Bloc métadonnées à droite (Plage / Étapes / Distance / Mood)
    const metaX = pageW - M - 70;
    let metaY = y - 2;

    const startT = cleanTime(day.startTime || '10:00');
    const endT = cleanTime(day.endTime || '22:00');
    const steps = (day.steps || []).filter((s: any) => !s.isPremiumPlaceholder);
    const distance = computeDistance(steps);
    const moodKey = (day.title || (day as any).mood || '').toLowerCase().trim();
    const moodTxt = MOOD_LABELS[moodKey] || (moodKey ? moodKey.charAt(0).toUpperCase() + moodKey.slice(1) : 'Exploration');

    const drawMetaRow = (label: string, value: string, valueItalic = false) => {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text(label.toUpperCase(), metaX, metaY);

      if (valueItalic) {
        doc.setFont('times', 'italic');
        doc.setFontSize(11);
      } else {
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
      }
      doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
      doc.text(value, pageW - M, metaY, { align: 'right' });

      // Filet sous chaque row
      metaY += 3;
      doc.setDrawColor(COL_RULE[0], COL_RULE[1], COL_RULE[2]);
      doc.setLineWidth(0.15);
      doc.line(metaX, metaY, pageW - M, metaY);
      metaY += 4;
    };

    drawMetaRow('Plage', `${startT}  -  ${endT}`);
    drawMetaRow('Étapes', String(steps.length));
    drawMetaRow('Distance', `~ ${distance} km`);
    drawMetaRow('Mood', moodTxt, true);

    y += Math.max(descBlockHeight, 35) + 4;

    // ─── Eyebrow "MATIN · APRÈS-MIDI / SOIRÉE · NUIT" (selon position dans la journée)
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
    doc.text('MATIN · APRÈS-MIDI', M, y);
    y += 6;

    // ─── TIMELINE des étapes ──
    const TIMELINE_X_TIMES = M + 2;        // colonne horaires (gauche)
    const TIMELINE_X_CIRCLE = M + 26;      // colonne ronds numérotés
    const TIMELINE_X_CONTENT = M + 36;     // colonne contenu
    const STEP_BLOCK_H = 38;               // hauteur réservée par étape

    let lastBlockBottomForLine: number | null = null;

    steps.forEach((step: any, stepIdx: number) => {
      // Nouvelle page si on dépasse
      if (y + STEP_BLOCK_H > pageH - 22) {
        doc.addPage();
        paintBg();
        drawTopHeader(dayIdx, true);
        y = 24;

        // Eyebrow continuation (soirée si on est tard, sinon "suite")
        const firstStepHour = parseInt(cleanTime(step.time).split(':')[0] || '0', 10);
        const eyebrow = firstStepHour >= 18 ? 'SOIRÉE · NUIT' : 'JOURNÉE · SUITE';
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
        doc.text(eyebrow, M, y);
        y += 8;
        lastBlockBottomForLine = null;
      }

      const stepNumber = stepIdx + 1;
      const stepStart = cleanTime(step.time);
      const stepEnd = cleanTime(step.endTime);
      const catColor = CAT_COLORS[step.type] || CAT_COLORS.culture;
      const catLabel = CAT_LABELS[step.type] || step.type;

      // ── Horaires (gauche) ──
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
      doc.text(stepStart, TIMELINE_X_TIMES, y + 2);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text(stepEnd, TIMELINE_X_TIMES, y + 7);

      // ── Rond numéroté crème entouré de doré (centré sur la colonne TIMELINE_X_CIRCLE) ──
      const circleX = TIMELINE_X_CIRCLE;
      const circleY = y + 4;
      doc.setFillColor(COL_BG[0], COL_BG[1], COL_BG[2]);
      doc.setDrawColor(COL_RULE[0], COL_RULE[1], COL_RULE[2]);
      doc.setLineWidth(0.4);
      doc.circle(circleX, circleY, 3.2, 'FD');
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(COL_ACCENT[0], COL_ACCENT[1], COL_ACCENT[2]);
      doc.text(String(stepNumber), circleX, circleY + 1.3, { align: 'center' });

      // Ligne pointillée verticale vers le rond suivant
      if (lastBlockBottomForLine !== null) {
        doc.setDrawColor(COL_RULE[0], COL_RULE[1], COL_RULE[2]);
        doc.setLineDashPattern([0.8, 1.2], 0);
        doc.setLineWidth(0.25);
        doc.line(circleX, lastBlockBottomForLine, circleX, circleY - 3.4);
        doc.setLineDashPattern([], 0);
      }

      // ── Contenu (droite) ──
      // Pastille catégorie : dot couleur + label en mono uppercase
      doc.setFillColor(catColor[0], catColor[1], catColor[2]);
      doc.circle(TIMELINE_X_CONTENT + 1.5, y + 1.2, 1.1, 'F');

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
      doc.text(catLabel.toUpperCase(), TIMELINE_X_CONTENT + 4.5, y + 2);

      // Nom du lieu en serif italique
      doc.setFont('times', 'italic');
      doc.setFontSize(17);
      doc.setTextColor(COL_TEXT[0], COL_TEXT[1], COL_TEXT[2]);
      const nameLines = doc.splitTextToSize(step.name || '', CONTENT_W - 40);
      doc.text(nameLines.slice(0, 1), TIMELINE_X_CONTENT, y + 9);

      // Description (helvetica gris, max 2 lignes)
      if (step.desc) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(COL_MUTED[0], COL_MUTED[1], COL_MUTED[2]);
        const descLines = doc.splitTextToSize(step.desc, CONTENT_W - 40);
        doc.text(descLines.slice(0, 2), TIMELINE_X_CONTENT, y + 15);
      }

      // Transport (en bas du bloc)
      const transport = cleanTransport(step.tr);
      if (transport) {
        const trY = y + 28;
        // Filet doré court
        doc.setDrawColor(COL_RULE[0], COL_RULE[1], COL_RULE[2]);
        doc.setLineWidth(0.4);
        doc.line(TIMELINE_X_CONTENT, trY, TIMELINE_X_CONTENT + 5, trY);

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(COL_FAINT[0], COL_FAINT[1], COL_FAINT[2]);
        doc.text(`${transport.mode}${transport.mins ? `   ${transport.mins}` : ''}`, TIMELINE_X_CONTENT + 7, trY + 1);
      }

      lastBlockBottomForLine = circleY + 3.4;
      y += STEP_BLOCK_H;
    });

    const dayEndPage = doc.getNumberOfPages();
    dayPageRanges.push({ start: dayStartPage, end: dayEndPage, day });
  });

  // ─── Footers + pagination FINALE ──
  // Maintenant qu'on connaît le total de pages, on les redessine proprement
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Trouver le jour correspondant à cette page
    const range = dayPageRanges.find((r) => p >= r.start && p <= r.end);
    drawFooter(p, totalPages, range?.day);
  }

  // ─── Téléchargement ──
  const firstDay = plan.days?.[0]?.date || 'voyage';
  const fileName = `your-trip-${plan.city.toLowerCase().replace(/\s+/g, '-')}-${firstDay}.pdf`;
  doc.save(fileName);
}