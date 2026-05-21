import { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { LangCode } from '../lib/i18n';
import { t } from '../lib/i18n';

// --- NOS DESSINS SVG EN NOIR ET OR (VERSION PRO & ÉPURÉE) ---

// 1. Paris - Ta nouvelle Tour Eiffel détaillée mise à jour
const ParisIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 241 404" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M124.894 28.5L124.986 29.0273C127.225 29.4319 129.051 30.1075 130.534 31.0322C133.093 32.6273 134.581 34.9232 135.426 37.6777C136.266 40.4164 136.473 43.6231 136.479 47.0723C136.481 48.8001 136.433 50.6008 136.384 52.4424C136.335 54.2863 136.285 56.1733 136.285 58.0859H143.901V86.0859H130.405L143.397 187.022L142.901 187.086H162.901V215.086H150.44L178.364 283.897L177.901 284.086H189.901V312.086H183.49L239.825 402.321L240.303 403.086H177.901V402.086H238.5L182.478 312.351L182.901 312.086H57.4014L57.8252 312.351L1.80273 402.086H62.4014V403.086H0L0.477539 402.321L56.8125 312.086H49.9014V284.086H64.7637L92.3633 215.086H76.9014V187.086H99.9014L99.4053 187.022L112.397 86.0859H96.9014V58.0859H103.785C103.785 54.6493 103.523 51.1699 103.432 47.7666C103.341 44.3958 103.42 41.1428 104.127 38.3076C104.837 35.4599 106.188 33.0058 108.652 31.2744C110.349 30.0822 112.545 29.2535 115.364 28.8555L115.405 28.5254L118.905 0.0253906L119.894 0L124.894 28.5ZM112.006 346.525C114.41 346.352 116.395 346.367 117.78 346.427C118.473 346.456 119.017 346.497 119.389 346.53C119.574 346.547 119.717 346.561 119.814 346.572C119.862 346.578 119.898 346.583 119.924 346.586C135.257 346.051 146.266 348.151 155.381 356.266C164.468 364.356 171.599 378.365 179.375 401.427L178.901 401.586L178.428 401.746C170.655 378.693 163.589 364.913 154.716 357.013C145.878 349.144 135.173 347.049 119.919 347.586L119.878 347.588L119.836 347.582H119.835C119.834 347.582 119.832 347.581 119.83 347.581C119.825 347.58 119.817 347.579 119.806 347.578C119.784 347.575 119.749 347.571 119.704 347.566C119.614 347.556 119.477 347.542 119.299 347.526C118.942 347.494 118.414 347.455 117.737 347.426C116.385 347.368 114.439 347.352 112.078 347.522C107.354 347.863 100.977 348.948 94.3564 351.918C81.1491 357.843 66.8762 371.313 62.8975 401.651L62.4014 401.586L61.9053 401.521C65.9265 370.86 80.4038 357.08 93.9463 351.005C100.7 347.975 107.199 346.872 112.006 346.525ZM93.3652 215.271L65.8398 284.086H92.7393L118.368 215.086H92.9014L93.3652 215.271ZM119.37 215.26L93.8057 284.086H149.367L123.434 215.263L123.901 215.086H118.901L119.37 215.26ZM150.369 283.909L149.901 284.086H177.362L149.438 215.274L149.901 215.086H124.436L150.369 283.909ZM113.397 86.1494L100.405 187.086H142.397L129.405 86.1494L129.901 86.0859H112.901L113.397 86.1494ZM119.524 29.5859C114.722 29.586 111.454 30.5286 109.228 32.0928C107.011 33.65 105.767 35.8667 105.098 38.5498C104.425 41.2455 104.341 44.3834 104.432 47.7393C104.521 51.0627 104.785 54.6466 104.785 58.0859H135.285C135.285 56.158 135.335 54.2583 135.384 52.416C135.433 50.5712 135.481 48.7853 135.479 47.0742C135.473 43.6459 135.264 40.5625 134.47 37.9717C133.68 35.3967 132.318 33.3228 130.005 31.8809C127.678 30.4302 124.335 29.5859 119.524 29.5859Z" 
      fill={color}
    />
  </svg>
);

// 2. Lyon - Ton profil de Lion personnalisé mis à jour
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

