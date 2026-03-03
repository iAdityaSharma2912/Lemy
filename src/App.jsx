import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, serverTimestamp, orderBy, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { apiKey:"AIzaSyCfbmO0p-KrgECDZW9gHYSeRETqWJ-N0B0", authDomain:"myos-6c9d9.firebaseapp.com", projectId:"myos-6c9d9", storageBucket:"myos-6c9d9.firebasestorage.app", messagingSenderId:"367542951212", appId:"1:367542951212:web:c9cda1ede08a056d70e089" };
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const OR_KEY = "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";
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_HEADERS = { "Content-Type":"application/json","Authorization":`Bearer ${OR_KEY}`,"HTTP-Referer":"https://lemy.app","X-Title":"Lemy" };

async function askAI(prompt) {
  const res = await fetch(OR_URL,{method:"POST",headers:OR_HEADERS,body:JSON.stringify({model:"openai/gpt-4o",max_tokens:1200,messages:[{role:"user",content:prompt}]})});
  const d = await res.json(); return d.choices[0].message.content;
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
const toDateStr = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDisplayDate = (str) => {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" });
};
const fmtMonthYear = (str) => {
  if (!str) return "";
  const [y, m] = str.split("-");
  return new Date(+y, +m - 1).toLocaleDateString("en-IN", { month:"long", year:"numeric" });
};
const getMonthStr = (str) => str ? str.slice(0, 7) : ""; // "YYYY-MM"
const fmtDate = ts => { if(!ts)return""; const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString("en-IN",{month:"short",day:"numeric"}); };
const inits = n => n?n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2):"?";
const todayLong = () => new Date().toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric"});
const CC = {food:"#fb923c",transport:"#3b82f6",entertainment:"#a855f7",shopping:"#ec4899",health:"#22c55e",utilities:"#eab308",rent:"#ef4444",salary:"#10b981",other:"#6b7280"};

// Navigate day/month helpers
const addDays = (str, n) => {
  const d = new Date(str + "T00:00:00"); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const addMonths = (str, n) => {
  const [y, m] = str.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};

// ─── DATE NAV BAR ─────────────────────────────────────────────────────────────
function DateNav({ mode="day", value, onChange, accentColor="var(--g)" }) {
  const label = mode === "day" ? fmtDisplayDate(value) : fmtMonthYear(value + "-01");
  const prev = () => onChange(mode === "day" ? addDays(value, -1) : addMonths(value, -1));
  const next = () => onChange(mode === "day" ? addDays(value, 1) : addMonths(value, 1));
  const isToday = mode === "day" ? value === todayStr() : value === todayStr().slice(0,7);
  return (
    <div style={{display:"flex",alignItems:"center",gap:".5rem",background:"rgba(0,0,0,.3)",border:`1px solid ${accentColor}33`,borderRadius:"12px",padding:".35rem .6rem",marginBottom:"1.5rem",width:"fit-content"}}>
      <button onClick={prev} style={{background:"none",border:"none",color:accentColor,cursor:"pointer",padding:"2px 6px",borderRadius:"6px",fontSize:"1rem",lineHeight:1}}>‹</button>
      <span style={{fontSize:".82rem",fontWeight:600,color:"#fff",fontFamily:"'Outfit',sans-serif",minWidth:"180px",textAlign:"center"}}>{label}</span>
      <button onClick={next} style={{background:"none",border:"none",color:accentColor,cursor:"pointer",padding:"2px 6px",borderRadius:"6px",fontSize:"1rem",lineHeight:1}}>›</button>
      {!isToday && (
        <button onClick={()=>onChange(mode==="day"?todayStr():todayStr().slice(0,7))} style={{background:`${accentColor}22`,border:`1px solid ${accentColor}44`,color:accentColor,cursor:"pointer",padding:"2px 8px",borderRadius:"6px",fontSize:".68rem",fontWeight:700,marginLeft:"2px",fontFamily:"'JetBrains Mono',monospace"}}>TODAY</button>
      )}
    </div>
  );
}

const I = {
  Calendar:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Users:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Chart:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  Sparkle:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/></svg>,
  Plus:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Clock:()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  UserPlus:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Shake:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/></svg>,
  Wallet:()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><circle cx="17" cy="12" r="1"/></svg>,
  Up:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  Down:()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Out:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Mail:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Lock:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bot:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/></svg>,
  Send:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Zap:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  X:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Arrow:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Trip:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l2-8h14l2 8"/><path d="M5 9V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><circle cx="7.5" cy="17" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/></svg>,
};

// ─── MESH BG ──────────────────────────────────────────────────────────────────
const MeshBG = ({ variant="planner" }) => {
  const ref = useRef(null);
  useEffect(()=>{
    const c=ref.current; if(!c)return;
    const ctx=c.getContext("2d");
    let W=c.width=window.innerWidth,H=c.height=window.innerHeight,raf;
    const PAL={planner:["#10b981","#059669","#34d399","#6ee7b7"],split:["#3b82f6","#818cf8","#06b6d4","#60a5fa"],expense:["#f97316","#f59e0b","#fbbf24","#ea580c"],auth:["#10b981","#047857","#6ee7b7","#065f46"]};
    const cols=PAL[variant]||PAL.planner;
    const h2r=h=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`${r},${g},${b}`;};
    const orbs=Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,r:180+Math.random()*220,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,col:cols[i%cols.length],op:.07+Math.random()*.08}));
    const pts=Array.from({length:55},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:.4+Math.random()*1.1,op:.15+Math.random()*.4,col:cols[Math.floor(Math.random()*cols.length)]}));
    function frame(){
      ctx.clearRect(0,0,W,H);ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
      orbs.forEach(o=>{o.x+=o.vx;o.y+=o.vy;if(o.x<-o.r)o.x=W+o.r;if(o.x>W+o.r)o.x=-o.r;if(o.y<-o.r)o.y=H+o.r;if(o.y>H+o.r)o.y=-o.r;const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);g.addColorStop(0,`rgba(${h2r(o.col)},${o.op})`);g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();});
      const vg=ctx.createRadialGradient(W/2,H/2,H*.15,W/2,H/2,H*.9);vg.addColorStop(0,"transparent");vg.addColorStop(1,"rgba(0,0,0,.65)");ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${h2r(p.col)},${p.op})`;ctx.fill();});
      pts.forEach((p,i)=>{for(let j=i+1;j<pts.length;j++){const dx=p.x-pts[j].x,dy=p.y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<95){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(${h2r(p.col)},${.07*(1-d/95)})`;ctx.lineWidth=.4;ctx.stroke();}}});
      raf=requestAnimationFrame(frame);
    }
    frame();
    const onR=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight;};window.addEventListener("resize",onR);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onR);};
  },[variant]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
};

const AuroraBG = ({ colors=["#10b981","#3b82f6","#f97316"] }) => (
  <>
    <div className="aurora-bg" />
    <style>{`.aurora-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(circle at 20% 30%,${colors[0]}33,transparent 50%),radial-gradient(circle at 80% 70%,${colors[1]}33,transparent 50%),radial-gradient(circle at 50% 50%,${colors[2]}22,transparent 60%);animation:auroraMove 18s ease-in-out infinite alternate;filter:blur(100px)}@keyframes auroraMove{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.2) translate(-4%,4%)}}`}</style>
  </>
);

