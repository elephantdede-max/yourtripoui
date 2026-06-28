import { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { useLang } from '../lib/lang-context';

// --- DESSINS SVG ---

const ParisIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 241 404" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M124.894 28.5L124.986 29.0273C127.225 29.4319 129.051 30.1075 130.534 31.0322C133.093 32.6273 134.581 34.9232 135.426 37.6777C136.266 40.4164 136.473 43.6231 136.479 47.0723C136.481 48.8001 136.433 50.6008 136.384 52.4424C136.335 54.2863 136.285 56.1733 136.285 58.0859H143.901V86.0859H130.405L143.397 187.022L142.901 187.086H162.901V215.086H150.44L178.364 283.897L177.901 284.086H189.901V312.086H183.49L239.825 402.321L240.303 403.086H177.901V402.086H238.5L182.478 312.351L182.901 312.086H57.4014L57.8252 312.351L1.80273 402.086H62.4014V403.086H0L0.477539 402.321L56.8125 312.086H49.9014V284.086H64.7637L92.3633 215.086H76.9014V187.086H99.9014L99.4053 187.022L112.397 86.0859H96.9014V58.0859H103.785C103.785 54.6493 103.523 51.1699 103.432 47.7666C103.341 44.3958 103.42 41.1428 104.127 38.3076C104.837 35.4599 106.188 33.0058 108.652 31.2744C110.349 30.0822 112.545 29.2535 115.364 28.8555L115.405 28.5254L118.905 0.0253906L119.894 0L124.894 28.5ZM112.006 346.525C114.41 346.352 116.395 346.367 117.78 346.427C118.473 346.456 119.017 346.497 119.389 346.53C119.574 346.547 119.717 346.561 119.814 346.572C119.862 346.578 119.898 346.583 119.924 346.586C135.257 346.051 146.266 348.151 155.381 356.266C164.468 364.356 171.599 378.365 179.375 401.427L178.901 401.586L178.428 401.746C170.655 378.693 163.589 364.913 154.716 357.013C145.878 349.144 135.173 347.049 119.919 347.586L119.878 347.588L119.836 347.582H119.835C119.834 347.582 119.832 347.581 119.83 347.581C119.825 347.58 119.817 347.579 119.806 347.578C119.784 347.575 119.749 347.571 119.704 347.566C119.614 347.556 119.477 347.542 119.299 347.526C118.942 347.494 118.414 347.455 117.737 347.426C116.385 347.368 114.439 347.352 112.078 347.522C107.354 347.863 100.977 348.948 94.3564 351.918C81.1491 357.843 66.8762 371.313 62.8975 401.651L62.4014 401.586L61.9053 401.521C65.9265 370.86 80.4038 357.08 93.9463 351.005C100.7 347.975 107.199 346.872 112.006 346.525Z" 
      stroke={color}
      strokeWidth={6}
      fill="none"
    />
  </svg>
);

const LyonIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 52 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="Mask group">
      <path 
        id="Union" 
        d="M12.373 1.464C18.3565 -0.0822142 24.1852 -0.603199 28.9395 0.886849C33.662 2.36708 37.2637 5.8149 38.9023 12.0216C40.0532 13.1214 41.1095 14.384 42.1611 15.632C43.1508 16.8064 44.1429 17.9705 45.2334 19.0197L45.2393 19.0099L51.2393 22.3107L51.498 22.4523V30.4484C51.4981 33.2022 51.5412 35.3382 51.4365 36.879C51.384 37.6516 51.292 38.3101 51.127 38.8419C50.9613 39.3754 50.7077 39.8268 50.2998 40.1281C49.8868 40.433 49.3845 40.5336 48.8281 40.504C48.2789 40.4748 47.6397 40.3175 46.9043 40.0665C45.6855 39.6506 44.1105 38.9419 42.0918 38.006L42.8027 38.5519L43.0889 38.7716L42.9707 39.1124L38.9707 50.6124L38.7451 51.2589L31.4141 45.7599L33.9775 54.3048L34.2959 55.3673L33.2891 54.9025L20.2891 48.9025L20.2188 48.8702L20.1621 48.8185C18.7008 47.49 17.2884 46.1307 15.998 44.712V50.4484L15.0527 50.6759L4.58594 30.2179L0.970703 40.6124L0 40.4015L3 8.4015L3.02148 8.17591L3.20508 8.0431L12.2051 1.5431L12.2812 1.48841L12.373 1.464ZM33.7676 9.96107C32.2316 9.49385 30.4282 9.40707 28.2051 9.91419L24.7891 12.3556L24.4736 12.5802L24.1768 12.3322C22.8979 11.2599 21.7908 10.6018 20.8896 10.297C19.9866 9.99181 19.3572 10.0603 18.9443 10.3214C18.5308 10.5831 18.2008 11.1231 18.0859 12.0597C17.9716 12.9936 18.0831 14.2536 18.4834 15.8253L18.5449 16.0695L18.3857 16.2658C15.3668 19.9555 12.549 23.1533 10.9844 27.5724C9.52714 36.4086 14.5246 42.3333 20.7793 48.0275L32.7002 53.5285L30.0752 44.7775C27.7132 43.3804 25.4746 40.9848 24.0547 38.2462C22.6004 35.441 21.9681 32.2049 23.0283 29.2785L23.498 29.4484L23.9688 29.6193C23.0355 32.1955 23.5672 35.1318 24.9434 37.7863C26.3186 40.4385 28.5019 42.738 30.7451 44.0138L30.9199 44.1134L30.9297 44.1466L38.25 49.6368L41.9062 39.1251L27.1934 27.8449L27.0586 27.7413L27.0146 27.5773L25.0146 20.0773L25.9814 19.8195L27.9375 27.1544L40.9219 37.1095L41.209 36.4952C43.8899 37.745 45.8211 38.6403 47.2275 39.1202C47.9298 39.3599 48.4679 39.484 48.8818 39.506C49.2883 39.5275 49.5366 39.4485 49.7061 39.3234C49.8803 39.1945 50.0418 38.9641 50.1719 38.5451C50.3026 38.1237 50.3878 37.5561 50.4385 36.8107C50.5323 35.4305 50.504 33.5586 50.499 31.0831C48.903 31.4737 46.2258 32.1454 43.9482 32.1173C42.6516 32.1013 41.3707 31.8603 40.4893 31.1085C39.566 30.3209 39.1976 29.0808 39.5059 27.3605L40.4902 27.5363C40.2221 29.0326 40.5696 29.863 41.1377 30.3478C41.7477 30.8681 42.7341 31.1022 43.9609 31.1173C46.2134 31.1451 48.8971 30.4404 50.498 30.0538V27.674L46.6689 24.3243L45.667 23.4484H50.498V23.0441L45.291 20.1808L45.166 20.3224C43.7719 19.0832 42.5592 17.6563 41.3965 16.2765C40.2724 14.9425 39.1954 13.6576 38.0215 12.5665L38.0127 12.5695C38.0114 12.5643 38.0091 12.559 38.0078 12.5538C37.9632 12.5125 37.9199 12.4696 37.875 12.4288C36.6485 11.3145 35.3279 10.4358 33.7676 9.96107ZM28.6406 1.84095C24.1725 0.440607 18.595 0.899741 12.7119 2.41029L3.97461 8.71986L1.38086 36.3859L4.02539 28.7843L4.41016 27.6788L4.94336 28.7208L14.998 48.3732V44.4484H15.7578C11.6072 39.8038 8.81567 34.4865 10.0049 27.3663L10.0127 27.3234L10.0264 27.2824C11.6303 22.7213 14.5169 19.4041 17.4541 15.8224C17.0851 14.2912 16.9656 12.9834 17.0938 11.9376C17.2285 10.8383 17.647 9.95839 18.4102 9.47572C19.1739 8.99289 20.1498 8.99141 21.21 9.34974C22.1919 9.68184 23.3038 10.3417 24.5176 11.3204L27.708 9.04212L27.7881 8.98451L27.8848 8.96204C30.2967 8.39698 32.3098 8.47207 34.0586 9.00404C35.3457 9.39563 36.4702 10.0287 37.4922 10.8068C35.7896 5.84531 32.6351 3.09304 28.6406 1.84095ZM49.3271 25.3224L50.498 26.3468V24.4484H48.3281L49.3271 25.3224ZM35.3779 16.1232L38.3779 19.6232L39.1787 20.5577L37.9531 20.4464L32.4531 19.9464L32.2939 19.9318L32.1729 19.8283L28.6729 16.8283L27.6465 15.9484H35.2275L35.3779 16.1232Z" 
        fill={color}
      />
    </g>
  </svg>
);

const MarseilleIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 95 L90 95 L70 80 H30 Z" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 80 V60 H70 V80 M30 70 H70" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 60 V25 H60 V60 M45 40 H55 M45 50 H55" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 25 L50 15 L60 25 M50 15 V5" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="5" r="3" fill={color} />
  </svg>
);

const LilleIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.157 19.763C13.003 17.677 12.628 16.515 12.904 14.37C13.524 12.728 15.357 10.843 16.162 10.467C16.949 10.1 20.739 10.687 21.163 11.444C21.208 11.575 21.228 11.553 21.163 11.444C20.355 9.1 19.087 7.762 17.245 7.366C14.031 7.589 12.681 11.487 12.025 14.148C11.994 16.635 12.326 17.844 13.457 19.763H14.157ZM10.262 19.763H9.005C9.597 15.622 11.247 13.748 7.115 5.889L10.262 0.441L13.409 5.889C9.277 13.748 10.927 15.622 11.519 19.763H10.262ZM7.115 19.763C8.269 17.677 8.644 16.515 8.368 14.37C7.748 12.728 5.915 10.843 5.11 10.467C4.313 10.087 0.134 10.737 0.068 11.543C0.877 9.148 2.17 7.771 4.019 7.366C7.233 7.589 8.583 11.487 9.239 14.148C9.27 16.635 8.938 17.844 7.807 19.763H7.115Z"
      fill={color}
    />
  </svg>
);

const ToulouseIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 60V95 M50 75L35 65 M50 85L65 75" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 60L20 35L35 10L50 20L65 10L80 35Z" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 35L50 35L80 35 M35 10L50 35L65 10 M50 20V35 M50 35V60" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NantesIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="12" r="8" stroke={color} strokeWidth="4"/>
    <path d="M50 20V80M40 25H60M20 55C20 75 35 85 50 85C65 85 80 75 80 55" stroke={color} strokeWidth="6" strokeLinecap="round"/>
    <path d="M15 50L20 58L28 53M85 50L80 58L72 53" stroke={color} strokeWidth="4" strokeLinejoin="round"/>
  </svg>
);

const AngersIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 47 158" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M23.5 132.625V57.6247H1V50.1247H7.5V44.1247H1V36.6247H11.5V41.1247H16.5V36.6247H21.5V30.6247H16.5V25.1247H11.5V30.6247H1V22.6247H7.5V16.1247H1V8.62469H23.5V5.62469H21.5L25.5 0.624695M25.5 5.62469H28.5L24.5 0.624695M26.5 6.62469V133.125"
      stroke={color}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <ellipse cx="23.5" cy="140" rx="21.5" ry="9.5" fill={color} />
  </svg>
);

const NiceIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MonacoIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M5 20h14" />
  </svg>
);

const StrasbourgIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 216 261" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M108 0L76 43H91L45 106H69L23 169H55L0 245H89V261H127V245H216L161 169H193L147 106H171L125 43H140L108 0ZM108 26L126 51H90L108 26ZM108 75L141 121H75L108 75ZM108 141L156 207H60L108 141Z"
      fill={color}
    />
  </svg>
);

const BordeauxIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V13" />
    <path d="M7 22h10" />
    <path d="M12 13a5 5 0 0 0 5-5V3H7v5a5 5 0 0 0 5 5z" />
  </svg>
);

const MontpellierIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 177 165" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M49.7701 106V163H14.2701V106M49.7701 106H14.2701M49.7701 106C76.211 58.4349 104.097 62.2292 126.77 106M14.2701 106V50M14.2701 50V31M14.2701 50H162.27M14.2701 31L4.27008 19H14.2701M14.2701 31H162.27M14.2701 19V2H162.27V19M14.2701 19H162.27M162.27 31L172.27 19H162.27M162.27 31V50M126.77 106V163H162.27V106M126.77 106H162.27M162.27 106V50"
      stroke={color}
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ToulonIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5V60M50 10L15 55H50M54 10L85 55H54" stroke={color} strokeWidth="4" strokeLinejoin="round"/>
    <path d="M10 65C10 65 20 85 50 85C80 85 90 65 90 65H10Z" fill={color}/>
    <path d="M0 85C15 75 35 75 50 85C65 95 85 95 100 85" stroke={color} strokeWidth="6" strokeLinecap="round"/>
  </svg>
);