// 3. Marseille - (Inchangé)
const MarseilleIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6c.6 0 1.2-.2 1.5-.5C4.2 4.7 5.7 4 7.5 4s3.3.7 4 1.5c.3.3.9.5 1.5.5s1.2-.2 1.5-.5C16.2 4.7 17.7 4 19.5 4s3.3.7 4 1.5c.3.3.9.5 1.5.5" />
    <path d="M2 12c.6 0 1.2-.2 1.5-.5.7-.8 2.2-1.5 4-1.5s3.3.7 4 1.5c.3.3.9.5 1.5.5s1.2-.2 1.5-.5c.7-.8 2.2-1.5 4-1.5s3.3.7 4 1.5c.3.3.9.5 1.5.5" />
    <path d="M2 18c.6 0 1.2-.2 1.5-.5.7-.8 2.2-1.5 4-1.5s3.3.7 4 1.5c.3.3.9.5 1.5.5s1.2-.2 1.5-.5c.7-.8 2.2-1.5 4-1.5s3.3.7 4 1.5c.3.3.9.5 1.5.5" />
  </svg>
);

// 4. Lille - (Inchangé)
const LilleIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" x2="4" y1="22" y2="15" />
  </svg>
);

// 5. Toulouse - (Inchangé)
const ToulouseIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 5a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z" />
    <path d="M12 13a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z" />
    <path d="M5 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z" />
    <path d="M13 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z" />
  </svg>
);

// 6. Nantes - On oublie l'éléphant raté, on fait une magnifique ancre marine (ville portuaire) très chic
const NantesIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v14M9 10h6M6 14c0 4.4 3.6 8 8 8s8-3.6 8-8" />
    <path d="M5 13l2 2M19 13l-2 2" />
  </svg>
);

// 7. Angers - Un vrai beau blason de château fort épuré et symétrique
const AngersIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v6c0 5.5-4.5 10-8 10s-8-4.5-8-10V4z" />
    <path d="M9 4v4h6V4" />
    <path d="M12 8v6" />
  </svg>
);

// 8. Nice - (Inchangé)
const NiceIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

// 9. Monaco - (Inchangé)
const MonacoIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M5 20h14" />
  </svg>
);

// 10. Strasbourg - Une flèche de cathédrale gothique ultra fine et géométrique
const StrasbourgIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9 9h6l-3-7z" />
    <path d="M9 9v11h6V9" />
    <path d="M6 20h12" />
    <path d="M12 9v11" />
  </svg>
);

// 11. Bordeaux - (Inchangé)
const BordeauxIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V13" />
    <path d="M7 22h10" />
    <path d="M12 13a5 5 0 0 0 5-5V3H7v5a5 5 0 0 0 5 5z" />
  </svg>
);

// 12. Montpellier - Un superbe soleil héraldique géométrique
const MontpellierIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
  </svg>
);

// 13. Toulon - (Inchangé)
const ToulonIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 18H2a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4z" />
    <path d="M10 2v16" />
    <path d="M10 4l7 8H10z" />
  </svg>
);

// --- FIN DES DESSINS ---

interface Props {
  city: string;
  lang: LangCode;
  onSelect: (city: string) => void;
  onClose: () => void;
}

const G = '#C9A961';
const BG = '#000000';

// Ici, on a remplacé 'emoji' par notre composant 'Icon'
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

export default function CityModal({ city, lang, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const filtered = FRENCH_CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
          border: `2px solid ${G}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700, color: G, margin: 0 }}>
            {t('destination', lang)}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color={G} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} color="#666" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_city', lang)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 34px',
              background: BG,
              border: `1.5px solid ${G}`,
              borderRadius: 10,
              color: G,
              fontFamily: 'var(--f-display)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <p style={{ fontFamily: 'var(--f-display)', fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('french_cities', lang)}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.length > 0 ? (
            filtered.map(c => {
              const isSelected = city === c.name;
              // On prépare le composant d'icône pour l'affichage
              const CityIcon = c.Icon;
              
              return (
                <button
                  key={c.name}
                  onClick={() => { onSelect(c.name); onClose(); }}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 12,
                    border: `2px solid ${isSelected ? G : '#333'}`,
                    background: isSelected ? G : BG,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 150ms',
                  }}
                >
                  {/* C'est ici qu'on affiche l'icône avec la bonne couleur */}
                  <CityIcon color={isSelected ? BG : G} />
                  
                  <span style={{
                    fontFamily: 'var(--f-display)', fontSize: 13, fontWeight: 600,
                    color: isSelected ? BG : G,
                  }}>
                    {c.name}
                  </span>
                </button>
              );
            })
          ) : (
            <p style={{ gridColumn: 'span 2', textAlign: 'center', color: '#666', fontFamily: 'var(--f-display)', fontSize: 13, padding: 20 }}>
              {t('no_city', lang)}
            </p>
          )}
        </div>

        <p style={{ fontFamily: 'var(--f-display)', fontSize: 10, color: '#555', marginTop: 16, lineHeight: 1.5 }}>
          {t('city_note', lang)}
        </p>
      </div>
    </div>
  );
}