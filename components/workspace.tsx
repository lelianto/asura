"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ReactFlow,Background,Controls,Handle,MiniMap,Position,ReactFlowProvider,useReactFlow,type NodeProps} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import {ArrowRight,AudioWaveform,ChevronDown,Command,CornerDownLeft,GitBranch,Languages,LayoutGrid,Mic,MicOff,Plus,Redo2,RotateCcw,Trash2,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger} from "@/components/ui/alert-dialog";
import {parseIntent} from "@/lib/diagram";
import {useDiagramStore} from "@/lib/store";
import {WebSpeechProvider} from "@/lib/speech";

type Log={text:string;applied:boolean;time:string};
type Status="initializing"|"listening"|"processing"|"denied"|"unavailable"|"ended";
const labels={
  id:{title:"Arsitektur Suara",session:"SESI AKTIF",listening:"Mendengarkan",processing:"Memproses",initializing:"Menyiapkan mikrofon",denied:"Izin mikrofon ditolak",unavailable:"Pengenalan suara tidak tersedia",ended:"Sesi berakhir",placeholder:"Ketik perintah untuk menguji…",hint:"Ucapkan keputusan arsitektur dengan jelas",undo:"Urungkan",redo:"Ulangi",layout:"Tata otomatis",clear:"Bersihkan",end:"Akhiri sesi",empty:"Ucapan sementara akan muncul di sini",safe:"Tidak ada perubahan — kalimat bukan perintah eksplisit",applied:"Diterapkan",examples:"COBA UCAPKAN",confirmTitle:"Bersihkan seluruh diagram?",confirmBody:"Semua node dan koneksi akan dihapus. Anda masih dapat mengurungkannya.",cancel:"Batal",confirm:"Bersihkan"},
  en:{title:"Voice Architecture",session:"LIVE SESSION",listening:"Listening",processing:"Processing",initializing:"Preparing microphone",denied:"Microphone permission denied",unavailable:"Speech recognition unavailable",ended:"Session ended",placeholder:"Type a command to test…",hint:"State architecture decisions clearly",undo:"Undo",redo:"Redo",layout:"Auto layout",clear:"Clear",end:"End session",empty:"Interim speech will appear here",safe:"No change — not an explicit command",applied:"Applied",examples:"TRY SAYING",confirmTitle:"Clear the entire diagram?",confirmBody:"All nodes and connections will be removed. You can still undo this.",cancel:"Cancel",confirm:"Clear"}
};

