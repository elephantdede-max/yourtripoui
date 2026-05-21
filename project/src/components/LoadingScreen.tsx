import { useState, useEffect } from 'react';
import type { LangCode } from '../lib/i18n';

const MESSAGES = [
  "Analyzing your preferences...",
  "Selecting the best places...",
  "Building your perfect route...",
  "Almost ready..."
];

interface Props { lang: LangCode; onReady: () => void; }

export default function LoadingScreen({ onReady }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIdx(i => Math.min(i+1, MESSAGES.length-1)), 900);
    const progTimer = setInterval(() => setProgress(p => Math.min(p+2, 95)), 60);
    const doneTimer = setTimeout(onReady, 3200);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); clearTimeout(doneTimer); };
  }, [onReady]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>

      {/* Logo animé */}
      <div style={{ width:80, height:80, borderRadius:'22px', background:'linear-gradient(135deg,#1A1205,#D4A843)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'32px', boxShadow:'0 4px 20px rgba(212,168,67,0.25)', animation:'pulse 2s ease infinite' }}>
        <span style={{ fontFamily:'var(--f-display)', fontSize:'28px', fontWeight:700, color:'#fff', letterSpacing:'-1px' }}>YT</span>
      </div>

      <h2 style={{ fontFamily:'var(--f-display)', fontSize:'24px', fontWeight:700, color:'var(--text)', marginBottom:'8px', textAlign:'center' }}>
        Creating your day
      </h2>

      <p style={{ fontFamily:"'Caveat', cursive", fontSize:'18px', color:'var(--text-muted)', marginBottom:'40px', textAlign:'center', minHeight:'28px', transition:'opacity 300ms' }}>
        {MESSAGES[msgIdx]}
      </p>

      {/* Progress bar */}
      <div style={{ width:'200px', height:'3px', background:'var(--bg-elevated)', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${progress}%`, background:'var(--accent)', borderRadius:'2px', transition:'width 60ms linear', boxShadow:'0 0 8px var(--accent)' }} />
      </div>

      <p style={{ marginTop:'16px', fontSize:'12px', color:'var(--text-faint)' }}>{progress}%</p>
    </div>
  );
}
