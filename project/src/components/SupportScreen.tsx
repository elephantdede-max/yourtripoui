import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Send, HelpCircle, Bug, Lightbulb, MessageCircle, CheckCircle, ChevronLeft, BookOpen, Mail, Inbox, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { useLang } from '../lib/lang-context';
import { useToast } from '../lib/toast-context';

interface Props {
  onClose: () => void;
}

const G = '#C9A961';
const BG = '#000000';

const TICKET_TYPES = [
  { id: 'question',   labelKey: 'support_type_question', icon: HelpCircle,    color: '#5DADE2' },
  { id: 'bug',        labelKey: 'support_type_bug',      icon: Bug,           color: '#E74C3C' },
  { id: 'suggestion', labelKey: 'support_type_suggestion', icon: Lightbulb,   color: '#F1C40F' },
  { id: 'other',      labelKey: 'support_type_other',    icon: MessageCircle, color: '#9B9B9B' },
] as const;

type TicketType = typeof TICKET_TYPES[number]['id'];
type View = 'menu' | 'faq' | 'contact' | 'tickets';

export default function SupportScreen({ onClose }: Props) {
    const { toast } = useToast();
const { user } = useAuth();
  const { t } = useLang();
  const [view, setView] = useState<View>('menu');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [ticketType, setTicketType] = useState<TicketType>('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // FAQ items générés dynamiquement avec t()
  const FAQ_ITEMS = Array.from({ length: 10 }, (_, i) => ({
    q: t(`faq_q${i + 1}`),
    a: t(`faq_a${i + 1}`),
  }));

  const loadMyTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMyTickets(data || []);
    setLoadingTickets(false);
  };

  const goTo = (v: View) => {
    setView(v);
    if (v === 'tickets') loadMyTickets();
  };

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert([{
        user_id: user.id,
        user_email: user.email,
        type: ticketType,
        subject: subject.trim(),
        message: message.trim(),
      }]);
      if (error) throw error;
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      console.error('Erreur envoi ticket:', e);
      toast.error(t('support_send_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: BG, zIndex: 9995,
      maxWidth: 430, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--f-display)',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 24px 16px', borderBottom: `1px solid ${G}33`,
      }}>
        {view !== 'menu' ? (
          <button onClick={() => setView('menu')} style={{
            background: 'transparent', border: `1px solid ${G}55`, borderRadius: '50%',
            width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft size={20} color={G} />
          </button>
        ) : <div style={{ width: 36 }} />}

        <h2 style={{ color: G, fontSize: 20, fontWeight: 700, margin: 0, flex: 1, textAlign: 'center' }}>
          {view === 'menu' ? t('support_title') :
           view === 'faq' ? t('support_faq_title') :
           view === 'contact' ? t('support_contact') :
           t('support_my_messages')}
        </h2>

        <button onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${G}55`, borderRadius: '50%',
          width: 36, height: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={20} color={G} />
        </button>
      </div>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* ─── MENU PRINCIPAL ─── */}
        {view === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 8, textAlign: 'center', lineHeight: 1.5 }}>
              {t('support_subtitle')}
            </p>

            {[
              { id: 'faq' as View,     icon: BookOpen, labelKey: 'support_faq',         descKey: 'support_faq_desc',         color: '#5DADE2' },
              { id: 'contact' as View, icon: Mail,     labelKey: 'support_contact',     descKey: 'support_contact_desc',     color: G },
              { id: 'tickets' as View, icon: Inbox,    labelKey: 'support_my_messages', descKey: 'support_my_messages_desc', color: '#9B9B9B' },
            ].map(({ id, icon: Icon, labelKey, descKey, color }) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                style={{
                  width: '100%', padding: 20,
                  background: '#0f0f0f',
                  border: `1.5px solid ${color}44`,
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#161616';
                  e.currentTarget.style.borderColor = `${color}88`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#0f0f0f';
                  e.currentTarget.style.borderColor = `${color}44`;
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={24} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: G, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    {t(labelKey)}
                  </div>
                  <div style={{ color: '#888', fontSize: 12, lineHeight: 1.4 }}>
                    {t(descKey)}
                  </div>
                </div>
                <ChevronRight size={18} color="#555" />
              </button>
            ))}
          </div>
        )}

        {/* ─── FAQ ─── */}
        {view === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              {t('support_faq_intro')}
            </p>
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} style={{
                background: '#0f0f0f', border: `1px solid ${G}33`,
                borderRadius: 12, overflow: 'hidden',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    color: G, fontFamily: 'var(--f-display)', fontSize: 14, fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ flex: 1, paddingRight: 12 }}>{item.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openFaq === idx && (
                  <div style={{
                    padding: '0 16px 14px',
                    color: '#aaa', fontSize: 13, lineHeight: 1.5,
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── CONTACT ─── */}
        {view === 'contact' && (
          <div>
            {success ? (
              <div style={{
                padding: 24, background: '#0a3a1a', border: '1.5px solid #2D7D46',
                borderRadius: 14, textAlign: 'center',
              }}>
                <CheckCircle size={48} color="#5BCB7F" style={{ marginBottom: 12 }} />
                <h3 style={{ color: '#5BCB7F', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  {t('support_sent_title')}
                </h3>
                <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5 }}>
                  {t('support_sent_desc')} <strong>{user?.email}</strong>.
                </p>
              </div>
            ) : (
              <>
                <label style={{ display: 'block', color: G, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('support_type')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                  {TICKET_TYPES.map(({ id, labelKey, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => setTicketType(id)}
                      style={{
                        padding: '12px 10px', borderRadius: 12,
                        background: ticketType === id ? `${color}22` : '#0f0f0f',
                        border: `1.5px solid ${ticketType === id ? color : '#222'}`,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: ticketType === id ? color : '#888',
                        fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      <Icon size={18} />
                      <span>{t(labelKey)}</span>
                    </button>
                  ))}
                </div>

                <label style={{ display: 'block', color: G, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('support_subject')}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={t('support_subject_placeholder')}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: '#0f0f0f', border: `1px solid ${G}33`,
                    color: G, fontFamily: 'var(--f-display)', fontSize: 14,
                    outline: 'none', marginBottom: 16, boxSizing: 'border-box',
                  }}
                />

                <label style={{ display: 'block', color: G, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('support_message')}
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('support_message_placeholder')}
                  rows={6}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: '#0f0f0f', border: `1px solid ${G}33`,
                    color: G, fontFamily: 'var(--f-display)', fontSize: 14,
                    outline: 'none', resize: 'vertical', marginBottom: 20, boxSizing: 'border-box',
                    minHeight: 120,
                  }}
                />

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !subject.trim() || !message.trim()}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 30,
                    background: (subject.trim() && message.trim() && !submitting) ? G : '#333',
                    color: (subject.trim() && message.trim() && !submitting) ? BG : '#666',
                    border: 'none',
                    cursor: (subject.trim() && message.trim() && !submitting) ? 'pointer' : 'default',
                    fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Send size={16} />
                  {submitting ? t('support_sending') : t('support_send')}
                </button>
                <p style={{ color: '#666', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
                  {t('support_response_time')} {user?.email}
                </p>
              </>
            )}
          </div>
        )}

        {/* ─── MES TICKETS ─── */}
        {view === 'tickets' && (
          <div>
            {loadingTickets ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>{t('support_loading')}</div>
            ) : myTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                <Inbox size={48} color="#444" style={{ margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: 14, marginBottom: 8 }}>{t('support_no_messages')}</p>
                <p style={{ fontSize: 11, color: '#444', maxWidth: 250, margin: '0 auto', lineHeight: 1.5 }}>
                  {t('support_no_messages_desc')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myTickets.map((ticket) => {
                  const typeInfo = TICKET_TYPES.find(x => x.id === ticket.type);
                  const statusColor = ticket.status === 'resolved' ? '#5BCB7F' :
                                      ticket.status === 'in_progress' ? '#F1C40F' : '#888';
                  const statusLabel = ticket.status === 'resolved' ? t('support_status_resolved') :
                                      ticket.status === 'in_progress' ? t('support_status_in_progress') :
                                      ticket.status === 'closed' ? t('support_status_closed') : t('support_status_open');
                  return (
                    <div key={ticket.id} style={{
                      background: '#0f0f0f', border: `1px solid ${G}33`,
                      borderRadius: 12, padding: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        {typeInfo && <typeInfo.icon size={14} color={typeInfo.color} />}
                        <span style={{ fontSize: 11, color: typeInfo?.color, fontWeight: 600, textTransform: 'uppercase' }}>
                          {typeInfo && t(typeInfo.labelKey)}
                        </span>
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          background: `${statusColor}22`, color: statusColor,
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                      <h4 style={{ color: G, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        {ticket.subject}
                      </h4>
                      <p style={{ color: '#aaa', fontSize: 12, lineHeight: 1.4, marginBottom: 6 }}>
                        {ticket.message}
                      </p>
                      {ticket.admin_response && (
                        <div style={{
                          marginTop: 10, padding: 10,
                          background: `${G}11`, border: `1px solid ${G}44`,
                          borderRadius: 8,
                        }}>
                          <div style={{ fontSize: 10, color: G, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>
                            {t('support_admin_response')}
                          </div>
                          <p style={{ color: '#ddd', fontSize: 12, lineHeight: 1.4 }}>{ticket.admin_response}</p>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#555', marginTop: 8 }}>
                        {new Date(ticket.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}