function SystemNode({data,selected}:NodeProps){const label=String(data.label);const kind=String(data.kind||"service");const color=kind==="client"?"#b7f774":kind==="edge"?"#65d9e8":kind==="app"?"#ffbd68":"#a990ff";return <div className="min-w-[164px] rounded-2xl border bg-[#10201b] px-5 py-4 shadow-[0_12px_28px_rgba(0,0,0,.32)]" style={{borderColor:selected?color:"#30463d"}}><Handle type="target" position={Position.Left} style={{background:color,border:0,width:8,height:8}}/><div className="mb-3 flex items-center justify-between"><span className="h-2 w-2 rounded-full" style={{background:color}}/><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#71877d]">{kind}</span></div><div className="text-[15px] font-semibold text-[#edf7f1]">{label}</div><Handle type="source" position={Position.Right} style={{background:color,border:0,width:8,height:8}}/></div>}
const nodeTypes={system:SystemNode};

function Canvas({onLog}:{onLog:(l:Log)=>void}){
  const {nodes,edges,onNodesChange,onEdgesChange,execute,undo,redo,clear,past,future}=useDiagramStore();const flow=useReactFlow();
  const [lang,setLang]=useState<"id"|"en">("id");const [status,setStatus]=useState<Status>("initializing");const [interim,setInterim]=useState("");const [logs,setLogs]=useState<Log[]>([{text:"User ke CDN lalu ke Next.js lalu ke BFF",applied:true,time:"baru saja"}]);const [typed,setTyped]=useState("");const [seconds,setSeconds]=useState(0);const speech=useRef<WebSpeechProvider|null>(null);const L=labels[lang];
  const submit=useCallback((raw:string)=>{const text=raw.trim();if(!text)return;setStatus("processing");const commands=parseIntent(text);if(commands.length)execute(commands);const log={text,applied:commands.length>0,time:new Date().toLocaleTimeString(lang==="id"?"id-ID":"en-US",{hour:"2-digit",minute:"2-digit"})};setLogs(x=>[log,...x].slice(0,5));onLog(log);setInterim("");window.setTimeout(()=>setStatus("listening"),320)},[execute,lang,onLog]);
  useEffect(()=>{const p=new WebSpeechProvider();speech.current=p;p.setLanguage(lang==="id"?"id-ID":"en-US");const unsub=p.subscribe(e=>{setInterim(e.transcript);if(e.isFinal&&(!e.confidence||e.confidence>=.55))submit(e.transcript)});p.start().then(()=>setStatus("listening")).catch(err=>setStatus(err.message==="unsupported"?"unavailable":"denied"));return()=>{unsub();p.stop()}},[]);
  useEffect(()=>{speech.current?.setLanguage(lang==="id"?"id-ID":"en-US")},[lang]);
  useEffect(()=>{
    const context=(document as Document&{modelContext?:{registerTool:(tool:unknown,options?:{signal?:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({name:"apply_diagram_statement",title:"Apply diagram statement",description:"Apply one explicit Indonesian or English architecture statement to the visible diagram using the deterministic parser.",inputSchema:{type:"object",properties:{statement:{type:"string"}},required:["statement"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const statement=(input as {statement?:unknown})?.statement;if(typeof statement!=="string"||!statement.trim())throw new Error("statement must be a non-empty string");const commands=parseIntent(statement);if(!commands.length)return{applied:false,reason:"No explicit diagram command detected"};execute(commands);return{applied:true,commandCount:commands.length}}},{signal:lifecycle.signal})).catch(()=>undefined);
    return()=>lifecycle.abort();
  },[execute]);
  useEffect(()=>{if(status==="ended")return;const id=setInterval(()=>setSeconds(x=>x+1),1000);return()=>clearInterval(id)},[status]);
  const time=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  const layout=()=>{const g=new dagre.graphlib.Graph();g.setDefaultEdgeLabel(()=>({}));g.setGraph({rankdir:"LR",ranksep:90,nodesep:65});nodes.forEach(n=>g.setNode(n.id,{width:164,height:82}));edges.forEach(e=>g.setEdge(e.source,e.target));dagre.layout(g);useDiagramStore.setState({nodes:nodes.map(n=>{const p=g.node(n.id);return{...n,position:{x:p.x-82,y:p.y-41}}})});window.setTimeout(()=>flow.fitView({padding:.25,duration:500}),40)};
  const displayNodes=useMemo(()=>nodes.map(n=>({...n,type:"system"})),[nodes]);
  const retry=()=>{setStatus("initializing");speech.current?.start().then(()=>setStatus("listening")).catch(()=>setStatus("denied"))};
  return <main className="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-[#07100e]">
    <header className="glass z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-[#24352e] px-4 sm:px-7">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><GitBranch size={18}/></div><div><h1 className="text-[15px] font-semibold tracking-tight sm:text-base">{L.title}</h1><p className="hidden text-xs text-[#71877d] sm:block">Think out loud. We draw it.</p></div></div>
      <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 text-xs text-[#9bafa6] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>{L.session}<span className="font-mono text-[#dce9e2]">{time}</span></div><label className="relative flex items-center"><Languages className="pointer-events-none absolute left-2.5" size={15}/><select aria-label="Bahasa pengenalan suara" value={lang} onChange={e=>setLang(e.target.value as "id"|"en")} className="appearance-none rounded-lg border border-[#2a3d35] bg-[#10201b] py-2 pl-8 pr-7 text-xs text-[#dce9e2]"><option value="id">Bahasa Indonesia</option><option value="en">English</option></select><ChevronDown className="pointer-events-none absolute right-2" size={13}/></label></div>
    </header>
    <section className="relative min-h-0 flex-1">
      <div className="canvas-grid absolute inset-0"><ReactFlow nodes={displayNodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.25}} colorMode="dark"><Background color="transparent"/><Controls position="top-left"/><MiniMap position="top-right" nodeColor="#b7f774" maskColor="rgba(3,10,8,.75)"/></ReactFlow></div>
      <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-[#2b4037] bg-[#0d1916]/90 px-4 py-2 text-xs text-[#94a89f] shadow-lg">{nodes.length} node <span className="mx-2 text-[#3d5149]">•</span> {edges.length} koneksi</div>
      {!nodes.length&&<div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><GitBranch className="mx-auto mb-4 text-[#41554c]" size={38}/><p className="font-semibold text-[#b8c8c0]">Kanvas siap</p><p className="mt-1 text-sm text-[#71877d]">Ucapkan “tambahkan User” untuk mulai</p></div></div>}
    </section>
    <section className="glass z-20 shrink-0 border-t border-[#293b33]">
      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[1fr_340px] lg:px-7">
        <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#2a3d35] bg-[#0d1b17] px-4 py-3 sm:px-5">
          <div className={(status==="listening"?"pulse-ring ":"")+"relative grid h-11 w-11 shrink-0 place-items-center rounded-full "+(status==="denied"||status==="unavailable"?"bg-[#44201f] text-[#ff8b82]":"bg-primary text-primary-foreground")}>
            {status==="denied"||status==="unavailable"||status==="ended"?<MicOff size={19}/>:status==="processing"?<AudioWaveform size={19}/>:<Mic size={19}/>} 
          </div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold">{L[status]}</p>{status==="listening"&&<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">LIVE</span>}</div><p className={(interim?"text-[#e5f0ea]":"text-[#63786f]")+" mt-1 truncate text-sm"}>{interim?`“${interim}”`:L.empty}</p></div>
          {(status==="denied"||status==="unavailable")&&<Button size="sm" variant="secondary" onClick={retry}>Coba lagi</Button>}
        </div>
        <form onSubmit={e=>{e.preventDefault();submit(typed);setTyped("")}} className="flex items-center gap-2 rounded-2xl border border-[#2a3d35] bg-[#0d1b17] p-2 pl-4"><Command size={17} className="shrink-0 text-[#71877d]"/><input value={typed} onChange={e=>setTyped(e.target.value)} placeholder={L.placeholder} aria-label={L.placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-[#edf6f1] outline-none placeholder:text-[#5f746a]"/><Button type="submit" size="icon" disabled={!typed.trim()}><CornerDownLeft size={17}/></Button></form>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#203129] px-4 py-3 sm:px-7">
        <div className="flex items-center gap-1"><ToolButton onClick={undo} disabled={!past.length} icon={<RotateCcw/>} label={L.undo}/><ToolButton onClick={redo} disabled={!future.length} icon={<Redo2/>} label={L.redo}/><ToolButton onClick={layout} icon={<LayoutGrid/>} label={L.layout}/>
          <AlertDialog><AlertDialogTrigger asChild><span><ToolButton icon={<Trash2/>} label={L.clear}/></span></AlertDialogTrigger><AlertDialogContent className="border-[#33483f] bg-[#0d1916] text-white"><AlertDialogHeader><AlertDialogTitle>{L.confirmTitle}</AlertDialogTitle><AlertDialogDescription>{L.confirmBody}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{L.cancel}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={clear}>{L.confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div><Button variant="secondary" onClick={()=>{speech.current?.stop();setStatus("ended")}}><X size={16}/><span className="hidden sm:inline">{L.end}</span></Button>
      </div>
    </section>
  </main>;
}
function ToolButton({icon,label,onClick,disabled}:{icon:React.ReactNode;label:string;onClick?:()=>void;disabled?:boolean}){return <button onClick={onClick} disabled={disabled} title={label} aria-label={label} className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-[#93a79e] transition hover:bg-[#17251f] hover:text-white disabled:opacity-30 [&_svg]:h-4 [&_svg]:w-4"><span>{icon}</span><span className="hidden text-xs xl:inline">{label}</span></button>}

export default function Workspace(){const [last,setLast]=useState<Log|null>(null);return <ReactFlowProvider><Canvas onLog={setLast}/>{last&&<div aria-live="polite" className="pointer-events-none fixed bottom-[150px] left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[#344a40] bg-[#10201b] px-4 py-2 text-xs shadow-xl"><span className={last.applied?"text-primary":"text-[#ffbd68]"}>{last.applied?"✓ Diterapkan":"○ Tidak ada perubahan"}</span><span className="ml-2 text-[#90a59b]">{last.text}</span></div>}</ReactFlowProvider>}
