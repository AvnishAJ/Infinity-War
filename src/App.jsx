import { useState, useCallback, useEffect, useRef, memo } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

/* ═══════════════════════════════════════════════
   FIREBASE
═══════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyAZ5ZnLcxfUz3CQsrP8Dbxg877IaziQMME",
  authDomain: "infinity-war-7edea.firebaseapp.com",
  databaseURL: "https://infinity-war-7edea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "infinity-war-7edea",
  storageBucket: "infinity-war-7edea.firebasestorage.app",
  messagingSenderId: "626564045317",
  appId: "1:626564045317:web:53fde18cfd07402258da6c"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const TC = {
  space:   { name:"The Empire",         color:"#00d4ff", rgb:"0,212,255",  em:"💠" },
  reality: { name:"Homelanders",        color:"#ff3333", rgb:"255,51,51",  em:"🔴" },

  mind:    { name:"Bowser",             color:"#fde047", rgb:"253,224,71", em:"💛" },
  time:    { name:"Viltrumites",        color:"#00ff88", rgb:"0,255,136",  em:"⏳" },
  soul:    { name:"Captain Underpants", color:"#ff8c00", rgb:"255,140,0",  em:"🔶" },
};
const IDS = Object.keys(TC);

const QV = [50, 80, 150, 200, 500, 700];
const hintCost = (qi) => Math.floor(QV[qi] / 5);
const skipCost = (qi) => Math.floor(QV[qi] / 5);
const ATTEMPT_COST = 5;
const ATTACK_HP_COST   = 100;
const ATTACK_HP_DAMAGE = 150;
const ADMIN_PIN = "1408";

const SHOP_ITEMS = [
  { id:"missiles", name:"5 Missiles", desc:"Purchase 5 extra missiles.", price:75, icon:"🚀" },
];

const mkTeam = () => ({
  gold:0, hp:500, zOpt:"",
  strategy:null,
  safes:[0,0,0,0,0], safeHp:[0,0,0,0,0], safeStatus:["ok","ok","ok","ok","ok"],
  safesLocked:false,
  questions: Array(6).fill(false), qHints: Array(6).fill(false),
  qSkips: Array(6).fill(false), qAttempts: Array(6).fill(0),
  diplomacyLog:[], hints:0,
  allianceWith:null, allianceProposalTo:null, allianceProposalFrom:null,
});

const mkAlliance = (idA, idB, gold, hp) => ({
  members:[idA,idB], gold, hp,
  safes:[0,0,0,0,0], safeHp:[0,0,0,0,0], safeStatus:["ok","ok","ok","ok","ok"],
  sealed:false, used:false, formedAt:Date.now(),
});

function getTeamHp(team, round) {
  if (!team) return 0;
  if (round === 4) {
    const safeHp = team.safeHp || [0, 0, 0, 0, 0];
    return team.safesLocked ? safeHp.reduce((a, b) => a + (Number(b)||0), 0) : (team.hp || 0);
  }
  const base = team.hp || 0;
  const extra = team.strategy === "PASSIVE" ? 500 : 0;
  return base + extra;
}

const DEFAULT_STATE = {
  round: 1, locked: false,
  teams: { space:mkTeam(), reality:mkTeam(), mind:mkTeam(), time:mkTeam(), soul:mkTeam() },
  attacks: {}, logs: {}, alliances: {}, wars: {},
};

function allianceLabel(a){
  if(!a) return "Unknown Alliance";
  return `${TC[a.members[0]].name} + ${TC[a.members[1]].name}`;
}
function getSide(type,id,teams,alliances,round){
  if(type==="alliance"){
    const a=alliances[id]; if(!a) return null;
    return { type:"alliance", id, gold:a.gold, hp:a.hp,
      safes:a.safes||[0,0,0,0,0], safeHp:a.safeHp||[0,0,0,0,0], safeStatus:a.safeStatus||["ok","ok","ok","ok","ok"],
      name:allianceLabel(a), color:"#fde047", em:"🤝" };
  }
  const t=teams[id]; if(!t) return null;
  return { type:"team", id, gold:t.gold, hp:getTeamHp(t,round),
    safes:t.safes||[0,0,0,0,0], safeHp:t.safeHp||[0,0,0,0,0], safeStatus:t.safeStatus||["ok","ok","ok","ok","ok"],
    name:TC[id].name, color:TC[id].color, em:TC[id].em };
}

/* ═══════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0b1e;color:#e0e0ff;font-family:'Rajdhani',sans-serif;min-height:100vh}
.ob{font-family:'Orbitron',sans-serif}
input,select{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);border-radius:6px;padding:8px 12px;color:#e0e0ff;font-family:'Rajdhani',sans-serif;font-size:14px;outline:none;width:100%;transition:border-color .2s}
input:focus,select:focus{border-color:rgba(255,255,255,.38)}
select{background:rgba(9,9,26,.9);cursor:pointer}
select option{background:#0d0d26;color:#e0e0ff}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:rgba(255,255,255,.02)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}
@keyframes tw{0%{opacity:.3}100%{opacity:.9}}
@keyframes fi{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@keyframes pg{0%,100%{text-shadow:0 0 10px #fde047,0 0 20px #fde04766}50%{text-shadow:0 0 24px #fde047,0 0 50px #fde047,0 0 80px #fde04799}}
@keyframes eg{0%,100%{color:#ff5555;text-shadow:0 0 8px #ff3333}50%{color:#ff9999;text-shadow:0 0 30px #ff3333}}
@keyframes bh{0%,100%{transform:scale(1)}50%{transform:scale(1.38)}}
@keyframes sf{0%{opacity:1;filter:blur(0)brightness(1)}40%{opacity:.55;filter:blur(5px)brightness(1.5)}100%{opacity:0;filter:blur(16px)brightness(2.2)}}
@keyframes sl{0%{top:0}100%{top:100vh}}
@keyframes ti{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes ck{from{transform:scale(.55)rotate(-10deg);opacity:0}to{transform:scale(1)rotate(0);opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(253,224,71,.3)}50%{box-shadow:0 0 20px rgba(253,224,71,.6)}}
.pg{animation:pg 2.5s ease-in-out infinite;color:#fde047}
.eg{animation:eg 1.8s ease-in-out infinite}
.fi{animation:fi .4s ease}
.lv{animation:bh .65s ease-in-out infinite}
.sn{animation:sf 2.8s ease-out forwards}
.allianceGlow{animation:glow 2s ease-in-out infinite}
.gl{background:rgba(255,255,255,.035);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.08);border-radius:12px}
.btn{font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:9px 18px;border:none;border-radius:6px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn:hover:not(:disabled){filter:brightness(1.25);transform:translateY(-1px)}
.btn:active:not(:disabled){transform:translateY(0)}
.btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important;filter:none!important}
.qbtn{font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;padding:3px 5px;border:1px solid;border-radius:4px;cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:2px}
.qbtn:hover:not(:disabled){filter:brightness(1.3)}
.qbtn:disabled{opacity:.3;cursor:not-allowed}
`;

/* ═══════════════════════════════════════════════
   STARS
═══════════════════════════════════════════════ */
const Stars = memo(() => {
  const s = Array.from({length:58},(_,i)=>({
    l:`${(i*37+13)%97}%`,t:`${(i*53+7)%97}%`,
    sz:i%8===0?2:1,op:.25+(i%5)*.12,dur:2+(i%3),del:(i%6)*.38,
  }));
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
      background:`radial-gradient(ellipse at 15% 50%,rgba(0,212,255,.05) 0%,transparent 55%),
        radial-gradient(ellipse at 85% 20%,rgba(155,48,255,.06) 0%,transparent 55%),
        radial-gradient(ellipse at 50% 85%,rgba(255,140,0,.04) 0%,transparent 50%)`}}>
      {s.map((x,i)=>(
        <div key={i} style={{position:"absolute",left:x.l,top:x.t,
          width:x.sz,height:x.sz,borderRadius:"50%",
          background:`rgba(255,255,255,${x.op})`,
          animation:`tw ${x.dur}s ease-in-out ${x.del}s infinite alternate`}}/>
      ))}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════ */
function Toast({toast,clear}){
  useEffect(()=>{const t=setTimeout(clear,4500);return()=>clearTimeout(t);},[toast]);
  const M={
    info:  {bg:"rgba(10,40,90,.93)", br:"#0080ff",ic:"ℹ️"},
    success:{bg:"rgba(5,60,35,.93)",  br:"#00ff88",ic:"✅"},
    warning:{bg:"rgba(80,45,0,.93)",  br:"#ff8c00",ic:"⚠️"},
    danger: {bg:"rgba(80,10,10,.93)", br:"#ff3333",ic:"💥"},
    snap:   {bg:"rgba(40,20,80,.96)", br:"#fde047",ic:"⚡"},
    love:   {bg:"rgba(70,10,50,.93)", br:"#ff69b4",ic:"💛"},
    endgame:{bg:"rgba(90,5,10,.96)",  br:"#ff3333",ic:"🔥"},
  };
  const c=M[toast.type]||M.info;
  return (
    <div style={{position:"fixed",top:82,right:18,zIndex:9999,minWidth:300,maxWidth:420,
      padding:"13px 18px",background:c.bg,border:`1px solid ${c.br}`,
      borderRadius:10,animation:"ti .35s ease",backdropFilter:"blur(16px)",
      boxShadow:`0 0 24px ${c.br}55,0 4px 20px rgba(0,0,0,.5)`}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:18}}>{c.ic}</span>
        <span style={{fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:15,lineHeight:1.35}}>{toast.msg}</span>
      </div>
    </div>
  );
}

function RDots({cur}){
  return (
    <div style={{display:"flex",gap:7,alignItems:"center"}}>
      {[1,2,3,4].map(r=>(
        <div key={r} style={{width:10,height:10,borderRadius:"50%",transition:"all .3s",
          background:r<cur?"rgba(253,224,71,.35)":r===cur?"#fde047":"transparent",
          border:r===cur?"1px solid #fde047":"1px solid rgba(255,255,255,.18)",
          boxShadow:r===cur?"0 0 8px #fde047":"none"}}/>
      ))}
      <span className="ob" style={{fontSize:9,color:"#fde047",letterSpacing:2,marginLeft:2}}>R{cur}/4</span>
    </div>
  );
}

function GoldBadge({gold}){
  const love=gold===3000;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
      <span className="ob" style={{color:"#fde047",fontWeight:700,fontSize:19}}>
        {gold.toLocaleString()}<span style={{fontSize:10,opacity:.6,marginLeft:2}}>Au</span>
      </span>
      {love&&<span style={{display:"inline-flex",alignItems:"center",gap:3}}>
        <span className="lv" style={{fontSize:17}}>💛</span>
        <span className="ob" style={{fontSize:9,color:"#ff69b4",letterSpacing:.5}}>I LOVE YOU 3000</span>
      </span>}
    </span>
  );
}

function HPBar({hp,maxHp,color}){
  const mx=Math.max(maxHp||hp||1,1);
  const pct=Math.min(100,(hp/mx)*100);
  const col=pct>60?"#00ff88":pct>30?"#fde047":"#ff3333";
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.7,marginBottom:3}}>
        <span>HP</span><span className="ob" style={{color:col}}>{hp.toLocaleString()}</span>
      </div>
      <div style={{height:7,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,borderRadius:4,transition:"width .6s ease",
          background:`linear-gradient(90deg,${col}88,${col})`,boxShadow:`0 0 8px ${col}77`}}/>
      </div>
    </div>
  );
}

