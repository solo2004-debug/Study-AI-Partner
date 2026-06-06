import { useState, useRef, useEffect } from "react";
import { Upload, X, Moon, Sun, Timer, BookOpen, Brain, FileText, MessageSquare, Map, FlaskConical, Download, Check, RotateCcw, Play, Pause, ChevronRight, RefreshCw, List, Layers, Search } from "lucide-react";

// ── Direct Gemini call (no server needed) ──────────────────────────────────
async function askGemini(prompt, systemPrompt = "") {
  const key = window.__GEMINI_KEY__;
  if (!key) throw new Error("No API key set");
  const full = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: full }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
      })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const NLM_KB = `NotebookLM Limitations (Mid-2026):
1. ~50 source cap — blocks large literature reviews
2. No cross-notebook reasoning — isolated silos
3. No live sync — static snapshots, manual re-upload needed
4. No clean export — no Markdown/LaTeX/code output
5. Limited editing of generated Studio assets
6. Audio Overview truncates long docs, too casual for academia
7. No real-time collaboration
8. No Excel/CSV/Notion/Airtable support
9. Free tier: ~3 audio overviews/day, ~50 queries/day
10. No persistent knowledge graph`;

const CF_KB = `ContextForge Capabilities (V1.0):
1. Live sync via webhooks — auto re-indexes Google Doc/Notion/OneDrive
2. 200 sources per project with HNSW vector retrieval
3. LaTeX & code block preservation natively
4. Multimodal OCR — diagrams, scans, handwritten notes
5. One-click Markdown export for Obsidian/Notion
6. Auto bibliography — APA, MLA, Chicago
7. Real-time multiplayer collaboration
8. Ingestion API for automated pipelines
V1.0 Limits: No audio generation. No mobile apps yet.`;

function Pomodoro() {
  const [secs, setSecs] = useState(25*60);
  const [on, setOn] = useState(false);
  const [brk, setBrk] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (on) ref.current = setInterval(() => setSecs(s => {
      if (s <= 1) { setBrk(b=>!b); setOn(false); return brk ? 25*60 : 5*60; }
      return s-1;
    }), 1000);
    return () => clearInterval(ref.current);
  }, [on, brk]);
  const reset = () => { setOn(false); setSecs(25*60); setBrk(false); };
  const m = String(Math.floor(secs/60)).padStart(2,"0");
  const s = String(secs%60).padStart(2,"0");
  const pct = brk ? (1-secs/300)*100 : (1-secs/1500)*100;
  const circ = 2*Math.PI*18;
  const col = brk ? "#4ecdc4" : "#7c6af7";
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,background:"#1e1e28",border:"1px solid #2a2a38",borderRadius:12,padding:"7px 13px"}}>
      <svg width="38" height="38" style={{transform:"rotate(-90deg)",flexShrink:0}}>
        <circle cx="19" cy="19" r="18" fill="none" stroke="#2a2a38" strokeWidth="3"/>
        <circle cx="19" cy="19" r="18" fill="none" stroke={col} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1s linear"}}/>
      </svg>
      <div>
        <div style={{fontSize:9,color:"#5a5a72",textTransform:"uppercase",letterSpacing:1}}>{brk?"Break":"Focus"}</div>
        <div style={{fontSize:15,fontWeight:700,letterSpacing:2,color:"#e8e8f0"}}>{m}:{s}</div>
      </div>
      <button onClick={()=>setOn(o=>!o)} style={IB}>{on?<Pause size={12}/>:<Play size={12}/>}</button>
      <button onClick={reset} style={IB}><RotateCcw size={12}/></button>
    </div>
  );
}

