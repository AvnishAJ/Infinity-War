import { useState, useCallback, useEffect, useRef, memo } from "react";

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const TC = {
  space:   { name:"Space",   color:"#00d4ff", rgb:"0,212,255",  em:"💠" },
  reality: { name:"Reality", color:"#ff3333", rgb:"255,51,51",  em:"🔴" },
  power:   { name:"Power",   color:"#9b30ff", rgb:"155,48,255", em:"🔮" },
  mind:    { name:"Mind",    color:"#fde047", rgb:"253,224,71", em:"💛" },
  time:    { name:"Time",    color:"#00ff88", rgb:"0,255,136",  em:"⏳" },
  soul:    { name:"Soul",    color:"#ff8c00", rgb:"255,140,0",  em:"🔶" },
};
const IDS = Object.keys(TC);
const QV  = [100, 200, 300, 400, 500, 700, 850];
const WPN = [
  { id:"blaster", name:"Phase Blaster",   icon:"⚡" },
  { id:"beam",    name:"Infinity Beam",   icon:"✨" },
  { id:"loop",    name:"Time Loop Trap",  icon:"🌀" },
  { id:"shard",   name:"Reality Shard",   icon:"💎" },
  { id:"drain",   name:"Soul Drain",      icon:"👻" },
];

// ── Change this to whatever PIN you want ──
const ADMIN_PIN = "1408";

const mkTeam = () => ({
  gold:0, hp:0, zOpt:"", strategy:null, shield:null,
  safes:[0,0,0,0,0], safeStatus:["ok","ok","ok","ok","ok"],
  safesLocked:false, questions:Array(7).fill(false), diplomacyLog:[],
});

/* ═══════════════════════════════════════════════
   GLOBAL CSS
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
@keyframes eg{0%,100%{color:#ff5555;text-shadow:0 0 8px #ff3333}50%{color:#ff9999;text-shadow:0 0 30px #ff3333,0 0 60px #ff333566}}
@keyframes bh{0%,100%{transform:scale(1)}50%{transform:scale(1.38)}}
@keyframes sf{0%{opacity:1;filter:blur(0)brightness(1)}40%{opacity:.55;filter:blur(5px)brightness(1.5)}100%{opacity:0;filter:blur(16px)brightness(2.2)}}
@keyframes sl{0%{top:0}100%{top:100vh}}
@keyframes ti{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes ck{from{transform:scale(.55)rotate(-10deg);opacity:0}to{transform:scale(1)rotate(0);opacity:1}}
.pg{animation:pg 2.5s ease-in-out infinite;color:#fde047}
.eg{animation:eg 1.8s ease-in-out infinite}
.fi{animation:fi .4s ease}
.lv{animation:bh .65s ease-in-out infinite}
.sn{animation:sf 2.8s ease-out forwards}
.gl{background:rgba(255,255,255,.035);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.08);border-radius:12px}
.btn{font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;padding:9px 18px;border:none;border-radius:6px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.btn:hover:not(:disabled){filter:brightness(1.25);transform:translateY(-1px)}
.btn:active:not(:disabled){transform:translateY(0)}
.btn:disabled{opacity:.38;cursor:not-allowed;transform:none!important;filter:none!important}
`;

/* ═══════════════════════════════════════════════
   STARS — memoized, never re-renders
═══════════════════════════════════════════════ */
const Stars = memo(() => {
  const s = Array.from({ length:58 }, (_,i) => ({
    l:`${(i*37+13)%97}%`, t:`${(i*53+7)%97}%`,
    sz:i%8===0?2:1, op:.25+(i%5)*.12,
    dur:2+(i%3), del:(i%6)*.38,
  }));
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
      background:`
        radial-gradient(ellipse at 15% 50%,rgba(0,212,255,.05) 0%,transparent 55%),
        radial-gradient(ellipse at 85% 20%,rgba(155,48,255,.06) 0%,transparent 55%),
        radial-gradient(ellipse at 50% 85%,rgba(255,140,0,.04) 0%,transparent 50%)
      ` }}>
      {s.map((x,i) => (
        <div key={i} style={{ position:"absolute", left:x.l, top:x.t,
          width:x.sz, height:x.sz, borderRadius:"50%",
          background:`rgba(255,255,255,${x.op})`,
          animation:`tw ${x.dur}s ease-in-out ${x.del}s infinite alternate` }}/>
      ))}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   SMALL ATOMS
═══════════════════════════════════════════════ */
function Toast({ toast, clear }) {
  useEffect(() => { const t = setTimeout(clear, 4500); return () => clearTimeout(t); }, [toast]);
  const M = {
    info:   { bg:"rgba(10,40,90,.93)",  br:"#0080ff", ic:"ℹ️" },
    success:{ bg:"rgba(5,60,35,.93)",   br:"#00ff88", ic:"✅" },
    warning:{ bg:"rgba(80,45,0,.93)",   br:"#ff8c00", ic:"⚠️" },
    danger: { bg:"rgba(80,10,10,.93)",  br:"#ff3333", ic:"💥" },
    snap:   { bg:"rgba(40,20,80,.96)",  br:"#fde047", ic:"⚡" },
    love:   { bg:"rgba(70,10,50,.93)",  br:"#ff69b4", ic:"💛" },
    endgame:{ bg:"rgba(90,5,10,.96)",   br:"#ff3333", ic:"🔥" },
  };
  const c = M[toast.type] || M.info;
  return (
    <div style={{ position:"fixed", top:82, right:18, zIndex:9999, minWidth:300, maxWidth:420,
      padding:"13px 18px", background:c.bg, border:`1px solid ${c.br}`,
      borderRadius:10, animation:"ti .35s ease", backdropFilter:"blur(16px)",
      boxShadow:`0 0 24px ${c.br}55,0 4px 20px rgba(0,0,0,.5)` }}>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>{c.ic}</span>
        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:15, lineHeight:1.35 }}>
          {toast.msg}
        </span>
      </div>
    </div>
  );
}

function RDots({ cur }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"center" }}>
      {[1,2,3,4].map(r => (
        <div key={r} style={{ width:10, height:10, borderRadius:"50%", transition:"all .3s",
          background: r<cur?"rgba(253,224,71,.35)":r===cur?"#fde047":"transparent",
          border: r===cur?"1px solid #fde047":"1px solid rgba(255,255,255,.18)",
          boxShadow: r===cur?"0 0 8px #fde047":"none" }}/>
      ))}
      <span className="ob" style={{ fontSize:9, color:"#fde047", letterSpacing:2, marginLeft:2 }}>R{cur}/4</span>
    </div>
  );
}

function GoldBadge({ gold }) {
  const love = gold === 3000;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:7 }}>
      <span className="ob" style={{ color:"#fde047", fontWeight:700, fontSize:19 }}>
        {gold.toLocaleString()}
        <span style={{ fontSize:10, opacity:.6, marginLeft:2 }}>Au</span>
      </span>
      {love && (
        <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}>
          <span className="lv" style={{ fontSize:17 }}>💛</span>
          <span className="ob" style={{ fontSize:9, color:"#ff69b4", letterSpacing:.5 }}>I LOVE YOU 3000</span>
        </span>
      )}
    </span>
  );
}