function Loader(){
  return (
    <div style={{minHeight:"100vh",background:"#0b0b1e",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <Stars/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <div className="ob pg" style={{fontSize:24,fontWeight:900,letterSpacing:6}}>⚡ INFINITY WAR</div>
        <div style={{width:32,height:32,border:"3px solid rgba(253,224,71,.2)",
          borderTop:"3px solid #fde047",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:13,opacity:.5}}>Connecting to the universe...</div>
      </div>
    </div>
  );
}

function PinScreen({onUnlock}){
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const attempt=()=>{
    if(pin===ADMIN_PIN){onUnlock();}
    else{setErr(true);setPin("");setTimeout(()=>setErr(false),1200);}
  };
  return (
    <div style={{minHeight:"100vh",background:"#0b0b1e",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",gap:18,position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <Stars/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
        <div className="ob pg" style={{fontSize:26,fontWeight:900,letterSpacing:7}}>⚡ INFINITY WAR</div>
        <div className="ob" style={{fontSize:11,letterSpacing:3,opacity:.5}}>ADMIN ACCESS</div>
        <div className="gl" style={{padding:"32px 40px",display:"flex",flexDirection:"column",alignItems:"center",gap:14,minWidth:280}}>
          <div style={{fontSize:13,opacity:.6}}>Enter Admin PIN to continue</div>
          <input type="password" placeholder="••••" value={pin} maxLength={8}
            onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attempt()}
            style={{width:160,textAlign:"center",fontSize:22,letterSpacing:10,
              border:`1px solid ${err?"#ff3333":"rgba(255,255,255,.15)"}`,
              boxShadow:err?"0 0 12px rgba(255,50,50,.4)":"none",transition:"all .2s"}}/>
          {err&&<div style={{fontSize:12,color:"#ff6666"}}>Incorrect PIN</div>}
          <button className="btn" onClick={attempt}
            style={{background:"rgba(253,224,71,.15)",color:"#fde047",
              border:"1px solid rgba(253,224,71,.35)",width:"100%",justifyContent:"center"}}>ENTER</button>
        </div>
        <div style={{fontSize:11,opacity:.3}}>Team devices open their stone URL — no PIN needed.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 1
═══════════════════════════════════════════════ */
function R1Admin({teams,toggleQ,toggleHint,toggleSkip,addAttempt}){
  return (
    <div style={{overflowX:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"130px repeat(6,1fr)",gap:6,marginBottom:8,minWidth:820}}>
        <div/>
        {QV.map((g,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:11,padding:"4px 0"}}>
            <div className="ob" style={{color:"#fde047",fontSize:12}}>Q{i+1}</div>
            <div style={{opacity:.5,fontSize:10}}>{g}g</div>
            <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:4,fontSize:9,opacity:.45}}>
              <span>💡{hintCost(i)}g</span><span>⏭{skipCost(i)}g</span><span>⚡5g</span>
            </div>
          </div>
        ))}
      </div>
      {IDS.map(tid=>{
        const cfg=TC[tid],tm=teams[tid];
        const qs=tm.questions||Array(6).fill(false);
        const qh=tm.qHints||Array(6).fill(false);
        const qsk=tm.qSkips||Array(6).fill(false);
        const qa=tm.qAttempts||Array(6).fill(0);
        return (
          <div key={tid} style={{display:"grid",gridTemplateColumns:"130px repeat(6,1fr)",
            gap:6,alignItems:"start",marginBottom:8,
            background:`rgba(${cfg.rgb},.04)`,border:`1px solid rgba(${cfg.rgb},.15)`,
            borderRadius:8,padding:"10px 8px",minWidth:820}}>
            <div style={{display:"flex",gap:6,alignItems:"center",paddingTop:6}}>
              <span style={{fontSize:16}}>{cfg.em}</span>
              <div>
                <div className="ob" style={{color:cfg.color,fontSize:10}}>{cfg.name}</div>
                <div style={{fontSize:10,color:"#fde047"}}>{(tm.gold||0).toLocaleString()}g</div>
              </div>
            </div>
            {qs.map((_,qi)=>{
              const answered=qs[qi],skipped=qsk[qi],hinted=qh[qi],attempts=qa[qi]||0;
              const disabled=answered||skipped;
              return (
                <div key={qi} style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
                  <div onClick={()=>!skipped&&toggleQ(tid,qi)} style={{
                    width:34,height:34,borderRadius:6,cursor:skipped?"not-allowed":"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:16,fontWeight:700,userSelect:"none",
                    background:answered?`rgba(${cfg.rgb},.8)`:skipped?"rgba(255,255,255,.04)":"rgba(255,255,255,.06)",
                    border:`2px solid ${answered?cfg.color:skipped?"rgba(255,100,100,.3)":"rgba(255,255,255,.15)"}`,
                    boxShadow:answered?`0 0 12px rgba(${cfg.rgb},.5)`:"none",
                    color:answered?"#0b0b1e":"transparent",transition:"all .2s",opacity:skipped&&!answered?.4:1}}>
                    {skipped&&!answered?"⏭":"✓"}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,width:"100%"}}>
                    <button className="qbtn" onClick={()=>toggleHint(tid,qi)} disabled={disabled||hinted}
                      style={{background:hinted?"rgba(253,224,71,.15)":"rgba(255,255,255,.04)",
                        borderColor:hinted?"rgba(253,224,71,.5)":"rgba(255,255,255,.12)",
                        color:hinted?"#fde047":"rgba(255,255,255,.55)",justifyContent:"center",fontSize:9}}>
                      💡 {hinted?"USED":`${hintCost(qi)}g`}
                    </button>
                    <button className="qbtn" onClick={()=>toggleSkip(tid,qi)} disabled={disabled}
                      style={{background:skipped?"rgba(255,100,100,.15)":"rgba(255,255,255,.04)",
                        borderColor:skipped?"rgba(255,100,100,.5)":"rgba(255,255,255,.12)",
                        color:skipped?"#ff8888":"rgba(255,255,255,.55)",justifyContent:"center",fontSize:9}}>
                      ⏭ {skipped?"SKIPPED":`${skipCost(qi)}g`}
                    </button>
                    <button className="qbtn" onClick={()=>addAttempt(tid,qi)} disabled={disabled}
                      style={{background:attempts>0?"rgba(255,140,0,.12)":"rgba(255,255,255,.04)",
                        borderColor:attempts>0?"rgba(255,140,0,.4)":"rgba(255,255,255,.12)",
                        color:attempts>0?"#ff8c00":"rgba(255,255,255,.55)",justifyContent:"center",fontSize:9}}>
                      ⚡ {attempts>0?`×${attempts} (-${attempts*5}g)`:"-5g"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 2
═══════════════════════════════════════════════ */
function R2Admin({teams,setZOpt,giveDiplomacy}){
  const [ds,setDs]=useState({});
  const gd=tid=>ds[tid]||{to:"",amt:""};
  const upd=(tid,k,v)=>setDs(p=>({...p,[tid]:{...gd(tid),[k]:v}}));
  const maxHp=Math.max(...IDS.map(t=>teams[t].hp),1);
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {IDS.map(tid=>{
        const cfg=TC[tid],tm=teams[tid],d=gd(tid);
        return (
          <div key={tid} style={{background:`rgba(${cfg.rgb},.05)`,
            border:`1px solid rgba(${cfg.rgb},.2)`,borderRadius:10,padding:14}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:18}}>{cfg.em}</span>
              <span className="ob" style={{color:cfg.color,fontSize:11,letterSpacing:2}}>{cfg.name}</span>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Z<sub>opt</sub></div>
              <input type="number" placeholder="LPP solution..." value={tm.zOpt||""}
                onChange={e=>setZOpt(tid,e.target.value)} style={{borderColor:`rgba(${cfg.rgb},.3)`}}/>
            </div>
            {tm.hp>0&&<><HPBar hp={tm.hp} maxHp={maxHp} color={cfg.color}/><div style={{fontSize:11,opacity:.5,marginTop:4}}>= {tm.hp} HP</div></>}
            {tm.hp>0&&(
              <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:10,marginTop:10}}>
                <div style={{fontSize:10,opacity:.45,letterSpacing:1,marginBottom:6}}>DIPLOMACY</div>
                <select value={d.to} onChange={e=>upd(tid,"to",e.target.value)} style={{marginBottom:6}}>
                  <option value="">Send HP to...</option>
                  {IDS.filter(t=>t!==tid).map(t=><option key={t} value={t}>{TC[t].em} {TC[t].name}</option>)}
                </select>
                <div style={{display:"flex",gap:6}}>
                  <input type="number" placeholder="HP" value={d.amt} onChange={e=>upd(tid,"amt",e.target.value)} style={{flex:1}}/>
                  <button className="btn" onClick={()=>{
                    const amt=parseInt(d.amt);if(!d.to||!amt||amt<=0)return;
                    giveDiplomacy(tid,d.to,amt);setDs(p=>({...p,[tid]:{to:"",amt:""}}));
                  }} style={{background:`rgba(${cfg.rgb},.2)`,color:cfg.color,border:`1px solid rgba(${cfg.rgb},.3)`,padding:"8px 12px"}}>SEND</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 3 (stances)
   ═══════════════════════════════════════════════ */
function R3Admin({teams,locked,lockStrategies}){
  return (
    <div>
      <div style={{marginBottom:12,fontSize:13,opacity:.6,lineHeight:1.5}}>
        Teams choose their stance. <strong style={{color:"#00ff88"}}>PASSIVE</strong> teams get an extra <strong style={{color:"#00ff88"}}>500 HP</strong>. <strong style={{color:"#ff6666"}}>AGGRESSIVE</strong> teams can wage war and launch missile attacks in Round 4.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {IDS.map(tid=>{
          const cfg=TC[tid],tm=teams[tid];
          return (
            <div key={tid} style={{background:`rgba(${cfg.rgb},.05)`,
              border:`1px solid rgba(${cfg.rgb},.18)`,borderRadius:10,padding:14}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                <span>{cfg.em}</span>
                <span className="ob" style={{color:cfg.color,fontSize:11}}>{cfg.name}</span>
                <span style={{marginLeft:"auto",fontSize:12,color:"#fde047"}}>{getTeamHp(tm)} HP</span>
              </div>
              {tm.strategy?(
                <span style={{display:"inline-block",padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,
                  background:tm.strategy==="AGGRESSIVE"?"rgba(255,50,50,.15)":"rgba(0,200,100,.15)",
                  border:`1px solid ${tm.strategy==="AGGRESSIVE"?"#ff333355":"#00ff8855"}`,
                  color:tm.strategy==="AGGRESSIVE"?"#ff6666":"#00ff88"}}>
                  {tm.strategy==="AGGRESSIVE"?"⚔️ AGGRESSIVE":"🛡️ PASSIVE"}
                </span>
              ):<div style={{fontSize:12,opacity:.35}}>Not decided yet</div>}
            </div>
          );
        })}
      </div>

      <button className="btn" onClick={lockStrategies} disabled={locked} style={{
        background:locked?"rgba(255,255,255,.07)":"rgba(255,50,50,.2)",
        color:locked?"rgba(255,255,255,.4)":"#ff6666",
        border:`1px solid ${locked?"rgba(255,255,255,.08)":"#ff333377"}`,
        boxShadow:locked?"none":"0 0 15px rgba(255,50,50,.2)",padding:"11px 28px",fontSize:12,
      }}>{locked?"🔒 STRATEGIES LOCKED":"🔐 LOCK ALL STRATEGIES"}</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 4
   ═══════════════════════════════════════════════ */
function R4Admin({teams,attacks,approveAtk,rejectAtk,alliances,wars,concludeWar,round}){
  const atksArr=Object.values(attacks||{});
  const pending=atksArr.filter(a=>a.status==="pending");
  const resolved=atksArr.filter(a=>a.status!=="pending");
  const activeWars = Object.values(wars||{}).filter(w=>w.status==="active");
  const resolvedWars = Object.values(wars||{}).filter(w=>w.status==="resolved");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {IDS.map(tid=>{
          const cfg=TC[tid],tm=teams[tid];
          const safeHp=tm.safeHp||[0,0,0,0,0];
          const aggroBonus = tm.strategy === "AGGRESSIVE" ? 3 : 0;
          const boughtMissiles = tm.boughtMissiles || 0;
          const totalM = Math.floor((tm.gold||0)/20) + aggroBonus + boughtMissiles;
          const usedM = atksArr.filter(a=>a.attackerId===tid && a.status!=="rejected").reduce((s,a)=>s+(a.missiles||0),0);
          const availM = Math.max(0, totalM - usedM);

          return (
            <div key={tid} style={{background:`rgba(${cfg.rgb},.05)`,
              border:`1px solid rgba(${cfg.rgb},.15)`,borderRadius:8,padding:12}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:14}}>{cfg.em}</span>
                <span className="ob" style={{color:cfg.color,fontSize:10}}>{cfg.name}</span>
                <span style={{marginLeft:"auto",fontSize:10,color:"#00ff88"}}>{getTeamHp(tm, round)} HP</span>
                <span style={{fontSize:10,opacity:.5}}>{tm.safesLocked?"🔒":"⚠️"}</span>
              </div>
              <div style={{fontSize:10,opacity:.6,marginBottom:6}}>
                Missiles: <span style={{color:"#fde047"}}>{availM}</span> / {totalM} avail
              </div>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:5}, (_,i)=>(tm.safes?.[i]||0)).map((g,i)=>(
                  <div key={i} style={{flex:1,padding:"5px 3px",borderRadius:4,textAlign:"center",
                    background:(tm.safeStatus||[])[i]==="destroyed"?"rgba(255,0,0,.1)":`rgba(${cfg.rgb},.08)`,
                    border:`1px solid ${(tm.safeStatus||[])[i]==="destroyed"?"rgba(255,0,0,.3)":`rgba(${cfg.rgb},.2)`}`,fontSize:9}}>
                    <div style={{opacity:.5}}>S{i+1}</div>
                    <div style={{color:(tm.safeStatus||[])[i]==="destroyed"?"#ff3333":"#00ff88",fontSize:10}}>
                      {(tm.safeStatus||[])[i]==="destroyed"?"💥":`${safeHp[i]}hp`}
                    </div>
                    <div style={{color:"#fde047",fontSize:10}}>{(tm.safeStatus||[])[i]==="destroyed"?"":` ${g}g`}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="ob" style={{fontSize:11,letterSpacing:2,color:"#fde047",marginBottom:10}}>⚔️ ACTIVE WARS ({activeWars.length})</div>
        {activeWars.length===0&&<div style={{opacity:.35,fontSize:13,padding:"10px 0"}}>No active wars.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {activeWars.map(w=>(
            <div key={w.id} style={{background:"rgba(255,50,0,.04)",border:"1px solid rgba(255,50,0,.25)",borderRadius:8,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:14}}>
                <span style={{color:TC[w.attacker].color,fontWeight:700}}>{TC[w.attacker].em} {TC[w.attacker].name}</span>
                {w.attackerAlly && (
                  <>
                    <span>+</span>
                    <span style={{color:TC[w.attackerAlly].color,fontWeight:700}}>{TC[w.attackerAlly].em} {TC[w.attackerAlly].name} (Ally)</span>
                  </>
                )}
                <span style={{opacity:.5,fontSize:12}}>WAGED WAR ON</span>
                <span style={{color:TC[w.defender].color,fontWeight:700}}>{TC[w.defender].em} {TC[w.defender].name}</span>
                {w.defenderAlly && (
                  <>
                    <span>+</span>
                    <span style={{color:TC[w.defenderAlly].color,fontWeight:700}}>{TC[w.defenderAlly].em} {TC[w.defenderAlly].name} (Ally)</span>
                  </>
                )}
              </div>
              <button className="btn" onClick={()=>concludeWar(w.id)} style={{background:"rgba(255,255,255,.08)",color:"#fff",border:"1px solid rgba(255,255,255,.2)"}}>🏁 CONCLUDE WAR</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="ob" style={{fontSize:11,letterSpacing:2,color:"#ff6666",marginBottom:10}}>⚔️ CIPHER QUEUE ({pending.length})</div>
        {pending.length===0&&<div style={{opacity:.35,fontSize:13,padding:"10px 0"}}>No attacks queued.</div>}
        {pending.map(atk=>{
          const aSide=getSide(atk.attackerType,atk.attackerId,teams,alliances,round);
          const dSide=getSide(atk.targetType,atk.targetId,teams,alliances,round);
          if(!aSide||!dSide) return null;
          return (
            <div key={atk.id} style={{border:"1px solid rgba(255,100,0,.3)",background:"rgba(255,50,0,.05)",
              borderRadius:8,padding:"12px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{flex:1,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:13}}>
                <span style={{color:aSide.color,fontWeight:700}}>{aSide.em} {aSide.name}</span>
                <span style={{opacity:.4}}>→</span>
                <span style={{color:dSide.color,fontWeight:700}}>{dSide.em} {dSide.name}</span>
                <span style={{opacity:.6}}>Safe #{atk.safeIdx+1}</span>
                <span style={{fontSize:11,color:"#ff8c00"}}>🚀 {atk.missiles} Missiles ({atk.missiles * 200} damage)</span>
                <span style={{fontSize:11,opacity:.4}}>{atk.time}</span>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button className="btn" onClick={()=>approveAtk(atk)}
                  style={{background:"rgba(0,200,100,.15)",color:"#00ff88",border:"1px solid #00ff8844"}}>✅ APPROVE</button>
                <button className="btn" onClick={()=>rejectAtk(atk.id)}
                  style={{background:"rgba(255,50,50,.15)",color:"#ff6666",border:"1px solid #ff333344"}}>❌ REJECT</button>
              </div>
            </div>
          );
        })}
      </div>

      {resolved.length>0&&(
        <div>
          <div className="ob" style={{fontSize:10,letterSpacing:2,opacity:.4,marginBottom:6}}>RESOLVED ({resolved.length})</div>
          {resolved.slice(-5).reverse().map(atk=>{
            const aSide=getSide(atk.attackerType,atk.attackerId,teams,alliances,round);
            const dSide=getSide(atk.targetType,atk.targetId,teams,alliances,round);
            if(!aSide||!dSide) return null;
            return (
              <div key={atk.id} style={{fontSize:12,padding:"5px 8px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",gap:6,opacity:.6}}>
                <span>{atk.status==="resolved"?"✅":"❌"}</span>
                <span style={{color:aSide.color}}>{aSide.name}</span>→<span style={{color:dSide.color}}>{dSide.name}</span>
                <span>S#{atk.safeIdx+1} ({atk.missiles} missiles)</span>
                <span style={{marginLeft:"auto",opacity:.5}}>{atk.time}</span>
              </div>
            );
          })}
        </div>
      )}

      {resolvedWars.length>0&&(
        <div style={{marginTop:10}}>
          <div className="ob" style={{fontSize:10,letterSpacing:2,opacity:.4,marginBottom:6}}>RESOLVED WARS ({resolvedWars.length})</div>
          {resolvedWars.map(w=>(
            <div key={w.id} style={{fontSize:12,padding:"5px 8px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",gap:6,opacity:.5}}>
              <span>🏁</span>
              <span>{TC[w.attacker].name} {w.attackerAlly ? `+ ${TC[w.attackerAlly].name}` : ""} vs {TC[w.defender].name} {w.defenderAlly ? `+ ${TC[w.defenderAlly].name}` : ""} (Concluded)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════ */
function AdminPanel({round,teams,locked,logs,attacks,snap,alliances,wars,handlers}){
  const {toggleQ,toggleHint,toggleSkip,addAttempt,setZOpt,giveDiplomacy,
         lockStrategies,approveAtk,rejectAtk,triggerSnap,advanceRound,concludeWar}=handlers;
  const [tab,setTab]=useState(1);
  useEffect(()=>setTab(round),[round]);
  const TABS=[
    {id:1,label:"R1 · SCRAMBLE",col:"#00d4ff"},
    {id:2,label:"R2 · FORTIFY", col:"#9b30ff"},
    {id:3,label:"R3 · STRATEGY",col:"#ff8c00"},
    {id:4,label:"R4 · ENDGAME", col:"#ff3333"},
  ];
  const maxHp=Math.max(...IDS.map(t=>getTeamHp(teams[t], round)),1);
  const top3=[...IDS].sort((a,b)=>teams[b].gold-teams[a].gold).slice(0,3);
  const logsArr=Object.values(logs||{}).sort((a,b)=>b.ts-a.ts).slice(0,60);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div className="gl" style={{padding:"16px 20px",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <button title="Thanos Snap" onClick={triggerSnap}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:34,
            filter:"drop-shadow(0 0 10px rgba(253,224,71,.5))",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.22) rotate(-13deg)";e.currentTarget.style.filter="drop-shadow(0 0 26px rgba(253,224,71,.96))"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1) rotate(0)";e.currentTarget.style.filter="drop-shadow(0 0 10px rgba(253,224,71,.5))"}}>🫱</button>
        <div>
          <div className="ob" style={{fontSize:9,letterSpacing:2,opacity:.5}}>MASTER CONTROL</div>
          <div style={{fontSize:12,opacity:.4}}>Tony Stark Interface</div>
        </div>
        <div style={{width:1,height:36,background:"rgba(255,255,255,.08)"}}/>
        <div>
          <div className="ob" style={{fontSize:9,letterSpacing:2,opacity:.5,marginBottom:5}}>PHASE</div>
          <RDots cur={round}/>
        </div>
        <button className="btn" onClick={advanceRound} disabled={round>=4} style={{
          background:round>=4?"rgba(255,255,255,.06)":"rgba(253,224,71,.15)",
          color:round>=4?"rgba(255,255,255,.3)":"#fde047",
          border:`1px solid ${round>=4?"rgba(255,255,255,.06)":"rgba(253,224,71,.35)"}`,
          boxShadow:round<4?"0 0 15px rgba(253,224,71,.15)":"none",
        }}>{round<4?`⚡ ADVANCE R${round+1}`:"🏁 ENDGAME"}</button>
        <div style={{marginLeft:"auto",display:"flex",gap:14,alignItems:"center"}}>
          {top3.map((tid,i)=>(
            <div key={tid} style={{fontSize:12,display:"flex",gap:5,alignItems:"center"}}>
              <span>{["🥇","🥈","🥉"][i]}</span>
              <span style={{color:TC[tid].color}}>{TC[tid].name}</span>
              <span style={{color:"#fde047",fontWeight:700}}>{teams[tid].gold.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gl" style={{padding:"16px 20px"}}>
        <div className="ob" style={{fontSize:10,letterSpacing:3,opacity:.45,marginBottom:12}}>TEAM STATUS</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {IDS.map(tid=>{
            const cfg=TC[tid],tm=teams[tid];
            const attempts=(tm.qAttempts||[]).reduce((a,b)=>a+b,0);
            return (
              <div key={tid} style={{display:"flex",gap:12,alignItems:"center",
                background:`rgba(${cfg.rgb},.04)`,border:`1px solid rgba(${cfg.rgb},.15)`,
                borderRadius:8,padding:"10px 14px",flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",minWidth:108}}>
                  <span>{cfg.em}</span>
                  <span className="ob" style={{color:cfg.color,fontSize:10}}>{cfg.name}</span>
                </div>
                <GoldBadge gold={tm.gold}/>
                <div style={{flex:1,minWidth:130}}><HPBar hp={getTeamHp(tm, round)} maxHp={maxHp} color={cfg.color}/></div>
                <div style={{minWidth:80,textAlign:"center"}}>
                  {tm.strategy?(
                    <span style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,
                      background:tm.strategy==="AGGRESSIVE"?"rgba(255,50,50,.15)":"rgba(0,200,100,.15)",
                      border:`1px solid ${tm.strategy==="AGGRESSIVE"?"#ff333344":"#00ff8844"}`,
                      color:tm.strategy==="AGGRESSIVE"?"#ff6666":"#00ff88"}}>
                      {tm.strategy==="AGGRESSIVE"?"⚔️":"🛡️"} {tm.strategy.slice(0,4)}
                    </span>
                  ):<span style={{opacity:.25,fontSize:11}}>—</span>}
                </div>
                <div style={{fontSize:11,opacity:.55}}>Q {(tm.questions||[]).filter(Boolean).length}/6</div>
                {attempts>0&&<div style={{fontSize:11,color:"#ff8c00"}}>⚡×{attempts}</div>}
                {(tm.hints||0)>0&&<div style={{fontSize:11,color:"#fde047"}}>💡×{tm.hints}</div>}
                {tm.allianceWith&&<div style={{fontSize:11,color:"#fde047"}}>🤝 {TC[tm.allianceWith]?.name}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="gl" style={{padding:"18px 20px"}}>
        <div style={{display:"flex",gap:6,marginBottom:18,borderBottom:"1px solid rgba(255,255,255,.07)",paddingBottom:14}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:tab===t.id?`${t.col}18`:"transparent",
              border:`1px solid ${tab===t.id?t.col+"66":"rgba(255,255,255,.1)"}`,
              borderRadius:6,padding:"7px 14px",cursor:"pointer",
              color:tab===t.id?t.col:"rgba(255,255,255,.45)",
              fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:1,
              boxShadow:tab===t.id?`0 0 10px ${t.col}33`:"none",transition:"all .2s",
            }}>{t.label}</button>
          ))}
        </div>
        <div className="fi">
          {tab===1&&<R1Admin teams={teams} toggleQ={toggleQ} toggleHint={toggleHint} toggleSkip={toggleSkip} addAttempt={addAttempt}/>}
          {tab===2&&<R2Admin teams={teams} setZOpt={setZOpt} giveDiplomacy={giveDiplomacy}/>}
          {tab===3&&<R3Admin teams={teams} locked={locked} lockStrategies={lockStrategies}/>}
          {tab===4&&<R4Admin teams={teams} attacks={attacks} approveAtk={approveAtk} rejectAtk={rejectAtk} alliances={alliances} wars={wars} concludeWar={concludeWar} round={round}/>}
        </div>
      </div>

      <div className="gl" style={{padding:"16px 20px"}}>
        <div className="ob" style={{fontSize:10,letterSpacing:3,opacity:.4,marginBottom:8}}>SYSTEM LOG</div>
        <div className={snap?"sn":""} style={{maxHeight:190,overflowY:"auto",background:"rgba(0,0,0,.35)",borderRadius:8,padding:6,fontFamily:"monospace"}}>
          {logsArr.length===0&&<div style={{opacity:.3,fontSize:12,padding:8}}>Awaiting events...</div>}
          {logsArr.map((l,i)=>(
            <div key={i} style={{fontSize:12,padding:"3px 8px",borderBottom:"1px solid rgba(255,255,255,.03)",opacity:i===0?1:.65}}>
              <span style={{color:"rgba(253,224,71,.4)",marginRight:8}}>[{l.t}]</span>{l.m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM — ROUND 1
═══════════════════════════════════════════════ */
function TR1({teamId,team}){
  const cfg=TC[teamId];
  const questions=team.questions||Array(6).fill(false);
  const qh=team.qHints||Array(6).fill(false);
  const qsk=team.qSkips||Array(6).fill(false);
  const qa=team.qAttempts||Array(6).fill(0);
  const earned=questions.reduce((a,s,i)=>a+(s?QV[i]:0),0);
  return (
    <div>
      <div className="ob" style={{fontSize:11,letterSpacing:3,color:cfg.color,opacity:.7,marginBottom:16}}>COSMIC SCRAMBLE — GOLD ACQUISITION</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:16}}>
        {questions.map((solved,i)=>{
          const skipped=qsk[i],hinted=qh[i],attempts=qa[i]||0;
          return (
            <div key={i} style={{padding:"12px 6px",borderRadius:8,textAlign:"center",
              background:solved?`rgba(${cfg.rgb},.15)`:skipped?"rgba(255,100,100,.06)":"rgba(255,255,255,.03)",
              border:`2px solid ${solved?cfg.color:skipped?"rgba(255,100,100,.3)":"rgba(255,255,255,.1)"}`,
              boxShadow:solved?`0 0 16px rgba(${cfg.rgb},.3)`:"none",
              transition:"all .4s",transform:solved?"scale(1.04)":"scale(1)"}}>
              <div style={{fontSize:22}}>{solved?"🔓":skipped?"⏭":"🔒"}</div>
              <div className="ob" style={{fontSize:10,opacity:.5,marginTop:4}}>Q{i+1}</div>
              <div style={{fontSize:12,fontWeight:700,marginTop:3,
                color:solved?cfg.color:skipped?"rgba(255,100,100,.6)":"rgba(255,255,255,.25)"}}>
                {solved?`+${QV[i]}g`:skipped?"SKIP":`${QV[i]}g`}
              </div>
              <div style={{marginTop:6,display:"flex",flexDirection:"column",gap:2}}>
                {hinted&&<div style={{fontSize:9,color:"#fde047"}}>💡 hint</div>}
                {attempts>0&&<div style={{fontSize:9,color:"#ff8c00"}}>⚡×{attempts}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:14,background:"rgba(255,255,255,.03)",borderRadius:8,
        border:"1px solid rgba(255,255,255,.07)",display:"flex",gap:24,flexWrap:"wrap"}}>
        <div><div style={{fontSize:11,opacity:.5}}>SOLVED</div>
          <div className="ob" style={{color:cfg.color,fontSize:22}}>{questions.filter(Boolean).length}/6</div></div>
        <div><div style={{fontSize:11,opacity:.5}}>EARNINGS</div><GoldBadge gold={earned}/></div>
        <div><div style={{fontSize:11,opacity:.5}}>TOTAL GOLD</div><GoldBadge gold={team.gold}/></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM — ROUND 2
═══════════════════════════════════════════════ */
function TR2({teamId,team,allTeams,giveDiplomacy,showToast}){
  const cfg=TC[teamId];
  const [dipTo,setDipTo]=useState("");
  const [dipAmt,setDipAmt]=useState("");
  const maxHp=Math.max(...IDS.map(t=>allTeams[t].hp),1);
  const dipLog=team.diplomacyLog||[];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div>
        <div className="ob" style={{fontSize:11,letterSpacing:3,color:cfg.color,opacity:.7,marginBottom:12}}>FORTIFICATION ENGINE</div>
        <HPBar hp={team.hp} maxHp={maxHp} color={cfg.color}/>
        {team.zOpt?<div style={{fontSize:12,opacity:.5,marginTop:5}}>Z<sub>opt</sub> = {team.zOpt} → {team.hp} HP (Z × 5)</div>
          :<div style={{fontSize:12,opacity:.35,marginTop:5}}>Awaiting admin to enter Z<sub>opt</sub>…</div>}
        <div style={{marginTop:12,padding:10,borderRadius:8,background:"rgba(0,212,255,.06)",
          border:"1px solid rgba(0,212,255,.15)",fontSize:12,opacity:.8}}>
          💡 In Round 4, you distribute your entire team's total HP across your 5 safes.
        </div>
      </div>
      {team.hp>0&&(
        <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:16}}>
          <div className="ob" style={{fontSize:11,letterSpacing:2,opacity:.55,marginBottom:12}}>DIPLOMATIC SACRIFICE</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <div style={{flex:2,minWidth:140}}>
              <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Send HP to:</div>
              <select value={dipTo} onChange={e=>setDipTo(e.target.value)}>
                <option value="">Select ally...</option>
                {IDS.filter(t=>t!==teamId).map(t=><option key={t} value={t}>{TC[t].em} {TC[t].name}</option>)}
              </select>
            </div>
            <div style={{flex:1,minWidth:80}}>
              <div style={{fontSize:11,opacity:.5,marginBottom:4}}>HP Amount:</div>
              <input type="number" placeholder="e.g. 50" value={dipAmt} onChange={e=>setDipAmt(e.target.value)}/>
            </div>
            <button className="btn" onClick={()=>{
              if(!dipTo)return showToast("Select a team!","warning");
              const amt=parseInt(dipAmt);
              if(!amt||amt<=0)return showToast("Enter a valid amount!","warning");
              if(amt>team.hp)return showToast(`Only ${team.hp} HP available!`,"danger");
              giveDiplomacy(teamId,dipTo,amt);setDipTo("");setDipAmt("");
            }} style={{background:`rgba(${cfg.rgb},.2)`,color:cfg.color,
              border:`1px solid rgba(${cfg.rgb},.35)`,alignSelf:"flex-end"}}>⚡ SACRIFICE</button>
          </div>
        </div>
      )}
      {dipLog.length>0&&(
        <div>
          <div className="ob" style={{fontSize:10,letterSpacing:2,opacity:.4,marginBottom:8}}>DIPLOMACY LOG</div>
          {dipLog.map((d,i)=>(
            <div key={i} style={{fontSize:12,padding:"5px 10px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",gap:8,opacity:.65}}>
              <span>{d.dir==="out"?"📤":"📥"}</span>
              <span style={{color:d.dir==="out"?"#ff6666":"#00ff88"}}>
                {d.dir==="out"?`Sent ${d.hp} HP → ${TC[d.to]?.name}`:`Received ${d.hp} HP ← ${TC[d.fr]?.name}`}
              </span>
              <span style={{marginLeft:"auto",opacity:.45}}>{d.t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM — ROUND 3 (strategy)
   ═══════════════════════════════════════════════ */
function TR3({teamId,team,locked,setStrategy}){
  const cfg=TC[teamId];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div className="ob" style={{fontSize:11,letterSpacing:3,color:cfg.color,opacity:.7}}>WAR COUNCIL</div>
      {locked&&<div style={{padding:"9px 14px",borderRadius:6,background:"rgba(255,50,50,.07)",
        border:"1px solid rgba(255,50,50,.25)",fontSize:12,display:"flex",gap:8,alignItems:"center"}}>
        🔒 <span style={{opacity:.7}}>War Council concluded. Stance is final.</span>
      </div>}

      <div style={{padding:14,borderRadius:8,background:"rgba(255,255,255,.03)",
        border:"1px solid rgba(255,255,255,.07)",fontSize:13,lineHeight:1.7}}>
        <div style={{marginBottom:6,opacity:.6,fontSize:11,letterSpacing:1}}>COMBAT RULES</div>
        <div>⚔️ <strong style={{color:"#ff6666"}}>AGGRESSIVE</strong> — You declare war and launch missile attacks.</div>
        <div style={{marginTop:6}}>🛡️ <strong style={{color:"#00ff88"}}>PASSIVE</strong> — You hold the line. Gets an extra <strong style={{color:"#00ff88"}}>500 hitpoints</strong>.</div>
      </div>

      <div style={{display:"flex",gap:12}}>
        {["PASSIVE","AGGRESSIVE"].map(s=>{
          const isAgg=s==="AGGRESSIVE",chosen=team.strategy===s;
          return (
            <button key={s} onClick={()=>!locked&&setStrategy(teamId,s)} disabled={locked}
              style={{flex:1,padding:"22px 14px",
                border:`2px solid ${chosen?(isAgg?"#ff3333":"#00ff88"):"rgba(255,255,255,.1)"}`,
                borderRadius:10,cursor:locked?"not-allowed":"pointer",
                background:chosen?(isAgg?"rgba(255,50,50,.12)":"rgba(0,200,100,.12)"):"rgba(255,255,255,.02)",
                color:chosen?(isAgg?"#ff7777":"#00ff88"):"rgba(255,255,255,.35)",
                boxShadow:chosen?`0 0 22px ${isAgg?"rgba(255,50,50,.25)":"rgba(0,200,100,.25)"}`:"none",
                transition:"all .3s",textAlign:"center",
                fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:2,
                opacity:locked&&!chosen?.4:1}}>
              <div style={{fontSize:34,marginBottom:8}}>{isAgg?"⚔️":"🛡️"}</div>
              <div>{s}</div>
              <div style={{fontSize:10,marginTop:8,opacity:.65,fontFamily:"'Rajdhani',sans-serif",fontWeight:400}}>
                {isAgg?`Wages war and fires missiles`:`Defends vaults · +500 HP`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM — ROUND 4
   ═══════════════════════════════════════════════ */
function TR4({teamId,team,teams,alliances,attacks,wars,allocateSafe,lockSafes,queueAttack,showToast,handlers}){
  const { wageWar, proposeAlliance, cancelAllianceProposal, acceptAlliance, declineAlliance, allocateSafeHp, allocateAllianceSafe, allocateAllianceSafeHp, sealAllianceVault } = handlers;
  
  const cfg=TC[teamId];
  const alId = team.allianceWith ? [teamId, team.allianceWith].sort().join("_") : null;
  const al = alId ? (alliances||{})[alId] : null;
  const isAl = !!al;
  
  const safes = Array.from({length:5}, (_,i)=>(isAl ? al.safes?.[i] : team.safes?.[i])||0);
  const safeHp = Array.from({length:5}, (_,i)=>(isAl ? al.safeHp?.[i] : team.safeHp?.[i])||0);
  const safeStatus = Array.from({length:5}, (_,i)=>(isAl ? al.safeStatus?.[i] : team.safeStatus?.[i])||"ok");
  const sumG = safes.reduce((a,b)=>a+(Number(b)||0), 0);
  const sumH = safeHp.reduce((a,b)=>a+(Number(b)||0), 0);
  
  const getTeamBaseHp = (t) => (t.hp || 0) + (t.strategy === "PASSIVE" ? 500 : 0);
  const targetGold = isAl ? (al.gold||0) : (team.gold||0);
  const targetHp = isAl ? (al.hp||0) : getTeamBaseHp(team);
  const locked = isAl ? al.sealed : team.safesLocked;
  
  const [warTgt, setWarTgt] = useState("");
  const [allyTgt, setAllyTgt] = useState("");
  const [atkSafe, setAtkSafe] = useState("0");
  const [atkMissiles, setAtkMissiles] = useState("1");
  const [atkTeamTgt, setAtkTeamTgt] = useState("");
  
  const [errG,setErrG]=useState("");

  const doLock=()=>{
    if(sumG!==targetGold){
      setErrG(`Gold mismatch: ${sumG.toLocaleString()} ≠ ${targetGold.toLocaleString()}.`);
    } else if(sumH!==targetHp){
      setErrG(`HP mismatch: ${sumH.toLocaleString()} ≠ ${targetHp.toLocaleString()}.`);
    } else {
      setErrG("");
      if(isAl) sealAllianceVault(alId);
      else lockSafes(teamId);
    }
  };

  const getTeamAggroBonus = (t) => t?.strategy === "AGGRESSIVE" ? 3 : 0;
  const aggroBonus = isAl 
    ? getTeamAggroBonus(teams[al.members[0]]) + getTeamAggroBonus(teams[al.members[1]])
    : getTeamAggroBonus(team);
  const getTeamBoughtMissiles = (t) => t?.boughtMissiles || 0;
  const boughtMissiles = isAl
    ? getTeamBoughtMissiles(teams[al.members[0]]) + getTeamBoughtMissiles(teams[al.members[1]])
    : getTeamBoughtMissiles(team);
  const totalMissiles = (isAl ? Math.floor((al.gold || 0) / 20) : Math.floor((team.gold || 0) / 20)) + aggroBonus + boughtMissiles;
  const usedMissiles = Object.values(attacks || {})
    .filter(a => (a.attackerId === teamId || (isAl && a.attackerId === alId)) && a.status !== "rejected")
    .reduce((s, a) => s + (a.missiles || 0), 0);
  const availMissiles = Math.max(0, totalMissiles - usedMissiles);

  const activeWar = Object.values(wars || {}).find(w => w.status === "active" && (w.attacker === teamId || w.defender === teamId || w.attackerAlly === teamId || w.defenderAlly === teamId));

  let warRole = null;
  if (activeWar) {
    if (activeWar.attacker === teamId) warRole = "attacker";
    else if (activeWar.defender === teamId) warRole = "defender";
    else if (activeWar.attackerAlly === teamId || activeWar.defenderAlly === teamId) warRole = "ally";
  }

  const proposalFrom = team.allianceProposalFrom;
  const proposalTo = team.allianceProposalTo;

  const proposerWar = proposalFrom
    ? Object.values(wars || {}).find(w => w.status === "active" && (w.attacker === proposalFrom || w.defender === proposalFrom))
    : null;
  const opponentId = proposerWar
    ? (proposerWar.attacker === proposalFrom ? proposerWar.defender : proposerWar.attacker)
    : null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <div className="ob" style={{fontSize:11,letterSpacing:3,color:cfg.color,opacity:.7,marginBottom:14}}>
          {isAl ? `ALLIANCE VAULT ALLOCATION (${TC[teamId].name} + ${TC[team.allianceWith].name})` : "VIBRANIUM VAULT ALLOCATION"}
        </div>
        <div style={{fontSize:12,opacity:.6,marginBottom:14,lineHeight:1.5}}>
          Distribute your <span style={{color:"#fde047",fontWeight:700}}>{targetGold.toLocaleString()} Au</span> and <span style={{color:"#00ff88",fontWeight:700}}>{targetHp.toLocaleString()} HP</span> across your {isAl ? "Alliance's 5 safes" : "5 safes"}.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:12}}>
          {safes.map((g,i)=>{
            const destr=safeStatus[i]==="destroyed";
            const shp=safeHp[i]||0;
            return (
              <div key={i} style={{padding:"12px 8px",borderRadius:8,textAlign:"center",position:"relative",
                border:`2px solid ${destr?"rgba(255,0,0,.35)":`rgba(${cfg.rgb},${locked?.25:.15})`}`,
                background:destr?"rgba(255,0,0,.05)":`rgba(${cfg.rgb},.05)`}}>
                {destr&&<div style={{position:"absolute",inset:0,borderRadius:7,background:"rgba(0,0,0,.6)",
                  display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2}}>
                  <span style={{fontSize:22,animation:"ck .4s ease"}}>💥</span>
                  <span style={{fontSize:9,color:"#ff3333"}}>DESTROYED</span>
                </div>}
                <div style={{fontSize:18}}>🔐</div>
                <div className="ob" style={{fontSize:9,opacity:.5,margin:"4px 0"}}>SAFE {i+1}</div>
                <div style={{fontSize:9,color:"#00ff88",marginBottom:3}}>HP shield</div>
                {locked
                  ?<div style={{color:"#00ff88",fontWeight:700,fontSize:12,marginBottom:4}}>{shp.toLocaleString()} HP</div>
                  :<input type="number" min="0" value={safeHp[i]||""} placeholder="0"
                    onChange={e=>isAl?allocateAllianceSafeHp(alId,i,e.target.value):allocateSafeHp(teamId,i,e.target.value)}
                    style={{textAlign:"center",padding:"4px 2px",fontSize:11,borderColor:"rgba(0,255,136,.3)",marginBottom:4}}/>}
                <div style={{fontSize:9,color:"#fde047",marginBottom:3}}>Gold</div>
                {locked
                  ?<div style={{color:"#fde047",fontWeight:700,fontSize:12}}>{g.toLocaleString()}g</div>
                  :<input type="number" min="0" value={g||""} placeholder="0"
                    onChange={e=>isAl?allocateAllianceSafe(alId,i,e.target.value):allocateSafe(teamId,i,e.target.value)}
                    style={{textAlign:"center",padding:"4px 2px",fontSize:11,borderColor:"rgba(253,224,71,.3)"}}/>}
              </div>
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
          <div style={{padding:"8px 12px",borderRadius:6,background:"rgba(253,224,71,.05)",border:"1px solid rgba(253,224,71,.15)"}}>
            <div style={{fontSize:11,color:"#fde047",marginBottom:2}}>Gold Allocated</div>
            <div style={{fontSize:14,fontWeight:700,color:sumG===targetGold?"#fde047":"#ff5555"}}>{sumG.toLocaleString()} / {targetGold.toLocaleString()}</div>
          </div>
          <div style={{padding:"8px 12px",borderRadius:6,background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.15)"}}>
            <div style={{fontSize:11,color:"#00ff88",marginBottom:2}}>HP Allocated</div>
            <div style={{fontSize:14,fontWeight:700,color:sumH===targetHp?"#00ff88":"#ff5555"}}>{sumH.toLocaleString()} / {targetHp.toLocaleString()}</div>
          </div>
        </div>
        {!locked&&<button className="btn" onClick={doLock}
          style={{background:`rgba(${cfg.rgb},.18)`,color:cfg.color,border:`1px solid rgba(${cfg.rgb},.35)`}}>🔒 SEAL VAULTS</button>}
        {locked&&<span style={{fontSize:12,color:"#00ff88"}}>✅ Vaults sealed</span>}
        {errG&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:6,background:"rgba(255,0,0,.09)",border:"1px solid rgba(255,0,0,.3)",color:"#ff7777",fontSize:12}}>⚠️ {errG}</div>}
      </div>

      <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:18}}>
        <div className="ob" style={{fontSize:11,letterSpacing:3,color:"#ff3333",opacity:.85,marginBottom:14}}>⚔️ BATTLE GROUND</div>



        {proposalFrom && (
          <div style={{marginBottom:18,background:"rgba(253,224,71,.08)",border:"1px solid rgba(253,224,71,.3)",padding:12,borderRadius:8}}>
            <div style={{fontSize:13,marginBottom:10}}>
              {opponentId ? (
                <span>
                  <strong style={{color:"#fde047"}}>{TC[proposalFrom]?.em} {TC[proposalFrom]?.name}</strong> requests your alliance in their war against <strong style={{color:TC[opponentId]?.color}}>{TC[opponentId]?.name}</strong>!
                </span>
              ) : (
                <span>
                  <strong style={{color:"#fde047"}}>{TC[proposalFrom]?.em} {TC[proposalFrom]?.name}</strong> requests your alliance!
                </span>
              )}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn" onClick={()=>acceptAlliance(teamId)} style={{background:"rgba(0,200,100,.15)",color:"#00ff88",border:"1px solid #00ff8844"}}>✅ ACCEPT</button>
              <button className="btn" onClick={()=>declineAlliance(teamId)} style={{background:"rgba(255,50,50,.15)",color:"#ff6666",border:"1px solid #ff333344"}}>❌ DECLINE</button>
            </div>
          </div>
        )}

        {!activeWar && (
          <div>
            {team.strategy === "AGGRESSIVE" ? (
              <div style={{background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, padding:14}}>
                <div style={{fontSize:13,marginBottom:12}}>You are <strong style={{color:"#ff6666"}}>AGGRESSIVE</strong>. Choose a team to wage war against.</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <select value={warTgt} onChange={e=>setWarTgt(e.target.value)} style={{maxWidth:250}}>
                    <option value="">Select target...</option>
                    {IDS.filter(t=>t!==teamId).map(t=><option key={t} value={t}>{TC[t].em} {TC[t].name}</option>)}
                  </select>
                  <button className="btn" disabled={!warTgt} onClick={()=>{
                    wageWar(teamId, warTgt);
                    setWarTgt("");
                  }} style={{background:"rgba(255,50,50,.2)",color:"#ff6666",border:"1px solid #ff333344"}}>⚔️ WAGE WAR</button>
                </div>
              </div>
            ) : (
              <div style={{padding:14,borderRadius:8,background:"rgba(0,200,100,.06)",border:"1px solid rgba(0,200,100,.18)"}}>
                🛡️ Defensive stance — waiting for someone to declare war or send an alliance request.
              </div>
            )}
          </div>
        )}

        {activeWar && (
          <div style={{background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,marginBottom:14,borderBottom:"1px solid rgba(255,255,255,.05)",paddingBottom:10}}>
              <span>⚔️ WAR ACTIVE:</span>
              <span style={{color:TC[activeWar.attacker]?.color}}>{TC[activeWar.attacker]?.em} {TC[activeWar.attacker]?.name}</span>
              {activeWar.attackerAlly && (
                <>
                  <span>+</span>
                  <span style={{color:TC[activeWar.attackerAlly]?.color}}>{TC[activeWar.attackerAlly]?.em} {TC[activeWar.attackerAlly]?.name}</span>
                </>
              )}
              <span style={{opacity:.5,fontSize:12}}>vs</span>
              <span style={{color:TC[activeWar.defender]?.color}}>{TC[activeWar.defender]?.em} {TC[activeWar.defender]?.name}</span>
              {activeWar.defenderAlly && (
                <>
                  <span>+</span>
                  <span style={{color:TC[activeWar.defenderAlly]?.color}}>{TC[activeWar.defenderAlly]?.em} {TC[activeWar.defenderAlly]?.name}</span>
                </>
              )}
            </div>

            {warRole === "attacker" && !activeWar.attackerAlly && (
              <div style={{marginBottom:18,background:"rgba(253,224,71,.04)",border:"1px solid rgba(253,224,71,.15)",padding:12,borderRadius:8}}>
                <div style={{fontSize:12,marginBottom:8,color:"#fde047"}}>🤝 Recruit an Ally for this battle:</div>
                {proposalTo ? (
                  <div style={{fontSize:12,opacity:.7}}>
                    ⏳ Waiting for <strong style={{color:"#fde047"}}>{TC[proposalTo]?.name}</strong>...
                    <button className="btn" onClick={()=>cancelAllianceProposal(teamId)} style={{marginLeft:12,padding:"4px 8px",fontSize:9}}>Cancel</button>
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8}}>
                    <select value={allyTgt} onChange={e=>setAllyTgt(e.target.value)} style={{maxWidth:200}}>
                      <option value="">Select ally...</option>
                      {IDS.filter(t=>t!==teamId && t!==activeWar.defender && !teams[t]?.allianceWith).map(t=><option key={t} value={t}>{TC[t].em} {TC[t].name}</option>)}
                    </select>
                    <button className="btn" disabled={!allyTgt} onClick={()=>{
                      proposeAlliance(teamId, allyTgt);
                      setAllyTgt("");
                    }} style={{background:"rgba(253,224,71,.15)",color:"#fde047",border:"1px solid rgba(253,224,71,.3)"}}>🤝 PROPOSE ALLIANCE</button>
                  </div>
                )}
              </div>
            )}

            {warRole === "defender" && !activeWar.defenderAlly && (
              <div style={{marginBottom:18,background:"rgba(253,224,71,.04)",border:"1px solid rgba(253,224,71,.15)",padding:12,borderRadius:8}}>
                <div style={{fontSize:12,marginBottom:8,color:"#fde047"}}>🤝 Recruit an Ally for this defense:</div>
                {proposalTo ? (
                  <div style={{fontSize:12,opacity:.7}}>
                    ⏳ Waiting for <strong style={{color:"#fde047"}}>{TC[proposalTo]?.name}</strong>...
                    <button className="btn" onClick={()=>cancelAllianceProposal(teamId)} style={{marginLeft:12,padding:"4px 8px",fontSize:9}}>Cancel</button>
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8}}>
                    <select value={allyTgt} onChange={e=>setAllyTgt(e.target.value)} style={{maxWidth:200}}>
                      <option value="">Select ally...</option>
                      {IDS.filter(t=>t!==teamId && t!==activeWar.attacker && !teams[t]?.allianceWith).map(t=><option key={t} value={t}>{TC[t].em} {TC[t].name}</option>)}
                    </select>
                    <button className="btn" disabled={!allyTgt} onClick={()=>{
                      proposeAlliance(teamId, allyTgt);
                      setAllyTgt("");
                    }} style={{background:"rgba(253,224,71,.15)",color:"#fde047",border:"1px solid rgba(253,224,71,.3)"}}>🤝 PROPOSE ALLIANCE</button>
                  </div>
                )}
              </div>
            )}

            <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",padding:12,borderRadius:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div className="ob" style={{fontSize:10,letterSpacing:1,color:"#ff8c00"}}>🚀 MISSILE ATTACK LAUNCHER</div>
                <div style={{fontSize:12}}>
                  Missiles: <strong style={{color:"#fde047"}}>{availMissiles}</strong> / {totalMissiles} left (each deals 200 damage)
                </div>
              </div>

              {(teamId === activeWar.attacker || teamId === activeWar.attackerAlly) && (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
                    <div>
                      <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Target</div>
                      <select value={atkTeamTgt} onChange={e=>setAtkTeamTgt(e.target.value)}>
                        <option value="">Choose target...</option>
                        {activeWar.defenderAlly ? (
                          <option value={[activeWar.defender, activeWar.defenderAlly].sort().join("_")}>ALLIANCE: {TC[activeWar.defender].name} & {TC[activeWar.defenderAlly].name}</option>
                        ) : (
                          <option value={activeWar.defender}>{TC[activeWar.defender].em} {TC[activeWar.defender].name}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Target Safe</div>
                      <select value={atkSafe} onChange={e=>setAtkSafe(e.target.value)}>
                        {[0,1,2,3,4].map(i=>{
                          let tStatus = null;
                          if (atkTeamTgt) {
                            if (atkTeamTgt.includes("_")) {
                              tStatus = (alliances?.[atkTeamTgt]?.safeStatus || [])[i];
                            } else {
                              tStatus = (teams[atkTeamTgt]?.safeStatus || [])[i];
                            }
                          }
                          return <option key={i} value={i} disabled={tStatus==="destroyed"}>Safe #{i+1} {tStatus==="destroyed"?"(💥)":""}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Missiles</div>
                      <input type="number" min="1" max={availMissiles} value={atkMissiles} onChange={e=>setAtkMissiles(e.target.value)}/>
                    </div>
                    <button className="btn" disabled={availMissiles<=0 || !atkTeamTgt || !locked} onClick={()=>{
                      const m = parseInt(atkMissiles);
                      if(!atkTeamTgt) return showToast("Select target!", "warning");
                      if(!m || m <= 0) return showToast("Enter a valid missile count!","warning");
                      if(m > availMissiles) return showToast(`Only ${availMissiles} missiles left!`,"danger");
                      queueAttack(isAl?alId:teamId, atkTeamTgt, parseInt(atkSafe), m);
                      setAtkMissiles("1");
                    }} style={{background:"rgba(255,50,50,.2)",color:"#ff6666",border:"1px solid #ff333344"}}>🚀 LAUNCH</button>
                  </div>
                </div>
              )}

              {(teamId === activeWar.defender || teamId === activeWar.defenderAlly) && (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
                    <div>
                      <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Target</div>
                      <select value={atkTeamTgt} onChange={e=>setAtkTeamTgt(e.target.value)}>
                        <option value="">Choose target...</option>
                        {activeWar.attackerAlly ? (
                          <option value={[activeWar.attacker, activeWar.attackerAlly].sort().join("_")}>ALLIANCE: {TC[activeWar.attacker].name} & {TC[activeWar.attackerAlly].name}</option>
                        ) : (
                          <option value={activeWar.attacker}>{TC[activeWar.attacker].em} {TC[activeWar.attacker].name}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Target Safe</div>
                      <select value={atkSafe} onChange={e=>setAtkSafe(e.target.value)}>
                        {[0,1,2,3,4].map(i=>{
                          let tStatus = null;
                          if (atkTeamTgt) {
                            if (atkTeamTgt.includes("_")) {
                              tStatus = (alliances?.[atkTeamTgt]?.safeStatus || [])[i];
                            } else {
                              tStatus = (teams[atkTeamTgt]?.safeStatus || [])[i];
                            }
                          }
                          return <option key={i} value={i} disabled={tStatus==="destroyed"}>Safe #{i+1} {tStatus==="destroyed"?"(💥)":""}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:11,opacity:.5,marginBottom:4}}>Missiles</div>
                      <input type="number" min="1" max={availMissiles} value={atkMissiles} onChange={e=>setAtkMissiles(e.target.value)}/>
                    </div>
                    <button className="btn" disabled={availMissiles<=0 || !atkTeamTgt || !locked} onClick={()=>{
                      const m = parseInt(atkMissiles);
                      if(!atkTeamTgt) return showToast("Select target!", "warning");
                      if(!m || m <= 0) return showToast("Enter a valid missile count!","warning");
                      if(m > availMissiles) return showToast(`Only ${availMissiles} missiles left!`,"danger");
                      queueAttack(isAl?alId:teamId, atkTeamTgt, parseInt(atkSafe), m);
                      setAtkMissiles("1");
                    }} style={{background:"rgba(255,50,50,.2)",color:"#ff6666",border:"1px solid #ff333344"}}>🚀 LAUNCH</button>
                  </div>
                </div>
              )}

              {!locked && <div style={{fontSize:11,color:"#ff5555",marginTop:8}}>⚠️ You must seal your vaults first before launching missile attacks!</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHOP MODAL
═══════════════════════════════════════════════ */
function ShopModal({teamId,team,onBuy,onClose}){
  const cfg=TC[teamId];
  const [confirm,setConfirm]=useState(false);
  return (
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)"}}
      onClick={e=>{if(e.target===e.currentTarget){onClose();setConfirm(false);}}}>
      <div style={{width:420,borderRadius:14,overflow:"hidden",
        background:"rgba(11,11,30,.97)",border:`1px solid rgba(${cfg.rgb},.35)`,
        boxShadow:`0 0 40px rgba(${cfg.rgb},.2),0 20px 60px rgba(0,0,0,.6)`}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid rgba(255,255,255,.07)",
          background:`rgba(${cfg.rgb},.08)`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:22}}>🛒</span>
            <div>
              <div className="ob" style={{color:cfg.color,fontSize:13,letterSpacing:3}}>STONE MARKET</div>
              <div style={{fontSize:11,opacity:.5,marginTop:1}}>Spend your gold wisely</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div className="ob" style={{color:"#fde047",fontSize:15,fontWeight:700}}>{team.gold.toLocaleString()} <span style={{fontSize:10,opacity:.6}}>Au</span></div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",
              borderRadius:6,width:28,height:28,cursor:"pointer",color:"#e0e0ff",fontSize:16,
              display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:10}}>
          {SHOP_ITEMS.map(item=>{
            const canAfford=team.gold>=item.price;
            return (
              <div key={item.id} style={{padding:"16px",borderRadius:10,
                background:canAfford?"rgba(255,255,255,.04)":"rgba(255,255,255,.02)",
                border:`1px solid ${canAfford?`rgba(${cfg.rgb},.25)`:"rgba(255,255,255,.06)"}`,
                display:"flex",alignItems:"center",gap:14,opacity:canAfford?1:.5}}>
                <div style={{fontSize:36,filter:canAfford?`drop-shadow(0 0 10px rgba(${cfg.rgb},.5))`:"none"}}>{item.icon}</div>
                <div style={{flex:1}}>
                  <div className="ob" style={{fontSize:12,color:canAfford?cfg.color:"rgba(255,255,255,.4)",letterSpacing:1}}>{item.name}</div>
                  <div style={{fontSize:12,opacity:.55,marginTop:3,lineHeight:1.4}}>{item.desc}</div>
                  {(team.hints||0)>0&&<div style={{fontSize:11,color:"#fde047",marginTop:4}}>✓ Purchased {team.hints}×</div>}
                </div>
                <div style={{textAlign:"center",minWidth:80}}>
                  <div className="ob" style={{color:"#fde047",fontSize:14,fontWeight:700,marginBottom:6}}>{item.price} Au</div>
                  <button className="btn" onClick={()=>{
                    if(!confirm){setConfirm(true);return;}
                    onBuy(item);setConfirm(false);
                  }} disabled={!canAfford}
                    style={{background:confirm?"rgba(255,200,0,.25)":canAfford?`rgba(${cfg.rgb},.2)`:"rgba(255,255,255,.05)",
                      color:confirm?"#fde047":canAfford?cfg.color:"rgba(255,255,255,.3)",
                      border:`1px solid ${confirm?"rgba(255,200,0,.4)":canAfford?`rgba(${cfg.rgb},.4)`:"rgba(255,255,255,.08)"}`,
                      padding:"7px 14px",fontSize:10}}>
                    {confirm?"CONFIRM?":"BUY"}
                  </button>
                  {confirm&&<button onClick={()=>setConfirm(false)}
                    style={{marginTop:4,background:"none",border:"none",color:"rgba(255,255,255,.4)",
                      fontSize:11,cursor:"pointer",display:"block",width:"100%"}}>cancel</button>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:"12px 22px",borderTop:"1px solid rgba(255,255,255,.06)",fontSize:11,opacity:.4,textAlign:"center"}}>
          Show this screen to the Organiser to claim your hint.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM PANEL
═══════════════════════════════════════════════ */
function TeamPanel({teamId,round,teams,locked,alliances,attacks,wars,handlers}){
  const cfg=TC[teamId],team=teams[teamId];
  const {setStrategy,giveDiplomacy,allocateSafe,lockSafes,queueAttack,showToast,buyHint}=handlers;
  const [tab,setTab]=useState(Math.min(round,4));
  const [shopOpen,setShopOpen]=useState(false);
  useEffect(()=>setTab(Math.min(round,4)),[round]);
  useEffect(()=>{setShopOpen(false);setTab(Math.min(round,4));},[teamId]);

  const TABS=[{id:1,l:"SCRAMBLE"},{id:2,l:"FORTIFY"},{id:3,l:"STRATEGY"},{id:4,l:"ENDGAME"}];
  const maxHp=Math.max(...IDS.map(t=>getTeamHp(teams[t], round)),1);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18,position:"relative"}}>
      <button onClick={()=>setShopOpen(true)}
        style={{position:"fixed",bottom:28,right:28,zIndex:200,width:56,height:56,
          borderRadius:"50%",border:`2px solid rgba(${cfg.rgb},.5)`,
          background:`rgba(${cfg.rgb},.15)`,backdropFilter:"blur(12px)",
          cursor:"pointer",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:`0 0 20px rgba(${cfg.rgb},.3),0 4px 20px rgba(0,0,0,.5)`,transition:"all .2s"}}
        onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}
        title="Open Stone Market">
        🛒
        {(team.hints||0)>0&&(
          <div style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:"50%",
            background:"#fde047",color:"#0b0b1e",fontSize:10,fontWeight:700,
            display:"flex",alignItems:"center",justifyContent:"center"}}>{team.hints}</div>
        )}
      </button>
      {shopOpen&&<ShopModal teamId={teamId} team={team}
        onBuy={(item)=>{buyHint(teamId,item);setShopOpen(false);}}
        onClose={()=>setShopOpen(false)}/>}

      <div style={{padding:"20px 24px",borderRadius:12,position:"relative",overflow:"hidden",
        background:`rgba(${cfg.rgb},.06)`,border:`1px solid rgba(${cfg.rgb},.25)`,boxShadow:`0 0 40px rgba(${cfg.rgb},.08)`}}>
        <div style={{position:"absolute",top:-30,right:-20,width:150,height:150,borderRadius:"50%",
          background:`rgba(${cfg.rgb},.07)`,filter:"blur(28px)",pointerEvents:"none"}}/>
        <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap",position:"relative"}}>
          <div style={{fontSize:54,filter:`drop-shadow(0 0 20px rgba(${cfg.rgb},.75))`}}>{cfg.em}</div>
          <div>
            <div className="ob" style={{fontSize:22,color:cfg.color,fontWeight:900,letterSpacing:5}}>{cfg.name.toUpperCase()} TEAM</div>
            <div style={{fontSize:11,opacity:.4,letterSpacing:3,marginTop:2}}>STONE BEARER TERMINAL</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:22,flexWrap:"wrap",alignItems:"center"}}>
            <div><div style={{fontSize:10,opacity:.45,letterSpacing:1,marginBottom:3}}>GOLD</div><GoldBadge gold={team.gold}/></div>
            <div style={{minWidth:160}}><HPBar hp={getTeamHp(team, round)} maxHp={maxHp} color={cfg.color}/></div>
            {team.strategy&&<div>
              <div style={{fontSize:10,opacity:.45,marginBottom:4}}>STANCE</div>
              <span style={{padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700,
                background:team.strategy==="AGGRESSIVE"?"rgba(255,50,50,.15)":"rgba(0,200,100,.15)",
                border:`1px solid ${team.strategy==="AGGRESSIVE"?"#ff333355":"#00ff8855"}`,
                color:team.strategy==="AGGRESSIVE"?"#ff7777":"#00ff88",fontFamily:"'Orbitron',sans-serif"}}>
                {team.strategy==="AGGRESSIVE"?"⚔️ AGGRO":"🛡️ PASSIVE"}
              </span>
            </div>}
            {team.allianceWith&&<div>
              <div style={{fontSize:10,opacity:.45,marginBottom:4}}>ALLIANCE</div>
              <span style={{padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:700,
                background:"rgba(253,224,71,.15)",border:"1px solid rgba(253,224,71,.4)",color:"#fde047",
                fontFamily:"'Orbitron',sans-serif"}}>🤝 {TC[team.allianceWith].name}</span>
            </div>}
          </div>
        </div>
      </div>

      <div className="gl" style={{padding:"18px 20px"}}>
        <div style={{display:"flex",gap:6,marginBottom:18,borderBottom:"1px solid rgba(255,255,255,.07)",paddingBottom:14}}>
          {TABS.map(t=>{
            const ok=t.id<=round;
            return (
              <button key={t.id} onClick={()=>ok&&setTab(t.id)} disabled={!ok} style={{
                background:tab===t.id?`rgba(${cfg.rgb},.14)`:"transparent",
                border:`1px solid ${tab===t.id?`rgba(${cfg.rgb},.4)`:"rgba(255,255,255,.09)"}`,
                borderRadius:6,padding:"7px 14px",cursor:ok?"pointer":"not-allowed",
                color:!ok?"rgba(255,255,255,.2)":tab===t.id?cfg.color:"rgba(255,255,255,.45)",
                fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:1,
                boxShadow:tab===t.id?`0 0 10px rgba(${cfg.rgb},.2)`:"none",transition:"all .2s",
              }}>{!ok&&"🔒 "}{t.l}</button>
            );
          })}
        </div>
        <div className="fi">
          {tab===1&&<TR1 teamId={teamId} team={team}/>}
          {tab===2&&<TR2 teamId={teamId} team={team} allTeams={teams} giveDiplomacy={giveDiplomacy} showToast={showToast}/>}
           {tab===3&&<TR3 teamId={teamId} team={team} locked={locked} setStrategy={setStrategy}/>}
           {tab===4&&<TR4 teamId={teamId} team={team} teams={teams} attacks={attacks} wars={wars} alliances={alliances}
             allocateSafe={allocateSafe} lockSafes={lockSafes} queueAttack={queueAttack} showToast={showToast} handlers={handlers}/>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════ */
export default function App(){
  const hashTeam=window.location.hash.replace("#","");
  const lockedTeam=IDS.includes(hashTeam)?hashTeam:null;

  const [adminUnlocked,setAdminUnlocked]=useState(false);
  const [view,setView]=useState(lockedTeam||"admin");
  const [toast,setToast]=useState(null);
  const [snap,setSnap]=useState(false);
  const [loading,setLoading]=useState(true);
  const [gameState,setGameState]=useState(DEFAULT_STATE);

  const toast_=(msg,type="info")=>setToast({msg,type,k:Date.now()});

  useEffect(()=>{
    const gameRef=ref(db,"game");
    const unsub=onValue(gameRef,(snap)=>{
      const data=snap.val();
      if(data){
        const merged={
          ...DEFAULT_STATE,...data,
          teams:IDS.reduce((acc,tid)=>({...acc,[tid]:{...mkTeam(),...(data.teams?.[tid]||{})}}),{}),
          alliances:data.alliances||{},
          wars:data.wars||{},
        };
        setGameState(merged);
      } else { set(gameRef,DEFAULT_STATE); }
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  const fbSet=(path,value)=>set(ref(db,path),value);
  const addLog=useCallback((m)=>{
    const id=Date.now();
    const t=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    set(ref(db,`game/logs/${id}`),{m,t,ts:id});
  },[]);

  const toggleQ=useCallback((tid,qi)=>{
    const tm=gameState.teams[tid];
    if((tm.qSkips||[])[qi])return;
    const nq=[...(tm.questions||Array(6).fill(false))];
    const was=nq[qi];nq[qi]=!was;
    const d=was?-QV[qi]:QV[qi];
    const gold=Math.max(0,tm.gold+d);
    fbSet(`game/teams/${tid}/questions`,nq);
    fbSet(`game/teams/${tid}/gold`,gold);
    addLog(`${TC[tid].name}: Q${qi+1} ${was?"revoked":"✅ approved"} (${d>0?"+":""}${d}g → ${gold}g)`);
    if(gold===3000)setTimeout(()=>toast_("💛 I Love You 3000!","love"),50);
  },[gameState.teams,addLog]);

  const toggleHint=useCallback((tid,qi)=>{
    const tm=gameState.teams[tid];
    if((tm.qHints||[])[qi]||(tm.qSkips||[])[qi]||(tm.questions||[])[qi])return;
    const cost=hintCost(qi);
    if(tm.gold<cost){toast_("Not enough gold for hint!","danger");return;}
    const nq=[...(tm.qHints||Array(6).fill(false))];nq[qi]=true;
    fbSet(`game/teams/${tid}/qHints`,nq);
    fbSet(`game/teams/${tid}/gold`,tm.gold-cost);
    addLog(`${TC[tid].name}: 💡 Hint Q${qi+1} (-${cost}g)`);
    toast_(`💡 Hint purchased for ${TC[tid].name} Q${qi+1}!`,"success");
  },[gameState.teams,addLog]);

  const toggleSkip=useCallback((tid,qi)=>{
    const tm=gameState.teams[tid];
    if((tm.qSkips||[])[qi]||(tm.questions||[])[qi])return;
    const cost=skipCost(qi);
    if(tm.gold<cost){toast_("Not enough gold to skip!","danger");return;}
    const ns=[...(tm.qSkips||Array(6).fill(false))];ns[qi]=true;
    fbSet(`game/teams/${tid}/qSkips`,ns);
    fbSet(`game/teams/${tid}/gold`,tm.gold-cost);
    addLog(`${TC[tid].name}: ⏭ Skipped Q${qi+1} (-${cost}g)`);
    toast_(`⏭ Q${qi+1} skipped for ${TC[tid].name}.`,"warning");
  },[gameState.teams,addLog]);

  const addAttempt=useCallback((tid,qi)=>{
    const tm=gameState.teams[tid];
    if((tm.qSkips||[])[qi]||(tm.questions||[])[qi])return;
    if(tm.gold<ATTEMPT_COST){toast_("Not enough gold!","danger");return;}
    const na=[...(tm.qAttempts||Array(6).fill(0))];na[qi]=(na[qi]||0)+1;
    fbSet(`game/teams/${tid}/qAttempts`,na);
    fbSet(`game/teams/${tid}/gold`,tm.gold-ATTEMPT_COST);
    addLog(`${TC[tid].name}: ⚡ Attempt Q${qi+1} (-${ATTEMPT_COST}g, ×${na[qi]})`);
  },[gameState.teams,addLog]);

  const setZOpt=useCallback((tid,val)=>{
    const z=parseFloat(val)||0,hp=500+Math.round(z*5);
    fbSet(`game/teams/${tid}/zOpt`,val);
    fbSet(`game/teams/${tid}/hp`,hp);
    if(val)addLog(`${TC[tid].name}: Z_opt=${val} → ${hp} HP`);
  },[addLog]);

  const giveDiplomacy=useCallback((frId,toId,amt)=>{
    const fr=gameState.teams[frId],to=gameState.teams[toId];
    if(fr.hp<amt){toast_("Insufficient HP!","danger");return;}
    const ts=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"});
    const frLog=[{dir:"out",fr:frId,to:toId,hp:amt,t:ts},...(fr.diplomacyLog||[])];
    const toLog=[{dir:"in", fr:frId,to:toId,hp:amt,t:ts},...(to.diplomacyLog||[])];
    fbSet(`game/teams/${frId}/hp`,fr.hp-amt);
    fbSet(`game/teams/${toId}/hp`,to.hp+amt);
    fbSet(`game/teams/${frId}/diplomacyLog`,frLog);
    fbSet(`game/teams/${toId}/diplomacyLog`,toLog);
    addLog(`DIPLOMACY: ${TC[frId].name} → ${TC[toId].name}: ${amt} HP`);
    toast_(`🤝 ${TC[frId].name} → ${TC[toId].name}: ${amt} HP`,"success");
  },[gameState.teams,addLog]);

  const setStrategy=useCallback((tid,strategy)=>{
    if(gameState.locked)return;
    fbSet(`game/teams/${tid}/strategy`,strategy);
    addLog(`${TC[tid].name}: ${strategy}`);
  },[gameState.locked,addLog]);

  const lockStrategies=useCallback(()=>{
    fbSet("game/locked",true);
    toast_("⚔️ War Council concluded. All stances are final.","warning");
    addLog("ADMIN: Strategies locked.");
  },[addLog]);

  const proposeAlliance=useCallback((fromId,toId)=>{
    const fr=gameState.teams[fromId];
    if(fr.allianceWith||fr.allianceProposalTo||fr.allianceProposalFrom)return;
    fbSet(`game/teams/${fromId}/allianceProposalTo`,toId);
    fbSet(`game/teams/${toId}/allianceProposalFrom`,fromId);
    addLog(`🤝 ${TC[fromId].name} proposed an alliance to ${TC[toId].name}`);
    toast_(`Alliance proposal sent to ${TC[toId].name}`,"info");
  },[gameState.teams,addLog]);

  const cancelAllianceProposal=useCallback((fromId)=>{
    const fr=gameState.teams[fromId];
    const toId=fr.allianceProposalTo;
    if(!toId)return;
    fbSet(`game/teams/${fromId}/allianceProposalTo`,null);
    fbSet(`game/teams/${toId}/allianceProposalFrom`,null);
    addLog(`${TC[fromId].name} cancelled their alliance proposal.`);
  },[gameState.teams,addLog]);

  const acceptAlliance=useCallback((teamId)=>{
    const tm=gameState.teams[teamId];
    const fromId=tm.allianceProposalFrom;
    if(!fromId)return;
    const fr=gameState.teams[fromId];
    
    fbSet(`game/teams/${fromId}/allianceWith`,teamId);
    fbSet(`game/teams/${fromId}/allianceProposalTo`,null);
    fbSet(`game/teams/${fromId}/allianceProposalFrom`,null);
    fbSet(`game/teams/${teamId}/allianceWith`,fromId);
    fbSet(`game/teams/${teamId}/allianceProposalTo`,null);
    fbSet(`game/teams/${teamId}/allianceProposalFrom`,null);

    const allianceId=[fromId,teamId].sort().join("_");
    const getTeamBaseHp = (t) => (t.hp || 0) + (t.strategy === "PASSIVE" ? 500 : 0);
    const avgGold=Math.floor(((tm.gold||0)+(fr.gold||0))/2);
    const avgHp=Math.floor((getTeamBaseHp(tm)+getTeamBaseHp(fr))/2);
    fbSet(`game/alliances/${allianceId}`, mkAlliance(fromId,teamId,avgGold,avgHp));

    const activeWar = Object.values(gameState.wars || {}).find(w => w.status === 'active' && (w.attacker === fromId || w.defender === fromId || w.attacker === teamId || w.defender === teamId));
    if(activeWar) {
      if (activeWar.attacker === fromId) fbSet(`game/wars/${activeWar.id}/attackerAlly`, teamId);
      else if (activeWar.defender === fromId) fbSet(`game/wars/${activeWar.id}/defenderAlly`, teamId);
      else if (activeWar.attacker === teamId) fbSet(`game/wars/${activeWar.id}/attackerAlly`, fromId);
      else if (activeWar.defender === teamId) fbSet(`game/wars/${activeWar.id}/defenderAlly`, fromId);
    }

    addLog(`🤝 ALLIANCE FORMED: ${TC[fromId].name} + ${TC[teamId].name}`);
    toast_(`🤝 Alliance formed: ${TC[fromId].name} + ${TC[teamId].name}!`, "success");
  },[gameState.teams,gameState.wars,addLog]);

  const declineAlliance=useCallback((teamId)=>{
    const tm=gameState.teams[teamId];
    const fromId=tm.allianceProposalFrom;
    if(!fromId)return;
    fbSet(`game/teams/${fromId}/allianceProposalTo`,null);
    fbSet(`game/teams/${teamId}/allianceProposalFrom`,null);
    addLog(`${TC[teamId].name} declined the alliance from ${TC[fromId].name}.`);
    toast_("Alliance declined.","warning");
  },[gameState.teams,addLog]);

  const allocateSafe=useCallback((tid,i,val)=>{
    const tm=gameState.teams[tid];
    if(tm.safesLocked)return;
    const safes=[...(tm.safes||[0,0,0,0,0])];
    safes[i]=Math.max(0,parseInt(val)||0);
    fbSet(`game/teams/${tid}/safes`, safes);
  },[gameState.teams]);

  const allocateSafeHp=useCallback((tid,i,val)=>{
    const tm=gameState.teams[tid];
    if(tm.safesLocked)return;
    const safeHp=[...(tm.safeHp||[0,0,0,0,0])];
    safeHp[i]=Math.max(0,parseInt(val)||0);
    fbSet(`game/teams/${tid}/safeHp`,safeHp);
  },[gameState.teams]);

  const lockSafes=useCallback((tid)=>{
    const tm=gameState.teams[tid];
    const sumG=(Array.isArray(tm.safes)?tm.safes:Object.values(tm.safes||{})).reduce((a,b)=>a+(Number(b)||0),0);
    if(sumG!==tm.gold)return;
    const sumH=(Array.isArray(tm.safeHp)?tm.safeHp:Object.values(tm.safeHp||{})).reduce((a,b)=>a+(Number(b)||0),0);
    if(sumH!==tm.hp)return;
    fbSet(`game/teams/${tid}/safesLocked`,true);
    addLog(`${TC[tid].name}: Vaults sealed.`);
  },[gameState.teams,addLog]);

  const allocateAllianceSafe=useCallback((allianceId,i,val)=>{
    const a=gameState.alliances[allianceId];
    if(!a||a.sealed)return;
    const safes=[...(a.safes||[0,0,0,0,0])];
    safes[i]=Math.max(0,parseInt(val)||0);
    fbSet(`game/alliances/${allianceId}/safes`,safes);
  },[gameState.alliances]);

  const allocateAllianceSafeHp=useCallback((allianceId,i,val)=>{
    const a=gameState.alliances[allianceId];
    if(!a||a.sealed)return;
    const safeHp=[...(a.safeHp||[0,0,0,0,0])];
    safeHp[i]=Math.max(0,parseInt(val)||0);
    fbSet(`game/alliances/${allianceId}/safeHp`,safeHp);
  },[gameState.alliances]);

  const sealAllianceVault=useCallback((allianceId)=>{
    const a=gameState.alliances[allianceId];
    if(!a)return;
    const sumG=(a.safes||[]).reduce((x,y)=>x+y,0);
    const sumH=(a.safeHp||[]).reduce((x,y)=>x+y,0);
    if(sumG!==a.gold||sumH!==a.hp){toast_("Alliance totals don't match!","danger");return;}
    fbSet(`game/alliances/${allianceId}/sealed`,true);
    const [m1,m2]=a.members;
    addLog(`🤝 Alliance vault sealed: ${TC[m1].name}+${TC[m2].name} — ${a.gold}Au / ${a.hp}HP committed.`);
    toast_("🤝 Alliance vault sealed! Ready to strike.","success");
  },[gameState.alliances,addLog]);

  const wageWar=useCallback((attackerId, defenderId)=>{
    const warId=`war_${attackerId}_${defenderId}_${Date.now()}`;
    fbSet(`game/wars/${warId}`, {
      id: warId,
      attacker: attackerId,
      defender: defenderId,
      attackerAlly: null,
      defenderAlly: null,
      status: "active",
      createdAt: Date.now()
    });
    addLog(`⚔️ WAR DECLARED: ${TC[attackerId].name} has declared war on ${TC[defenderId].name}!`);
    toast_(`War declared on ${TC[defenderId].name}!`, "warning");
  },[addLog]);

  const concludeWar=useCallback((warId)=>{
    const war = (gameState.wars || {})[warId];
    if(!war || war.status === "resolved") return;
    
    const processAlliance = (idA, idB) => {
      if(!idA || !idB) return;
      const allianceId = [idA, idB].sort().join("_");
      const al = (gameState.alliances || {})[allianceId];
      if(!al) return;
      
      const tmA = gameState.teams[idA];
      const tmB = gameState.teams[idB];
      
      const initialAvgGold = Math.floor(((tmA.gold||0) + (tmB.gold||0)) / 2);
      const diffGold = (al.gold || 0) - initialAvgGold;
      
      fbSet(`game/teams/${idA}/gold`, Math.max(0, tmA.gold + Math.floor(diffGold / 2)));
      fbSet(`game/teams/${idB}/gold`, Math.max(0, tmB.gold + Math.floor(diffGold / 2)));
    };

    if (war.attackerAlly) processAlliance(war.attacker, war.attackerAlly);
    if (war.defenderAlly) processAlliance(war.defender, war.defenderAlly);

    fbSet(`game/wars/${warId}/status`, "resolved");
    fbSet(`game/teams/${war.attacker}/allianceWith`, null);
    fbSet(`game/teams/${war.attacker}/allianceProposalTo`, null);
    fbSet(`game/teams/${war.attacker}/allianceProposalFrom`, null);
    fbSet(`game/teams/${war.attacker}/safesLocked`, false);
    fbSet(`game/teams/${war.defender}/allianceWith`, null);
    fbSet(`game/teams/${war.defender}/allianceProposalTo`, null);
    fbSet(`game/teams/${war.defender}/allianceProposalFrom`, null);
    fbSet(`game/teams/${war.defender}/safesLocked`, false);
    if(war.attackerAlly) {
      fbSet(`game/teams/${war.attackerAlly}/allianceWith`, null);
      fbSet(`game/teams/${war.attackerAlly}/allianceProposalTo`, null);
      fbSet(`game/teams/${war.attackerAlly}/allianceProposalFrom`, null);
      fbSet(`game/teams/${war.attackerAlly}/safesLocked`, false);
    }
    if(war.defenderAlly) {
      fbSet(`game/teams/${war.defenderAlly}/allianceWith`, null);
      fbSet(`game/teams/${war.defenderAlly}/allianceProposalTo`, null);
      fbSet(`game/teams/${war.defenderAlly}/allianceProposalFrom`, null);
      fbSet(`game/teams/${war.defenderAlly}/safesLocked`, false);
    }
    addLog(`🏁 WAR CONCLUDED: The war between ${TC[war.attacker].name} and ${TC[war.defender].name} has finished.`);
    toast_("War concluded.", "info");
  },[gameState.wars, gameState.teams, gameState.alliances, addLog]);

  const queueAttack=useCallback((attackerId,targetId,safeIdx,missiles)=>{
    const atkType = attackerId.includes("_") ? "alliance" : "team";
    const tgtType = targetId.includes("_") ? "alliance" : "team";
    const id=Date.now();
    const atk={id,attackerType:atkType,attackerId,targetType:tgtType,targetId,safeIdx,missiles,status:"pending",
      time:new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})};
    set(ref(db,`game/attacks/${id}`),atk);
    addLog(`ATTACK QUEUED: S#${safeIdx+1} targeted with ${missiles} missiles`);
    toast_("🚀 Attack queued. Cipher pending.","warning");
  },[addLog]);

  const approveAtk=useCallback((atk)=>{
    const attSide=getSide(atk.attackerType||"team",atk.attackerId,gameState.teams,gameState.alliances,gameState.round);
    const defSide=getSide(atk.targetType||"team",atk.targetId,gameState.teams,gameState.alliances,gameState.round);
    if(!attSide||!defSide)return;

    const attPath=atk.attackerType==="alliance"?`game/alliances/${atk.attackerId}`:`game/teams/${atk.attackerId}`;
    const defPath=atk.targetType==="alliance"?`game/alliances/${atk.targetId}`:`game/teams/${atk.targetId}`;

    let attGold=attSide.gold;
    let attSafes=[...attSide.safes];
    let attSafeHp=[...attSide.safeHp];
    let attSafeStatus=[...attSide.safeStatus];

    let defGold=defSide.gold;
    let defSafes=[...defSide.safes];
    let defSafeHp=[...defSide.safeHp];
    let defSafeStatus=[...defSide.safeStatus];

    const damage = (atk.missiles || 0) * 200;
    defSafeHp[atk.safeIdx]=Math.max(0,(defSafeHp[atk.safeIdx]||0)-damage);
    
    let msg="",typ="info";
    if(defSafeHp[atk.safeIdx]<=0&&defSafeStatus[atk.safeIdx]!=="destroyed"){
      const stolen=defSafes[atk.safeIdx]||0;
      defSafes[atk.safeIdx]=0;
      defSafeStatus[atk.safeIdx]="destroyed";
      attGold+=stolen;
      if (stolen > 0) {
        if (atk.attackerType === "alliance") fbSet(`${attPath}/sealed`, false);
        else fbSet(`${attPath}/safesLocked`, false);
      }
      defGold=Math.max(0,defGold-stolen);
      msg=`💥 ${attSide.name} destroyed ${defSide.name}'s Safe #${atk.safeIdx+1} using ${atk.missiles} missiles! ${stolen.toLocaleString()} Au seized!`;
      typ="danger";
    } else {
      msg=`🛡️ ${attSide.name} dealt ${damage} HP to ${defSide.name}'s Safe #${atk.safeIdx+1} using ${atk.missiles} missiles.`;
      typ="warning";
    }

    fbSet(`${attPath}/gold`,attGold);
    fbSet(`${attPath}/safes`,attSafes);
    fbSet(`${attPath}/safeHp`,attSafeHp);
    fbSet(`${attPath}/safeStatus`,attSafeStatus);
    
    fbSet(`${defPath}/gold`,defGold);
    fbSet(`${defPath}/safes`,defSafes);
    fbSet(`${defPath}/safeHp`,defSafeHp);
    fbSet(`${defPath}/safeStatus`,defSafeStatus);
    
    fbSet(`game/attacks/${atk.id}/status`,"resolved");

    addLog(`SIEGE [${attSide.name}→${defSide.name}]: ${msg}`);
    toast_(msg,typ);
    
    if(attGold===3000){
      setTimeout(()=>toast_("💛 I Love You 3000!","love"),100);
    }
  },[gameState.teams,gameState.alliances,addLog]);

  const rejectAtk=useCallback((id)=>{
    fbSet(`game/attacks/${id}/status`,"rejected");
    addLog("CIPHER REJECTED.");
    toast_("❌ Cipher failed. Attack nullified.","danger");
  },[addLog]);

  const buyHint=useCallback((tid,item)=>{
    const tm=gameState.teams[tid];
    if(tm.gold<item.price){toast_("Not enough gold!","danger");return;}
    fbSet(`game/teams/${tid}/gold`,tm.gold-item.price);
    if(item.id==="missiles") {
      fbSet(`game/teams/${tid}/boughtMissiles`,(tm.boughtMissiles||0)+5);
      addLog(`🛒 ${TC[tid].name} purchased 5 Missiles (${item.price}Au)`);
      toast_("🚀 5 Missiles purchased!","success");
    } else {
      fbSet(`game/teams/${tid}/hints`,(tm.hints||0)+1);
      addLog(`🛒 ${TC[tid].name} purchased ${item.name} (${item.price}Au)`);
      toast_("💡 Hint purchased! Show this screen to the Organiser.","success");
    }
  },[gameState.teams,addLog]);

  const triggerSnap=useCallback(()=>{
    setSnap(true);
    toast_("Perfectly balanced, as all things should be.","snap");
    addLog("⚡ THANOS: The snap reverberates across the universe.");
    setTimeout(()=>setSnap(false),3200);
  },[addLog]);

  const advanceRound=useCallback(()=>{
    if(gameState.round>=4)return;
    const next=gameState.round+1;
    fbSet("game/round",next);
    addLog(`━━━ ROUND ${next} INITIATED ━━━`);
    if(next===4)toast_("⚡ We're in the endgame now.","endgame");
    else toast_(`🚀 Round ${next} activated!`,"info");
  },[gameState.round,addLog]);

  const NAV=[
    {id:"admin",  label:"⚡ ADMIN",  col:"#fde047"},
    {id:"space",  label:"💠 SPACE",  col:"#00d4ff"},
    {id:"reality",label:"🔴 REALITY",col:"#ff3333"},

    {id:"mind",   label:"💛 MIND",   col:"#fde047"},
    {id:"time",   label:"⏳ TIME",   col:"#00ff88"},
    {id:"soul",   label:"🔶 SOUL",   col:"#ff8c00"},
  ];

  const handlers={
    toggleQ,toggleHint,toggleSkip,addAttempt,
    setZOpt,giveDiplomacy,setStrategy,lockStrategies,
    proposeAlliance,cancelAllianceProposal,acceptAlliance,declineAlliance,
    allocateSafe,allocateSafeHp,lockSafes,
    allocateAllianceSafe,allocateAllianceSafeHp,sealAllianceVault,
    queueAttack,approveAtk,rejectAtk,
    buyHint,triggerSnap,advanceRound,showToast:toast_,
    wageWar,concludeWar,
  };

  const {round,locked,teams,attacks,logs,alliances,wars}=gameState;

  if(loading)return <Loader/>;
  if(!lockedTeam&&!adminUnlocked)return <PinScreen onUnlock={()=>setAdminUnlocked(true)}/>;

  return (
    <div style={{minHeight:"100vh",background:"#0b0b1e",position:"relative"}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <Stars/>
      {snap&&<div className="sn" style={{position:"fixed",inset:0,zIndex:900,pointerEvents:"none",
        background:"radial-gradient(ellipse at center,rgba(253,224,71,.22) 0%,transparent 65%)"}}/>}
      {snap&&<div style={{position:"fixed",left:0,right:0,height:3,top:0,zIndex:901,pointerEvents:"none",
        background:"linear-gradient(90deg,transparent,rgba(253,224,71,.95),transparent)",animation:"sl 2s linear"}}/>}

      <header style={{position:"sticky",top:0,zIndex:100,padding:"12px 20px",
        background:"rgba(11,11,30,.9)",backdropFilter:"blur(22px)",
        borderBottom:"1px solid rgba(255,255,255,.06)",boxShadow:"0 4px 30px rgba(0,0,0,.6)"}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div className="ob pg" style={{fontSize:20,fontWeight:900,letterSpacing:6}}>⚡ INFINITY WAR</div>
              <div className={round===4?"eg":""} style={{fontSize:11,letterSpacing:3,marginTop:2,
                color:round===4?"#ff5555":"rgba(255,255,255,.4)"}}>
                {round===4?"WE'RE IN THE ENDGAME NOW.":"TOURNAMENT SCORING SYSTEM"}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:10,opacity:.4,color:"#ff3333"}}>🔴 LIVE</div>
              <RDots cur={round}/>
            </div>
          </div>
          {!lockedTeam&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>setView(n.id)} style={{
                  fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,letterSpacing:1,padding:"7px 12px",
                  border:`1px solid ${view===n.id?n.col:"rgba(255,255,255,.09)"}`,borderRadius:6,cursor:"pointer",
                  background:view===n.id?`${n.col}22`:"rgba(0,0,0,.3)",
                  color:view===n.id?n.col:"rgba(255,255,255,.45)",
                  boxShadow:view===n.id?`0 0 12px ${n.col}44`:"none",transition:"all .2s",
                }}>{n.label}</button>
              ))}
            </div>
          )}
          {lockedTeam&&(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{TC[lockedTeam].em}</span>
              <span className="ob" style={{color:TC[lockedTeam].color,fontSize:12,letterSpacing:3}}>
                {TC[lockedTeam].name.toUpperCase()} TEAM TERMINAL
              </span>
            </div>
          )}
        </div>
      </header>

      <main style={{padding:"20px",maxWidth:1400,margin:"0 auto",position:"relative",zIndex:1}}>
        {lockedTeam
          ?<TeamPanel key={lockedTeam} teamId={lockedTeam} round={round} teams={teams} locked={locked} alliances={alliances} attacks={attacks||{}} wars={wars||{}} handlers={handlers}/>
          :view==="admin"
            ?<AdminPanel round={round} teams={teams} locked={locked} logs={logs||{}} attacks={attacks||{}} alliances={alliances||{}} wars={wars||{}} snap={snap} handlers={handlers}/>
            :<TeamPanel key={view} teamId={view} round={round} teams={teams} locked={locked} alliances={alliances} attacks={attacks||{}} wars={wars||{}} handlers={handlers}/>
        }
      </main>
      {toast&&<Toast key={toast.k} toast={toast} clear={()=>setToast(null)}/>}
    </div>
  );
}