// ─── AI CHAT PANEL ────────────────────────────────────────────────────────────
function AiPanel({ accentColor, accentDim, systemPrompt, placeholder, suggestions, onClose }) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:`Hey! I'm MIKO your AI assistant. ${placeholder}`}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  async function send(text) {
    const q=text||input.trim();if(!q)return;
    setInput("");setLoading(true);
    const newMsgs=[...msgs,{role:"user",content:q}]; setMsgs(newMsgs);
    try{
      const res=await fetch(OR_URL,{method:"POST",headers:OR_HEADERS,body:JSON.stringify({model:"openai/gpt-4o",max_tokens:800,messages:[{role:"system",content:systemPrompt},...newMsgs.map(m=>({role:m.role,content:m.content}))]})});
      const d=await res.json(); setMsgs(p=>[...p,{role:"assistant",content:d.choices[0].message.content}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Sorry, something went wrong. Try again!"}]);}
    setLoading(false);
  }
  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:"1rem",pointerEvents:"none"}}>
      <div style={{width:"100%",maxWidth:"420px",height:"520px",background:"rgba(10,10,10,0.97)",border:`1px solid ${accentColor}33`,borderRadius:"20px",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:`0 20px 60px rgba(0,0,0,.6),0 0 0 1px ${accentColor}22`,pointerEvents:"all",animation:"slideUp .3s cubic-bezier(.16,1,.3,1)"}}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{display:"flex",alignItems:"center",gap:".65rem",padding:"1rem 1.1rem",borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:accentDim,display:"flex",alignItems:"center",justifyContent:"center",color:accentColor}}><I.Bot/></div>
          <div><div style={{fontSize:".88rem",fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff"}}>MIKO</div><div style={{fontSize:".7rem",color:accentColor,fontFamily:"'JetBrains Mono',monospace"}}>GPT-4o · lemy</div></div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"rgba(255,255,255,.06)",border:"none",color:"#888",width:28,height:28,borderRadius:"8px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I.X/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:".75rem"}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"85%",padding:".65rem .9rem",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?accentColor:"rgba(255,255,255,.06)",color:m.role==="user"?"#000":"#e6edf3",fontSize:".83rem",lineHeight:1.55,fontFamily:"'Outfit',sans-serif",whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:".65rem .9rem",borderRadius:"14px 14px 14px 4px",background:"rgba(255,255,255,.06)",display:"flex",gap:"4px",alignItems:"center"}}>{[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:accentColor,animation:`dp 1s ease-in-out ${i*.18}s infinite`}}/>)}<style>{`@keyframes dp{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style></div></div>}
          <div ref={bottomRef}/>
        </div>
        {msgs.length<=1&&<div style={{padding:"0 1rem .75rem",display:"flex",gap:".4rem",flexWrap:"wrap"}}>{suggestions.map((s,i)=><button key={i} onClick={()=>send(s)} style={{fontSize:".72rem",padding:".3rem .65rem",borderRadius:"20px",border:`1px solid ${accentColor}44`,background:accentDim,color:accentColor,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{s}</button>)}</div>}
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
    :root{--g:#10b981;--gd:#059669;--gdim:rgba(16,185,129,.15);--gg:rgba(16,185,129,.25);--b:#3b82f6;--bdim:rgba(59,130,246,.13);--o:#f97316;--od:#ea6c0a;--odim:rgba(249,115,22,.15);--og:rgba(249,115,22,.25);--r:#ef4444;--rdim:rgba(239,68,68,.13);--glass:rgba(255,255,255,.03);--glass2:rgba(255,255,255,.06);--border:rgba(255,255,255,.09);--text:#f0fdf4;--muted:#6b7280;--muted2:#9ca3af}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{background:#000;color:var(--text);font-family:'Outfit',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:10px}
    .fs{font-family:'Syne',sans-serif}.fo{font-family:'Outfit',sans-serif}.fm{font-family:'JetBrains Mono',monospace}.fp{font-family:'Playfair Display',serif}
    .gc{background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:20px;padding:1.5rem;transition:border-color .3s}
    .gc-inner{background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:12px;padding:.9rem}
    .inp{width:100%;padding:.75rem 1rem;background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:12px;color:var(--text);font-family:'Outfit',sans-serif;font-size:.88rem;outline:none;transition:border-color .2s,box-shadow .2s}
    .inp::placeholder{color:var(--muted)}.inp-g:focus{border-color:var(--g);box-shadow:0 0 0 3px var(--gdim)}.inp-b:focus{border-color:var(--b);box-shadow:0 0 0 3px var(--bdim)}.inp-o:focus{border-color:var(--o);box-shadow:0 0 0 3px var(--odim)}
    .inp-wrap{position:relative;display:flex;align-items:center}.inp-wrap svg{position:absolute;left:.9rem;color:var(--muted);pointer-events:none;z-index:1}.inp-wrap input{padding-left:2.5rem}
    select.inp{appearance:none;cursor:pointer}select.inp option{background:#0a0a0a}textarea.inp{resize:none;line-height:1.6}
    .btn{padding:.75rem 1.4rem;border:none;border-radius:12px;font-family:'Outfit',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;transition:all .2s;letter-spacing:.01em;white-space:nowrap}
    .btn-g{background:var(--g);color:#000}.btn-g:hover:not(:disabled){background:#0ea271;transform:translateY(-2px);box-shadow:0 8px 20px var(--gg)}
    .btn-o{background:var(--o);color:#000}.btn-o:hover:not(:disabled){background:var(--od);transform:translateY(-2px);box-shadow:0 8px 20px var(--og)}
    .btn-b{background:var(--b);color:#fff}.btn-b:hover:not(:disabled){background:#2563eb;transform:translateY(-2px);box-shadow:0 8px 20px var(--bdim)}
    .btn-ghost{background:var(--glass2);color:var(--muted2);border:1px solid var(--border)}.btn-ghost:hover:not(:disabled){color:var(--text);border-color:rgba(255,255,255,.18)}
    .btn-danger{background:var(--rdim);color:var(--r);border:1px solid rgba(239,68,68,.2)}.btn-danger:hover:not(:disabled){background:rgba(239,68,68,.25)}
    .btn:disabled{opacity:.4;cursor:not-allowed}.btn-icon{width:40px;height:40px;padding:0;border-radius:10px;flex-shrink:0}.btn-full{width:100%}.btn-sm{padding:.5rem .9rem;font-size:.8rem;border-radius:9px}
    .ai-fab{position:fixed;bottom:1.5rem;right:1.5rem;z-index:400;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(0,0,0,.4);transition:all .25s}.ai-fab:hover{transform:scale(1.1)}.ai-fab-g{background:var(--g);color:#000}.ai-fab-b{background:var(--b);color:#fff}.ai-fab-o{background:var(--o);color:#000}
    .nav{position:sticky;top:0;z-index:200;background:rgba(0,0,0,.7);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:0 1.25rem;height:64px;display:flex;align-items:center;gap:.75rem}
    .nav-logo{display:flex;align-items:center;gap:.5rem;white-space:nowrap;flex-shrink:0;text-decoration:none}
    .nav-logo-mark{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:.95rem;color:#000;flex-shrink:0;box-shadow:0 4px 12px rgba(16,185,129,.35)}
    .nav-logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:1.15rem;letter-spacing:-.04em;color:#fff}
    .nav-logo-text em{font-style:normal;color:var(--g)}
    .nav-pills{display:flex;gap:.2rem;background:rgba(0,0,0,.4);padding:.25rem;border-radius:13px;border:1px solid var(--border);flex:1;justify-content:center}
    .np{padding:.42rem .75rem;border-radius:9px;border:none;background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:.35rem;white-space:nowrap;flex:1;justify-content:center}
    .np:hover{color:var(--text)}.np.on-g{background:var(--gdim);color:var(--g)}.np.on-b{background:var(--bdim);color:var(--b)}.np.on-o{background:var(--odim);color:var(--o)}
    .np-lbl{display:none}@media(min-width:420px){.np-lbl{display:inline}}
    .nav-right{margin-left:auto;display:flex;align-items:center;gap:.5rem;flex-shrink:0}
    .nav-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--g),#047857);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:.7rem;font-weight:800;color:#000;flex-shrink:0}
    .nav-nm{font-size:.8rem;color:var(--muted2);display:none}@media(min-width:600px){.nav-nm{display:block}}
    .nav-out{background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);padding:.35rem .55rem;cursor:pointer;transition:all .2s;display:flex;align-items:center}.nav-out:hover{border-color:var(--r);color:var(--r)}
    .page{min-height:calc(100vh - 64px);padding:1.5rem 1rem 5rem;position:relative;z-index:1}
    @media(min-width:768px){.page{padding:2.5rem 1.5rem 5rem}}
    .pi{max-width:1080px;margin:0 auto}
    .g2{display:grid;grid-template-columns:1fr;gap:1.25rem}@media(min-width:768px){.g2{grid-template-columns:1fr 1fr}}
    .g3{display:grid;grid-template-columns:1fr;gap:.85rem}@media(min-width:480px){.g3{grid-template-columns:1fr 1fr}}@media(min-width:768px){.g3{grid-template-columns:1fr 1fr 1fr}}
    .gs{display:grid;grid-template-columns:1fr;gap:1.25rem}@media(min-width:900px){.gs{grid-template-columns:300px 1fr}}
    .ge{display:grid;grid-template-columns:1fr;gap:1.25rem}@media(min-width:900px){.ge{grid-template-columns:1fr 320px}}
    .divider{height:1px;background:var(--border);margin:1.1rem 0}
    .prog-track{height:5px;background:var(--border);border-radius:3px;overflow:hidden}.prog-fill{height:100%;border-radius:3px;transition:width .5s cubic-bezier(.4,0,.2,1)}
    .task-row{display:flex;align-items:center;gap:.7rem;padding:.8rem .9rem;background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:13px;transition:all .2s}.task-row:hover{border-color:rgba(16,185,129,.22)}.task-row.done{opacity:.4}
    .chk{width:19px;height:19px;border-radius:6px;flex-shrink:0;border:1.5px solid var(--border);background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:#000}
    .pri{font-size:.65rem;padding:.12rem .44rem;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;flex-shrink:0}.pri-h{background:rgba(16,185,129,.14);color:var(--g)}.pri-m{background:rgba(255,255,255,.07);color:var(--muted2)}.pri-l{background:rgba(255,255,255,.04);color:var(--muted)}
    .badge{display:inline-flex;align-items:center;gap:3px;font-size:.68rem;font-weight:700;padding:.16rem .5rem;border-radius:20px}.bg{background:var(--gdim);color:var(--g)}.br{background:var(--rdim);color:var(--r)}.bm{background:rgba(255,255,255,.06);color:var(--muted2)}
    .f-row{display:flex;align-items:center;justify-content:space-between;padding:.6rem .75rem;border-radius:10px;background:rgba(0,0,0,.15);border:1px solid var(--border);margin-bottom:.45rem;transition:border-color .2s}.f-row:hover{border-color:rgba(59,130,246,.3)}
    .f-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;color:#fff;flex-shrink:0;font-family:'Syne',sans-serif}
    .sp-row{padding:.9rem;background:rgba(0,0,0,.2);border:1px solid var(--border);border-radius:13px;margin-bottom:.7rem;transition:border-color .2s}.sp-row:hover{border-color:rgba(59,130,246,.3)}.sp-row:last-child{margin-bottom:0}
    .settle-tag{font-size:.68rem;padding:.18rem .6rem;border-radius:20px;border:1px solid rgba(59,130,246,.3);background:rgba(59,130,246,.1);color:var(--b);cursor:pointer;transition:all .2s;font-weight:600}.settle-tag:hover{background:rgba(59,130,246,.22)}
    .settled-tag{font-size:.68rem;padding:.18rem .6rem;border-radius:20px;background:rgba(255,255,255,.05);color:var(--muted);font-weight:500}
    .debt-card{padding:.65rem .9rem;background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;gap:.6rem;margin-bottom:.45rem}.debt-from{font-size:.82rem;font-weight:600;color:var(--r)}.debt-to{font-size:.82rem;font-weight:600;color:var(--g)}.debt-amt{font-size:.8rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--text);margin-left:auto}
    .trip-card{padding:.75rem 1rem;background:rgba(0,0,0,.25);border:1px solid var(--border);border-radius:13px;margin-bottom:.5rem;cursor:pointer;transition:all .2s}.trip-card:hover{border-color:rgba(59,130,246,.3)}.trip-card.active{border-color:var(--b);background:rgba(59,130,246,.06)}
    .tx-row{display:flex;align-items:center;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--border)}.tx-row:last-child{border-bottom:none}.tx-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .stat{border-radius:16px;padding:1.1rem 1.25rem;position:relative;overflow:hidden;background:var(--glass);backdrop-filter:blur(20px);border:1px solid var(--border)}.stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}.sb::before{background:linear-gradient(90deg,#fff,transparent)}.si::before{background:linear-gradient(90deg,var(--o),transparent)}.ss::before{background:linear-gradient(90deg,#f59e0b,transparent)}
    .type-tog{display:flex;gap:.35rem;background:rgba(0,0,0,.35);padding:.25rem;border-radius:11px;border:1px solid var(--border)}.type-btn{flex:1;padding:.52rem;border-radius:8px;border:none;background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.3rem}.type-btn.se{background:var(--rdim);color:var(--r)}.type-btn.si{background:var(--odim);color:var(--o)}
    .bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}.bar-rect{width:100%;border-radius:3px 3px 0 0}.bar-lbl{font-size:.58rem;color:var(--muted);font-family:'JetBrains Mono',monospace}
    .auth-wrap{min-height:100vh;display:grid;grid-template-columns:1fr}@media(min-width:900px){.auth-wrap{grid-template-columns:1fr 1fr}}
    .auth-hero{display:none;flex-direction:column;align-items:center;justify-content:center;padding:4rem 3rem;position:relative;z-index:1}@media(min-width:900px){.auth-hero{display:flex}}
    .auth-side{display:flex;align-items:center;justify-content:center;padding:1.5rem;position:relative;z-index:1;min-height:100vh}
    .h-mod{display:flex;align-items:center;gap:.9rem;padding:.9rem 1.1rem;border-radius:14px;background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.22);margin-bottom:.75rem;transition:transform .2s}.h-mod:hover{transform:translateX(5px)}.h-mod-ic{width:38px;height:38px;border-radius:10px;background:var(--gdim);color:var(--g);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1rem}
    .ai-insight{background:rgba(0,0,0,.3);border-radius:12px;padding:.9rem;margin-top:.85rem;border-left:3px solid;font-size:.82rem;line-height:1.6;color:var(--muted2);white-space:pre-wrap}
    .fi{animation:fadeIn .5s ease-out both}.fi1{animation-delay:.06s}.fi2{animation-delay:.13s}.fi3{animation-delay:.2s}
    @keyframes fadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    .si2{animation:slideIn .4s cubic-bezier(.16,1,.3,1) both}@keyframes slideIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .pulse{animation:pls 1.5s ease-in-out infinite}@keyframes pls{0%,100%{opacity:.25}50%{opacity:1}}
    .member-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.28rem .65rem;border-radius:20px;font-size:.72rem;font-weight:600;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);color:var(--b);margin:.18rem}
    .member-chip button{background:none;border:none;color:var(--r);cursor:pointer;padding:0;display:flex;align-items:center}
    .section-label{font-size:.7rem;color:var(--muted2);font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:.6rem;font-family:'JetBrains Mono',monospace}
    /* view toggle for expense */
    .view-tog{display:flex;gap:.3rem;background:rgba(0,0,0,.3);padding:.22rem;border-radius:9px;border:1px solid var(--border)}
    .view-btn{padding:.35rem .75rem;border-radius:7px;border:none;background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s}
    .view-btn.active{background:rgba(249,115,22,.18);color:var(--o)}
  `}</style>
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function Auth({ onAuth }) {
  const [mode,setMode]=useState("signin");const [name,setName]=useState("");const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  async function submit(){setErr("");setLoading(true);try{if(mode==="signup"){const c=await createUserWithEmailAndPassword(auth,email,pw);if(name)await updateProfile(c.user,{displayName:name});onAuth(c.user);}else{const c=await signInWithEmailAndPassword(auth,email,pw);onAuth(c.user);}}catch(e){setErr(e.message.replace("Firebase: ",""));}setLoading(false);}
  return (
    <div className="auth-wrap">
      <MeshBG variant="auth"/>
      <div className="auth-hero fi">
        <div style={{width:"100%",maxWidth:"320px"}}>
          <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:".5rem"}}>
            <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.3rem",color:"#000",boxShadow:"0 6px 20px rgba(16,185,129,.4)"}}>L</div>
            <div className="fs" style={{fontSize:"2.8rem",fontWeight:800,letterSpacing:"-.05em",lineHeight:1}}>le<em style={{color:"var(--g)",fontStyle:"normal"}}>my</em></div>
          </div>
          <div className="fp" style={{fontSize:"1rem",color:"var(--muted2)",fontStyle:"italic",marginBottom:"2.5rem"}}>your personal life OS</div>
          {[{icon:<I.Calendar/>,title:"Dayflow",sub:"AI-powered daily planning"},{icon:<I.Users/>,title:"Splitty",sub:"Smart expense splitting"},{icon:<I.Chart/>,title:"Vault",sub:"AI financial insights"}].map((m,i)=>(
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
          <div style={{color:"var(--muted2)",fontSize:".86rem",marginBottom:"1.75rem"}}>{mode==="signin"?"Enter your workspace.":"Create your account — it's free."}</div>
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

// ─── DAYFLOW ──────────────────────────────────────────────────────────────────
function Planner({ user }) {
  const [allTasks,setAllTasks]=useState([]);
  const [selectedDate,setSelectedDate]=useState(todayStr());
  const [dump,setDump]=useState("");const [aiLoad,setAiLoad]=useState(false);
  const [newT,setNewT]=useState("");const [newTm,setNewTm]=useState("");const [newP,setNewP]=useState("medium");
  const [loading,setLoading]=useState(true);const [showAI,setShowAI]=useState(false);
  const [insight,setInsight]=useState("");const [insightLoad,setInsightLoad]=useState(false);

  useEffect(()=>{
    async function load(){
      try{const q=query(collection(db,"tasks"),where("uid","==",user.uid));const s=await getDocs(q);setAllTasks(s.docs.map(d=>({id:d.id,...d.data()})));}
      catch{setAllTasks([]);}setLoading(false);
    }
    load();
  },[user.uid]);

  // Filter tasks by selected date (stored as dateStr field)
  const tasks = allTasks.filter(t => (t.dateStr || toDateStr(t.createdAt)) === selectedDate);

  async function add(text,time="",priority="medium"){
    const t={uid:user.uid,text,time,priority,done:false,dateStr:selectedDate,createdAt:serverTimestamp()};
    try{const r=await addDoc(collection(db,"tasks"),t);setAllTasks(p=>[{id:r.id,...t,createdAt:new Date()},...p]);}
    catch{setAllTasks(p=>[{id:Date.now().toString(),...t,createdAt:new Date()},...p]);}
  }
  async function toggle(id,done){setAllTasks(p=>p.map(t=>t.id===id?{...t,done:!done}:t));try{await updateDoc(doc(db,"tasks",id),{done:!done})}catch{}}
  async function del(id){setAllTasks(p=>p.filter(t=>t.id!==id));try{await deleteDoc(doc(db,"tasks",id))}catch{}}
  async function addManual(){if(!newT.trim())return;await add(newT.trim(),newTm,newP);setNewT("");setNewTm("");}
  async function planAI(){
    if(!dump.trim())return;setAiLoad(true);
    try{const txt=await askAI(`You are a productivity assistant. Return ONLY a valid JSON array, no markdown. Each item: {"text":"task","time":"HH:MM AM/PM","priority":"high|medium|low"}. Tasks: ${dump}`);
    const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
    for(const item of parsed)await add(item.text,item.time||"",item.priority||"medium");setDump("");}
    catch(e){alert("AI planning failed: "+e.message);}setAiLoad(false);
  }
  async function getDayInsight(){
    if(tasks.length===0)return;setInsightLoad(true);
    try{const list=tasks.map(t=>`- ${t.text} [${t.priority}]${t.done?" (done)":""}`).join("\n");
    const txt=await askAI(`Productivity coach. Task list for ${fmtDisplayDate(selectedDate)}:\n${list}\n\nGive 3-4 sentences of motivating analysis: focus areas, reprioritization tips, and a quick tip. Be concise.`);
    setInsight(txt);}catch{setInsight("Couldn't load insight.");}setInsightLoad(false);
  }

  const done=tasks.filter(t=>t.done).length;
  const pct=tasks.length?Math.round((done/tasks.length)*100):0;
  const isToday = selectedDate === todayStr();

  return (
    <div className="page">
      <AuroraBG colors={["#10b981","#059669","#34d399"]}/>
      <MeshBG variant="planner"/>
      <div className="pi">
        <header className="fi" style={{marginBottom:"1.25rem"}}>
          <div className="fm" style={{fontSize:".7rem",color:"var(--g)",letterSpacing:".1em",marginBottom:".4rem",textTransform:"uppercase"}}>{isToday?"Today · "+todayLong():"Dayflow"}</div>
          <h1 className="fs" style={{fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:800,letterSpacing:"-.04em",lineHeight:1.05}}>Design your<br/><span className="fp" style={{fontStyle:"italic",color:"var(--g)"}}>Productive Day.</span></h1>
        </header>

        {/* Day navigator */}
        <DateNav mode="day" value={selectedDate} onChange={d=>{setSelectedDate(d);setInsight("");}} accentColor="var(--g)"/>

        <div className="g2">
          <div className="gc fi fi1">
            <h3 className="fs" style={{marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:".5rem",fontSize:".95rem"}}><span style={{color:"var(--g)"}}><I.Sparkle/></span>AI Thought Dump</h3>
            <textarea className="inp inp-g" rows={4} placeholder={`Brain dump tasks for ${fmtDisplayDate(selectedDate)}…`} value={dump} onChange={e=>setDump(e.target.value)}/>
            <button className="btn btn-g btn-full" style={{marginTop:".65rem"}} onClick={planAI} disabled={aiLoad||!dump.trim()}>
              {aiLoad?<><span style={{display:"flex",gap:"3px"}}>{[0,1,2].map(i=><span key={i} style={{animation:`dp 1s ease-in-out ${i*.18}s infinite`,fontSize:"1.2rem",lineHeight:.8}}>·</span>)}<style>{`@keyframes dp{0%,100%{opacity:.2}50%{opacity:1}}`}</style></span>Drafting Plan</>:<><I.Sparkle/>Generate Schedule</>}
            </button>
            {tasks.length>0&&<button className="btn btn-ghost btn-full btn-sm" style={{marginTop:".5rem"}} onClick={getDayInsight} disabled={insightLoad}>{insightLoad?<><I.Bot/>Analyzing…</>:<><I.Zap/>Get Day Insight</>}</button>}
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

          <div className="gc fi fi2">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
              <div>
                <h3 className="fs" style={{fontSize:".95rem"}}>Dayflow</h3>
                <div style={{fontSize:".72rem",color:"var(--muted2)",marginTop:"2px"}}>{fmtDisplayDate(selectedDate)}</div>
              </div>
              {tasks.length>0&&<span className="fm" style={{fontSize:".7rem",color:"var(--g)"}}>{done}/{tasks.length} DONE</span>}
            </div>
            {tasks.length>0&&(
              <div style={{marginBottom:"1.1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:".3rem"}}><span style={{fontSize:".7rem",color:"var(--muted2)"}}>Progress</span><span className="fm" style={{fontSize:".7rem",color:"var(--g)",fontWeight:700}}>{pct}%</span></div>
                <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`,background:"var(--g)"}}/></div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
              {loading?<div style={{color:"var(--muted)",fontSize:".85rem"}}>Loading…</div>:
               tasks.length===0?<div style={{textAlign:"center",padding:"2rem 0",color:"var(--muted)"}}><div className="fp" style={{fontSize:"1.05rem",fontStyle:"italic",marginBottom:".4rem"}}>No tasks for this day.</div><div style={{fontSize:".8rem"}}>Use the AI planner or add manually.</div></div>:
               tasks.map((t,idx)=>(
                <div key={t.id} className={`task-row ${t.done?"done":""} si2`} style={{animationDelay:`${idx*.04}s`}}>
                  <div className="chk" style={t.done?{background:"var(--g)",borderColor:"var(--g)"}:{}} onClick={()=>toggle(t.id,t.done)}>{t.done&&<I.Check/>}</div>
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
      <button className="ai-fab ai-fab-g" onClick={()=>setShowAI(v=>!v)} title="MIKO"><I.Bot/></button>
      {showAI&&<AiPanel accentColor="var(--g)" accentDim="rgba(16,185,129,.15)" systemPrompt="You are Lemy's Dayflow AI assistant named MIKO. Help the user plan their day, prioritize tasks, manage time, and stay productive. Be concise, practical, and encouraging." placeholder="Ask me to help plan your day, prioritize tasks, or beat procrastination!" suggestions={["Plan a productive morning","How to prioritize tasks?","I'm feeling overwhelmed","Best time to deep work?"]} onClose={()=>setShowAI(false)}/>}
    </div>
  );
}

// ─── P2P DEBT ─────────────────────────────────────────────────────────────────
function computeDebts(expenses, members) {
  const net={};
  members.forEach(f=>{net[f.id]=0;});
  expenses.forEach(exp=>{
    const {paidBy,amount,perPerson,splitWith=[],settled=[]}=exp;
    if(!paidBy||!splitWith.length)return;
    net[paidBy]=(net[paidBy]||0)+amount;
    splitWith.forEach(fid=>{
      net[fid]=(net[fid]||0)-perPerson;
      if(settled.includes(fid)){net[fid]=(net[fid]||0)+perPerson;net[paidBy]=(net[paidBy]||0)-perPerson;}
    });
  });
  const creditors=[],debtors=[];
  Object.entries(net).forEach(([id,bal])=>{if(bal>0.01)creditors.push({id,amt:bal});else if(bal<-0.01)debtors.push({id,amt:-bal});});
  const debts=[],cArr=creditors.map(x=>({...x})),dArr=debtors.map(x=>({...x}));
  let ci=0,di=0;
  while(ci<cArr.length&&di<dArr.length){const s=Math.min(cArr[ci].amt,dArr[di].amt);if(s>0.01)debts.push({from:dArr[di].id,to:cArr[ci].id,amount:s});cArr[ci].amt-=s;dArr[di].amt-=s;if(cArr[ci].amt<0.01)ci++;if(dArr[di].amt<0.01)di++;}
  return debts;
}

// ─── SPLIT ────────────────────────────────────────────────────────────────────
function Split({ user }) {
  const [friends,setFriends]=useState([]);
  const [allExpenses,setAllExpenses]=useState([]);
  const [selectedDate,setSelectedDate]=useState(todayStr());
  const [newF,setNewF]=useState("");
  const [desc,setDesc]=useState("");const [amt,setAmt]=useState("");
  const [paidBy,setPaidBy]=useState("");const [splitWith,setSplitWith]=useState([]);
  const [modal,setModal]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showAI,setShowAI]=useState(false);
  const [insight,setInsight]=useState("");const [insightLoad,setInsightLoad]=useState(false);
  const [mode,setMode]=useState("normal");
  const [trips,setTrips]=useState([]);const [activeTrip,setActiveTrip]=useState(null);const [newTrip,setNewTrip]=useState("");
  const [tripMemberInput,setTripMemberInput]=useState("");

  useEffect(()=>{
    async function loadFriends(){try{const fq=query(collection(db,"friends"),where("uid","==",user.uid));const fs=await getDocs(fq);setFriends(fs.docs.map(d=>({id:d.id,...d.data()})));}catch{setFriends([]);}}
    loadFriends();
  },[user.uid]);

  useEffect(()=>{
    async function loadExpenses(){
      setLoading(true);
      try{
        if(mode==="trip"){
          if(activeTrip){
            const tq=query(collection(db,"trips",activeTrip.id,"expenses"));
            const ts=await getDocs(tq);
            const docs=ts.docs.map(d=>({id:d.id,...d.data()}));
            docs.sort((a,b)=>{const ta=a.createdAt?.toDate?a.createdAt.toDate():new Date(a.createdAt||0);const tb=b.createdAt?.toDate?b.createdAt.toDate():new Date(b.createdAt||0);return tb-ta;});
            setAllExpenses(docs);
          }else{setAllExpenses([]);}
        }else{
          const eq=query(collection(db,"splitExpenses"),where("uid","==",user.uid),orderBy("createdAt","desc"));
          const es=await getDocs(eq);setAllExpenses(es.docs.map(d=>({id:d.id,...d.data()})));
        }
      }catch(e){console.error(e);setAllExpenses([]);}
      setLoading(false);
    }
    loadExpenses();
  },[user.uid,mode,activeTrip]);

  useEffect(()=>{
    async function loadTrips(){try{const q=query(collection(db,"trips"),where("uid","==",user.uid),orderBy("createdAt","desc"));const s=await getDocs(q);setTrips(s.docs.map(d=>({id:d.id,...d.data()})));}catch(e){console.error(e);}}
    loadTrips();
  },[user.uid]);

  const getName = id => friends.find(f=>f.id===id)?.name||"Unknown";
  const activeMemberIds = mode==="trip"&&activeTrip?(activeTrip.members||[]):friends.map(f=>f.id);
  const allMembers = friends.filter(f=>activeMemberIds.includes(f.id));

  // Filter expenses by selected date (normal mode only)
  const expenses = mode==="trip" ? allExpenses : allExpenses.filter(e=>(e.dateStr||toDateStr(e.createdAt))===selectedDate);
  const p2pDebts = computeDebts(expenses, allMembers);

  async function addFriend(){if(!newF.trim())return;const f={uid:user.uid,name:newF.trim(),createdAt:serverTimestamp()};try{const r=await addDoc(collection(db,"friends"),f);setFriends(p=>[...p,{id:r.id,...f}]);}catch{setFriends(p=>[...p,{id:Date.now().toString(),...f}]);}setNewF("");}
  async function deleteFriend(id){if(!window.confirm("Remove?"))return;try{await deleteDoc(doc(db,"friends",id));}catch{}setFriends(p=>p.filter(f=>f.id!==id));}

  async function addExp(){
    const payerId=paidBy||(allMembers[0]?.id);
    if(!desc.trim()||!amt||splitWith.length===0||!payerId)return;
    const a=parseFloat(amt);const uniqueSplitters=[...new Set(splitWith)];const pp=a/uniqueSplitters.length;
    const e={uid:user.uid,desc:desc.trim(),amount:a,perPerson:pp,paidBy:payerId,splitWith:uniqueSplitters,settled:[],dateStr:selectedDate,createdAt:serverTimestamp()};
    try{
      if(mode==="trip"&&activeTrip){const r=await addDoc(collection(db,"trips",activeTrip.id,"expenses"),e);setAllExpenses(p=>[{id:r.id,...e,createdAt:new Date()},...p]);}
      else{const r=await addDoc(collection(db,"splitExpenses"),e);setAllExpenses(p=>[{id:r.id,...e,createdAt:new Date()},...p]);}
    }catch(err){console.error(err);}
    setDesc("");setAmt("");setSplitWith([]);setPaidBy("");
  }

  async function settle(expId,fid){
    setAllExpenses(p=>p.map(e=>e.id===expId?{...e,settled:[...(e.settled||[]),fid]}:e));
    try{if(mode==="trip"&&activeTrip)await updateDoc(doc(db,"trips",activeTrip.id,"expenses",expId),{settled:arrayUnion(fid)});else await updateDoc(doc(db,"splitExpenses",expId),{settled:arrayUnion(fid)});}catch{}
    setModal(null);
  }

  async function delExpense(expId){
    if(!window.confirm("Delete this expense?"))return;
    setAllExpenses(p=>p.filter(e=>e.id!==expId));
    try{if(mode==="trip"&&activeTrip)await deleteDoc(doc(db,"trips",activeTrip.id,"expenses",expId));else await deleteDoc(doc(db,"splitExpenses",expId));}catch(e){console.error(e);}
  }

  async function createTrip(){if(!newTrip.trim())return;const trip={uid:user.uid,name:newTrip.trim(),members:[],createdAt:serverTimestamp()};try{const r=await addDoc(collection(db,"trips"),trip);setTrips(p=>[{id:r.id,...trip,members:[]},...p]);setNewTrip("");}catch(e){console.error(e);}}
  async function deleteTrip(tripId){if(!window.confirm("Delete this trip?"))return;try{const snap=await getDocs(collection(db,"trips",tripId,"expenses"));for(const d of snap.docs)await deleteDoc(doc(db,"trips",tripId,"expenses",d.id));await deleteDoc(doc(db,"trips",tripId));}catch(e){console.error(e);}setTrips(p=>p.filter(t=>t.id!==tripId));if(activeTrip?.id===tripId){setActiveTrip(null);setAllExpenses([]);}}

  async function addMemberToTrip(){
    const name=tripMemberInput.trim();if(!name||!activeTrip)return;
    let friend=friends.find(f=>f.name.toLowerCase()===name.toLowerCase());
    if(!friend){const fData={uid:user.uid,name,createdAt:serverTimestamp()};try{const r=await addDoc(collection(db,"friends"),fData);friend={id:r.id,...fData};setFriends(p=>[...p,friend]);}catch{friend={id:Date.now().toString(),...fData};setFriends(p=>[...p,friend]);}}
    if(activeTrip.members?.includes(friend.id)){setTripMemberInput("");return;}
    const updated={...activeTrip,members:[...(activeTrip.members||[]),friend.id]};
    try{await updateDoc(doc(db,"trips",activeTrip.id),{members:arrayUnion(friend.id)});}catch{}
    setActiveTrip(updated);setTrips(p=>p.map(t=>t.id===activeTrip.id?updated:t));setTripMemberInput("");
  }

  async function removeMemberFromTrip(friendId){if(!activeTrip)return;const updated={...activeTrip,members:(activeTrip.members||[]).filter(id=>id!==friendId)};try{await updateDoc(doc(db,"trips",activeTrip.id),{members:arrayRemove(friendId)});}catch{}setActiveTrip(updated);setTrips(p=>p.map(t=>t.id===activeTrip.id?updated:t));}

  async function getSplitInsight(){if(expenses.length===0)return;setInsightLoad(true);try{const debtStr=p2pDebts.map(d=>`${getName(d.from)} → ${getName(d.to)}: ₹${d.amount.toFixed(0)}`).join(", ")||"All settled";const recent=expenses.slice(0,5).map(e=>`${e.desc}: ₹${e.amount}`).join(", ");const txt=await askAI(`Group expense advisor. Settlements: ${debtStr}. Recent: ${recent}.\n\nGive 2-3 sentence summary: who should pay whom, fairness check, and a tip.`);setInsight(txt);}catch{setInsight("Couldn't load insight.");}setInsightLoad(false);}

  return (
    <div className="page">
      <AuroraBG colors={["#3b82f6","#06b6d4","#818cf8"]}/>
      <MeshBG variant="split"/>
      <div className="pi">
        <header className="fi" style={{marginBottom:"1.25rem"}}>
          <div className="fm" style={{fontSize:".7rem",color:"var(--b)",letterSpacing:".1em",marginBottom:".4rem",textTransform:"uppercase"}}>Split & Settle</div>
          <h1 className="fs" style={{fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:800,letterSpacing:"-.04em",lineHeight:1.05}}>Splitty <span className="fp" style={{fontStyle:"italic",color:"var(--b)"}}>Ledger.</span></h1>
        </header>

        {/* Mode Toggle */}
        <div className="gc fi" style={{marginBottom:"1.5rem"}}>
          <div className="type-tog" style={{marginBottom:mode==="trip"?"1rem":"0"}}>
            <button className={`type-btn ${mode==="normal"?"si":""}`} onClick={()=>{setMode("normal");setActiveTrip(null);setAllExpenses([]);}}>Normal Mode</button>
            <button className={`type-btn ${mode==="trip"?"si":""}`} onClick={()=>setMode("trip")}><I.Trip/> Trip / Event</button>
          </div>
          {mode==="trip"&&(
            <div>
              <div className="section-label">Create New Trip</div>
              <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
                <input className="inp inp-b" placeholder="Trip name (e.g. Goa 2025)" value={newTrip} onChange={e=>setNewTrip(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createTrip()}/>
                <button className="btn btn-b btn-sm" onClick={createTrip} disabled={!newTrip.trim()}>Create</button>
              </div>
              {trips.length>0&&<>
                <div className="section-label">Your Trips</div>
                {trips.map(t=>(
                  <div key={t.id} className={`trip-card ${activeTrip?.id===t.id?"active":""}`} onClick={()=>{setActiveTrip(t);setAllExpenses([]);setLoading(true);}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                        <span style={{color:"var(--b)"}}><I.Trip/></span>
                        <span style={{fontWeight:600,fontSize:".88rem"}}>{t.name}</span>
                        <span style={{fontSize:".7rem",color:"var(--muted2)",fontFamily:"'JetBrains Mono',monospace"}}>{(t.members||[]).length} members</span>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();deleteTrip(t.id);}}>Delete</button>
                    </div>
                  </div>
                ))}
              </>}
              {activeTrip&&(
                <div style={{marginTop:"1rem",padding:"1rem",background:"rgba(59,130,246,.05)",border:"1px solid rgba(59,130,246,.15)",borderRadius:"13px"}}>
                  <div className="section-label" style={{color:"var(--b)"}}>Members — {activeTrip.name}</div>
                  <div style={{marginBottom:".75rem",flexWrap:"wrap",display:"flex"}}>
                    {(activeTrip.members||[]).length===0?<span style={{fontSize:".8rem",color:"var(--muted)"}}>No members yet.</span>
                    :(activeTrip.members||[]).map(id=><span key={id} className="member-chip">{getName(id)}<button onClick={()=>removeMemberFromTrip(id)}><I.X/></button></span>)}
                  </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="inp inp-b" style={{flex:1,padding:".55rem .85rem",fontSize:".82rem"}} placeholder="Add by name" value={tripMemberInput} onChange={e=>setTripMemberInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addMemberToTrip()}/>
                    <button className="btn btn-b btn-sm" onClick={addMemberToTrip} disabled={!tripMemberInput.trim()}><I.UserPlus/></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date nav — only in normal mode */}
        {mode==="normal"&&<DateNav mode="day" value={selectedDate} onChange={setSelectedDate} accentColor="var(--b)"/>}

        <div className="gs">
          {/* LEFT */}
          <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
            <div className="gc fi fi1">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".88rem",display:"flex",alignItems:"center",gap:".45rem"}}><span style={{color:"var(--b)"}}><I.Shake/></span> Who Owes Whom</h3>
              {p2pDebts.length===0?<div style={{fontSize:".82rem",color:"var(--muted)",padding:".5rem 0"}}>All settled up! 🎉</div>
              :p2pDebts.map((d,i)=><div key={i} className="debt-card"><div className="debt-from">{getName(d.from)}</div><span style={{color:"var(--muted2)",display:"flex",alignItems:"center",margin:"0 .25rem"}}><I.Arrow/></span><div className="debt-to">{getName(d.to)}</div><div className="debt-amt">₹{d.amount.toFixed(0)}</div></div>)}
              {expenses.length>0&&<><button className="btn btn-ghost btn-full btn-sm" style={{marginTop:".85rem"}} onClick={getSplitInsight} disabled={insightLoad}>{insightLoad?<><I.Bot/>Analyzing…</>:<><I.Zap/>AI Balance Insight</>}</button>{insight&&<div className="ai-insight" style={{borderColor:"var(--b)"}}>{insight}</div>}</>}
            </div>
            <div className="gc fi fi2">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".95rem"}}>Log Expense</h3>
              {mode==="normal"&&<div style={{fontSize:".72rem",color:"var(--b)",fontFamily:"'JetBrains Mono',monospace",marginBottom:".75rem"}}>📅 {fmtDisplayDate(selectedDate)}</div>}
              {mode==="trip"&&!activeTrip&&<div style={{fontSize:".82rem",color:"var(--muted)",marginBottom:".5rem"}}>Select a trip first.</div>}
              <input className="inp inp-b" style={{marginBottom:".55rem"}} placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} disabled={mode==="trip"&&!activeTrip}/>
              <input className="inp inp-b" style={{marginBottom:".55rem"}} type="number" placeholder="Amount (₹)" value={amt} onChange={e=>setAmt(e.target.value)} disabled={mode==="trip"&&!activeTrip}/>
              <select className="inp inp-b" style={{marginBottom:".65rem"}} value={paidBy||(allMembers[0]?.id||"")} onChange={e=>setPaidBy(e.target.value)} disabled={mode==="trip"&&!activeTrip}>
                {allMembers.length===0&&<option value="" disabled>No members</option>}
                {allMembers.map(f=><option key={f.id} value={f.id}>Paid by {f.name}</option>)}
              </select>
              <div className="gc-inner" style={{marginBottom:".65rem"}}>
                <div style={{fontSize:".68rem",color:"var(--muted)",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",marginBottom:".55rem"}}>Split with</div>
                <div style={{display:"flex",flexDirection:"column",gap:".45rem"}}>
                  {allMembers.length===0&&<span style={{fontSize:".85rem",color:"var(--muted)"}}>Add members first</span>}
                  {allMembers.map(f=>(
                    <label key={f.id} style={{display:"flex",alignItems:"center",gap:".55rem",cursor:"pointer",fontSize:".85rem",color:"var(--muted2)"}}>
                      <div className="chk" style={splitWith.includes(f.id)?{background:"var(--b)",borderColor:"var(--b)"}:{}} onClick={()=>setSplitWith(p=>p.includes(f.id)?p.filter(x=>x!==f.id):[...p,f.id])}>{splitWith.includes(f.id)&&<I.Check/>}</div>
                      {f.name}
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn btn-b btn-full" onClick={addExp} disabled={allMembers.length===0||(mode==="trip"&&!activeTrip)}>Split Expense</button>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
            <div className="gc fi fi1">
              <h3 className="fs" style={{marginBottom:".5rem",fontSize:".95rem"}}>
                Activity {mode==="trip"&&activeTrip&&<span style={{fontSize:".75rem",color:"var(--b)",fontWeight:400,marginLeft:".4rem"}}>· {activeTrip.name}</span>}
              </h3>
              {mode==="normal"&&<div style={{fontSize:".72rem",color:"var(--b)",fontFamily:"'JetBrains Mono',monospace",marginBottom:"1rem"}}>📅 {fmtDisplayDate(selectedDate)}</div>}
              {loading?<div style={{color:"var(--muted)"}}>Loading…</div>:
               expenses.length===0?<div style={{textAlign:"center",padding:"2.5rem 0",color:"var(--muted)"}}><div className="fp" style={{fontStyle:"italic",fontSize:"1.05rem",marginBottom:".35rem"}}>No expenses yet.</div><div style={{fontSize:".8rem"}}>{mode==="trip"&&!activeTrip?"Select a trip.":"Add your first shared expense."}</div></div>
               :expenses.map(e=>{
                 const pName=getName(e.paidBy);
                 const splitNames=(e.splitWith||[]).map(id=>getName(id)).join(", ");
                 return (
                   <div key={e.id} className="sp-row">
                     <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:".3rem"}}>
                       <div style={{display:"flex",alignItems:"center",gap:".45rem",flex:1,minWidth:0}}>
                         <span style={{color:"var(--b)",flexShrink:0}}><I.Shake/></span>
                         <span style={{fontWeight:600,fontSize:".88rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.desc}</span>
                       </div>
                       <div style={{display:"flex",alignItems:"center",gap:".5rem",flexShrink:0,paddingLeft:".5rem"}}>
                         <span className="fm" style={{fontWeight:700,fontSize:".88rem"}}>₹{e.amount?.toFixed(0)}</span>
                         <button onClick={()=>delExpense(e.id)} title="Delete" style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",padding:"3px",display:"flex",alignItems:"center",transition:"color .2s"}} onMouseEnter={ev=>ev.currentTarget.style.color="var(--r)"} onMouseLeave={ev=>ev.currentTarget.style.color="var(--muted)"}><I.Trash/></button>
                       </div>
                     </div>
                     <div style={{fontSize:".72rem",color:"var(--muted2)",marginBottom:".4rem"}}>{pName} paid · ₹{e.perPerson?.toFixed(0)}/person · {fmtDate(e.createdAt)}</div>
                     {splitNames&&<div style={{fontSize:".7rem",color:"var(--muted)",marginBottom:".5rem"}}>Split with: {splitNames}</div>}
                     <div style={{display:"flex",gap:".35rem",flexWrap:"wrap"}}>
                       {(e.splitWith||[]).map(fid=>{
                         if(fid===e.paidBy)return null;
                         const fn=getName(fid);const settled=(e.settled||[]).includes(fid);
                         return settled?<span key={fid} className="settled-tag">{fn} ✓</span>:<button key={fid} className="settle-tag" onClick={()=>setModal({expId:e.id,friendId:fid,fname:fn,amount:e.perPerson,payerName:pName})}>Settle {fn}</button>;
                       })}
                     </div>
                   </div>
                 );
               })}
            </div>
            <div className="gc fi fi2">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".95rem"}}>Network</h3>
              <div style={{display:"flex",gap:".5rem",marginBottom:".85rem"}}>
                <input className="inp inp-b" style={{flex:1}} placeholder="Add a friend…" value={newF} onChange={e=>setNewF(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFriend()}/>
                <button className="btn btn-ghost btn-icon" onClick={addFriend}><I.UserPlus/></button>
              </div>
              {friends.length===0?<div style={{color:"var(--muted)",fontSize:".83rem",textAlign:"center",padding:".75rem 0"}}>No connections yet.</div>
              :friends.map(f=>{
                const debt=p2pDebts.find(d=>d.from===f.id||d.to===f.id);
                return (
                  <div key={f.id} className="f-row">
                    <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                      <div className="f-av">{inits(f.name)}</div>
                      <span style={{fontWeight:500,fontSize:".87rem"}}>{f.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                      {debt&&debt.to===f.id?<span className="fm badge bg">gets back ₹{debt.amount.toFixed(0)}</span>:debt&&debt.from===f.id?<span className="fm badge br">owes ₹{debt.amount.toFixed(0)}</span>:<span className="badge bm">settled</span>}
                      {mode==="normal"&&<button onClick={()=>deleteFriend(f.id)} style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--r)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}><I.Trash/></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <button className="ai-fab ai-fab-b" onClick={()=>setShowAI(v=>!v)} title="MIKO"><I.Bot/></button>
      {showAI&&<AiPanel accentColor="var(--b)" accentDim="rgba(59,130,246,.15)" systemPrompt="You are Lemy's Splitty AI assistant named MIKO. Help the user manage shared expenses, figure out who owes what, suggest fair splitting strategies, and navigate awkward money conversations. Be practical and friendly." placeholder="Ask me about splitting bills, settling up, or handling money with friends!" suggestions={["How to split a restaurant bill fairly?","Who should settle first?","Tips for tracking shared expenses","How to ask a friend to pay back?"]} onClose={()=>setShowAI(false)}/>}
      {modal&&<div className="modal-bg" onClick={()=>setModal(null)}><div className="gc si2" style={{width:"100%",maxWidth:"380px",background:"#0a0a0a"}} onClick={e=>e.stopPropagation()}><h3 className="fs" style={{marginBottom:".65rem"}}>Settle with {modal.fname}?</h3><p style={{color:"var(--muted2)",fontSize:".86rem",lineHeight:1.6,marginBottom:"1.5rem"}}>Mark <strong className="fm" style={{color:"var(--text)"}}>₹{modal.amount?.toFixed(0)}</strong> as settled. {modal.fname} has paid back {modal.payerName}.</p><div style={{display:"flex",gap:".65rem",justifyContent:"flex-end"}}><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-b" onClick={()=>settle(modal.expId,modal.friendId)}>Mark Settled</button></div></div></div>}
    </div>
  );
}

// ─── VAULT ────────────────────────────────────────────────────────────────────
function Expense({ user }) {
  const [allEntries,setAllEntries]=useState([]);
  const [viewMode,setViewMode]=useState("day"); // "day" | "month"
  const [selectedDate,setSelectedDate]=useState(todayStr());
  const [selectedMonth,setSelectedMonth]=useState(todayStr().slice(0,7));
  const [desc,setDesc]=useState("");const [amt,setAmt]=useState("");const [cat,setCat]=useState("food");const [type,setType]=useState("expense");
  const [loading,setLoading]=useState(true);
  const [showAI,setShowAI]=useState(false);const [insight,setInsight]=useState("");const [insightLoad,setInsightLoad]=useState(false);

  useEffect(()=>{
    async function load(){try{const q=query(collection(db,"expenses"),where("uid","==",user.uid),orderBy("createdAt","desc"));const s=await getDocs(q);setAllEntries(s.docs.map(d=>({id:d.id,...d.data()})));}catch{setAllEntries([]);}setLoading(false);}
    load();
  },[user.uid]);

  // Filter by day or month
  const entries = allEntries.filter(e=>{
    const ds = e.dateStr || toDateStr(e.createdAt);
    return viewMode==="day" ? ds===selectedDate : ds.slice(0,7)===selectedMonth;
  });

  async function add(){
    if(!desc.trim()||!amt)return;
    const e={uid:user.uid,desc:desc.trim(),amount:parseFloat(amt),cat,type,dateStr:selectedDate,createdAt:serverTimestamp()};
    try{const r=await addDoc(collection(db,"expenses"),e);setAllEntries(p=>[{id:r.id,...e,createdAt:new Date()},...p]);}
    catch{setAllEntries(p=>[{id:Date.now().toString(),...e,createdAt:new Date()},...p]);}
    setDesc("");setAmt("");
  }
  async function del(id){setAllEntries(p=>p.filter(e=>e.id!==id));try{await deleteDoc(doc(db,"expenses",id))}catch{}}

  async function getFinanceInsight(){
    if(entries.length===0)return;setInsightLoad(true);
    try{
      const inc=entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
      const spd=entries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
      const catT={};entries.filter(e=>e.type==="expense").forEach(e=>{catT[e.cat]=(catT[e.cat]||0)+e.amount;});
      const topCats=Object.entries(catT).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,v])=>`${c}: ₹${v.toFixed(0)}`).join(", ");
      const period=viewMode==="day"?fmtDisplayDate(selectedDate):fmtMonthYear(selectedMonth+"-01");
      const txt=await askAI(`Personal finance AI for ${period}.\nIncome: ₹${inc.toFixed(0)}\nSpent: ₹${spd.toFixed(0)}\nSavings Rate: ${inc>0?Math.round(((inc-spd)/inc)*100):0}%\nTop spending: ${topCats}\n\nGive 3-4 sentences of smart analysis and one actionable tip.`);
      setInsight(txt);
    }catch{setInsight("Couldn't load insight.");}setInsightLoad(false);
  }

  const inc=entries.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
  const spd=entries.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
  const bal=inc-spd;
  const catT={};entries.filter(e=>e.type==="expense").forEach(e=>{catT[e.cat]=(catT[e.cat]||0)+e.amount;});
  const topC=Object.entries(catT).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxC=Math.max(...topC.map(c=>c[1]),1);
  const cats=["food","transport","entertainment","shopping","health","utilities","rent","salary","other"];

  return (
    <div className="page">
      <MeshBG variant="expense"/>
      <AuroraBG colors={["#f97316","#ea580c","#fbbf24"]}/>
      <div className="pi">
        <header className="fi" style={{marginBottom:"1.25rem"}}>
          <div className="fm" style={{fontSize:".7rem",color:"var(--o)",letterSpacing:".1em",marginBottom:".4rem",textTransform:"uppercase"}}>Cash Flow</div>
          <h1 className="fs" style={{fontSize:"clamp(1.8rem,5vw,3rem)",fontWeight:800,letterSpacing:"-.04em",lineHeight:1.05}}>Wealth <span className="fp" style={{fontStyle:"italic",color:"var(--o)"}}>Metrics.</span></h1>
        </header>

        {/* View mode + date navigator */}
        <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
          <div className="view-tog">
            <button className={`view-btn ${viewMode==="day"?"active":""}`} onClick={()=>setViewMode("day")}>Day</button>
            <button className={`view-btn ${viewMode==="month"?"active":""}`} onClick={()=>setViewMode("month")}>Month</button>
          </div>
          {viewMode==="day"
            ?<DateNav mode="day" value={selectedDate} onChange={d=>{setSelectedDate(d);setInsight("");}} accentColor="var(--o)"/>
            :<DateNav mode="month" value={selectedMonth} onChange={m=>{setSelectedMonth(m);setInsight("");}} accentColor="var(--o)"/>}
        </div>

        {/* Stats */}
        <div className="g3 fi fi1" style={{marginBottom:"1.5rem"}}>
          <div className="stat sb"><div className="fm" style={{fontSize:".65rem",color:"var(--muted2)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".35rem"}}><I.Wallet/>Balance</div><div className="fs" style={{fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:800,letterSpacing:"-.03em"}}>{bal>=0?"+":"-"}₹{Math.abs(bal).toLocaleString()}</div></div>
          <div className="stat si"><div className="fm" style={{fontSize:".65rem",color:"var(--o)",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".35rem"}}><I.Up/>Income</div><div className="fs" style={{fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:800,color:"var(--o)",letterSpacing:"-.03em"}}>₹{inc.toLocaleString()}</div></div>
          <div className="stat ss"><div className="fm" style={{fontSize:".65rem",color:"#f59e0b",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em",display:"flex",alignItems:"center",gap:".35rem"}}><I.Down/>Spent</div><div className="fs" style={{fontSize:"clamp(1.4rem,3vw,1.85rem)",fontWeight:800,color:"#f59e0b",letterSpacing:"-.03em"}}>₹{spd.toLocaleString()}</div></div>
        </div>

        <div className="ge">
          <div className="gc fi fi2">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.1rem"}}>
              <h3 className="fs" style={{fontSize:".95rem"}}>Ledger</h3>
              <span style={{fontSize:".72rem",color:"var(--o)",fontFamily:"'JetBrains Mono',monospace"}}>{viewMode==="day"?fmtDisplayDate(selectedDate):fmtMonthYear(selectedMonth+"-01")}</span>
            </div>
            {loading?<div style={{color:"var(--muted)",fontSize:".85rem"}}>Loading…</div>:
             entries.length===0?<div style={{textAlign:"center",padding:"2.5rem 0",color:"var(--muted)"}}><div className="fp" style={{fontStyle:"italic",fontSize:"1.05rem",marginBottom:".35rem"}}>No transactions.</div><div style={{fontSize:".8rem"}}>Record your first entry for this {viewMode}.</div></div>:
             entries.slice(0,50).map((e,idx)=>(
              <div key={e.id} className="tx-row si2" style={{animationDelay:`${idx*.03}s`}}>
                <div className="tx-dot" style={{background:CC[e.cat]||"#6b7280"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:".87rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.desc}</div>
                  <div style={{display:"flex",gap:".4rem",marginTop:"3px"}}>
                    <span className="fm" style={{fontSize:".65rem",color:"var(--muted)",textTransform:"capitalize"}}>{e.cat}</span>
                    <span style={{fontSize:".65rem",color:"var(--muted)"}}>· {fmtDate(e.createdAt)}</span>
                  </div>
                </div>
                <span className="fm" style={{fontWeight:700,color:e.type==="income"?"var(--o)":"var(--text)",fontSize:".86rem",whiteSpace:"nowrap"}}>{e.type==="income"?"+":"-"}₹{e.amount.toLocaleString()}</span>
                <button style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",padding:"3px",marginLeft:".2rem",transition:"color .2s",display:"flex",alignItems:"center",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color="var(--o)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"} onClick={()=>del(e.id)}><I.Trash/></button>
              </div>
             ))}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
            <div className="gc fi fi1">
              <h3 className="fs" style={{marginBottom:".85rem",fontSize:".95rem"}}>New Entry</h3>
              <div style={{fontSize:".72rem",color:"var(--o)",fontFamily:"'JetBrains Mono',monospace",marginBottom:".75rem"}}>📅 {fmtDisplayDate(selectedDate)}</div>
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
            {topC.length>0&&(
              <div className="gc fi fi2">
                <h3 className="fs" style={{marginBottom:".85rem",fontSize:".78rem",color:"var(--muted2)",textTransform:"uppercase",letterSpacing:".06em"}}>Spending Breakdown</h3>
                <div style={{display:"flex",alignItems:"flex-end",height:"70px",gap:"4px",marginBottom:"5px"}}>{topC.map(([c,v])=><div key={c} className="bar-col"><div className="bar-rect" style={{height:`${(v/maxC)*62}px`,background:CC[c],opacity:.85}}/></div>)}</div>
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
      {showAI&&<AiPanel accentColor="var(--o)" accentDim="rgba(249,115,22,.15)" systemPrompt="You are Lemy's Vault AI assistant named MIKO. Help the user understand their spending, suggest budgets, identify saving opportunities, and give actionable money management advice. Be specific and data-driven." placeholder="Ask me about your spending, budgeting tips, or how to save more!" suggestions={["How am I spending too much?","Help me build a budget","Tips to save more money","What's a healthy savings rate?"]} onClose={()=>setShowAI(false)}/>}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);const [tab,setTab]=useState("planner");const [loading,setLoading]=useState(true);
  useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setLoading(false);}),[]);
  if(loading)return(<><Styles/><div style={{background:"#000",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",gap:".75rem"}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.1rem",color:"#000"}} className="pulse">L</div><div className="fs pulse" style={{color:"#fff",fontSize:"1.4rem",fontWeight:800,letterSpacing:"-.03em"}}>le<span style={{color:"var(--g)"}}>my</span></div><style>{`@keyframes pls{0%,100%{opacity:.25}50%{opacity:1}}.pulse{animation:pls 1.5s ease-in-out infinite}`}</style></div></>);
  if(!user)return <><Styles/><Auth onAuth={setUser}/></>;
  return (
    <>
      <Styles/>
      <nav className="nav">
        <a className="nav-logo" href="#">
          <div className="nav-logo-mark">L</div>
          <span className="nav-logo-text">le<em>my</em></span>
        </a>
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