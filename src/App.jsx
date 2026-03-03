import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, 
  updateDoc, query, where, serverTimestamp, orderBy,
  arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyCfbmO0p-KrgECDZW9gHYSeRETqWJ-N0B0",
  authDomain: "myos-6c9d9.firebaseapp.com",
  projectId: "myos-6c9d9",
  storageBucket: "myos-6c9d9.firebasestorage.app",
  messagingSenderId: "367542951212",
  appId: "1:367542951212:web:c9cda1ede08a056d70e089",
  measurementId: "G-YMQ0P6JLKN"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const OR_KEY = import.meta.env.VITE_OR_KEY;
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_HEADERS = { "Content-Type":"application/json", "Authorization":`Bearer ${OR_KEY}`, "HTTP-Referer":"https://lemy.app", "X-Title":"Lemy" };

async function askAI(prompt) {
  const res = await fetch(OR_URL, { method:"POST", headers: OR_HEADERS,
    body: JSON.stringify({ model:"openai/gpt-4o", max_tokens:1200,
      messages:[{ role:"user", content: prompt }] }) });
  const d = await res.json();
  return d.choices[0].message.content;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I = {
  Calendar: ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Users:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chart:    ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Sparkle:  ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/></svg>,
  Plus:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:    ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Clock:    ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  UserPlus: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Shake:    ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>,
  Wallet:   ()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><circle cx="17" cy="12" r="1"/></svg>,
  Up:       ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  Down:     ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Out:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Mail:     ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Lock:     ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User:     ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bot:      ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/></svg>,
  Send:     ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Zap:      ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  X:        ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const fmtDate = ts => { if(!ts)return""; const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}); };
const inits = n => n?n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2):"?";
const todayLong = () => new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const CC = {food:"#fb923c",transport:"#3b82f6",entertainment:"#a855f7",shopping:"#ec4899",health:"#22c55e",utilities:"#eab308",rent:"#ef4444",salary:"#10b981",other:"#6b7280"};

// ─── CANVAS MESH BG ───────────────────────────────────────────────────────────
const MeshBG = ({ variant="planner" }) => {
  const ref = useRef(null);
  useEffect(()=>{
    const c = ref.current; if(!c) return;
    const ctx = c.getContext("2d");
    let W = c.width = window.innerWidth, H = c.height = window.innerHeight, raf;
    const PAL = { planner:["#10b981","#059669","#34d399","#6ee7b7"], split:["#3b82f6","#818cf8","#06b6d4","#60a5fa"], expense:["#f97316","#f59e0b","#fbbf24","#ea580c"], auth:["#10b981","#047857","#6ee7b7","#065f46"] };
    const cols = PAL[variant]||PAL.planner;
    const h2r = h=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`${r},${g},${b}`;};
    const orbs = Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,r:180+Math.random()*220,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,col:cols[i%cols.length],op:.07+Math.random()*.08}));
    const pts  = Array.from({length:55},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:.4+Math.random()*1.1,op:.15+Math.random()*.4,col:cols[Math.floor(Math.random()*cols.length)]}));
    function frame(){
      ctx.clearRect(0,0,W,H); ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);
      orbs.forEach(o=>{ o.x+=o.vx; o.y+=o.vy; if(o.x<-o.r)o.x=W+o.r; if(o.x>W+o.r)o.x=-o.r; if(o.y<-o.r)o.y=H+o.r; if(o.y>H+o.r)o.y=-o.r; const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r); g.addColorStop(0,`rgba(${h2r(o.col)},${o.op})`); g.addColorStop(1,"transparent"); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill(); });
      const vg=ctx.createRadialGradient(W/2,H/2,H*.15,W/2,H/2,H*.9); vg.addColorStop(0,"transparent"); vg.addColorStop(1,"rgba(0,0,0,.65)"); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
      pts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(${h2r(p.col)},${p.op})`; ctx.fill(); });
      pts.forEach((p,i)=>{ for(let j=i+1;j<pts.length;j++){const dx=p.x-pts[j].x,dy=p.y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy); if(d<95){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(${h2r(p.col)},${.07*(1-d/95)})`;ctx.lineWidth=.4;ctx.stroke();}} });
      raf=requestAnimationFrame(frame);
    }
    frame();
    const onR=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight;}; window.addEventListener("resize",onR);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onR);};
  },[variant]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
};
// ─── AURORA BG ────────────────────────────────────────────────
const AuroraBG = ({ colors = ["#10b981", "#3b82f6", "#f97316"] }) => {
  return (
    <>
      <div className="aurora-bg" />
      <style>{`
        .aurora-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(circle at 20% 30%, ${colors[0]}33, transparent 50%),
                      radial-gradient(circle at 80% 70%, ${colors[1]}33, transparent 50%),
                      radial-gradient(circle at 50% 50%, ${colors[2]}22, transparent 60%);
          animation: auroraMove 18s ease-in-out infinite alternate;
          filter: blur(100px);
        }

        @keyframes auroraMove {
          0% { transform: scale(1) translate(0,0); }
          100% { transform: scale(1.2) translate(-4%, 4%); }
        }
      `}</style>
    </>
  );
};

