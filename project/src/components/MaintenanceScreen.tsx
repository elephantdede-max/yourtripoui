export default function MaintenanceScreen() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#1A1205,#D4A843)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 4px 20px rgba(212,168,67,0.3)' }}>
        <span style={{ fontFamily:'var(--f-logo)', fontSize:28, color:'#fff' }}>YT</span>
      </div>
      <h2 style={{ fontFamily:'var(--f-display)', fontSize:26, fontWeight:700, color:'var(--text)', marginBottom:12, lineHeight:1.3 }}>
        Maintenance en cours
      </h2>
      <p style={{ fontFamily:"'Caveat', cursive", fontSize:18, color:'var(--text-muted)', maxWidth:280, lineHeight:1.6 }}>
        Your Trip est actuellement en maintenance afin d'améliorer encore plus votre expérience ✨
      </p>
      <p style={{ fontSize:13, color:'var(--text-faint)', marginTop:24 }}>
        Nous serons de retour très bientôt.
      </p>
    </div>
  );
}