function MindMap({ title, nodes=[] }) {
  if (!nodes.length) return null;
  const cx=250,cy=145,r=90;
  const cols=["#7c6af7","#f7916a","#4ecdc4","#f7d76a","#f76a9f","#6af7b8","#76c7f7","#c76af7"];
  return (
    <svg viewBox="0 0 500 290" style={{width:"100%",maxHeight:240,display:"block"}}>
      {nodes.map((n,i)=>{
        const a=(i/nodes.length)*2*Math.PI-Math.PI/2;
        const nx=cx+r*Math.cos(a),ny=cy+r*Math.sin(a),col=cols[i%cols.length];
        return (<g key={i}>
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={col} strokeWidth="1.5" opacity="0.5"/>
          <circle cx={nx} cy={ny} r={26} fill={col} fillOpacity="0.15" stroke={col} strokeWidth="1.5"/>
          <foreignObject x={nx-22} y={ny-14} width={44} height={28}>
            <div xmlns="http://www.w3.org/1999/xhtml" style={{fontSize:8,color:"#e8e8f0",textAlign:"center",lineHeight:"1.2",wordBreak:"break-word"}}>{n}</div>
          </foreignObject>
        </g>);
      })}
      <circle cx={cx} cy={cy} r={40} fill="#7c6af7" fillOpacity="0.2" stroke="#7c6af7" strokeWidth="2"/>
      <foreignObject x={cx-36} y={cy-16} width={72} height={32}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{fontSize:9,fontWeight:700,color:"#e8e8f0",textAlign:"center",lineHeight:"1.3"}}>{title}</div>
      </foreignObject>
    </svg>
  );
}

