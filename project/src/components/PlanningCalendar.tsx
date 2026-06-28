import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLang } from '../lib/lang-context';

type Mode = 'list' | 'calendar';
type CalView = 'day' | 'week' | 'month';

interface TripDay {
  tripId: string; city: string; date: string;
  dayLabel?: string; title?: string;
  startTime?: string; endTime?: string; plan: any;
}

interface Props {
  plans: any[];
  onDayClick: (plan: any) => void;
  initialView?: 'day' | 'week' | 'month' | 'list';
  initialDate?: string;
  onClose?: () => void;
  title?: string;
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

const LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE', pt: 'pt-PT',
};

export default function PlanningCalendar({ plans, onDayClick, initialView, initialDate, onClose, title }: Props) {
  const { t, lang } = useLang();

  const MONTHS = [
    t('cal_month_jan'), t('cal_month_feb'), t('cal_month_mar'), t('cal_month_apr'),
    t('cal_month_may'), t('cal_month_jun'), t('cal_month_jul'), t('cal_month_aug'),
    t('cal_month_sep'), t('cal_month_oct'), t('cal_month_nov'), t('cal_month_dec'),
  ];

  // Jours de la semaine traduits (lundi → dimanche)
  const WEEKDAYS_SHORT = [
    t('cal_weekday_mon'), t('cal_weekday_tue'), t('cal_weekday_wed'),
    t('cal_weekday_thu'), t('cal_weekday_fri'), t('cal_weekday_sat'), t('cal_weekday_sun'),
  ];

  const [mode, setMode] = useState<Mode>(initialView === 'list' ? 'list' : 'calendar');
  const [calView, setCalView] = useState<CalView>(
    initialView === 'day' ? 'day' : initialView === 'month' ? 'month' : 'week'
  );
  const [cursor, setCursor] = useState<Date>(initialDate ? new Date(initialDate + 'T00:00:00') : new Date());

  const allDays: TripDay[] = useMemo(() => {
    const out: TripDay[] = [];
    for (const p of plans) {
      const data = typeof p.plan_data === 'string' ? JSON.parse(p.plan_data) : p.plan_data;
      const days = data?.days || [];
      for (const d of days) {
        if (!d.date) continue;
        out.push({
          tripId: p.id, city: p.city, date: d.date,
          dayLabel: d.dayLabel, title: d.title,
          startTime: d.startTime, endTime: d.endTime, plan: data,
        });
      }
    }
    return out;
  }, [plans]);

  const daysByDate = useMemo(() => {
    const m = new Map<string, TripDay[]>();
    for (const d of allDays) {
      const arr = m.get(d.date) || [];
      arr.push(d); m.set(d.date, arr);
    }
    return m;
  }, [allDays]);

  const weekStart = startOfWeek(cursor);
  const weekEnd = addDays(weekStart, 6);

  const goPrev = () => {
    const d = new Date(cursor);
    if (calView === 'month') d.setMonth(d.getMonth() - 1);
    else if (calView === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCursor(d);
  };
  const goNext = () => {
    const d = new Date(cursor);
    if (calView === 'month') d.setMonth(d.getMonth() + 1);
    else if (calView === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCursor(d);
  };

  const locale = LOCALE_MAP[lang] || 'en-GB';

  const periodLabel = useMemo(() => {
    if (calView === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (calView === 'day') return cursor.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    if (sameMonth) return `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS[weekStart.getMonth()].toLowerCase()} ${weekEnd.getFullYear()}`;
    return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3).toLowerCase()} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0, 3).toLowerCase()} ${weekEnd.getFullYear()}`;
  }, [calView, cursor, weekStart, weekEnd, locale, MONTHS]);

  const periodEyebrow = calView === 'month' ? t('cal_view_month') : calView === 'day' ? t('cal_view_day') : t('cal_view_week');

  // Traduit le title du jour s'il existe en clé i18n (ex: 'date' → 'Romantique', 'chill' → 'Détente', etc.)
  const translateDayTitle = (raw?: string): string => {
    if (!raw) return '';
    const key = `day_title_${raw}`;
    const tr = t(key);
    return tr && tr !== key ? tr : raw;
  };

  function Toggle<T extends string>({ options, value, onChange }: {
    options: [T, string][]; value: T; onChange: (v: T) => void;
  }) {
    return (
      <div style={{
        display: 'inline-flex',
        background: 'var(--bg-soft-strong)',
        border: '1px solid rgba(244,238,223,0.08)',
        borderRadius: 999, padding: 4, gap: 4,
      }}>
        {options.map(([v, label]) => {
          const active = value === v;
          return (
            <button key={v} onClick={() => onChange(v)} style={{
              padding: '7px 16px', borderRadius: 999,
              background: active ? 'rgba(214,188,130,0.08)' : 'transparent',
              border: active ? '1px solid rgba(214,188,130,0.45)' : '1px solid transparent',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.06em', cursor: 'pointer',
              transition: 'all 200ms ease', whiteSpace: 'nowrap',
            }}>{label}</button>
          );
        })}
      </div>
    );
  }

  function DayCard({ d, events }: { d: Date; events: TripDay[] }) {
    const hasEvent = events.length > 0;
    const isToday = fmtDate(d) === fmtDate(new Date());
    const wd = WEEKDAYS_SHORT[(d.getDay() + 6) % 7].toUpperCase();
    return (
      <button onClick={() => hasEvent && onDayClick(events[0].plan)} style={{
        width: '100%', padding: '16px 18px',
        background: hasEvent ? 'rgba(214,188,130,0.04)' : 'var(--bg-soft)',
        border: `1px solid ${hasEvent ? 'var(--stroke-gold)' : 'var(--stroke-soft)'}`,
        borderRadius: 16, cursor: hasEvent ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
        fontFamily: 'var(--f-body)',
        boxShadow: hasEvent ? '0 0 24px rgba(212,168,67,0.06)' : 'none',
      }}>
        <div style={{ minWidth: 50 }}>
          <p style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: isToday ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: '0.18em', margin: 0, fontWeight: 600 }}>{wd}</p>
          <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 30, color: hasEvent ? 'var(--accent)' : 'var(--text)', margin: '4px 0 0', lineHeight: 1, letterSpacing: '-0.02em' }}>{d.getDate()}</p>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {hasEvent ? events.map((e, idx) => {
            const titleTr = translateDayTitle(e.title);
            return (
              <div key={idx} style={{
                marginTop: idx > 0 ? 16 : 0,
                paddingTop: idx > 0 ? 16 : 0,
                borderTop: idx > 0 ? '1px solid rgba(244,238,223,0.08)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(214,188,130,0.06)', border: '1px solid rgba(214,188,130,0.45)', color: 'var(--accent)', fontSize: 10, fontWeight: 600 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />{e.city}
                  </span>
                  {titleTr && <span style={{ padding: '3px 9px', borderRadius: 999, background: 'var(--bg-soft-strong)', border: '1px solid rgba(244,238,223,0.10)', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}>{titleTr}</span>}
                </div>
                <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 19, color: 'var(--text)', margin: 0, lineHeight: 1.2, letterSpacing: '-0.015em' }}>{titleTr || t('day')}</p>
                {e.startTime && e.endTime && <p style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', margin: '4px 0 0' }}>{e.startTime} → {e.endTime}</p>}
              </div>
            );
          }) : (
            <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-faint)', margin: 0 }}>{t('cal_no_trip_planned')}</p>
          )}
        </div>
      </button>
    );
  }

  const content = (
    <div style={{ fontFamily: 'var(--f-body)' }}>
      {/* Toggle 1 : LISTE / CALENDRIER */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Toggle options={[['list', t('cal_toggle_list')], ['calendar', t('cal_toggle_calendar')]]} value={mode} onChange={setMode} />
      </div>

      {/* Toggle 2 : JOUR / SEMAINE / MOIS */}
      {mode === 'calendar' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Toggle options={[['day', t('cal_view_day')], ['week', t('cal_view_week')], ['month', t('cal_view_month')]]} value={calView} onChange={setCalView} />
        </div>
      )}

      {mode === 'calendar' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 22px' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={goPrev} style={navBtn}><ChevronLeft size={16} color="var(--text-muted)" strokeWidth={1.8} /></button>
              <button onClick={goNext} style={navBtn}><ChevronRight size={16} color="var(--text-muted)" strokeWidth={1.8} /></button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 }}>{periodEyebrow}</p>
              <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--text)', margin: '4px 0 0', letterSpacing: '-0.015em', textTransform: 'capitalize' }}>{periodLabel}</p>
            </div>
          </div>

          {calView === 'day' && <DayCard d={cursor} events={daysByDate.get(fmtDate(cursor)) || []} />}

          {calView === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d, i) => (
                <DayCard key={i} d={d} events={daysByDate.get(fmtDate(d)) || []} />
              ))}
            </div>
          )}

          {calView === 'month' && (
            <MonthGrid cursor={cursor} daysByDate={daysByDate} weekdaysShort={WEEKDAYS_SHORT} onPick={(d) => { setCursor(d); setCalView('day'); }} />
          )}
        </>
      )}

      {mode === 'list' && (
        <>
          {allDays.length === 0 ? (
            <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-muted)', textAlign: 'center', padding: '60px 20px' }}>{t('cal_no_upcoming')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allDays.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e, idx) => (
                <DayCard key={idx} d={new Date(e.date + 'T00:00:00')} events={[e]} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 200, maxWidth: 430, margin: '0 auto', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
          <h1 style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 400, color: 'var(--accent)', margin: 0, letterSpacing: '-0.02em' }}>{title || t('planning_title')}</h1>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(244,238,223,0.12)', background: 'var(--bg-soft-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="var(--text-muted)" strokeWidth={1.8} /></button>
        </div>
        <div style={{ padding: '0 20px 32px' }}>{content}</div>
      </div>
    );
  }

  return <div style={{ padding: '8px 0 32px' }}>{content}</div>;
}

function MonthGrid({ cursor, daysByDate, weekdaysShort, onPick }: { cursor: Date; daysByDate: Map<string, TripDay[]>; weekdaysShort: string[]; onPick: (d: Date) => void; }) {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const today = fmtDate(new Date());
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 10 }}>
        {weekdaysShort.map(w => (
          <div key={w} style={{ textAlign: 'center', fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', padding: '4px 0' }}>{w.toUpperCase()}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {cells.map((d, i) => {
          const key = fmtDate(d);
          const isCurrentMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === today;
          const events = daysByDate.get(key) || [];
          const hasEvent = events.length > 0;
          return (
            <button key={i} onClick={() => onPick(d)} style={{
              aspectRatio: '1', padding: 4,
              background: hasEvent ? 'rgba(214,188,130,0.08)' : 'rgba(244,238,223,0.02)',
              border: `1px solid ${isToday ? 'rgba(214,188,130,0.55)' : hasEvent ? 'rgba(214,188,130,0.30)' : 'rgba(244,238,223,0.06)'}`,
              borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              cursor: 'pointer', fontFamily: 'var(--f-body)', opacity: isCurrentMonth ? 1 : 0.3,
            }}>
              <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 15, color: hasEvent ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{d.getDate()}</span>
              {hasEvent && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: '50%',
  background: 'var(--bg-soft-strong)',
  border: '1px solid rgba(244,238,223,0.12)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};