function HPBar({ hp, maxHp, color }) {
  const mx = Math.max(maxHp || hp || 1, 1);
  const pct = Math.min(100, (hp / mx) * 100);
  const col = pct > 60 ? "#00ff88" : pct > 30 ? "#fde047" : "#ff3333";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, opacity:.7, marginBottom:3 }}>
        <span>HP</span>
        <span className="ob" style={{ color:col }}>{hp.toLocaleString()}</span>
      </div>
      <div style={{ height:7, background:"rgba(255,255,255,.08)", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, borderRadius:4, transition:"width .6s ease",
          background:`linear-gradient(90deg,${col}88,${col})`, boxShadow:`0 0 8px ${col}77` }}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN PIN SCREEN
═══════════════════════════════════════════════ */
function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const attempt = () => {
    if (pin === ADMIN_PIN) { onUnlock(); }
    else { setErr(true); setPin(""); setTimeout(() => setErr(false), 1200); }
  };
  return (
    <div style={{ minHeight:"100vh", background:"#0b0b1e", display:"flex",
      alignItems:"center", justifyContent:"center", flexDirection:"column",
      gap:18, position:"relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <Stars/>
      <div style={{ position:"relative", zIndex:1, display:"flex",
        flexDirection:"column", alignItems:"center", gap:18 }}>
        <div className="ob pg" style={{ fontSize:26, fontWeight:900, letterSpacing:7 }}>
          ⚡ INFINITY WAR
        </div>
        <div className="ob" style={{ fontSize:11, letterSpacing:3, opacity:.5 }}>
          ADMIN ACCESS
        </div>
        <div className="gl" style={{ padding:"32px 40px", display:"flex",
          flexDirection:"column", alignItems:"center", gap:14, minWidth:280 }}>
          <div style={{ fontSize:13, opacity:.6 }}>Enter Admin PIN to continue</div>
          <input
            type="password"
            placeholder="••••"
            value={pin}
            maxLength={8}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && attempt()}
            style={{
              width:160, textAlign:"center", fontSize:22, letterSpacing:10,
              border:`1px solid ${err ? "#ff3333" : "rgba(255,255,255,.15)"}`,
              boxShadow: err ? "0 0 12px rgba(255,50,50,.4)" : "none",
              transition:"all .2s",
            }}
          />
          {err && <div style={{ fontSize:12, color:"#ff6666" }}>Incorrect PIN</div>}
          <button className="btn" onClick={attempt}
            style={{ background:"rgba(253,224,71,.15)", color:"#fde047",
              border:"1px solid rgba(253,224,71,.35)", width:"100%",
              justifyContent:"center" }}>
            ENTER
          </button>
        </div>
        <div style={{ fontSize:11, opacity:.3 }}>
          Team devices open their stone URL — no PIN needed.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 1
═══════════════════════════════════════════════ */
function R1Admin({ teams, toggleQ }) {
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"120px repeat(7,1fr)", gap:6, marginBottom:8, paddingLeft:4 }}>
        <div/>
        {QV.map((g,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:11 }}>
            <div style={{ opacity:.5 }}>Q{i+1}</div>
            <div className="ob" style={{ color:"#fde047", fontSize:10 }}>{g}g</div>
          </div>
        ))}
      </div>
      {IDS.map(tid => {
        const cfg = TC[tid], tm = teams[tid];
        return (
          <div key={tid} style={{ display:"grid", gridTemplateColumns:"120px repeat(7,1fr)",
            gap:6, alignItems:"center", marginBottom:6,
            background:`rgba(${cfg.rgb},.04)`, border:`1px solid rgba(${cfg.rgb},.15)`,
            borderRadius:8, padding:"8px" }}>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <span>{cfg.em}</span>
              <span className="ob" style={{ color:cfg.color, fontSize:10 }}>{cfg.name}</span>
            </div>
            {tm.questions.map((solved, qi) => (
              <div key={qi} style={{ display:"flex", justifyContent:"center" }}>
                <div onClick={() => toggleQ(tid, qi)} style={{
                  width:30, height:30, borderRadius:5, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, fontWeight:700,
                  background: solved ? `rgba(${cfg.rgb},.78)` : "rgba(255,255,255,.04)",
                  border: `2px solid ${solved ? cfg.color : "rgba(255,255,255,.12)"}`,
                  boxShadow: solved ? `0 0 12px rgba(${cfg.rgb},.5)` : "none",
                  color: solved ? "#0b0b1e" : "transparent",
                  transition:"all .2s", userSelect:"none" }}>
                  ✓
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 2
═══════════════════════════════════════════════ */
function R2Admin({ teams, setZOpt, giveDiplomacy }) {
  const [ds, setDs] = useState({});
  const gd  = tid => ds[tid] || { to:"", amt:"" };
  const upd = (tid, k, v) => setDs(p => ({ ...p, [tid]:{ ...gd(tid), [k]:v } }));
  const maxHp = Math.max(...IDS.map(t => teams[t].hp), 1);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
      {IDS.map(tid => {
        const cfg = TC[tid], tm = teams[tid], d = gd(tid);
        return (
          <div key={tid} style={{ background:`rgba(${cfg.rgb},.05)`,
            border:`1px solid rgba(${cfg.rgb},.2)`, borderRadius:10, padding:14 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:18 }}>{cfg.em}</span>
              <span className="ob" style={{ color:cfg.color, fontSize:11, letterSpacing:2 }}>{cfg.name}</span>
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, opacity:.5, marginBottom:4 }}>Z<sub>opt</sub></div>
              <input type="number" placeholder="LPP solution..."
                value={tm.zOpt} onChange={e => setZOpt(tid, e.target.value)}
                style={{ borderColor:`rgba(${cfg.rgb},.3)` }}/>
            </div>
            {tm.hp > 0 && <>
              <HPBar hp={tm.hp} maxHp={maxHp} color={cfg.color}/>
              <div style={{ fontSize:11, opacity:.5, marginTop:4 }}>= {tm.hp} HP (Z × 5)</div>
            </>}
            {tm.hp > 0 && (
              <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:10, marginTop:10 }}>
                <div style={{ fontSize:10, opacity:.45, letterSpacing:1, marginBottom:6 }}>DIPLOMACY</div>
                <select value={d.to} onChange={e => upd(tid,"to",e.target.value)} style={{ marginBottom:6 }}>
                  <option value="">Send HP to...</option>
                  {IDS.filter(t=>t!==tid).map(t=><option key={t} value={t}>{TC[t].em} {TC[t].name}</option>)}
                </select>
                <div style={{ display:"flex", gap:6 }}>
                  <input type="number" placeholder="HP" value={d.amt}
                    onChange={e => upd(tid,"amt",e.target.value)} style={{ flex:1 }}/>
                  <button className="btn" onClick={() => {
                    const amt = parseInt(d.amt); if (!d.to || !amt || amt<=0) return;
                    giveDiplomacy(tid, d.to, amt);
                    setDs(p => ({ ...p, [tid]:{ to:"", amt:"" } }));
                  }} style={{ background:`rgba(${cfg.rgb},.2)`, color:cfg.color,
                    border:`1px solid rgba(${cfg.rgb},.3)`, padding:"8px 12px" }}>
                    SEND
                  </button>
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
   ADMIN — ROUND 3
═══════════════════════════════════════════════ */
function R3Admin({ teams, locked, lockStrategies }) {
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {IDS.map(tid => {
          const cfg = TC[tid], tm = teams[tid];
          return (
            <div key={tid} style={{ background:`rgba(${cfg.rgb},.05)`,
              border:`1px solid rgba(${cfg.rgb},.18)`, borderRadius:10, padding:14 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:16 }}>{cfg.em}</span>
                <span className="ob" style={{ color:cfg.color, fontSize:11 }}>{cfg.name}</span>
              </div>
              {tm.strategy ? (
                <div>
                  <span style={{ display:"inline-block", padding:"5px 12px", borderRadius:20,
                    fontSize:12, fontWeight:600,
                    background: tm.strategy==="AGGRESSIVE"?"rgba(255,50,50,.15)":"rgba(0,200,100,.15)",
                    border:`1px solid ${tm.strategy==="AGGRESSIVE"?"#ff333355":"#00ff8855"}`,
                    color: tm.strategy==="AGGRESSIVE"?"#ff6666":"#00ff88" }}>
                    {tm.strategy==="AGGRESSIVE" ? "⚔️ AGGRESSIVE" : "🛡️ PASSIVE"}
                  </span>
                  {tm.shield && tm.strategy==="PASSIVE" && (
                    <div style={{ fontSize:11, opacity:.6, marginTop:5 }}>
                      Shield: {WPN.find(w=>w.id===tm.shield)?.icon} {WPN.find(w=>w.id===tm.shield)?.name}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize:12, opacity:.35 }}>Not decided yet</div>
              )}
            </div>
          );
        })}
      </div>
      <button className="btn" onClick={lockStrategies} disabled={locked} style={{
        background: locked?"rgba(255,255,255,.07)":"rgba(255,50,50,.2)",
        color: locked?"rgba(255,255,255,.4)":"#ff6666",
        border:`1px solid ${locked?"rgba(255,255,255,.08)":"#ff333377"}`,
        boxShadow: locked?"none":"0 0 15px rgba(255,50,50,.2)",
        padding:"11px 28px", fontSize:12,
      }}>
        {locked ? "🔒 STRATEGIES LOCKED" : "🔐 LOCK ALL STRATEGIES"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN — ROUND 4
═══════════════════════════════════════════════ */
function R4Admin({ teams, attacks, approveAtk, rejectAtk }) {
  const pending  = attacks.filter(a => a.status === "pending");
  const resolved = attacks.filter(a => a.status !== "pending");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {IDS.map(tid => {
          const cfg = TC[tid], tm = teams[tid];
          return (
            <div key={tid} style={{ background:`rgba(${cfg.rgb},.05)`,
              border:`1px solid rgba(${cfg.rgb},.15)`, borderRadius:8, padding:12 }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:14 }}>{cfg.em}</span>
                <span className="ob" style={{ color:cfg.color, fontSize:10 }}>{cfg.name}</span>
                <span style={{ marginLeft:"auto", fontSize:10, opacity:.5 }}>
                  {tm.safesLocked ? "🔒 sealed" : "⚠️ open"}
                </span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {tm.safes.map((g, i) => (
                  <div key={i} style={{ flex:1, padding:"5px 3px", borderRadius:4, textAlign:"center",
                    background: tm.safeStatus[i]==="destroyed"?"rgba(255,0,0,.1)":`rgba(${cfg.rgb},.08)`,
                    border:`1px solid ${tm.safeStatus[i]==="destroyed"?"rgba(255,0,0,.3)":`rgba(${cfg.rgb},.2)`}`,
                    fontSize:10 }}>
                    <div style={{ opacity:.5, fontSize:9 }}>S{i+1}</div>
                    <div style={{ color: tm.safeStatus[i]==="destroyed"?"#ff3333":cfg.color }}>
                      {tm.safeStatus[i]==="destroyed" ? "💥" : `${g}g`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="ob" style={{ fontSize:11, letterSpacing:2, color:"#ff6666", marginBottom:10 }}>
          ⚔️ CIPHER QUEUE ({pending.length})
        </div>
        {pending.length === 0 && (
          <div style={{ opacity:.35, fontSize:13, padding:"10px 0" }}>No attacks queued.</div>
        )}
        {pending.map(atk => {
          const ac=TC[atk.attackerId], dc=TC[atk.targetId];
          const w=WPN.find(w=>w.id===atk.weaponId);
          const def=teams[atk.targetId];
          const shMatch=def.strategy==="PASSIVE" && def.shield===atk.weaponId;
          return (
            <div key={atk.id} style={{ border:"1px solid rgba(255,100,0,.3)",
              background:"rgba(255,50,0,.05)", borderRadius:8, padding:"12px 14px",
              marginBottom:8, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:1, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", fontSize:13 }}>
                <span style={{ color:ac.color, fontWeight:700 }}>{ac.em} {ac.name}</span>
                <span style={{ opacity:.4 }}>→</span>
                <span style={{ color:dc.color, fontWeight:700 }}>{dc.em} {dc.name}</span>
                <span style={{ opacity:.6 }}>Safe #{atk.safeIdx+1}</span>
                <span>{w?.icon} {w?.name}</span>
                {shMatch && (
                  <span style={{ fontSize:11, color:"#00ff88", padding:"2px 8px",
                    border:"1px solid #00ff8855", borderRadius:10 }}>🛡️ shield match</span>
                )}
                <span style={{ fontSize:11, opacity:.4 }}>{atk.time}</span>
              </div>
              <div style={{ display:"flex", gap:7 }}>
                <button className="btn" onClick={() => approveAtk(atk.id)}
                  style={{ background:"rgba(0,200,100,.15)", color:"#00ff88", border:"1px solid #00ff8844" }}>
                  ✅ APPROVE CIPHER
                </button>
                <button className="btn" onClick={() => rejectAtk(atk.id)}
                  style={{ background:"rgba(255,50,50,.15)", color:"#ff6666", border:"1px solid #ff333344" }}>
                  ❌ REJECT
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {resolved.length > 0 && (
        <div>
          <div className="ob" style={{ fontSize:10, letterSpacing:2, opacity:.4, marginBottom:6 }}>
            RESOLVED ({resolved.length})
          </div>
          {resolved.slice(-6).reverse().map(atk => {
            const ac=TC[atk.attackerId], dc=TC[atk.targetId];
            return (
              <div key={atk.id} style={{ fontSize:12, padding:"5px 8px",
                borderBottom:"1px solid rgba(255,255,255,.04)",
                display:"flex", gap:6, opacity:.6 }}>
                <span>{atk.status==="resolved"?"✅":"❌"}</span>
                <span style={{ color:ac.color }}>{ac.name}</span><span>→</span>
                <span style={{ color:dc.color }}>{dc.name}</span>
                <span>Safe#{atk.safeIdx+1}</span>
                <span style={{ marginLeft:"auto", opacity:.5 }}>{atk.time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ADMIN PANEL
═══════════════════════════════════════════════ */
function AdminPanel({ round, teams, locked, logs, attacks, snap, handlers }) {
  const { toggleQ, setZOpt, giveDiplomacy, lockStrategies,
          approveAtk, rejectAtk, triggerSnap, advanceRound } = handlers;
  const [tab, setTab] = useState(1);
  useEffect(() => setTab(round), [round]);

  const TABS = [
    { id:1, label:"R1 · SCRAMBLE", col:"#00d4ff" },
    { id:2, label:"R2 · FORTIFY",  col:"#9b30ff" },
    { id:3, label:"R3 · STRATEGY", col:"#ff8c00" },
    { id:4, label:"R4 · ENDGAME",  col:"#ff3333" },
  ];
  const maxHp = Math.max(...IDS.map(t => teams[t].hp), 1);
  const top3  = [...IDS].sort((a,b) => teams[b].gold - teams[a].gold).slice(0,3);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      <div className="gl" style={{ padding:"16px 20px", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
        <button title="Thanos Snap" onClick={triggerSnap}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:34,
            filter:"drop-shadow(0 0 10px rgba(253,224,71,.5))", transition:"all .2s" }}
          onMouseEnter={e => {
            e.currentTarget.style.transform="scale(1.22) rotate(-13deg)";
            e.currentTarget.style.filter="drop-shadow(0 0 26px rgba(253,224,71,.96))";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform="scale(1) rotate(0)";
            e.currentTarget.style.filter="drop-shadow(0 0 10px rgba(253,224,71,.5))";
          }}>🫱</button>
        <div>
          <div className="ob" style={{ fontSize:9, letterSpacing:2, opacity:.5 }}>MASTER CONTROL</div>
          <div style={{ fontSize:12, opacity:.4 }}>Tony Stark Interface</div>
        </div>
        <div style={{ width:1, height:36, background:"rgba(255,255,255,.08)" }}/>
        <div>
          <div className="ob" style={{ fontSize:9, letterSpacing:2, opacity:.5, marginBottom:5 }}>CURRENT PHASE</div>
          <RDots cur={round}/>
        </div>
        <button className="btn" onClick={advanceRound} disabled={round >= 4} style={{
          background: round>=4?"rgba(255,255,255,.06)":"rgba(253,224,71,.15)",
          color: round>=4?"rgba(255,255,255,.3)":"#fde047",
          border:`1px solid ${round>=4?"rgba(255,255,255,.06)":"rgba(253,224,71,.35)"}`,
          boxShadow: round<4?"0 0 15px rgba(253,224,71,.15)":"none",
        }}>
          {round < 4 ? `⚡ ADVANCE R${round+1}` : "🏁 ENDGAME ACTIVE"}
        </button>
        <div style={{ marginLeft:"auto", display:"flex", gap:14, alignItems:"center" }}>
          <div className="ob" style={{ fontSize:9, opacity:.4, letterSpacing:2 }}>TOP</div>
          {top3.map((tid, i) => (
            <div key={tid} style={{ fontSize:12, display:"flex", gap:5, alignItems:"center" }}>
              <span>{["🥇","🥈","🥉"][i]}</span>
              <span style={{ color:TC[tid].color }}>{TC[tid].name}</span>
              <span style={{ color:"#fde047", fontWeight:700 }}>{teams[tid].gold.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gl" style={{ padding:"16px 20px" }}>
        <div className="ob" style={{ fontSize:10, letterSpacing:3, opacity:.45, marginBottom:12 }}>TEAM STATUS</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {IDS.map(tid => {
            const cfg = TC[tid], tm = teams[tid];
            return (
              <div key={tid} style={{ display:"flex", gap:12, alignItems:"center",
                background:`rgba(${cfg.rgb},.04)`, border:`1px solid rgba(${cfg.rgb},.15)`,
                borderRadius:8, padding:"10px 14px", flexWrap:"wrap" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", minWidth:108 }}>
                  <span>{cfg.em}</span>
                  <span className="ob" style={{ color:cfg.color, fontSize:10, letterSpacing:1 }}>{cfg.name}</span>
                </div>
                <div><GoldBadge gold={tm.gold}/></div>
                <div style={{ flex:1, minWidth:130 }}><HPBar hp={tm.hp} maxHp={maxHp} color={cfg.color}/></div>
                <div style={{ minWidth:90, textAlign:"center" }}>
                  {tm.strategy ? (
                    <span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600,
                      background: tm.strategy==="AGGRESSIVE"?"rgba(255,50,50,.15)":"rgba(0,200,100,.15)",
                      border:`1px solid ${tm.strategy==="AGGRESSIVE"?"#ff333344":"#00ff8844"}`,
                      color: tm.strategy==="AGGRESSIVE"?"#ff6666":"#00ff88" }}>
                      {tm.strategy==="AGGRESSIVE" ? "⚔️" : "🛡️"} {tm.strategy.slice(0,4)}
                    </span>
                  ) : <span style={{ opacity:.25, fontSize:11 }}>—</span>}
                </div>
                <div style={{ fontSize:11, opacity:.55, minWidth:55 }}>Q {tm.questions.filter(Boolean).length}/7</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gl" style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:18,
          borderBottom:"1px solid rgba(255,255,255,.07)", paddingBottom:14 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab===t.id ? `${t.col}18` : "transparent",
              border:`1px solid ${tab===t.id ? t.col+"66" : "rgba(255,255,255,.1)"}`,
              borderRadius:6, padding:"7px 14px", cursor:"pointer",
              color: tab===t.id ? t.col : "rgba(255,255,255,.45)",
              fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:1,
              boxShadow: tab===t.id ? `0 0 10px ${t.col}33` : "none", transition:"all .2s",
            }}>{t.label}</button>
          ))}
        </div>
        <div className="fi">
          {tab===1 && <R1Admin teams={teams} toggleQ={toggleQ}/>}
          {tab===2 && <R2Admin teams={teams} setZOpt={setZOpt} giveDiplomacy={giveDiplomacy}/>}
          {tab===3 && <R3Admin teams={teams} locked={locked} lockStrategies={lockStrategies}/>}
          {tab===4 && <R4Admin teams={teams} attacks={attacks} approveAtk={approveAtk} rejectAtk={rejectAtk}/>}
        </div>
      </div>

      <div className="gl" style={{ padding:"16px 20px" }}>
        <div className="ob" style={{ fontSize:10, letterSpacing:3, opacity:.4, marginBottom:8 }}>SYSTEM LOG</div>
        <div className={snap ? "sn" : ""} style={{ maxHeight:190, overflowY:"auto",
          background:"rgba(0,0,0,.35)", borderRadius:8, padding:6, fontFamily:"monospace" }}>
          {logs.length === 0 && <div style={{ opacity:.3, fontSize:12, padding:8 }}>Awaiting events...</div>}
          {logs.map((l, i) => (
            <div key={i} style={{ fontSize:12, padding:"3px 8px",
              borderBottom:"1px solid rgba(255,255,255,.03)",
              opacity: i===0?1:.65, animation: i===0?"fi .3s ease":"none" }}>
              <span style={{ color:"rgba(253,224,71,.4)", marginRight:8 }}>[{l.t}]</span>{l.m}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM VIEWS (R1–R4)
═══════════════════════════════════════════════ */
function TR1({ teamId, team }) {
  const cfg = TC[teamId];
  const earned = team.questions.reduce((a,s,i) => a + (s ? QV[i] : 0), 0);
  return (
    <div>
      <div className="ob" style={{ fontSize:11, letterSpacing:3, color:cfg.color, opacity:.7, marginBottom:16 }}>
        COSMIC SCRAMBLE — GOLD ACQUISITION
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10, marginBottom:16 }}>
        {team.questions.map((solved, i) => (
          <div key={i} style={{ padding:"14px 8px", borderRadius:8, textAlign:"center",
            background: solved ? `rgba(${cfg.rgb},.15)` : "rgba(255,255,255,.03)",
            border: `2px solid ${solved ? cfg.color : "rgba(255,255,255,.1)"}`,
            boxShadow: solved ? `0 0 16px rgba(${cfg.rgb},.3)` : "none",
            transition:"all .4s", transform: solved ? "scale(1.04)" : "scale(1)" }}>
            <div style={{ fontSize:24 }}>{solved ? "🔓" : "🔒"}</div>
            <div className="ob" style={{ fontSize:10, opacity:.5, marginTop:5 }}>Q{i+1}</div>
            <div style={{ fontSize:13, fontWeight:700, marginTop:4,
              color: solved ? cfg.color : "rgba(255,255,255,.25)" }}>
              {solved ? `+${QV[i]}g` : `${QV[i]}g`}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:14, background:"rgba(255,255,255,.03)", borderRadius:8,
        border:"1px solid rgba(255,255,255,.07)", display:"flex", gap:24, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:11, opacity:.5 }}>SOLVED</div>
          <div className="ob" style={{ color:cfg.color, fontSize:22 }}>{team.questions.filter(Boolean).length}/7</div>
        </div>
        <div>
          <div style={{ fontSize:11, opacity:.5 }}>ROUND EARNINGS</div>
          <GoldBadge gold={earned}/>
        </div>
      </div>
    </div>
  );
}

function TR2({ teamId, team, allTeams, giveDiplomacy, showToast }) {
  const cfg = TC[teamId];
  const [dipTo, setDipTo]   = useState("");
  const [dipAmt, setDipAmt] = useState("");
  const maxHp = Math.max(...IDS.map(t => allTeams[t].hp), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div>
        <div className="ob" style={{ fontSize:11, letterSpacing:3, color:cfg.color, opacity:.7, marginBottom:12 }}>
          FORTIFICATION ENGINE — HP STATUS
        </div>
        <HPBar hp={team.hp} maxHp={maxHp} color={cfg.color}/>
        {team.zOpt
          ? <div style={{ fontSize:12, opacity:.5, marginTop:5 }}>Z<sub>opt</sub> = {team.zOpt} → {team.hp} HP (× 5)</div>
          : <div style={{ fontSize:12, opacity:.35, marginTop:5 }}>Awaiting admin to enter Z<sub>opt</sub>…</div>}
      </div>
      {team.hp > 0 && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:16 }}>
          <div className="ob" style={{ fontSize:11, letterSpacing:2, opacity:.55, marginBottom:12 }}>DIPLOMATIC SACRIFICE</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <div style={{ flex:2, minWidth:140 }}>
              <div style={{ fontSize:11, opacity:.5, marginBottom:4 }}>Send HP to:</div>
              <select value={dipTo} onChange={e => setDipTo(e.target.value)}>
                <option value="">Select ally...</option>
                {IDS.filter(t => t !== teamId).map(t =>
                  <option key={t} value={t}>{TC[t].em} {TC[t].name}</option>
                )}
              </select>
            </div>
            <div style={{ flex:1, minWidth:80 }}>
              <div style={{ fontSize:11, opacity:.5, marginBottom:4 }}>HP Amount:</div>
              <input type="number" placeholder="e.g. 50" value={dipAmt} onChange={e => setDipAmt(e.target.value)}/>
            </div>
            <button className="btn" onClick={() => {
              if (!dipTo) return showToast("Select a team!", "warning");
              const amt = parseInt(dipAmt);
              if (!amt || amt <= 0) return showToast("Enter a valid amount!", "warning");
              if (amt > team.hp) return showToast(`Only ${team.hp} HP available!`, "danger");
              giveDiplomacy(teamId, dipTo, amt); setDipTo(""); setDipAmt("");
            }} style={{ background:`rgba(${cfg.rgb},.2)`, color:cfg.color,
              border:`1px solid rgba(${cfg.rgb},.35)`, alignSelf:"flex-end" }}>
              ⚡ SACRIFICE
            </button>
          </div>
        </div>
      )}
      {team.diplomacyLog.length > 0 && (
        <div>
          <div className="ob" style={{ fontSize:10, letterSpacing:2, opacity:.4, marginBottom:8 }}>DIPLOMACY LOG</div>
          {team.diplomacyLog.map((d,i) => (
            <div key={i} style={{ fontSize:12, padding:"5px 10px",
              borderBottom:"1px solid rgba(255,255,255,.04)", display:"flex", gap:8, opacity:.65 }}>
              <span>{d.dir==="out"?"📤":"📥"}</span>
              <span style={{ color: d.dir==="out"?"#ff6666":"#00ff88" }}>
                {d.dir==="out" ? `Sent ${d.hp} HP → ${TC[d.to]?.name}` : `Received ${d.hp} HP ← ${TC[d.fr]?.name}`}
              </span>
              <span style={{ marginLeft:"auto", opacity:.45 }}>{d.t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TR3({ teamId, team, locked, setStrategy }) {
  const cfg = TC[teamId];
  const [sh, setSh] = useState(team.shield || "");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div className="ob" style={{ fontSize:11, letterSpacing:3, color:cfg.color, opacity:.7 }}>WAR COUNCIL</div>
      {locked && (
        <div style={{ padding:"9px 14px", borderRadius:6, background:"rgba(255,50,50,.07)",
          border:"1px solid rgba(255,50,50,.25)", fontSize:12, display:"flex", gap:8, alignItems:"center" }}>
          🔒 <span style={{ opacity:.7 }}>War Council concluded. All stances are final.</span>
        </div>
      )}
      <div style={{ display:"flex", gap:12 }}>
        {["PASSIVE","AGGRESSIVE"].map(s => {
          const isAgg = s==="AGGRESSIVE", chosen = team.strategy===s;
          return (
            <button key={s} onClick={() => !locked && setStrategy(teamId, s)} disabled={locked}
              style={{ flex:1, padding:"22px 14px",
                border:`2px solid ${chosen?(isAgg?"#ff3333":"#00ff88"):"rgba(255,255,255,.1)"}`,
                borderRadius:10, cursor: locked?"not-allowed":"pointer",
                background: chosen?(isAgg?"rgba(255,50,50,.12)":"rgba(0,200,100,.12)"):"rgba(255,255,255,.02)",
                color: chosen?(isAgg?"#ff7777":"#00ff88"):"rgba(255,255,255,.35)",
                boxShadow: chosen?`0 0 22px ${isAgg?"rgba(255,50,50,.25)":"rgba(0,200,100,.25)"}`:"none",
                transition:"all .3s", textAlign:"center",
                fontFamily:"'Orbitron',sans-serif", fontSize:12, fontWeight:700, letterSpacing:2,
                opacity: locked&&!chosen?.4:1 }}>
              <div style={{ fontSize:34, marginBottom:8 }}>{isAgg?"⚔️":"🛡️"}</div>
              <div>{s}</div>
              <div style={{ fontSize:10, letterSpacing:.5, marginTop:6, opacity:.65,
                fontFamily:"'Rajdhani',sans-serif", fontWeight:400 }}>
                {isAgg?"Unlock weapons. Strike and plunder.":"Fortify vaults. Absorb incoming fire."}
              </div>
            </button>
          );
        })}
      </div>
      {team.strategy==="PASSIVE" && !locked && (
        <div>
          <div className="ob" style={{ fontSize:10, letterSpacing:2, opacity:.5, marginBottom:8 }}>
            DEFENSIVE FOCUS — CHOOSE YOUR SHIELD
          </div>
          <select value={sh} onChange={e => { setSh(e.target.value); setStrategy(teamId,"PASSIVE",e.target.value); }}>
            <option value="">Choose shield type...</option>
            {WPN.map(w => <option key={w.id} value={w.id}>{w.icon} Counter: {w.name}</option>)}
          </select>
          <div style={{ fontSize:11, opacity:.4, marginTop:6 }}>
            If the enemy uses this weapon against your safes, you absorb 75–100% damage.
          </div>
        </div>
      )}
      {team.shield && (
        <div style={{ padding:"9px 14px", borderRadius:6, background:"rgba(0,200,100,.07)",
          border:"1px solid rgba(0,200,100,.2)", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
          🛡️ Active shield: <strong>{WPN.find(w=>w.id===team.shield)?.icon} {WPN.find(w=>w.id===team.shield)?.name}</strong>
        </div>
      )}
    </div>
  );
}

function TR4({ teamId, team, allocateSafe, lockSafes, queueAttack, showToast }) {
  const cfg = TC[teamId];
  const [aTgt, setATgt]   = useState("");
  const [aSafe, setASafe] = useState("0");
  const [aWpn, setAWpn]   = useState("blaster");
  const [err, setErr]     = useState("");
  const sum = team.safes.reduce((a,b) => a+b, 0);

  const doLock = () => {
    if (sum !== team.gold) {
      setErr(`Mismatch: ${sum.toLocaleString()} Au allocated ≠ ${team.gold.toLocaleString()} Au total.`);
      return;
    }
    setErr(""); lockSafes(teamId);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div>
        <div className="ob" style={{ fontSize:11, letterSpacing:3, color:cfg.color, opacity:.7, marginBottom:14 }}>
          VIBRANIUM VAULT ALLOCATION
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:12 }}>
          {team.safes.map((g, i) => {
            const destr = team.safeStatus[i]==="destroyed";
            return (
              <div key={i} style={{ padding:"14px 8px", borderRadius:8, textAlign:"center", position:"relative",
                border:`2px solid ${destr?"rgba(255,0,0,.35)":`rgba(${cfg.rgb},${team.safesLocked?.25:.15})`}`,
                background: destr?"rgba(255,0,0,.05)":`rgba(${cfg.rgb},.05)` }}>
                {destr && (
                  <div style={{ position:"absolute", inset:0, borderRadius:7, background:"rgba(0,0,0,.6)",
                    display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:2 }}>
                    <span style={{ fontSize:22, animation:"ck .4s ease" }}>💥</span>
                    <span style={{ fontSize:9, color:"#ff3333" }}>DESTROYED</span>
                  </div>
                )}
                <div style={{ fontSize:20 }}>🔐</div>
                <div className="ob" style={{ fontSize:9, opacity:.5, margin:"5px 0" }}>SAFE {i+1}</div>
                {team.safesLocked
                  ? <div style={{ color:cfg.color, fontWeight:700, fontSize:13 }}>{g.toLocaleString()}g</div>
                  : <input type="number" min="0" value={g||""} placeholder="0"
                      onChange={e => allocateSafe(teamId,i,e.target.value)}
                      style={{ textAlign:"center", padding:"5px 2px", fontSize:12, borderColor:`rgba(${cfg.rgb},.3)` }}/>}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style={{ fontSize:13 }}>
            Allocated:{" "}
            <span style={{ color:sum===team.gold?"#00ff88":"#ff5555", fontWeight:700 }}>{sum.toLocaleString()}</span>
            {" / "}<span style={{ color:"#fde047" }}>{team.gold.toLocaleString()}</span> Au
          </div>
          {!team.safesLocked && (
            <button className="btn" onClick={doLock}
              style={{ background:`rgba(${cfg.rgb},.18)`, color:cfg.color, border:`1px solid rgba(${cfg.rgb},.35)` }}>
              🔒 SEAL VAULTS
            </button>
          )}
          {team.safesLocked && <span style={{ fontSize:12, color:"#00ff88" }}>✅ Vaults sealed</span>}
        </div>
        {err && (
          <div style={{ padding:"8px 12px", borderRadius:6, background:"rgba(255,0,0,.09)",
            border:"1px solid rgba(255,0,0,.3)", color:"#ff7777", fontSize:12, marginTop:4 }}>
            ⚠️ {err}
          </div>
        )}
      </div>

      {team.strategy==="AGGRESSIVE" ? (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:18 }}>
          <div className="ob" style={{ fontSize:11, letterSpacing:3, color:"#ff6666", opacity:.85, marginBottom:14 }}>
            ⚔️ SIEGE DECLARATION
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, alignItems:"flex-end" }}>
            <div>
              <div style={{ fontSize:11, opacity:.5, marginBottom:4 }}>Target Team</div>
              <select value={aTgt} onChange={e => setATgt(e.target.value)}>
                <option value="">Select target...</option>
                {IDS.filter(t => t!==teamId).map(t =>
                  <option key={t} value={t}>{TC[t].em} {TC[t].name}</option>
                )}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, opacity:.5, marginBottom:4 }}>Target Safe</div>
              <select value={aSafe} onChange={e => setASafe(e.target.value)}>
                {[0,1,2,3,4].map(i => <option key={i} value={i}>Safe #{i+1}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, opacity:.5, marginBottom:4 }}>Weapon</div>
              <select value={aWpn} onChange={e => setAWpn(e.target.value)}>
                {WPN.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
              </select>
            </div>
            <button className="btn" onClick={() => {
              if (!aTgt) return showToast("Select a target!", "warning");
              queueAttack(teamId, aTgt, parseInt(aSafe), aWpn);
              setATgt(""); setASafe("0"); setAWpn("blaster");
            }} style={{ background:"rgba(255,50,50,.2)", color:"#ff6666", border:"1px solid #ff333344" }}>
              🚀 LAUNCH
            </button>
          </div>
          <div style={{ fontSize:11, opacity:.35, marginTop:8 }}>
            Cipher verification required. Admin must approve before damage resolves.
          </div>
        </div>
      ) : (
        <div style={{ padding:14, borderRadius:8, background:"rgba(0,200,100,.06)", border:"1px solid rgba(0,200,100,.18)" }}>
          <div style={{ fontSize:13, opacity:.75, display:"flex", gap:8, alignItems:"center" }}>
            🛡️ Defensive stance active — shields monitoring all incoming threats.
          </div>
          {team.shield && (
            <div style={{ fontSize:12, marginTop:6, opacity:.6 }}>
              Blocking: {WPN.find(w=>w.id===team.shield)?.icon} {WPN.find(w=>w.id===team.shield)?.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TEAM PANEL
═══════════════════════════════════════════════ */
function TeamPanel({ teamId, round, teams, locked, handlers }) {
  const cfg = TC[teamId], team = teams[teamId];
  const { setStrategy, giveDiplomacy, allocateSafe, lockSafes, queueAttack, showToast } = handlers;
  const [tab, setTab] = useState(Math.min(round, 4));
  useEffect(() => setTab(Math.min(round, 4)), [round]);

  const TABS = [{ id:1, l:"SCRAMBLE" },{ id:2, l:"FORTIFY" },{ id:3, l:"STRATEGY" },{ id:4, l:"ENDGAME" }];
  const maxHp = Math.max(...IDS.map(t => teams[t].hp), 1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ padding:"20px 24px", borderRadius:12, position:"relative", overflow:"hidden",
        background:`rgba(${cfg.rgb},.06)`, border:`1px solid rgba(${cfg.rgb},.25)`,
        boxShadow:`0 0 40px rgba(${cfg.rgb},.08)` }}>
        <div style={{ position:"absolute", top:-30, right:-20, width:150, height:150,
          borderRadius:"50%", background:`rgba(${cfg.rgb},.07)`, filter:"blur(28px)", pointerEvents:"none" }}/>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", position:"relative" }}>
          <div style={{ fontSize:54, filter:`drop-shadow(0 0 20px rgba(${cfg.rgb},.75))` }}>{cfg.em}</div>
          <div>
            <div className="ob" style={{ fontSize:22, color:cfg.color, fontWeight:900, letterSpacing:5 }}>
              {cfg.name.toUpperCase()} TEAM
            </div>
            <div style={{ fontSize:11, opacity:.4, letterSpacing:3, marginTop:2 }}>STONE BEARER TERMINAL</div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:22, flexWrap:"wrap", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:10, opacity:.45, letterSpacing:1, marginBottom:3 }}>GOLD</div>
              <GoldBadge gold={team.gold}/>
            </div>
            <div style={{ minWidth:160 }}><HPBar hp={team.hp} maxHp={maxHp} color={cfg.color}/></div>
            {team.strategy && (
              <div>
                <div style={{ fontSize:10, opacity:.45, marginBottom:4 }}>STANCE</div>
                <span style={{ padding:"4px 11px", borderRadius:20, fontSize:11, fontWeight:700,
                  background: team.strategy==="AGGRESSIVE"?"rgba(255,50,50,.15)":"rgba(0,200,100,.15)",
                  border:`1px solid ${team.strategy==="AGGRESSIVE"?"#ff333355":"#00ff8855"}`,
                  color: team.strategy==="AGGRESSIVE"?"#ff7777":"#00ff88",
                  fontFamily:"'Orbitron',sans-serif" }}>
                  {team.strategy==="AGGRESSIVE"?"⚔️ AGGRO":"🛡️ PASSIVE"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="gl" style={{ padding:"18px 20px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:18,
          borderBottom:"1px solid rgba(255,255,255,.07)", paddingBottom:14 }}>
          {TABS.map(t => {
            const ok = t.id <= round;
            return (
              <button key={t.id} onClick={() => ok && setTab(t.id)} disabled={!ok} style={{
                background: tab===t.id?`rgba(${cfg.rgb},.14)`:"transparent",
                border:`1px solid ${tab===t.id?`rgba(${cfg.rgb},.4)`:"rgba(255,255,255,.09)"}`,
                borderRadius:6, padding:"7px 14px", cursor: ok?"pointer":"not-allowed",
                color: !ok?"rgba(255,255,255,.2)":tab===t.id?cfg.color:"rgba(255,255,255,.45)",
                fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:1,
                boxShadow: tab===t.id?`0 0 10px rgba(${cfg.rgb},.2)`:"none", transition:"all .2s",
              }}>
                {!ok&&"🔒 "}{t.l}
              </button>
            );
          })}
        </div>
        <div className="fi">
          {tab===1 && <TR1 teamId={teamId} team={team}/>}
          {tab===2 && <TR2 teamId={teamId} team={team} allTeams={teams} giveDiplomacy={giveDiplomacy} showToast={showToast}/>}
          {tab===3 && <TR3 teamId={teamId} team={team} locked={locked} setStrategy={setStrategy}/>}
          {tab===4 && <TR4 teamId={teamId} team={team} allocateSafe={allocateSafe} lockSafes={lockSafes} queueAttack={queueAttack} showToast={showToast}/>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════ */
export default function App() {
  // ── Hash-based team locking ──
  // Opening /#space locks the app to the Space team terminal.
  // The nav bar is hidden so teams cannot switch views.
  const hashTeam = window.location.hash.replace("#", "");
  const lockedTeam = IDS.includes(hashTeam) ? hashTeam : null;

  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin]           = useState("");

  const [view,    setView]    = useState(lockedTeam || "admin");
  const [round,   setRound]   = useState(1);
  const [locked,  setLocked]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [snap,    setSnap]    = useState(false);
  const [logs,    setLogs]    = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [teams,   setTeams]   = useState({
    space:mkTeam(), reality:mkTeam(), power:mkTeam(),
    mind:mkTeam(),  time:mkTeam(),   soul:mkTeam(),
  });

  const atkRef = useRef(attacks);
  useEffect(() => { atkRef.current = attacks; }, [attacks]);

  const toast_ = (msg, type="info") => setToast({ msg, type, k:Date.now() });
  const log_   = useCallback(m => {
    const t = new Date().toLocaleTimeString("en", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
    setLogs(p => [{ t, m }, ...p].slice(0, 60));
  }, []);

  const toggleQ = useCallback((tid, qi) => {
    setTeams(p => {
      const tm=p[tid], nq=[...tm.questions], was=nq[qi];
      nq[qi]=!was;
      const d=was?-QV[qi]:QV[qi], gold=Math.max(0,tm.gold+d);
      log_(`${TC[tid].name}: Q${qi+1} ${was?"revoked":"✅ approved"} (${d>0?"+":""}${d}g → ${gold}g)`);
      if (gold===3000) setTimeout(() => toast_("💛 I Love You 3000!", "love"), 50);
      return { ...p, [tid]: { ...tm, questions:nq, gold } };
    });
  }, [log_]);

  const setZOpt = useCallback((tid, val) => {
    const z=parseFloat(val)||0, hp=Math.round(z*5);
    setTeams(p => ({ ...p, [tid]: { ...p[tid], zOpt:val, hp } }));
    if (val) log_(`${TC[tid].name}: Z_opt=${val} → ${hp} HP`);
  }, [log_]);

  const giveDiplomacy = useCallback((frId, toId, amt) => {
    setTeams(p => {
      const fr=p[frId], to=p[toId];
      if (fr.hp < amt) { toast_("Insufficient HP!", "danger"); return p; }
      const ts=new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"});
      log_(`DIPLOMACY: ${TC[frId].name} → ${TC[toId].name}: ${amt} HP`);
      toast_(`🤝 ${TC[frId].name} → ${TC[toId].name}: ${amt} HP`, "success");
      return {
        ...p,
        [frId]: { ...fr, hp:fr.hp-amt, diplomacyLog:[{dir:"out",fr:frId,to:toId,hp:amt,t:ts},...fr.diplomacyLog] },
        [toId]: { ...to, hp:to.hp+amt, diplomacyLog:[{dir:"in", fr:frId,to:toId,hp:amt,t:ts},...to.diplomacyLog] },
      };
    });
  }, [log_]);

  const setStrategy = useCallback((tid, strategy, shield=null) => {
    if (locked) return;
    setTeams(p => {
      const upd = { strategy };
      if (shield!==null) upd.shield=shield;
      else if (strategy==="AGGRESSIVE") upd.shield=null;
      log_(`${TC[tid].name}: ${strategy}${shield?` [shield:${shield}]`:""}`);
      return { ...p, [tid]: { ...p[tid], ...upd } };
    });
  }, [locked, log_]);

  const lockStrategies = useCallback(() => {
    setLocked(true);
    toast_("⚔️ War Council concluded. All stances are now final.", "warning");
    log_("ADMIN: Strategies locked for all teams.");
  }, []);

  const allocateSafe = useCallback((tid, i, val) => {
    setTeams(p => {
      if (p[tid].safesLocked) return p;
      const safes=[...p[tid].safes]; safes[i]=Math.max(0,parseInt(val)||0);
      return { ...p, [tid]: { ...p[tid], safes } };
    });
  }, []);

  const lockSafes = useCallback(tid => {
    setTeams(p => {
      const tm=p[tid];
      if (tm.safes.reduce((a,b)=>a+b,0)!==tm.gold) return p;
      log_(`${TC[tid].name}: Vaults sealed [${tm.safes.join(", ")}]`);
      return { ...p, [tid]: { ...tm, safesLocked:true } };
    });
  }, [log_]);

  const queueAttack = useCallback((atkId, tgtId, safeIdx, wpnId) => {
    const atk = {
      id:Date.now(), attackerId:atkId, targetId:tgtId,
      safeIdx, weaponId:wpnId, status:"pending",
      time:new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"}),
    };
    setAttacks(p => [...p, atk]);
    log_(`ATTACK QUEUED: ${TC[atkId].name} → ${TC[tgtId].name} S#${safeIdx+1} [${WPN.find(w=>w.id===wpnId)?.name}]`);
    toast_("🚀 Attack queued. Cipher clearance pending.", "warning");
  }, [log_]);

  const approveAtk = useCallback(id => {
    const atk = atkRef.current.find(a => a.id===id); if (!atk) return;
    setAttacks(p => p.map(a => a.id===id ? {...a,status:"resolved"} : a));
    setTeams(p => {
      const att=p[atk.attackerId], def=p[atk.targetId];
      const safeGold=def.safes[atk.safeIdx];
      const shMatch=def.strategy==="PASSIVE" && def.shield===atk.weaponId;
      const ns=[...def.safes], nst=[...(def.safeStatus||["ok","ok","ok","ok","ok"])];
      let stolen=0, msg="", typ="info";
      if (shMatch) {
        const abs=0.75+Math.random()*.25; stolen=Math.floor(safeGold*(1-abs));
        ns[atk.safeIdx]-=stolen; nst[atk.safeIdx]="shielded";
        msg=`🛡️ Shield held! ${Math.round(abs*100)}% absorbed. ${stolen}g leaked from Safe #${atk.safeIdx+1}.`;
        typ="success";
      } else {
        stolen=safeGold; ns[atk.safeIdx]=0; nst[atk.safeIdx]="destroyed";
        msg=`💥 Safe #${atk.safeIdx+1} DESTROYED! ${stolen.toLocaleString()} Au seized!`;
        typ="danger";
      }
      const nag=att.gold+stolen, ndg=Math.max(0,def.gold-stolen);
      log_(`SIEGE [${TC[atk.attackerId].name}→${TC[atk.targetId].name}]: ${msg}`);
      setTimeout(() => {
        toast_(msg, typ);
        if (nag===3000) toast_("💛 I Love You 3000!", "love");
      }, 60);
      return {
        ...p,
        [atk.attackerId]: { ...att, gold:nag },
        [atk.targetId]:   { ...def, gold:ndg, safes:ns, safeStatus:nst, alive:ndg>0 },
      };
    });
  }, [log_]);

  const rejectAtk = useCallback(id => {
    const atk=atkRef.current.find(a=>a.id===id);
    setAttacks(p => p.map(a => a.id===id?{...a,status:"rejected"}:a));
    if (atk) { log_(`CIPHER REJECTED: ${TC[atk.attackerId].name}'s assault nullified.`); toast_("❌ Cipher failed.","danger"); }
  }, [log_]);

  const triggerSnap = useCallback(() => {
    setSnap(true);
    toast_("Perfectly balanced, as all things should be.", "snap");
    log_("⚡ THANOS: The snap reverberates across the universe.");
    setTimeout(() => setSnap(false), 3200);
  }, []);

  const advanceRound = useCallback(() => {
    if (round >= 4) return;
    const next = round+1; setRound(next);
    log_(`━━━ ROUND ${next} INITIATED ━━━`);
    if (next===4) toast_("⚡ We're in the endgame now.", "endgame");
    else          toast_(`🚀 Round ${next} activated!`, "info");
  }, [round]);

  const NAV = [
    { id:"admin",   label:"⚡ ADMIN",   col:"#fde047" },
    { id:"space",   label:"💠 SPACE",   col:"#00d4ff" },
    { id:"reality", label:"🔴 REALITY", col:"#ff3333" },
    { id:"power",   label:"🔮 POWER",   col:"#9b30ff" },
    { id:"mind",    label:"💛 MIND",    col:"#fde047" },
    { id:"time",    label:"⏳ TIME",    col:"#00ff88" },
    { id:"soul",    label:"🔶 SOUL",    col:"#ff8c00" },
  ];

  const handlers = {
    toggleQ, setZOpt, giveDiplomacy, setStrategy, lockStrategies,
    allocateSafe, lockSafes, queueAttack, approveAtk, rejectAtk,
    triggerSnap, advanceRound, showToast: toast_,
  };

  // ── Admin PIN gate (only when not a team URL) ──
  if (!lockedTeam && !adminUnlocked) {
    return <PinScreen onUnlock={() => setAdminUnlocked(true)}/>;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0b0b1e", position:"relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <Stars/>

      {snap && (
        <div className="sn" style={{ position:"fixed", inset:0, zIndex:900, pointerEvents:"none",
          background:"radial-gradient(ellipse at center,rgba(253,224,71,.22) 0%,transparent 65%)" }}/>
      )}
      {snap && (
        <div style={{ position:"fixed", left:0, right:0, height:3, top:0, zIndex:901, pointerEvents:"none",
          background:"linear-gradient(90deg,transparent,rgba(253,224,71,.95),transparent)",
          animation:"sl 2s linear" }}/>
      )}

      <header style={{ position:"sticky", top:0, zIndex:100, padding:"12px 20px",
        background:"rgba(11,11,30,.9)", backdropFilter:"blur(22px)",
        borderBottom:"1px solid rgba(255,255,255,.06)", boxShadow:"0 4px 30px rgba(0,0,0,.6)" }}>
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div className="ob pg" style={{ fontSize:20, fontWeight:900, letterSpacing:6 }}>⚡ INFINITY WAR</div>
              <div className={round===4?"eg":""} style={{ fontSize:11, letterSpacing:3, marginTop:2,
                color: round===4?"#ff5555":"rgba(255,255,255,.4)" }}>
                {round===4 ? "WE'RE IN THE ENDGAME NOW." : "TOURNAMENT SCORING SYSTEM"}
              </div>
            </div>
            <RDots cur={round}/>
          </div>

          {/* Nav only shown when NOT on a locked team URL */}
          {!lockedTeam && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setView(n.id)} style={{
                  fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:700, letterSpacing:1,
                  padding:"7px 12px",
                  border:`1px solid ${view===n.id?n.col:"rgba(255,255,255,.09)"}`,
                  borderRadius:6, cursor:"pointer",
                  background: view===n.id?`${n.col}22`:"rgba(0,0,0,.3)",
                  color: view===n.id?n.col:"rgba(255,255,255,.45)",
                  boxShadow: view===n.id?`0 0 12px ${n.col}44`:"none", transition:"all .2s",
                }}>{n.label}</button>
              ))}
            </div>
          )}

          {/* Locked team label */}
          {lockedTeam && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:20 }}>{TC[lockedTeam].em}</span>
              <span className="ob" style={{ color:TC[lockedTeam].color, fontSize:12, letterSpacing:3 }}>
                {TC[lockedTeam].name.toUpperCase()} TEAM TERMINAL
              </span>
            </div>
          )}
        </div>
      </header>

      <main style={{ padding:"20px", maxWidth:1400, margin:"0 auto", position:"relative", zIndex:1 }}>
        {lockedTeam
          ? <TeamPanel teamId={lockedTeam} round={round} teams={teams} locked={locked} handlers={handlers}/>
          : view==="admin"
            ? <AdminPanel round={round} teams={teams} locked={locked}
                logs={logs} attacks={attacks} snap={snap} handlers={handlers}/>
            : <TeamPanel teamId={view} round={round} teams={teams} locked={locked} handlers={handlers}/>
        }
      </main>

      {toast && <Toast key={toast.k} toast={toast} clear={() => setToast(null)}/>}
    </div>
  );
}