// ── API Key Setup Screen ───────────────────────────────────────────────────
function KeySetup({ onSave }) {
  const [val, setVal] = useState("");
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f0f13",gap:20,padding:24}}>
      <BookOpen size={48} color="#7c6af7"/>
      <h1 style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,color:"#e8e8f0",margin:0}}>Study<span style={{color:"#7c6af7"}}>Partner</span></h1>
      <p style={{color:"#9090a8",fontSize:14,textAlign:"center",maxWidth:360,margin:0}}>
        Enter your free Gemini API key to get started.<br/>
        Get one free at <a href="https://aistudio.google.com/apikey" target="_blank" style={{color:"#7c6af7"}}>aistudio.google.com/apikey</a>
      </p>
      <div style={{display:"flex",gap:8,width:"100%",maxWidth:400}}>
        <input
          value={val} onChange={e=>setVal(e.target.value)}
          placeholder="AIzaSy..."
          type="password"
          style={{flex:1,background:"#1e1e28",border:"1px solid #2a2a38",borderRadius:10,padding:"10px 14px",color:"#e8e8f0",fontSize:14,outline:"none"}}
        />
        <button onClick={()=>{ if(val.trim()){ window.__GEMINI_KEY__=val.trim(); onSave(); }}}
          style={{background:"#7c6af7",border:"none",color:"#fff",borderRadius:10,padding:"0 18px",fontWeight:600,fontSize:14,cursor:"pointer"}}>
          Start
        </button>
      </div>
      <p style={{color:"#5a5a72",fontSize:11,textAlign:"center",maxWidth:360,margin:0}}>
        Your key is stored only in your browser memory — never sent to any server except Google.
      </p>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("chat");
  const [files, setFiles] = useState([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");

  const [msgs, setMsgs] = useState([{r:"a",t:"Hi! Upload your study materials and I'll help you master them. I can create flashcards, quizzes, chapter mind maps, and more."}]);
  const [inp, setInp] = useState("");
  const chatEnd = useRef();

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [learned, setLearned] = useState({});

  const [quiz, setQuiz] = useState([]);
  const [revealed, setRevealed] = useState({});

  const [tips, setTips] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [activeChap, setActiveChap] = useState(0);

  const [rMsgs, setRMsgs] = useState([{r:"a",t:"I'm your Research Tools Advisor. I know NotebookLM's 10 current limitations and all of ContextForge's capabilities. Ask me anything."}]);
  const [rInp, setRInp] = useState("");

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs,rMsgs]);

  if (!ready) return <KeySetup onSave={()=>setReady(true)}/>;

  const BG="#0f0f13", BG2="#16161d", BG3="#1e1e28", BD="#2a2a38";
  const TX="#e8e8f0", TX2="#9090a8", TX3="#5a5a72", CARD="#1a1a24";

  const addFiles = async (list) => {
    const arr = Array.from(list);
    setFiles(p=>[...p,...arr]);
    let c = content;
    for (const f of arr) { try { c += `\n\n--- ${f.name} ---\n` + await f.text(); } catch(_){} }
    setContent(c);
  };

  const run = async (fn) => { setBusy(true); try { await fn(); } catch(e) { alert("Error: "+e.message); } setBusy(false); };

  const sendChat = () => run(async () => {
    if (!inp.trim()) return;
    const q=inp.trim(); setInp("");
    setMsgs(p=>[...p,{r:"u",t:q}]);
    setBusyMsg("Thinking…");
    const ctx = content ? `Study material:\n${content.slice(0,5000)}` : "No materials uploaded.";
    const reply = await askGemini(`${ctx}\n\nQuestion: ${q}`, "You are an expert study tutor. Give clear, structured educational answers.");
    setMsgs(p=>[...p,{r:"a",t:reply}]);
  });

  const genCards = () => run(async () => {
    if (!content) { alert("Upload materials first."); return; }
    setBusyMsg("Generating flashcards…");
    const raw = await askGemini(`Create 8 flashcards. Return ONLY JSON array, no markdown:\n[{"front":"...","back":"..."}]\n\nContent:\n${content.slice(0,5000)}`, "Return ONLY valid JSON array.");
    setCards(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    setFlipped({}); setLearned({});
  });

  const genQuiz = () => run(async () => {
    if (!content) { alert("Upload materials first."); return; }
    setBusyMsg("Generating quiz…");
    const raw = await askGemini(`Create 5 exam questions with solutions. Return ONLY JSON:\n[{"question":"...","solution":"..."}]\n\nContent:\n${content.slice(0,5000)}`, "Return ONLY valid JSON array.");
    setQuiz(JSON.parse(raw.replace(/```json|```/g,"").trim())); setRevealed({});
  });

  const genTips = () => run(async () => {
    if (!content) { alert("Upload materials first."); return; }
    setBusyMsg("Creating memory techniques…");
    const raw = await askGemini(`Create 6 memory techniques. Return ONLY JSON:\n[{"type":"Acronym","tip":"...","example":"..."}]\n\nContent:\n${content.slice(0,4000)}`, "Return ONLY valid JSON array.");
    setTips(JSON.parse(raw.replace(/```json|```/g,"").trim()));
  });

  const genChapters = () => run(async () => {
    if (!content) { alert("Upload materials first."); return; }
    setBusyMsg("Detecting chapters…");
    const raw = await askGemini(`Identify 3-5 chapters/topics. Return ONLY JSON:\n[{"title":"...","summary":"2-3 sentences","nodes":["concept1","concept2","concept3","concept4","concept5","concept6"]}]\n\nContent:\n${content.slice(0,6000)}`, "Return ONLY valid JSON array.");
    const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
    setChapters(parsed); setActiveChap(0);
  });

  const sendResearch = () => run(async () => {
    if (!rInp.trim()) return;
    const q=rInp.trim(); setRInp("");
    setRMsgs(p=>[...p,{r:"u",t:q}]);
    setBusyMsg("Consulting knowledge base…");
    const reply = await askGemini(q, `You are a research tools expert.\n${NLM_KB}\n\n${CF_KB}\n\nGive practical advice.`);
    setRMsgs(p=>[...p,{r:"a",t:reply}]);
  });

  const exportPDF = () => {
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Flashcards</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:10px}th{background:#eee}.l{color:green;font-weight:bold}</style></head><body><h1>Flashcards</h1><table><tr><th>#</th><th>Question</th><th>Answer</th><th>Status</th></tr>${cards.map((c,i)=>`<tr><td>${i+1}</td><td>${c.front}</td><td>${c.back}</td><td class="${learned[i]?"l":""}">${learned[i]?"✓ Learned":"To review"}</td></tr>`).join("")}</table><button onclick="window.print()" style="margin-top:16px;padding:8px 16px">Print / Save PDF</button></body></html>`);
    w.document.close();
  };

  const learnedN = Object.values(learned).filter(Boolean).length;

  const TABS=[
    {id:"chat",label:"Chat",icon:MessageSquare},
    {id:"flashcards",label:"Flashcards",icon:Layers},
    {id:"quiz",label:"Quiz",icon:FlaskConical},
    {id:"tips",label:"Memory",icon:Brain},
    {id:"chapters",label:"Chapters",icon:Map},
    {id:"research",label:"Research Tools",icon:Search},
  ];
  const AB={background:"#7c6af7",border:"none",color:"#fff",borderRadius:8,padding:"7px 13px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5,cursor:"pointer"};
  const AB2={background:BG3,border:`1px solid ${BD}`,color:TX2,borderRadius:8,padding:"7px 13px",fontSize:12,display:"flex",alignItems:"center",gap:5,cursor:"pointer"};

  const Msg = ({m}) => (
    <div style={{maxWidth:"80%",padding:"10px 14px",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",
      alignSelf:m.r==="u"?"flex-end":"flex-start",
      background:m.r==="u"?"#7c6af7":BG3, color:m.r==="u"?"#fff":TX,
      border:m.r==="u"?"none":`1px solid ${BD}`,
      borderRadius:m.r==="u"?"11px 11px 3px 11px":"11px 11px 11px 3px"}}>
      {m.t}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:BG,color:TX,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder{color:#5a5a72} *{box-sizing:border-box}`}</style>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",height:56,background:BG2,borderBottom:`1px solid ${BD}`,flexShrink:0,gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <BookOpen size={20} color="#7c6af7"/>
          <span style={{fontWeight:800,fontSize:17,fontFamily:"Syne,sans-serif"}}>Study<span style={{color:"#7c6af7"}}>Partner</span></span>
        </div>
        <Pomodoro/>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setReady(false)} style={{...AB2,fontSize:11,padding:"5px 10px"}}>Change Key</button>
          <button onClick={()=>setDark(d=>!d)} style={IB}>{dark?<Sun size={15}/>:<Moon size={15}/>}</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div style={{width:195,background:BG2,borderRight:`1px solid ${BD}`,padding:12,overflowY:"auto",flexShrink:0}}>
          <div style={{border:`2px dashed ${BD}`,borderRadius:10,padding:"14px 10px",textAlign:"center",cursor:"pointer",marginBottom:10}}
            onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files);}}
            onClick={()=>document.getElementById("fi").click()}>
            <Upload size={18} color="#7c6af7"/>
            <div style={{fontSize:12,fontWeight:600,marginTop:5,color:TX}}>Upload Materials</div>
            <div style={{fontSize:10,color:TX3,marginTop:2}}>PDF · DOCX · TXT</div>
            <input id="fi" type="file" multiple hidden onChange={e=>addFiles(e.target.files)}/>
          </div>

          {files.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 7px",background:BG3,borderRadius:6,marginBottom:3}}>
              <FileText size={11} color="#7c6af7"/>
              <span style={{flex:1,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:TX2}}>{f.name}</span>
              <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:TX3,cursor:"pointer",padding:1}}><X size={11}/></button>
            </div>
          ))}

          <div style={{marginTop:14}}>
            <div style={{fontSize:9,color:TX3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Quick Generate</div>
            {[{l:"Flashcards",I:Layers,fn:genCards,t:"flashcards"},{l:"Quiz",I:FlaskConical,fn:genQuiz,t:"quiz"},{l:"Memory Tips",I:Brain,fn:genTips,t:"tips"},{l:"Chapter Maps",I:Map,fn:genChapters,t:"chapters"}].map(({l,I,fn,t})=>(
              <button key={l} onClick={()=>{setTab(t);fn();}} style={{display:"flex",alignItems:"center",gap:6,width:"100%",background:BG3,border:`1px solid ${BD}`,color:TX2,borderRadius:7,padding:"7px 9px",fontSize:11,marginBottom:3,cursor:"pointer"}}>
                <I size={13}/>{l}
              </button>
            ))}
          </div>

          {cards.length>0&&(
            <div style={{marginTop:14}}>
              <div style={{fontSize:9,color:TX3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>Progress</div>
              <div style={{fontSize:11,color:TX2,marginBottom:4}}>{learnedN}/{cards.length} · {Math.round(learnedN/cards.length*100)}%</div>
              <div style={{height:5,background:BG3,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",background:"linear-gradient(90deg,#7c6af7,#f7916a)",width:`${learnedN/cards.length*100}%`,transition:"width .4s"}}/>
              </div>
            </div>
          )}
        </div>

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Tabs */}
          <div style={{display:"flex",gap:2,padding:"8px 12px 0",background:BG2,borderBottom:`1px solid ${BD}`,flexShrink:0,flexWrap:"wrap"}}>
            {TABS.map(({id,label,icon:Ic})=>(
              <button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",background:tab===id?BG3:"none",border:"none",borderBottom:tab===id?"2px solid #7c6af7":"2px solid transparent",color:tab===id?"#7c6af7":TX3,borderRadius:"6px 6px 0 0",fontSize:12,fontWeight:600,cursor:"pointer",marginBottom:-1}}>
                <Ic size={13}/>{label}
              </button>
            ))}
          </div>

          {busy&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",background:"#7c6af7",color:"#fff",fontSize:12,flexShrink:0}}>
              <div style={{width:13,height:13,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",animation:"spin .7s linear infinite",flexShrink:0}}/>
              {busyMsg}
            </div>
          )}

          {/* CHAT */}
          {tab==="chat"&&(
            <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
                {msgs.map((m,i)=><Msg key={i} m={m}/>)}
                <div ref={chatEnd}/>
              </div>
              <div style={{padding:"9px 12px",borderTop:`1px solid ${BD}`,display:"flex",gap:7,background:BG2}}>
                <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
                  placeholder="Ask anything about your materials…"
                  style={{flex:1,background:BG3,border:`1px solid ${BD}`,borderRadius:9,padding:"9px 12px",color:TX,fontSize:13,outline:"none"}}/>
                <button onClick={sendChat} style={{background:"#7c6af7",border:"none",color:"#fff",borderRadius:9,padding:"0 14px",display:"flex",alignItems:"center",cursor:"pointer"}}><ChevronRight size={16}/></button>
              </div>
            </div>
          )}

          {/* FLASHCARDS */}
          {tab==="flashcards"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontSize:16,fontWeight:700,fontFamily:"Syne,sans-serif"}}>Flashcards</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={genCards} style={AB}><RefreshCw size={13}/>Regenerate</button>
                  {cards.length>0&&<button onClick={exportPDF} style={AB2}><Download size={13}/>PDF</button>}
                </div>
              </div>
              {cards.length>0&&<div style={{marginBottom:12}}>
                <div style={{height:5,background:BG3,borderRadius:3,overflow:"hidden",marginBottom:3}}>
                  <div style={{height:"100%",background:"linear-gradient(90deg,#7c6af7,#f7916a)",width:`${learnedN/cards.length*100}%`,transition:"width .4s"}}/>
                </div>
                <div style={{fontSize:11,color:TX3}}>{learnedN}/{cards.length} mastered</div>
              </div>}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:11}}>
                {cards.map((c,i)=>(
                  <div key={i} style={{background:CARD,border:`1px solid ${learned[i]?"#4ecdc4":BD}`,borderRadius:11,overflow:"hidden"}}>
                    <div style={{padding:14,cursor:"pointer",minHeight:95,display:"flex",flexDirection:"column",justifyContent:"center"}} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))}>
                      <div style={{fontSize:9,letterSpacing:1.5,color:TX3,textTransform:"uppercase",marginBottom:5}}>{flipped[i]?"Answer":"Question"}</div>
                      <div style={{fontSize:13,lineHeight:1.6,color:TX}}>{flipped[i]?c.back:c.front}</div>
                    </div>
                    <button onClick={()=>setLearned(l=>({...l,[i]:!l[i]}))} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,width:"100%",padding:"6px",background:learned[i]?"#4ecdc4":BG3,border:"none",borderTop:`1px solid ${BD}`,color:learned[i]?"#000":TX3,fontSize:11,cursor:"pointer",fontWeight:learned[i]?600:400}}>
                      <Check size={11}/>{learned[i]?"Learned ✓":"Mark Learned"}
                    </button>
                  </div>
                ))}
              </div>
              {!cards.length&&!busy&&<div style={{textAlign:"center",padding:"40px 0",color:TX3}}><Layers size={34} style={{margin:"0 auto 10px",display:"block"}}/><p>Click Regenerate to create flashcards</p></div>}
            </div>
          )}

          {/* QUIZ */}
          {tab==="quiz"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontSize:16,fontWeight:700,fontFamily:"Syne,sans-serif"}}>Practice Quiz</span>
                <button onClick={genQuiz} style={AB}><RefreshCw size={13}/>New Quiz</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                {quiz.map((q,i)=>(
                  <div key={i} style={{background:CARD,border:`1px solid ${BD}`,borderRadius:11,padding:14}}>
                    <div style={{fontSize:10,color:"#7c6af7",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:6}}>Q{i+1}</div>
                    <div style={{fontSize:13,lineHeight:1.6,color:TX,marginBottom:10}}>{q.question}</div>
                    {revealed[i]
                      ?<div style={{background:BG3,borderRadius:8,padding:11,fontSize:13,lineHeight:1.7,color:TX2,whiteSpace:"pre-wrap"}}><span style={{color:"#4ecdc4",fontWeight:600,fontSize:10,display:"block",marginBottom:4}}>SOLUTION</span>{q.solution}</div>
                      :<button onClick={()=>setRevealed(r=>({...r,[i]:true}))} style={AB2}>Reveal Solution</button>
                    }
                  </div>
                ))}
              </div>
              {!quiz.length&&!busy&&<div style={{textAlign:"center",padding:"40px 0",color:TX3}}><FlaskConical size={34} style={{margin:"0 auto 10px",display:"block"}}/><p>Generate a quiz from your materials</p></div>}
            </div>
          )}

          {/* MEMORY */}
          {tab==="tips"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontSize:16,fontWeight:700,fontFamily:"Syne,sans-serif"}}>Memory Techniques</span>
                <button onClick={genTips} style={AB}><RefreshCw size={13}/>Regenerate</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:11}}>
                {tips.map((t,i)=>(
                  <div key={i} style={{background:CARD,border:`1px solid ${BD}`,borderRadius:11,padding:14}}>
                    <div style={{fontSize:9,color:"#f7916a",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:6}}>{t.type}</div>
                    <div style={{fontSize:13,lineHeight:1.7,color:TX,marginBottom:7}}>{t.tip}</div>
                    {t.example&&<div style={{fontSize:12,color:TX3,borderLeft:`2px solid ${BD}`,paddingLeft:8,fontStyle:"italic"}}>{t.example}</div>}
                  </div>
                ))}
              </div>
              {!tips.length&&!busy&&<div style={{textAlign:"center",padding:"40px 0",color:TX3}}><Brain size={34} style={{margin:"0 auto 10px",display:"block"}}/><p>Generate memory techniques from your materials</p></div>}
            </div>
          )}

          {/* CHAPTERS */}
          {tab==="chapters"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontSize:16,fontWeight:700,fontFamily:"Syne,sans-serif"}}>Chapter Summaries & Mind Maps</span>
                <button onClick={genChapters} style={AB}><RefreshCw size={13}/>Detect Chapters</button>
              </div>
              {chapters.length>0?(
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:170,flexShrink:0,display:"flex",flexDirection:"column",gap:3}}>
                    {chapters.map((ch,i)=>(
                      <button key={i} onClick={()=>setActiveChap(i)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 10px",background:activeChap===i?"#7c6af7":BG3,border:`1px solid ${activeChap===i?"#7c6af7":BD}`,borderRadius:8,color:activeChap===i?"#fff":TX2,fontSize:11,textAlign:"left",cursor:"pointer"}}>
                        <List size={11}/><span style={{flex:1}}>{ch.title}</span><ChevronRight size={10}/>
                      </button>
                    ))}
                  </div>
                  {chapters[activeChap]&&(
                    <div style={{flex:1}}>
                      <h3 style={{fontSize:16,fontWeight:700,fontFamily:"Syne,sans-serif",marginBottom:8,color:TX}}>{chapters[activeChap].title}</h3>
                      <p style={{color:TX2,fontSize:13,lineHeight:1.8,marginBottom:14}}>{chapters[activeChap].summary}</p>
                      <div style={{background:BG3,border:`1px solid ${BD}`,borderRadius:10,padding:12,marginBottom:12}}>
                        <div style={{fontSize:9,color:TX3,textTransform:"uppercase",letterSpacing:1.5,marginBottom:7}}>Mind Map</div>
                        <MindMap title={chapters[activeChap].title} nodes={chapters[activeChap].nodes}/>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {chapters[activeChap].nodes?.map((n,i)=>(
                          <span key={i} style={{fontSize:11,padding:"3px 10px",background:BG3,border:`1px solid ${BD}`,borderRadius:20,color:TX2}}>{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ):<div style={{textAlign:"center",padding:"40px 0",color:TX3}}><Map size={34} style={{margin:"0 auto 10px",display:"block"}}/><p>Upload materials and click Detect Chapters</p></div>}
            </div>
          )}

          {/* RESEARCH */}
          {tab==="research"&&(
            <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
              <div style={{padding:"9px 12px",borderBottom:`1px solid ${BD}`,background:BG2,display:"flex",flexWrap:"wrap",gap:5}}>
                {["NotebookLM's main limitations?","How does ContextForge handle 200 sources?","Can NotebookLM read Excel files?","How does live sync work?","Compare collaboration features","What export options exist?"].map((q,i)=>(
                  <button key={i} onClick={()=>setRInp(q)} style={{fontSize:11,padding:"3px 9px",background:BG3,border:`1px solid ${BD}`,borderRadius:20,color:TX2,cursor:"pointer"}}>{q}</button>
                ))}
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
                {rMsgs.map((m,i)=><Msg key={i} m={m}/>)}
                <div ref={chatEnd}/>
              </div>
              <div style={{padding:"9px 12px",borderTop:`1px solid ${BD}`,display:"flex",gap:7,background:BG2}}>
                <input value={rInp} onChange={e=>setRInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendResearch()}
                  placeholder="Ask about NotebookLM, ContextForge, or research workflows…"
                  style={{flex:1,background:BG3,border:`1px solid ${BD}`,borderRadius:9,padding:"9px 12px",color:TX,fontSize:13,outline:"none"}}/>
                <button onClick={sendResearch} style={{background:"#7c6af7",border:"none",color:"#fff",borderRadius:9,padding:"0 14px",display:"flex",alignItems:"center",cursor:"pointer"}}><ChevronRight size={16}/></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const IB = {background:"none",border:"1px solid #2a2a38",color:"#9090a8",borderRadius:7,padding:"5px 8px",display:"flex",alignItems:"center",cursor:"pointer"};
const Upload2 = ({size,color}) => <Upload size={size} color={color}/>;