interface Props {
  city: string;
  lang: LangCode;
  onSelect: (city: string) => void;
  onClose: () => void;
}

const FRENCH_CITIES = [
  { name: 'Paris', Icon: ParisIcon },
  { name: 'Lyon', Icon: LyonIcon },
  { name: 'Marseille', Icon: MarseilleIcon },
  { name: 'Lille', Icon: LilleIcon },
  { name: 'Toulouse', Icon: ToulouseIcon },
  { name: 'Nantes', Icon: NantesIcon },
  { name: 'Angers', Icon: AngersIcon },
  { name: 'Nice', Icon: NiceIcon },
  { name: 'Monaco', Icon: MonacoIcon },
  { name: 'Strasbourg', Icon: StrasbourgIcon },
  { name: 'Bordeaux', Icon: BordeauxIcon },
  { name: 'Montpellier', Icon: MontpellierIcon },
  { name: 'Toulon', Icon: ToulonIcon },
];

export default function CityModal({ city, onSelect, onClose }: Props) {
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const filtered = FRENCH_CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        zIndex: 250,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 24px',
          width: '100%', maxWidth: 430,
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(214,188,130,0.18)',
          borderBottom: 'none',
          fontFamily: 'var(--f-body)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(244,238,223,0.15)' }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '14px 20px 8px',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--f-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.22em',
              textTransform: 'uppercase', margin: '0 0 8px',
            }}>
              {t('destination')}
            </p>
            <h2 style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic',
              fontSize: 34, fontWeight: 400, color: 'var(--accent)',
              margin: 0, letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {t('city_modal_where')}
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '1px solid rgba(244,238,223,0.12)',
            background: 'var(--bg-soft-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <X size={18} color="var(--text-muted)" strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ padding: '12px 20px 16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search_city')}
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                background: 'var(--bg-soft)',
                border: '1px solid rgba(244,238,223,0.10)',
                borderRadius: 14,
                color: 'var(--text)',
                fontFamily: 'var(--f-body)',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          <p style={{
            fontFamily: 'var(--f-mono)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: '0.22em',
            textTransform: 'uppercase', margin: '0 0 14px',
          }}>
            {t('french_cities')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filtered.length > 0 ? (
              filtered.map(c => {
                const isSelected = city === c.name;
                const CityIcon = c.Icon;
                return (
                  <button
                    key={c.name}
                    onClick={() => { onSelect(c.name); onClose(); }}
                    style={{
                      padding: '16px 14px',
                      borderRadius: 16,
                      border: `1px solid ${isSelected ? 'rgba(214,188,130,0.55)' : 'var(--stroke-soft)'}`,
                      background: isSelected ? 'rgba(214,188,130,0.06)' : 'var(--bg-soft)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all 200ms ease',
                      boxShadow: isSelected ? '0 0 20px rgba(212,168,67,0.12)' : 'none',
                      fontFamily: 'var(--f-body)',
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: isSelected ? 'rgba(214,188,130,0.10)' : 'var(--bg-soft-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <CityIcon color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                    </div>
                    <span style={{
                      fontSize: 15, fontWeight: 600,
                      color: isSelected ? 'var(--accent)' : 'var(--text)',
                      letterSpacing: '-0.005em',
                    }}>
                      {c.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <p style={{
                gridColumn: 'span 2', textAlign: 'center',
                fontFamily: 'var(--f-display)', fontStyle: 'italic',
                fontSize: 15, color: 'var(--text-muted)', padding: '40px 20px',
              }}>
                {t('no_city')}
              </p>
            )}
          </div>

          <p style={{
            fontSize: 12, color: 'var(--text-faint)',
            marginTop: 18, lineHeight: 1.5,
            fontFamily: 'var(--f-body)',
          }}>
            {t('city_note')}
          </p>
        </div>
      </div>
    </div>
  );
}