// ─── AI CHAT PANEL ────────────────────────────────────────────────────────────
function AiPanel({ accentColor, accentDim, systemPrompt, placeholder, suggestions, onClose }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:`Hey! I'm MIKO your AI assistant. ${placeholder}` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function send(text) {
    const q = text || input.trim(); if(!q) return;
    setInput(""); setLoading(true);
    const newMsgs = [...msgs, {role:"user",content:q}];
    setMsgs(newMsgs);
    try {
      const res = await fetch(OR_URL, { method:"POST", headers: OR_HEADERS,
        body: JSON.stringify({ model:"openai/gpt-4o", max_tokens:800,
          messages:[{role:"system",content:systemPrompt},...newMsgs.map(m=>({role:m.role,content:m.content}))] }) });
      const d = await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.choices[0].message.content}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",content:"Sorry, something went wrong. Try again!"}]); }
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:"1rem",pointerEvents:"none"}}>
      <div style={{width:"100%",maxWidth:"420px",height:"520px",background:"rgba(10,10,10,0.97)",border:`1px solid ${accentColor}33`,borderRadius:"20px",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:`0 20px 60px rgba(0,0,0,.6), 0 0 0 1px ${accentColor}22`,pointerEvents:"all",animation:"slideUp .3s cubic-bezier(.16,1,.3,1)"}}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:".65rem",padding:"1rem 1.1rem",borderBottom:`1px solid rgba(255,255,255,.07)`,flexShrink:0}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:`${accentDim}`,display:"flex",alignItems:"center",justifyContent:"center",color:accentColor}}><I.Bot/></div>
          <div><div style={{fontSize:".88rem",fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff"}}>MIKO</div><div style={{fontSize:".7rem",color:accentColor,fontFamily:"'JetBrains Mono',monospace"}}>GPT-4o · lemy</div></div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"rgba(255,255,255,.06)",border:"none",color:"#888",width:28,height:28,borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X/></button>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:".75rem"}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"85%",padding:".65rem .9rem",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?accentColor:"rgba(255,255,255,.06)",color:m.role==="user"?"#000":"#e6edf3",fontSize:".83rem",lineHeight:1.55,fontFamily:"'Outfit',sans-serif",whiteSpace:"pre-wrap"}}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:".65rem .9rem",borderRadius:"14px 14px 14px 4px",background:"rgba(255,255,255,.06)",display:"flex",gap:"4px",alignItems:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:accentColor,animation:`dp 1s ease-in-out ${i*.18}s infinite`}}/>)}<style>{`@keyframes dp{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style></div></div>}
          <div ref={bottomRef}/>
        </div>
        {/* Suggestions */}
        {msgs.length<=1 && (
          <div style={{padding:"0 1rem .75rem",display:"flex",gap:".4rem",flexWrap:"wrap"}}>
            {suggestions.map((s,i)=><button key={i} onClick={()=>send(s)} style={{fontSize:".72rem",padding:".3rem .65rem",borderRadius:"20px",border:`1px solid ${accentColor}44`,background:`${accentDim}`,color:accentColor,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{s}</button>)}
          </div>
        )}
        {/* Input */}
        <div style={{padding:".75rem 1rem",borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",gap:".5rem",flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask anything…" style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"10px",padding:".6rem .85rem",color:"#fff",fontFamily:"'Outfit',sans-serif",fontSize:".85rem",outline:"none"}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()} style={{width:38,height:38,borderRadius:"10px",background:accentColor,border:"none",color:"#000",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:loading||!input.trim()?0.5:1}}><I.Send/></button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap');
    :root{
      --g:#10b981;--gd:#059669;--gdim:rgba(16,185,129,.15);--gg:rgba(16,185,129,.25);
      --b:#3b82f6;--bdim:rgba(59,130,246,.13);
      --o:#f97316;--od:#ea6c0a;--odim:rgba(249,115,22,.15);--og:rgba(249,115,22,.25);
      --r:#ef4444;--rdim:rgba(239,68,68,.13);
      --glass:rgba(255,255,255,.03);--glass2:rgba(255,255,255,.06);
      --border:rgba(255,255,255,.09);--bg:rgba(16,185,129,.22);--bo:rgba(249,115,22,.22);--bb:rgba(59,130,246,.22);
      --text:#f0fdf4;--muted:#6b7280;--muted2:#9ca3af;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{background:#000;color:var(--text);font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:10px}

    /* FONTS */
    .fs{font-family:'Syne',sans-serif}
    .fo{font-family:'Outfit',sans-serif}
    .fm{font-family:'JetBrains Mono',monospace}
    .fp{font-family:'Playfair Display',serif}

    /* GLASS CARD */
    .gc{background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:20px;padding:1.5rem;transition:border-color .3s}
    .gc-inner{background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:12px;padding:.9rem}

    /* INPUTS */
    .inp{width:100%;padding:.75rem 1rem;background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:'Outfit',sans-serif;font-size:.88rem;outline:none;transition:border-color .2s,box-shadow .2s}
    .inp::placeholder{color:var(--muted)}
    .inp-g:focus{border-color:var(--g);box-shadow:0 0 0 3px var(--gdim)}
    .inp-b:focus{border-color:var(--b);box-shadow:0 0 0 3px var(--bdim)}
    .inp-o:focus{border-color:var(--o);box-shadow:0 0 0 3px var(--odim)}
    .inp-wrap{position:relative;display:flex;align-items:center}
    .inp-wrap svg{position:absolute;left:.9rem;color:var(--muted);pointer-events:none;z-index:1}
    .inp-wrap input{padding-left:2.5rem}
    select.inp{appearance:none;cursor:pointer}
    select.inp option{background:#0a0a0a}
    textarea.inp{resize:none;line-height:1.6}

    /* BUTTONS */
    .btn{padding:.75rem 1.4rem;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;transition:all .2s;letter-spacing:.01em;white-space:nowrap}
    .btn-g{background:var(--g);color:#000}.btn-g:hover:not(:disabled){background:#0ea271;transform:translateY(-2px);box-shadow:0 8px 20px var(--gg)}
    .btn-o{background:var(--o);color:#000}.btn-o:hover:not(:disabled){background:var(--od);transform:translateY(-2px);box-shadow:0 8px 20px var(--og)}
    .btn-b{background:var(--b);color:#fff}.btn-b:hover:not(:disabled){background:#2563eb;transform:translateY(-2px);box-shadow:0 8px 20px var(--bdim)}
    .btn-ghost{background:var(--glass2);color:var(--muted2);border:1px solid var(--border)}.btn-ghost:hover:not(:disabled){color:var(--text);border-color:rgba(255,255,255,.18)}
    .btn:disabled{opacity:.4;cursor:not-allowed}
    .btn-icon{width:40px;height:40px;padding:0;border-radius:10px;flex-shrink:0}
    .btn-full{width:100%}
    .btn-sm{padding:.5rem .9rem;font-size:.8rem;border-radius:9px}

    /* AI FAB */
    .ai-fab{position:fixed;bottom:1.5rem;right:1.5rem;z-index:400;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 8px 30px rgba(0,0,0,.4);transition:all .25s}
    .ai-fab:hover{transform:scale(1.1)}
    .ai-fab-g{background:var(--g);color:#000}
    .ai-fab-b{background:var(--b);color:#fff}
    .ai-fab-o{background:var(--o);color:#000}

    /* NAV */
    .nav{position:sticky;top:0;z-index:200;background:rgba(0,0,0,.65);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:0 1rem;height:60px;display:flex;align-items:center;gap:.6rem}
    .nav-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-.04em;color:#fff;white-space:nowrap;flex-shrink:0}
    .nav-logo em{font-style:normal}
    .nav-logo em.g{color:var(--g)}
    .nav-pills{display:flex;gap:.2rem;background:rgba(0,0,0,.4);padding:.25rem;border-radius:13px;border:1px solid var(--border);flex:1;justify-content:center;overflow:hidden}
    .np{padding:.42rem .75rem;border-radius:9px;border:none;background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:.35rem;white-space:nowrap;flex:1;justify-content:center}
    .np:hover{color:var(--text)}
    .np.on-g{background:var(--gdim);color:var(--g)}
    .np.on-b{background:var(--bdim);color:var(--b)}
    .np.on-o{background:var(--odim);color:var(--o)}
    .np-lbl{display:none}
    @media(min-width:420px){.np-lbl{display:inline}}
    .nav-right{margin-left:auto;display:flex;align-items:center;gap:.5rem;flex-shrink:0}
    .nav-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--g),#047857);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:.7rem;font-weight:800;color:#000;flex-shrink:0}
    .nav-nm{font-size:.8rem;color:var(--muted2);display:none}
    @media(min-width:600px){.nav-nm{display:block}}
    .nav-out{background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);padding:.35rem .55rem;cursor:pointer;transition:all .2s;display:flex;align-items:center}
    .nav-out:hover{border-color:var(--r);color:var(--r)}

    /* PAGE */
    .page{min-height:calc(100vh - 60px);padding:1.5rem 1rem 5rem;position:relative;z-index:1}
    @media(min-width:768px){.page{padding:2.5rem 1.5rem 5rem}}
    .pi{max-width:1080px;margin:0 auto}

    /* GRIDS */
    .g2{display:grid;grid-template-columns:1fr;gap:1.25rem}
    @media(min-width:768px){.g2{grid-template-columns:1fr 1fr}}
    .g3{display:grid;grid-template-columns:1fr;gap:.85rem}
    @media(min-width:480px){.g3{grid-template-columns:1fr 1fr}}
    @media(min-width:768px){.g3{grid-template-columns:1fr 1fr 1fr}}
    .gs{display:grid;grid-template-columns:1fr;gap:1.25rem}
    @media(min-width:900px){.gs{grid-template-columns:290px 1fr}}
    .ge{display:grid;grid-template-columns:1fr;gap:1.25rem}
    @media(min-width:900px){.ge{grid-template-columns:1fr 320px}}

    /* MISC */
    .divider{height:1px;background:var(--border);margin:1.1rem 0}
    .prog-track{height:5px;background:var(--border);border-radius:3px;overflow:hidden}
    .prog-fill{height:100%;border-radius:3px;transition:width .5s cubic-bezier(.4,0,.2,1)}

    /* TASK */
    .task-row{display:flex;align-items:center;gap:.7rem;padding:.8rem .9rem;background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:13px;transition:all .2s}
    .task-row:hover{border-color:var(--bg)}
    .task-row.done{opacity:.4}
    .chk{width:19px;height:19px;border-radius:6px;flex-shrink:0;border:1.5px solid var(--border);background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:#000}

    /* PRIORITY */
    .pri{font-size:.65rem;padding:.12rem .44rem;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;flex-shrink:0}
    .pri-h{background:rgba(16,185,129,.14);color:var(--g)}
    .pri-m{background:rgba(255,255,255,.07);color:var(--muted2)}
    .pri-l{background:rgba(255,255,255,.04);color:var(--muted)}

    /* BADGES */
    .badge{display:inline-flex;align-items:center;gap:3px;font-size:.68rem;font-weight:700;padding:.16rem .5rem;border-radius:20px}
    .bg{background:var(--gdim);color:var(--g)}
    .br{background:var(--rdim);color:var(--r)}
    .bm{background:rgba(255,255,255,.06);color:var(--muted2)}

    /* FRIEND / SPLIT */
    .f-row{display:flex;align-items:center;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid var(--border)}
    .f-row:last-child{border-bottom:none}
    .f-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;color:#fff;flex-shrink:0;font-family:'Syne',sans-serif}
    .sp-row{padding:.9rem;background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:13px;margin-bottom:.7rem;transition:border-color .2s}
    .sp-row:hover{border-color:var(--bb)}
    .sp-row:last-child{margin-bottom:0}
    .settle-tag{font-size:.68rem;padding:.18rem .6rem;border-radius:20px;border:1px solid rgba(59,130,246,.3);background:rgba(59,130,246,.1);color:var(--b);cursor:pointer;transition:all .2s;font-weight:600}
    .settle-tag:hover{background:rgba(59,130,246,.22)}
    .settled-tag{font-size:.68rem;padding:.18rem .6rem;border-radius:20px;background:rgba(255,255,255,.05);color:var(--muted);font-weight:500}
    .ov-row{display:flex;justify-content:space-between;align-items:center;padding:.42rem 0;border-bottom:1px solid var(--border)}
    .ov-row:last-child{border-bottom:none}

    /* EXPENSE */
    .tx-row{display:flex;align-items:center;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--border)}
    .tx-row:last-child{border-bottom:none}
    .tx-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .stat{border-radius:16px;padding:1.1rem 1.25rem;position:relative;overflow:hidden;background:var(--glass);backdrop-filter:blur(20px);border:1px solid var(--border)}
    .stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
    .sb::before{background:linear-gradient(90deg,#fff,transparent)}
    .si::before{background:linear-gradient(90deg,var(--o),transparent)}
    .ss::before{background:linear-gradient(90deg,#f59e0b,transparent)}
    .type-tog{display:flex;gap:.35rem;background:rgba(0,0,0,.35);padding:.25rem;border-radius:11px;border:1px solid var(--border)}
    .type-btn{flex:1;padding:.52rem;border-radius:8px;border:none;background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.3rem}
    .type-btn.se{background:var(--rdim);color:var(--r)}
    .type-btn.si{background:var(--odim);color:var(--o)}

    /* CHART */
    .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
    .bar-rect{width:100%;border-radius:3px 3px 0 0;transition:height .5s cubic-bezier(.4,0,.2,1)}
    .bar-lbl{font-size:.58rem;color:var(--muted);font-family:'JetBrains Mono',monospace}

    /* AUTH */
    .auth-wrap{min-height:100vh;display:grid;grid-template-columns:1fr}
    @media(min-width:900px){.auth-wrap{grid-template-columns:1fr 1fr}}
    .auth-hero{display:none;flex-direction:column;align-items:center;justify-content:center;padding:4rem 3rem;position:relative;z-index:1}
    @media(min-width:900px){.auth-hero{display:flex}}
    .auth-side{display:flex;align-items:center;justify-content:center;padding:1.5rem;position:relative;z-index:1;min-height:100vh}
    .h-mod{display:flex;align-items:center;gap:.9rem;padding:.9rem 1.1rem;border-radius:14px;background:rgba(16,185,129,.04);border:1px solid var(--bg);margin-bottom:.75rem;transition:transform .2s}
    .h-mod:hover{transform:translateX(5px)}
    .h-mod-ic{width:38px;height:38px;border-radius:10px;background:var(--gdim);color:var(--g);display:flex;align-items:center;justify-content:center;flex-shrink:0}

    /* MODAL */
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}

    /* AI INSIGHT CARD */
    .ai-insight{background:rgba(0,0,0,.3);border-radius:12px;padding:.9rem;margin-top:.85rem;border-left:3px solid;font-size:.82rem;line-height:1.6;color:var(--muted2);white-space:pre-wrap;font-family:'Outfit',sans-serif}

    /* ANIMATIONS */
    .fi{animation:fadeIn .5s ease-out both}
    .fi1{animation-delay:.06s}.fi2{animation-delay:.13s}.fi3{animation-delay:.2s}
    @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    .si2{animation:slideIn .4s cubic-bezier(.16,1,.3,1) both}
    @keyframes slideIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .pulse{animation:pls 1.5s ease-in-out infinite}
    @keyframes pls{0%,100%{opacity:.25}50%{opacity:1}}
    .spin{animation:spin 1s linear infinite}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  `}</style>
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function Auth({ onAuth }) {
  const [mode,setMode]=useState("signin"); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(){ setErr(""); setLoading(true); try{ if(mode==="signup"){const c=await createUserWithEmailAndPassword(auth,email,pw);if(name)await updateProfile(c.user,{displayName:name});onAuth(c.user);}else{const c=await signInWithEmailAndPassword(auth,email,pw);onAuth(c.user);} }catch(e){setErr(e.message.replace("Firebase: ",""));} setLoading(false); }
  return (
    <div className="auth-wrap">
      <MeshBG variant="auth"/>
      <div className="auth-hero fi">
        <div style={{width:"100%",maxWidth:"320px"}}>
          <div className="fs" style={{fontSize:"3.2rem",fontWeight:800,letterSpacing:"-.05em",marginBottom:".35rem",lineHeight:1}}>le<em style={{color:"var(--g)",fontStyle:"normal"}}>my</em></div>
          <div className="fp" style={{fontSize:"1rem",color:"var(--muted2)",fontStyle:"italic",marginBottom:"2.5rem"}}>your personal life OS</div>
          {[{icon:<I.Calendar/>,title:"Dayflow",sub:"AI-powered daily planning"},{icon:<I.Users/>,title:"Splitty",sub:"Smart expense splitting"},{icon:<I.Chart/>,title:"Vault",sub:"AI financial insights"},].map((m,i)=>(
            <div key={i} className="h-mod fi" style={{animationDelay:`${i*.1+.2}s`}}>
              <div className="h-mod-ic">{m.icon}</div>
              <div><div className="fs" style={{fontWeight:600,fontSize:".88rem"}}>{m.title}</div><div style={{fontSize:".72rem",color:"var(--muted2)",marginTop:"1px"}}>{m.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-side">
        <div className="gc fi" style={{width:"100%",maxWidth:"420px"}}>
          <div className="fs" style={{fontSize:"1.8rem",fontWeight:800,letterSpacing:"-.04em",marginBottom:".3rem"}}>{mode==="signin"?"Welcome back.":"Join lemy."}</div>
          <div className="fo" style={{color:"var(--muted2)",fontSize:".86rem",marginBottom:"1.75rem"}}>{mode==="signin"?"Enter your workspace.":"Create your account — it's free."}</div>
          {err&&<div style={{background:"var(--rdim)",border:"1px solid rgba(239,68,68,.25)",color:"var(--r)",padding:".65rem .9rem",borderRadius:"10px",fontSize:".8rem",marginBottom:".9rem"}}>{err}</div>}
          {mode==="signup"&&<div className="inp-wrap" style={{marginBottom:".65rem"}}><I.User/><input className="inp inp-g" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}/></div>}
          <div className="inp-wrap" style={{marginBottom:".65rem"}}><I.Mail/><input className="inp inp-g" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div className="inp-wrap" style={{marginBottom:"1.1rem"}}><I.Lock/><input className="inp inp-g" type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <button className="btn btn-g btn-full" onClick={submit} disabled={loading}>{loading?"Authenticating…":mode==="signin"?"Enter Workspace →":"Create Account →"}</button>
          <div style={{marginTop:"1.1rem",textAlign:"center",fontSize:".82rem",color:"var(--muted2)"}}>
            {mode==="signin"?"New here? ":"Have an account? "}
            <span style={{color:"var(--g)",cursor:"pointer",fontWeight:700}} onClick={()=>setMode(mode==="signin"?"signup":"signin")}>{mode==="signin"?"Sign up free":"Sign in"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DAYFLOW (PLANNER) ────────────────────────────────────────────────────────
function Planner({ user }) {
  const [tasks,setTasks]=useState([]); const [dump,setDump]=useState(""); const [aiLoad,setAiLoad]=useState(false);
  const [newT,setNewT]=useState(""); const [newTm,setNewTm]=useState(""); const [newP,setNewP]=useState("medium");
  const [loading,setLoading]=useState(true); const [showAI,setShowAI]=useState(false);
  const [insight,setInsight]=useState(""); const [insightLoad,setInsightLoad]=useState(false);

  useEffect(()=>{
  async function load(){
    try{
      const q = query(
        collection(db,"tasks"),
        where("uid","==",user.uid)
      );
      const s = await getDocs(q);
      setTasks(s.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){
      console.error(e);
      setTasks([]);
    }
    setLoading(false);
  }
  load();
},[user.uid]);
  async function add(text,time="",priority="medium"){ const t={uid:user.uid,text,time,priority,done:false,createdAt:serverTimestamp()}; try{const r=await addDoc(collection(db,"tasks"),t);setTasks(p=>[{id:r.id,...t,createdAt:new Date()},...p]);}catch{setTasks(p=>[{id:Date.now().toString(),...t,createdAt:new Date()},...p]);} }
  async function toggle(id,done){ setTasks(p=>p.map(t=>t.id===id?{...t,done:!done}:t)); try{await updateDoc(doc(db,"tasks",id),{done:!done})}catch{} }
  async function del(id){ setTasks(p=>p.filter(t=>t.id!==id)); try{await deleteDoc(doc(db,"tasks",id))}catch{} }
  async function addManual(){ if(!newT.trim())return; await add(newT.trim(),newTm,newP); setNewT("");setNewTm(""); }

  async function planAI(){
    if(!dump.trim())return; setAiLoad(true);
    try{
      const txt=await askAI(`You are a productivity assistant. Return ONLY a valid JSON array, no markdown. Each item: {"text":"task","time":"HH:MM AM/PM","priority":"high|medium|low"}. Tasks: ${dump}`);
      const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
      for(const item of parsed) await add(item.text,item.time||"",item.priority||"medium");
      setDump("");
    }catch(e){alert("AI planning failed: "+e.message);} setAiLoad(false);
  }

  async function getDayInsight(){
    if(tasks.length===0)return;
    setInsightLoad(true);
    try{
      const list=tasks.map(t=>`- ${t.text} [${t.priority}]${t.done?" (done)":""}`).join("\n");
      const txt=await askAI(`You are a productivity coach. Here is my task list:\n${list}\n\nGive me a short (3-4 sentences) motivating analysis of my day: what I should focus on, anything I should re-prioritize, and a quick tip. Be concise and encouraging.`);
      setInsight(txt);
    }catch{setInsight("Couldn't load insight. Try again!");}
    setInsightLoad(false);
  }

  const done=tasks.filter(t=>t.done).length; const pct=tasks.length?Math.round((done/tasks.length)*100):0;
  return (
    <div className="page">
      <AuroraBG colors={["#10b981","#059669","#34d399"]} />
      <MeshBG variant="planner"/>
      <div className="pi">
        <header className="fi" style={{marginBottom:"2rem"}}>
          <div className="fm" style={{fontSize:".7rem",color:"var(--g)",letterSpacing:".1em",marginBottom:".4rem",textTransform:"uppercase"}}>{todayLong()}</div>
          <h1 className="fs" style={{fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:800,letterSpacing:"-.04em",lineHeight:1.05}}>
            Design your<br/><span className="fp" style={{fontStyle:"italic",color:"var(--g)"}}>Productive Day.</span>
          </h1>
        </header>
        <div className="g2">
          {/* AI + Input */}
          <div className="gc fi fi1">
            <h3 className="fs" style={{marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:".5rem",fontSize:".95rem"}}><span style={{color:"var(--g)"}}><I.Sparkle/></span>AI Thought Dump</h3>
            <textarea className="inp inp-g" rows={4} placeholder="Brain dump your tasks… 'gym 6am, meeting at 10, call dentist, grocery run'" value={dump} onChange={e=>setDump(e.target.value)}/>
            <button className="btn btn-g btn-full" style={{marginTop:".65rem"}} onClick={planAI} disabled={aiLoad||!dump.trim()}>
              {aiLoad?<><span style={{display:"flex",gap:"3px"}}>{[0,1,2].map(i=><span key={i} style={{animation:`dp 1s ease-in-out ${i*.18}s infinite`,fontSize:"1.2rem",lineHeight:.8}}>·</span>)}<style>{`@keyframes dp{0%,100%{opacity:.2}50%{opacity:1}}`}</style></span>Drafting Plan</>:<><I.Sparkle/>Generate Schedule</>}
            </button>
            {tasks.length>0&&(
              <button className="btn btn-ghost btn-full btn-sm" style={{marginTop:".5rem"}} onClick={getDayInsight} disabled={insightLoad}>
                {insightLoad?<><I.Bot/>Analyzing…</>:<><I.Zap/>Get Day Insight</>}
              </button>
            )}
            {insight&&<div className="ai-insight" style={{borderColor:"var(--g)"}}>{insight}</div>}
            <div className="divider"/>
            <h3 className="fs" style={{marginBottom:".75rem",fontSize:".85rem",color:"var(--muted2)",fontWeight:600}}>Manual Entry</h3>
            <input className="inp inp-g" style={{marginBottom:".55rem"}} placeholder="Task description" value={newT} onChange={e=>setNewT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addManual()}/>
            <div style={{display:"flex",gap:".5rem",marginBottom:".55rem"}}>
              <input className="inp inp-g" style={{flex:1}} placeholder="Time (9:00 AM)" value={newTm} onChange={e=>setNewTm(e.target.value)}/>
              <select className="inp inp-g" style={{width:"auto",paddingLeft:".75rem"}} value={newP} onChange={e=>setNewP(e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            </div>
            <button className="btn btn-ghost btn-full" onClick={addManual}><I.Plus/>Add Task</button>
          </div>
          {/* Task List */}
          <div className="gc fi fi2">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
              <h3 className="fs" style={{fontSize:".95rem"}}>Dayflow</h3>
              {tasks.length>0&&<span className="fm" style={{fontSize:".7rem",color:"var(--g)"}}>{done}/{tasks.length} DONE</span>}
            </div>
            {tasks.length>0&&<div style={{marginBottom:"1.1rem"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:".3rem"}}><span style={{fontSize:".7rem",color:"var(--muted2)"}}>Progress</span><span className="fm" style={{fontSize:".7rem",color:"var(--g)",fontWeight:700}}>{pct}%</span></div><div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`,background:"var(--g)"}}/></div></div>}
            <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
              {loading?<div style={{color:"var(--muted)",fontSize:".85rem"}}>Loading…</div>:
               tasks.length===0?<div style={{textAlign:"center",padding:"2rem 0",color:"var(--muted)"}}><div className="fp" style={{fontSize:"1.05rem",fontStyle:"italic",marginBottom:".4rem"}}>Your agenda is clear.</div><div style={{fontSize:".8rem"}}>Use AI planner or add manually.</div></div>:
               tasks.map((t,idx)=>(
                <div key={t.id} className={`task-row ${t.done?"done":""} si2`} style={{animationDelay:`${idx*.04}s`}}>
                  <div className={`chk ${t.done?"on":""}`} style={t.done?{background:"var(--g)",borderColor:"var(--g)"}:{}} onClick={()=>toggle(t.id,t.done)}>{t.done&&<I.Check/>}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,textDecoration:t.done?"line-through":"none",fontSize:".87rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.text}</div>
                    <div style={{display:"flex",alignItems:"center",gap:".35rem",marginTop:"3px",flexWrap:"wrap"}}>
                      {t.time&&<span style={{display:"flex",alignItems:"center",gap:"3px",fontSize:".7rem",color:"var(--muted2)"}}><I.Clock/>{t.time}</span>}
                      <span className={`pri pri-${t.priority==="high"?"h":t.priority==="low"?"l":"m"}`}>{t.priority}</span>
                    </div>
                  </div>
                  <button style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",padding:"3px",transition:"color .2s",display:"flex",alignItems:"center",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color="var(--r)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"} onClick={()=>del(t.id)}><I.Trash/></button>
                </div>
               ))}
            </div>
          </div>
        </div>
      </div>
      {/* AI Chat FAB */}
      <button className="ai-fab ai-fab-g" onClick={()=>setShowAI(v=>!v)} title="MIKO"><I.Bot/></button>
      {showAI&&<AiPanel accentColor="var(--g)" accentDim="rgba(16,185,129,.15)" systemPrompt="You are Lemy's Dayflow name MIKO AI assistant. Help the user plan their day, prioritize tasks, manage time, and stay productive. Be concise, practical, and encouraging." placeholder="Ask me to help plan your day, prioritize tasks, or beat procrastination!" suggestions={["Plan a productive morning","How to prioritize my tasks?","I'm feeling overwhelmed, help","Best time to deep work?"]} onClose={()=>setShowAI(false)}/>}
    </div>
  );
}

// ─── SPLITT ────────────────────────────────────────────────────────────
function Split({ user }) {
  const [friends,setFriends]=useState([]); const [expenses,setExpenses]=useState([]);
  const [newF,setNewF]=useState(""); const [desc,setDesc]=useState(""); const [amt,setAmt]=useState("");
  const [paidBy,setPaidBy]=useState("me"); const [splitWith,setSplitWith]=useState([]);
  const [modal,setModal]=useState(null); const [loading,setLoading]=useState(true);
  const [showAI,setShowAI]=useState(false); const [insight,setInsight]=useState(""); const [insightLoad,setInsightLoad]=useState(false);
  // 🔹 Trip Mode
const [tripMembers,setTripMembers]=useState([]);
  const [mode,setMode]=useState("normal"); // normal | trip
const [trips,setTrips]=useState([]);
const [activeTrip,setActiveTrip]=useState(null);
const [newTrip,setNewTrip]=useState("");
  useEffect(()=>{
  async function load(){
    try{
      const fq=query(collection(db,"friends"),where("uid","==",user.uid));
      const fs=await getDocs(fq);
      setFriends(fs.docs.map(d=>({id:d.id,...d.data()})));

      if(mode==="trip" && activeTrip){
        const tq=query(
          collection(db,"trips",activeTrip.id,"expenses"),
          orderBy("createdAt","desc")
        );
        const ts=await getDocs(tq);
        setExpenses(ts.docs.map(d=>({id:d.id,...d.data()})));
      }else{
        const eq=query(
          collection(db,"splitExpenses"),
          where("uid","==",user.uid),
          orderBy("createdAt","desc")
        );
        const es=await getDocs(eq);
        setExpenses(es.docs.map(d=>({id:d.id,...d.data()})));
      }

    }catch(e){
      console.error(e);
      setExpenses([]);
    }
    setLoading(false);
  }
  load();
},[user.uid,mode,activeTrip]);  // 🔹 Load Trips
useEffect(()=>{
  async function loadTrips(){
    try{
      const q=query(
        collection(db,"trips"),
        where("uid","==",user.uid),
        orderBy("createdAt","desc")
      );
      const s=await getDocs(q);
      setTrips(s.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){
      console.error("Trip load error:",e);
    }
  }
  loadTrips();
},[user.uid]);
  async function addFriend(){ if(!newF.trim())return; const f={uid:user.uid,name:newF.trim(),createdAt:serverTimestamp()}; try{const r=await addDoc(collection(db,"friends"),f);setFriends(p=>[...p,{id:r.id,...f}]);}catch{setFriends(p=>[...p,{id:Date.now().toString(),...f}]);} setNewF(""); }
  async function addExp(){
  if(!desc.trim()||!amt||splitWith.length===0)return;

  const a=parseFloat(amt);
  const pp=a/(splitWith.length+1);

  const e={
    uid:user.uid,
    desc:desc.trim(),
    amount:a,
    perPerson:pp,
    paidBy,
    splitWith,
    settled:[],
    createdAt:serverTimestamp()
  };

  try{
    if(mode==="trip" && activeTrip){
      const r=await addDoc(
        collection(db,"trips",activeTrip.id,"expenses"),
        e
      );
      setExpenses(p=>[{id:r.id,...e,createdAt:new Date()},...p]);
    }else{
      const r=await addDoc(collection(db,"splitExpenses"),e);
      setExpenses(p=>[{id:r.id,...e,createdAt:new Date()},...p]);
    }
  }catch(e){
    console.error(e);
  }

  setDesc("");
  setAmt("");
  setSplitWith([]);
}
  async function settle(expId,fid){
  setExpenses(p=>p.map(e=>e.id===expId?{...e,settled:[...(e.settled||[]),fid]}:e));

  try{
    if(mode==="trip" && activeTrip){
      await updateDoc(
        doc(db,"trips",activeTrip.id,"expenses",expId),
        { settled: arrayUnion(fid) }
      );
    }else{
      await updateDoc(
        doc(db,"splitExpenses",expId),
        { settled: arrayUnion(fid) }
      );
    }
  }catch(e){
    console.error(e);
  }

  setModal(null);
}
  function bal(fid){ let b=0; expenses.forEach(e=>{ if(e.settled?.includes(fid))return; if(e.paidBy==="me"&&e.splitWith.includes(fid))b+=e.perPerson; if(e.paidBy===fid&&e.splitWith.includes("me"))b-=e.perPerson; }); return b; }

  async function getSplitInsight(){
    if(expenses.length===0)return; setInsightLoad(true);
    try{
      const tOwed=friends.reduce((s,f)=>s+Math.max(0,bal(f.id)),0);
      const tOwe=friends.reduce((s,f)=>s+Math.max(0,-bal(f.id)),0);
      const recent=expenses.slice(0,5).map(e=>`${e.desc}: ₹${e.amount}`).join(", ");
      const txt=await askAI(`You are a financial advisor for group expenses. Here's the data:\nYou are owed: ₹${tOwed.toFixed(0)}\nYou owe: ₹${tOwe.toFixed(0)}\nRecent expenses: ${recent}\n\nGive a brief 2-3 sentence smart summary: who to follow up with, whether the balance looks fair, and a tip for managing shared costs. Be friendly and direct.`);
      setInsight(txt);
    }catch{setInsight("Couldn't load insight. Try again!");} setInsightLoad(false);
  }
  // 🔹 Delete Friend (Normal mode only)
async function deleteFriend(friendId) {
  const confirmDelete = window.confirm("Remove this friend?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "friends", friendId));
    setFriends(prev => prev.filter(f => f.id !== friendId));
  } catch (e) {
    console.error("Delete friend error:", e);
  }
}
async function createTrip(){
  if(!newTrip.trim()) return;

  const trip={
    uid:user.uid,
    name:newTrip.trim(),
    members:[],
    createdAt:serverTimestamp()
  };

  try{
    const r=await addDoc(collection(db,"trips"),trip);
    setTrips(p=>[{id:r.id,...trip,members:[]},...p]);
    setNewTrip("");
  }catch(e){
    console.error(e);
  }
  async function addFriendToTrip(friendId){
  if(!activeTrip) return;

  try{
    await updateDoc(
      doc(db,"trips",activeTrip.id),
      { members: arrayUnion(friendId) }
    );

    setTripMembers(p=>[...p,friendId]);
  }catch(e){
    console.error(e);
  }
}
async function removeFriendFromTrip(friendId){
  if(!activeTrip) return;

  const confirmDelete = window.confirm("Remove from this trip?");
  if(!confirmDelete) return;

  try{
    await updateDoc(
      doc(db,"trips",activeTrip.id),
      { members: arrayRemove(friendId) }
    );

    setTripMembers(p=>p.filter(id=>id!==friendId));
  }catch(e){
    console.error(e);
  }
}
async function deleteTrip(tripId){
  const confirmDelete = window.confirm("Delete this trip permanently?");
  if(!confirmDelete) return;

  try {
    // 1️⃣ Delete all trip expenses first
    const expensesRef = collection(db, "trips", tripId, "expenses");
    const snapshot = await getDocs(expensesRef);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "trips", tripId, "expenses", docSnap.id));
    }

    // 2️⃣ Delete trip document
    await deleteDoc(doc(db, "trips", tripId));

    // 3️⃣ Update state
    setTrips(p => p.filter(t => t.id !== tripId));

    if(activeTrip?.id === tripId){
      setActiveTrip(null);
      setMode("normal");
    }

  } catch(e){
    console.error("Trip delete error:", e);
  }
}
}
  

  const tOwed=friends.reduce((s,f)=>s+Math.max(0,bal(f.id)),0); const tOwe=friends.reduce((s,f)=>s+Math.max(0,-bal(f.id)),0);
  const balanceBreakdown = friends
  .map(f => {
    const amount = bal(f.id);
    return {
      id: f.id,
      name: f.name,
      amount
    };
  })
  .filter(f => Math.abs(f.amount) > 0.01);
  return (
    <div className="page">
      <AuroraBG colors={["#3b82f6","#06b6d4","#818cf8"]} />
      <MeshBG variant="split"/>
      <div className="pi">
        <header className="fi" style={{marginBottom:"2rem"}}>
          <div className="fm" style={{fontSize:".7rem",color:"var(--b)",letterSpacing:".1em",marginBottom:".4rem",textTransform:"uppercase"}}>Split & Settle</div>
          <h1 className="fs" style={{fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:800,letterSpacing:"-.04em",lineHeight:1.05}}>Splitty <span className="fp" style={{fontStyle:"italic",color:"var(--b)"}}>Ledger.</span></h1>
          <p className="fo" style={{color:"var(--muted2)",marginTop:".35rem",fontSize:".86rem"}}>Track shared expenses with friends.</p>
        </header>
        <div className="gc" style={{marginBottom:"1.5rem"}}>
  <div className="type-tog">
    <button
      className={`type-btn ${mode==="normal"?"si":""}`}
      onClick={()=>{setMode("normal");setActiveTrip(null);}}
    >
      Normal
    </button>

    <button
      className={`type-btn ${mode==="trip"?"si":""}`}
      onClick={()=>setMode("trip")}
    >
      Trip / Event
    </button>
  </div>

{mode==="trip" && (
  <>
    <div style={{display:"flex",gap:".5rem",marginTop:".8rem"}}>
      <input
        className="inp inp-b"
        placeholder="New Trip / Event Name"
        value={newTrip}
        onChange={e=>setNewTrip(e.target.value)}
      />
      <button className="btn btn-b btn-sm" onClick={createTrip}>
        Create
      </button>
    </div>

    {trips.map(t=>(
      <div
        key={t.id}
        style={{
          marginTop:".5rem",
          padding:".5rem",
          border:activeTrip?.id===t.id
            ? "1px solid var(--b)"
            : "1px solid var(--border)",
          borderRadius:"8px"
        }}
      >
        <div
          style={{cursor:"pointer"}}
          onClick={()=>{
            setActiveTrip(t);
            setTripMembers(t.members || []);
          }}
        >
          {t.name}
        </div>

        <button
          onClick={()=>deleteTrip(t.id)}
          style={{
            marginTop:".4rem",
            background:"transparent",
            border:"none",
            color:"var(--r)",
            cursor:"pointer",
            fontSize:".75rem"
          }}
        >
          Delete Trip
        </button>
      </div>
    ))}

    {activeTrip && (
      <div style={{marginTop:"1rem"}}>
        <h4 style={{fontSize:".8rem",marginBottom:".5rem"}}>
          Trip Members
        </h4>

        {friends.map(f=>{
          const isInTrip = tripMembers.includes(f.id);

          return (
            <div
              key={f.id}
              style={{
                display:"flex",
                justifyContent:"space-between",
                marginBottom:".4rem"
              }}
            >
              <span>{f.name}</span>

              {isInTrip ? (
                <button
                  onClick={()=>removeFriendFromTrip(f.id)}
                  style={{
                    background:"transparent",
                    border:"none",
                    color:"var(--r)",
                    cursor:"pointer"
                  }}
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={()=>addFriendToTrip(f.id)}
                  style={{
                    background:"transparent",
                    border:"none",
                    color:"var(--b)",
                    cursor:"pointer"
                  }}
                >
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    )}
  </>
)}
</div>
        <div className="gs">
          {/* Sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
            {/* Overview */}
            <div className="gc fi fi1">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".78rem",color:"var(--muted2)",letterSpacing:".06em",textTransform:"uppercase"}}>Overview</h3>
              <div className="ov-row"><span style={{fontSize:".83rem",color:"var(--muted2)"}}>You are owed</span><span className="fm badge bg">+₹{tOwed.toFixed(0)}</span></div>
              <div className="ov-row"><span style={{fontSize:".83rem",color:"var(--muted2)"}}>You owe</span><span className="fm badge br">-₹{tOwe.toFixed(0)}</span></div>
              {balanceBreakdown.length > 0 && (
  <>
    <div className="divider"/>
    <div style={{fontSize:".75rem",color:"var(--muted2)",marginBottom:".5rem"}}>
      Individual Balances
    </div>

    {balanceBreakdown.map(b => (
      <div key={b.id} className="ov-row">
        {b.amount > 0 ? (
          <>
            <span style={{fontSize:".82rem"}}>
              {b.name} owes you
            </span>
            <span className="fm badge bg">
              +₹{b.amount.toFixed(0)}
            </span>
          </>
        ) : (
          <>
            <span style={{fontSize:".82rem"}}>
              You owe {b.name}
            </span>
            <span className="fm badge br">
              -₹{Math.abs(b.amount).toFixed(0)}
            </span>
          </>
        )}
      </div>
    ))}
  </>
)}
              {expenses.length>0&&<>
                <button className="btn btn-ghost btn-full btn-sm" style={{marginTop:".85rem"}} onClick={getSplitInsight} disabled={insightLoad}>{insightLoad?<><I.Bot/>Analyzing…</>:<><I.Zap/>AI Balance Insight</>}</button>
                {insight&&<div className="ai-insight" style={{borderColor:"var(--b)"}}>{insight}</div>}
              </>}
            </div>
            {/* Friends */}
            <div className="gc fi fi2">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".95rem"}}>Network</h3>
              <div style={{display:"flex",gap:".5rem",marginBottom:".85rem"}}>
                <input className="inp inp-b" style={{flex:1}} placeholder="Add a friend…" value={newF} onChange={e=>setNewF(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFriend()}/>
                <button className="btn btn-ghost btn-icon" onClick={addFriend}><I.UserPlus/></button>
              </div>
              {loading?<div style={{color:"var(--muted)",fontSize:".83rem"}}>Loading…</div>:
               friends.length===0?<div style={{color:"var(--muted)",fontSize:".83rem",textAlign:"center",padding:".75rem 0"}}>No connections yet.</div>:
               friends.map(f=>{
  const b=bal(f.id);
  return (
    <div key={f.id} className="f-row">
      <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
        <div className="f-av">{inits(f.name)}</div>
        <span style={{fontWeight:500,fontSize:".87rem"}}>{f.name}</span>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
        {b>0.01?
          <span className="fm badge bg">+₹{b.toFixed(0)}</span>:
        b<-0.01?
          <span className="fm badge br">-₹{Math.abs(b).toFixed(0)}</span>:
          <span className="badge bm">settled</span>
        }

        {mode==="normal" && (
          <button
            onClick={()=>deleteFriend(f.id)}
            style={{
              background:"transparent",
              border:"none",
              color:"var(--muted)",
              cursor:"pointer"
            }}
          >
            <I.Trash/>
          </button>
        )}
      </div>
    </div>
  );
})}
            </div>
            {/* Add Expense */}
            <div className="gc fi fi3">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".95rem"}}>Log Expense</h3>
              <input className="inp inp-b" style={{marginBottom:".55rem"}} placeholder="Description (e.g. Dinner)" value={desc} onChange={e=>setDesc(e.target.value)}/>
              <input className="inp inp-b" style={{marginBottom:".55rem"}} type="number" placeholder="Amount (₹)" value={amt} onChange={e=>setAmt(e.target.value)}/>
              <select className="inp inp-b" style={{marginBottom:".65rem"}} value={paidBy} onChange={e=>setPaidBy(e.target.value)}><option value="me">Paid by me</option>{friends.map(f=><option key={f.id} value={f.id}>Paid by {f.name}</option>)}</select>
              <div className="gc-inner" style={{marginBottom:".65rem"}}>
                <div style={{fontSize:".68rem",color:"var(--muted)",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",marginBottom:".55rem"}}>Split with</div>
                <div style={{display:"flex",flexDirection:"column",gap:".45rem"}}>
                  {friends.map(f=>(
                    <label key={f.id} style={{display:"flex",alignItems:"center",gap:".55rem",cursor:"pointer",fontSize:".85rem",color:"var(--muted2)"}}>
                      <div className="chk" style={splitWith.includes(f.id)?{background:"var(--b)",borderColor:"var(--b)"}:{}} onClick={()=>setSplitWith(p=>p.includes(f.id)?p.filter(x=>x!==f.id):[...p,f.id])}>{splitWith.includes(f.id)&&<I.Check/>}</div>
                      {f.name}
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn btn-b btn-full" onClick={addExp}>Split Expense</button>
            </div>
          </div>
          {/* Activity */}
          <div className="gc fi fi2" style={{alignSelf:"start"}}>
            <h3 className="fs" style={{marginBottom:"1.25rem",fontSize:".95rem"}}>Activity</h3>
            {loading?<div style={{color:"var(--muted)"}}>Loading…</div>:
             expenses.length===0?<div style={{textAlign:"center",padding:"2.5rem 0",color:"var(--muted)"}}><div className="fp" style={{fontStyle:"italic",fontSize:"1.05rem",marginBottom:".35rem"}}>No recent expenses.</div><div style={{fontSize:".8rem"}}>Add your first shared expense.</div></div>:
             expenses.map(e=>{ const pName=e.paidBy==="me"?"You":(friends.find(f=>f.id===e.paidBy)?.name||"Friend"); return <div key={e.id} className="sp-row"><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".3rem"}}><div style={{display:"flex",alignItems:"center",gap:".45rem"}}><span style={{color:"var(--b)"}}><I.Shake/></span><span style={{fontWeight:600,fontSize:".88rem"}}>{e.desc}</span></div><span className="fm" style={{fontWeight:700,fontSize:".88rem",paddingLeft:".5rem"}}>₹{e.amount?.toFixed(0)}</span></div><div style={{fontSize:".72rem",color:"var(--muted2)",marginBottom:".55rem"}}>Paid by {pName} · {fmtDate(e.createdAt)}</div><div style={{display:"flex",gap:".35rem",flexWrap:"wrap"}}>{e.splitWith.map(fid=>{ const fn=friends.find(f=>f.id===fid)?.name||"Friend"; const settled=e.settled?.includes(fid); return settled?<span key={fid} className="settled-tag">{fn} ✓</span>:<button key={fid} className="settle-tag" onClick={()=>setModal({expId:e.id,friendId:fid,fname:fn,amount:e.perPerson})}>Settle {fn}</button>; })}</div></div>; })}
          </div>
        </div>
      </div>
      <button className="ai-fab ai-fab-b" onClick={()=>setShowAI(v=>!v)} title="MIKO"><I.Bot/></button>
      {showAI&&<AiPanel accentColor="var(--b)" accentDim="rgba(59,130,246,.15)" systemPrompt="You are Lemy's Splitty AI assistant name MIKO. Help the user manage shared expenses, figure out who owes what, suggest fair splitting strategies, and navigate awkward money conversations with friends. Be practical and friendly." placeholder="Ask me about splitting bills, settling up, or handling money with friends!" suggestions={["How to split a restaurant bill fairly?","Who should I settle with first?","Tips for tracking shared expenses","How to ask a friend to pay back?"]} onClose={()=>setShowAI(false)}/>}
      {modal&&<div className="modal-bg" onClick={()=>setModal(null)}><div className="gc si2" style={{width:"100%",maxWidth:"380px",background:"#0a0a0a"}} onClick={e=>e.stopPropagation()}><h3 className="fs" style={{marginBottom:".65rem"}}>Settle with {modal.fname}?</h3><p style={{color:"var(--muted2)",fontSize:".86rem",lineHeight:1.6,marginBottom:"1.5rem"}}>Mark <strong className="fm" style={{color:"var(--text)"}}>₹{modal.amount?.toFixed(0)}</strong> as settled. This cannot be undone.</p><div style={{display:"flex",gap:".65rem",justifyContent:"flex-end"}}><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-b" onClick={()=>settle(modal.expId,modal.friendId)}>Mark Settled</button></div></div></div>}
    </div>
  );
}

// ─── VAULT (EXPENSE) ──────────────────────────────────────────────────────────
function Expense({ user }) {
  const [entries,setEntries]=useState([]); const [desc,setDesc]=useState(""); const [amt,setAmt]=useState(""); const [cat,setCat]=useState("food"); const [type,setType]=useState("expense"); const [loading,setLoading]=useState(true);
  const [showAI,setShowAI]=useState(false); const [insight,setInsight]=useState(""); const [insightLoad,setInsightLoad]=useState(false);

  useEffect(()=>{ async function load(){ try{const q=query(collection(db,"expenses"),where("uid","==",user.uid),orderBy("createdAt","desc"));const s=await getDocs(q);setEntries(s.docs.map(d=>({id:d.id,...d.data()})));}catch{setEntries([]);}setLoading(false);} load(); },[user.uid]);
  async function add(){ if(!desc.trim()||!amt)return; const e={uid:user.uid,desc:desc.trim(),amount:parseFloat(amt),cat,type,createdAt:serverTimestamp()}; try{const r=await addDoc(collection(db,"expenses"),e);setEntries(p=>[{id:r.id,...e,createdAt:new Date()},...p]);}catch{setEntries(p=>[{id:Date.now().toString(),...e,createdAt:new Date()},...p]);} setDesc("");setAmt(""); }
  async function del(id){ setEntries(p=>p.filter(e=>e.id!==id)); try{await deleteDoc(doc(db,"expenses",id))}catch{} }

  async function getFinanceInsight(){
    if(entries.length===0)return; setInsightLoad(true);
    try{
      const inc=entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
      const spd=entries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
      const catT={}; entries.filter(e=>e.type==="expense").forEach(e=>{catT[e.cat]=(catT[e.cat]||0)+e.amount;});
      const topCats=Object.entries(catT).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,v])=>`${c}: ₹${v.toFixed(0)}`).join(", ");
      const txt=await askAI(`You are a personal finance AI. Here's the user's financial summary:\nTotal Income: ₹${inc.toFixed(0)}\nTotal Spent: ₹${spd.toFixed(0)}\nSavings Rate: ${inc>0?Math.round(((inc-spd)/inc)*100):0}%\nTop spending categories: ${topCats}\n\nGive 3-4 sentences of smart financial analysis: what looks good, what to watch out for, and one actionable tip to improve their finances. Be direct and helpful.`);
      setInsight(txt);
    }catch{setInsight("Couldn't load insight. Try again!");} setInsightLoad(false);
  }

  const inc=entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
  const spd=entries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
  const bal=inc-spd;
  const catT={}; entries.filter(e=>e.type==="expense").forEach(e=>{catT[e.cat]=(catT[e.cat]||0)+e.amount;});
  const topC=Object.entries(catT).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxC=Math.max(...topC.map(c=>c[1]),1);
  const cats=["food","transport","entertainment","shopping","health","utilities","rent","salary","other"];

  return (
    <div className="page">
      <MeshBG variant="expense"/>
      <AuroraBG colors={["#f97316","#ea580c","#fbbf24"]} />
      <div className="pi">
        <header className="fi" style={{marginBottom:"2rem"}}>
          <div className="fm" style={{fontSize:".7rem",color:"var(--o)",letterSpacing:".1em",marginBottom:".4rem",textTransform:"uppercase"}}>Cash Flow</div>
          <h1 className="fs" style={{fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:800,letterSpacing:"-.04em",lineHeight:1.05}}>Wealth <span className="fp" style={{fontStyle:"italic",color:"var(--o)"}}>Metrics.</span></h1>
          <p className="fo" style={{color:"var(--muted2)",marginTop:".35rem",fontSize:".86rem"}}>Analyze your personal cash flow.</p>
        </header>
        {/* Stats */}
        <div className="g3 fi fi1" style={{marginBottom:"1.5rem"}}>
          <div className="stat sb"><div className="fm" style={{fontSize:".65rem",color:"var(--muted2)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".35rem"}}><I.Wallet/>Balance</div><div className="fs" style={{fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:800,letterSpacing:"-.03em"}}>{bal>=0?"+":"-"}₹{Math.abs(bal).toLocaleString()}</div></div>
          <div className="stat si"><div className="fm" style={{fontSize:".65rem",color:"var(--o)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".35rem"}}><I.Up/>Income</div><div className="fs" style={{fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:800,color:"var(--o)",letterSpacing:"-.03em"}}>₹{inc.toLocaleString()}</div></div>
          <div className="stat ss"><div className="fm" style={{fontSize:".65rem",color:"#f59e0b",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".35rem"}}><I.Down/>Spent</div><div className="fs" style={{fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:800,color:"#f59e0b",letterSpacing:"-.03em"}}>₹{spd.toLocaleString()}</div></div>
        </div>
        <div className="ge">
          {/* Ledger */}
          <div className="gc fi fi2">
            <h3 className="fs" style={{marginBottom:"1.1rem",fontSize:".95rem"}}>Ledger</h3>
            {loading?<div style={{color:"var(--muted)",fontSize:".85rem"}}>Loading…</div>:
             entries.length===0?<div style={{textAlign:"center",padding:"2.5rem 0",color:"var(--muted)"}}><div className="fp" style={{fontStyle:"italic",fontSize:"1.05rem",marginBottom:".35rem"}}>No transactions yet.</div><div style={{fontSize:".8rem"}}>Record your first entry.</div></div>:
             entries.slice(0,30).map((e,idx)=>(
              <div key={e.id} className="tx-row si2" style={{animationDelay:`${idx*.03}s`}}>
                <div className={`tx-dot`} style={{background:CC[e.cat]||"#6b7280"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:".87rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.desc}</div>
                  <div style={{display:"flex",gap:".4rem",marginTop:"3px"}}><span className="fm" style={{fontSize:".65rem",color:"var(--muted)",textTransform:"capitalize"}}>{e.cat}</span><span style={{fontSize:".65rem",color:"var(--muted)"}}>· {fmtDate(e.createdAt)}</span></div>
                </div>
                <span className="fm" style={{fontWeight:700,color:e.type==="income"?"var(--o)":"var(--text)",fontSize:".86rem",whiteSpace:"nowrap"}}>{e.type==="income"?"+":"-"}₹{e.amount.toLocaleString()}</span>
                <button style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",padding:"3px",marginLeft:".2rem",transition:"color .2s",display:"flex",alignItems:"center",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color="var(--o)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"} onClick={()=>del(e.id)}><I.Trash/></button>
              </div>
             ))}
          </div>
          {/* Right column */}
          <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
            {/* Add */}
            <div className="gc fi fi1">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".95rem"}}>New Entry</h3>
              <div className="type-tog" style={{marginBottom:".85rem"}}>
                <button className={`type-btn ${type==="expense"?"se":""}`} onClick={()=>setType("expense")}><I.Down/>Expense</button>
                <button className={`type-btn ${type==="income"?"si":""}`} onClick={()=>setType("income")}><I.Up/>Income</button>
              </div>
              <input className="inp inp-o" style={{marginBottom:".55rem"}} placeholder="Title (e.g. Groceries)" value={desc} onChange={e=>setDesc(e.target.value)}/>
              <input className="inp inp-o" style={{marginBottom:".55rem"}} type="number" placeholder="Amount (₹)" value={amt} onChange={e=>setAmt(e.target.value)}/>
              <select className="inp inp-o" style={{marginBottom:".8rem"}} value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select>
              <button className="btn btn-o btn-full" onClick={add}>Record Entry</button>
              {entries.length>0&&<>
                <button className="btn btn-ghost btn-full btn-sm" style={{marginTop:".55rem"}} onClick={getFinanceInsight} disabled={insightLoad}>{insightLoad?<><I.Bot/>Analyzing…</>:<><I.Zap/>AI Financial Insight</>}</button>
                {insight&&<div className="ai-insight" style={{borderColor:"var(--o)"}}>{insight}</div>}
              </>}
            </div>
            {/* Chart */}
            {topC.length>0&&(
              <div className="gc fi fi2">
                <h3 className="fs" style={{marginBottom:".85rem",fontSize:".78rem",color:"var(--muted2)",textTransform:"uppercase",letterSpacing:".06em"}}>Spending Breakdown</h3>
                <div style={{display:"flex",alignItems:"flex-end",height:"70px",gap:"4px",marginBottom:"5px"}}>
                  {topC.map(([c,v])=><div key={c} className="bar-col"><div className="bar-rect" style={{height:`${(v/maxC)*62}px`,background:CC[c],opacity:.85}}/></div>)}
                </div>
                <div style={{display:"flex",gap:"4px",marginBottom:".9rem"}}>{topC.map(([c])=><div key={c} className="bar-col"><div className="bar-lbl">{c.slice(0,4)}</div></div>)}</div>
                <div className="divider"/>
                {topC.map(([c,v])=>(
                  <div key={c} style={{marginBottom:".55rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:".25rem",fontSize:".76rem"}}>
                      <span style={{color:CC[c],fontWeight:600,display:"flex",alignItems:"center",gap:"5px"}}><span style={{width:"6px",height:"6px",borderRadius:"50%",background:CC[c],display:"inline-block"}}/>{c}</span>
                      <span className="fm" style={{color:"var(--muted2)",fontSize:".68rem"}}>₹{v.toFixed(0)}</span>
                    </div>
                    <div className="prog-track"><div style={{height:"100%",width:`${(v/spd)*100}%`,background:CC[c],borderRadius:"3px",transition:"width .5s"}}/></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <button className="ai-fab ai-fab-o" onClick={()=>setShowAI(v=>!v)} title="MIKO"><I.Bot/></button>
      {showAI&&<AiPanel accentColor="var(--o)" accentDim="rgba(249,115,22,.15)" systemPrompt="You are Lemy's Vault AI assistant name MIKO. Help the user understand their spending, suggest budgets, identify saving opportunities, analyze their financial health, and give actionable money management advice. Be specific and data-driven." placeholder="Ask me about your spending, budgeting tips, or how to save more!" suggestions={["How am I spending too much?","Help me build a budget","Tips to save more money","What's a healthy savings rate?"]} onClose={()=>setShowAI(false)}/>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null); const [tab,setTab]=useState("planner"); const [loading,setLoading]=useState(true);
  useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setLoading(false);}),[]);

  if(loading) return (
    <><Styles/>
    <div style={{background:"#000",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className="fs pulse" style={{color:"var(--g)",fontSize:"1.4rem",fontWeight:800,letterSpacing:"-.03em"}}>le<span style={{color:"#fff"}}>my</span></div>
      <style>{`@keyframes pls{0%,100%{opacity:.2}50%{opacity:1}}.pulse{animation:pls 1.5s ease-in-out infinite}`}</style>
    </div></>
  );

  if(!user) return <><Styles/><Auth onAuth={setUser}/></>;

  return (
    <>
      <Styles/>
      <nav className="nav">
        <div className="nav-logo">le<em className="g">my</em></div>
        <div className="nav-pills">
          <button className={`np ${tab==="planner"?"on-g":""}`} onClick={()=>setTab("planner")}><I.Calendar/><span className="np-lbl">Dayflow</span></button>
          <button className={`np ${tab==="split"?"on-b":""}`} onClick={()=>setTab("split")}><I.Users/><span className="np-lbl">Splitty</span></button>
          <button className={`np ${tab==="expense"?"on-o":""}`} onClick={()=>setTab("expense")}><I.Chart/><span className="np-lbl">Vault</span></button>
        </div>
        <div className="nav-right">
          <div className="nav-av">{inits(user.displayName||user.email)}</div>
          <span className="nav-nm fo">{user.displayName||user.email?.split("@")[0]}</span>
          <button className="nav-out" onClick={()=>signOut(auth)} title="Sign out"><I.Out/></button>
        </div>
      </nav>
      <main>
        {tab==="planner"&&<Planner user={user}/>}
        {tab==="split"&&<Split user={user}/>}
        {tab==="expense"&&<Expense user={user}/>}
      </main>
    </>
  );
}