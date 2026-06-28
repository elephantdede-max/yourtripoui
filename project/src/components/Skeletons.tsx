/**
 * Skeleton loaders — Lot C
 *
 * Composants placeholders animés à afficher pendant le chargement.
 * Plus rassurant qu'un spinner : l'utilisateur "voit" déjà la structure
 * de ce qui va apparaître.
 *
 * Usage :
 *   {loading ? <TripCardSkeleton /> : <TripCard ... />}
 *   {loading ? <DaySkeleton /> : <DaySection ... />}
 */

import { ReactNode } from 'react';

// ─── Base shimmer (animation gradient qui passe de gauche à droite) ───
function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(244,238,223,0.04) 0%, rgba(244,238,223,0.08) 50%, rgba(244,238,223,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// CSS de l'animation à inclure une fois dans index.css :
// @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
// Mais pour être 100% portable, on inline le style avec un <style>.

export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}

// ─── TripCard skeleton (utilisé dans HomeScreen) ───
export function TripCardSkeleton() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(244,238,223,0.06)',
      borderRadius: 14,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <SkeletonBox width="60%" height={18} />
      <SkeletonBox width="40%" height={12} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <SkeletonBox width={60} height={22} borderRadius={11} />
        <SkeletonBox width={80} height={22} borderRadius={11} />
      </div>
    </div>
  );
}

// ─── Day section skeleton (utilisé dans ResultScreen) ───
export function DaySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SkeletonBox width="50%" height={22} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12 }}>
          <SkeletonBox width={22} height={22} borderRadius={11} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBox width="70%" height={14} />
            <SkeletonBox width="40%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Container générique avec shimmer global ───
export function SkeletonContainer({ children }: { children: ReactNode }) {
  return (
    <>
      <SkeletonStyles />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </>
  );
}
