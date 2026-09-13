"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {ReactFlow,Background,Controls,Handle,MiniMap,Position,ReactFlowProvider,useReactFlow,MarkerType,type Edge,type Node,type NodeProps,type NodeChange} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import {AudioWaveform,ChevronDown,Command,CornerDownLeft,GitBranch,Languages,LayoutGrid,LifeBuoy,Mic,MicOff,Pencil,Redo2,RotateCcw,Trash2,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger} from "@/components/ui/alert-dialog";
import {parseIntent} from "@/lib/diagram";
import {useDiagramStore} from "@/lib/store";
import {WebSpeechProvider} from "@/lib/speech";
import {examples} from "@/lib/examples";

type Log={text:string;applied:boolean;time:string;lang:"id"|"en"};
if(typeof window!=="undefined"){
  window.addEventListener("error",(e)=>{
    if(e.message&&e.message.includes("ResizeObserver")){
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}
type Status="initializing"|"listening"|"processing"|"denied"|"unavailable"|"ended";
const labels={
  id:{title:"Arsitektur Suara",session:"SESI AKTIF",listening:"Mendengarkan",processing:"Memproses",initializing:"Menyiapkan mikrofon",denied:"Izin mikrofon ditolak",unavailable:"Pengenalan suara tidak tersedia",ended:"Sesi berakhir",placeholder:"Ketik perintah untuk menguji…",hint:"Ucapkan keputusan arsitektur dengan jelas",undo:"Urungkan",redo:"Ulangi",layout:"Tata otomatis",clear:"Bersihkan",end:"Akhiri sesi",empty:"Ucapan sementara akan muncul di sini",safe:"Tidak ada perubahan — kalimat bukan perintah eksplisit",applied:"Diterapkan",examples:"COBA UCAPKAN",examplesTyped:"CONTOH PERINTAH",confirmTitle:"Bersihkan seluruh diagram?",confirmBody:"Semua node dan koneksi akan dihapus. Anda masih dapat mengurungkannya.",cancel:"Batal",confirm:"Bersihkan",guide:"Panduan",voiceOff:"Sembunyikan mode suara",voiceOn:"Aktifkan mode suara",typeOnly:"Mode ketik",retry:"Coba lagi",nodes:"node",connections:"koneksi",ready:"Kanvas siap",readyHint:"Ucapkan \u201ctambahkan User\u201d untuk mulai",langLabel:"Bahasa pengenalan suara",deleteNode:"Hapus node",editNode:"Ubah nama",editHint:"Klik dua kali untuk mengubah nama, Delete untuk menghapus",dismiss:"Tutup",jumpToSec:"\u2794 Ke Seksi",jumpFromSec:"\u21a9 Dari Seksi",section:"Seksi",sectionSub:"Alur panjang, 4 layer per seksi"},
  en:{title:"Voice Architecture",session:"LIVE SESSION",listening:"Listening",processing:"Processing",initializing:"Preparing microphone",denied:"Microphone permission denied",unavailable:"Speech recognition unavailable",ended:"Session ended",placeholder:"Type a command to test…",hint:"State architecture decisions clearly",undo:"Undo",redo:"Redo",layout:"Auto layout",clear:"Clear",end:"End session",empty:"Interim speech will appear here",safe:"No change — not an explicit command",applied:"Applied",examples:"TRY SAYING",examplesTyped:"EXAMPLE COMMANDS",confirmTitle:"Clear the entire diagram?",confirmBody:"All nodes and connections will be removed. You can still undo this.",cancel:"Cancel",confirm:"Clear",guide:"Guide",voiceOff:"Hide voice mode",voiceOn:"Turn on voice mode",typeOnly:"Type-only mode",retry:"Try again",nodes:"nodes",connections:"connections",ready:"Canvas ready",readyHint:"Say \u201cadd User\u201d to begin",langLabel:"Speech recognition language",deleteNode:"Delete node",editNode:"Rename",editHint:"Double-click to rename, Delete to remove",dismiss:"Dismiss",jumpToSec:"\u2794 To Section",jumpFromSec:"\u21a9 From Section",section:"Section",sectionSub:"Long flow, 4 layers per section"}
};

const LangContext=createContext<"id"|"en">("id");
const JumpContext=createContext<(targetId:string)=>void>(()=>{});

function SystemNode({id,data,selected}:NodeProps){
  const label=String(data.label);const tech=data.tech?String(data.tech):"";const kind=String(data.kind||"service");
  const isStart=Boolean(data.isStart);const isEnd=Boolean(data.isEnd);const isHighlighted=Boolean(data.isHighlighted);
  const color=kind==="client"?"#b7f774":kind==="edge"?"#65d9e8":kind==="app"?"#ffbd68":kind==="data"?"#ff9bc7":"#a990ff";
  const L=labels[useContext(LangContext)];
  const jumpTo=useContext(JumpContext);
  const remove=useDiagramStore(s=>s.remove);const rename=useDiagramStore(s=>s.rename);
  // `draft` doubles as the edit flag: null means the label is being displayed, not edited.
  const [draft,setDraft]=useState<string|null>(null);
  const commit=()=>{if(draft!==null)rename(id,draft);setDraft(null)};
  const handleJump=(e:React.MouseEvent)=>{
    if(data.bridgeTargetId){
      e.stopPropagation();
      jumpTo(String(data.bridgeTargetId));
    }
  };
  return <div onDoubleClick={()=>setDraft(label)} onClick={draft===null&&data.bridgeTargetId?handleJump:undefined} title={draft===null?(data.bridgeTargetId?L.jumpToSec:L.editHint):undefined} className={"group relative min-w-[164px] rounded-2xl border bg-[#10201b] px-5 py-4 transition-all duration-300 "+(isHighlighted?"animate-pulse ring-2 ring-cyan-400 ":"")+(data.bridgeTargetId?"cursor-pointer hover:border-cyan-400 ":"")} style={{borderColor:isHighlighted?"#65d9e8":selected?color:isStart?"#22c55e":isEnd?"#ec4899":data.bridgeTargetId?"#44786d":"#30463d",boxShadow:isHighlighted?"0 0 0 4px #65d9e8, 0 0 35px rgba(101,217,232,.8)":isStart?"0 0 20px rgba(34,197,94,.25)":isEnd?"0 0 20px rgba(236,72,153,.25)":"0 12px 28px rgba(0,0,0,.32)"}}>
    <Handle type="target" position={Position.Left} style={{background:color,border:0,width:8,height:8}}/>
    <div className="nodrag absolute -right-2 -top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <button type="button" onClick={()=>setDraft(label)} title={L.editNode} aria-label={L.editNode+": "+label} className="grid h-6 w-6 place-items-center rounded-full border border-[#33483f] bg-[#152b24] text-[#9bafa6] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"><Pencil size={12}/></button>
      <button type="button" onClick={()=>remove([id])} title={L.deleteNode} aria-label={L.deleteNode+": "+label} className="grid h-6 w-6 place-items-center rounded-full border border-[#4b2a27] bg-[#2a1614] text-[#ff8b82] transition hover:bg-[#3d1d19] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"><X size={13}/></button>
    </div>
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{background:color}}/><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#71877d]">{kind}</span></div>
      <div className="flex items-center gap-1">
        {isStart&&<span className="rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">● Start</span>}
        {isEnd&&<span className="rounded-full border border-pink-500/50 bg-pink-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-pink-300">■ End</span>}
        {Boolean(data.bridgeToSec)&&<button type="button" onClick={handleJump} className="rounded-full border border-emerald-500/50 bg-emerald-950/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/90 hover:border-emerald-400" title={L.jumpToSec+" "+String(data.bridgeToSec)}>{L.jumpToSec} {String(data.bridgeToSec)}</button>}
        {Boolean(data.isBridgeTarget)&&<button type="button" onClick={handleJump} className="rounded-full border border-cyan-500/50 bg-cyan-950/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/90 hover:border-cyan-400" title={L.jumpFromSec+" "+String(data.bridgeFromSec||1)}>{L.jumpFromSec} {String(data.bridgeFromSec||1)}</button>}
      </div>
    </div>
    {draft===null
      ?<div className="text-[15px] font-semibold text-[#edf7f1]">{label}</div>
      // Key events are stopped so React Flow does not read Backspace as "delete this node".
      :<input autoFocus value={draft} aria-label={L.editNode} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")commit();if(e.key==="Escape")setDraft(null)}} className="nodrag nopan w-full rounded-md border border-[#3c5a4e] bg-[#081511] px-2 py-1 text-[15px] font-semibold text-[#edf7f1] outline-none"/>}
    {tech&&<div className="mt-1 text-[11px] text-[#8aa79a]">{tech}</div>}
    <Handle type="source" position={Position.Right} style={{background:color,border:0,width:8,height:8}}/>
  </div>;
}

function SectionHeaderNode({data}:NodeProps){
  const L=labels[useContext(LangContext)];
  const jumpTo=useContext(JumpContext);
  const title=`${L.section} ${String(data.section||1)}`;
  const subtitle=L.sectionSub;
  const count=typeof data.count==="number"?data.count:undefined;
  const boundaryLabel=data.boundaryLabel?String(data.boundaryLabel):"";
  return <div onClick={boundaryLabel?()=>jumpTo(String(data.bridgeTargetId)):undefined} className={(boundaryLabel?"cursor-pointer border-cyan-500/60 hover:border-cyan-300 ":"pointer-events-none border-[#2b4238] ")+"relative select-none rounded-xl border bg-[#0c1a16]/85 px-4 py-2.5 shadow-lg backdrop-blur-md"}>
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-emerald-400"/>
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">{title}</span>
      {count!==undefined&&<span className="rounded-full bg-[#183027] px-2 py-0.5 text-[10px] text-[#8aa79a]">{count} {L.nodes}</span>}
    </div>
    {subtitle&&<p className="mt-0.5 text-[11px] text-[#71877d]">{subtitle}</p>}
    {boundaryLabel&&<div className="mt-2 flex items-center gap-2 border-t border-cyan-900/70 pt-2 text-xs font-semibold text-cyan-200"><span>{L.jumpFromSec} {String(data.bridgeFromSec||1)}</span><span className="text-[#52766a]">•</span><span>{boundaryLabel}</span></div>}
    {boundaryLabel&&<Handle type="source" position={Position.Right} style={{background:"#65d9e8",border:0,width:8,height:8}}/>}
  </div>;
}

function ContinuationNode({data}:NodeProps){
  const L=labels[useContext(LangContext)];
  const jumpTo=useContext(JumpContext);
  const label=String(data.label||"");
  const kind=String(data.kind||"service");
  const color=kind==="client"?"#b7f774":kind==="edge"?"#65d9e8":kind==="app"?"#ffbd68":kind==="data"?"#ff9bc7":"#a990ff";
  return <button type="button" onClick={()=>jumpTo(String(data.bridgeTargetId))} className="relative min-w-[164px] rounded-2xl border border-cyan-500/60 bg-[#10201b] px-5 py-4 text-left shadow-[0_0_24px_rgba(101,217,232,.16)] transition hover:border-cyan-300" title={L.jumpFromSec+" "+String(data.bridgeFromSec||1)}>
    <Handle type="target" position={Position.Left} style={{background:color,border:0,width:8,height:8}}/>
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#71877d]">{kind}</span>
      <span className="rounded-full border border-cyan-500/50 bg-cyan-950/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">{L.jumpFromSec} {String(data.bridgeFromSec||1)}</span>
    </div>
    <div className="text-[15px] font-semibold text-[#edf7f1]">{label}</div>
    <Handle type="source" position={Position.Right} style={{background:color,border:0,width:8,height:8}}/>
  </button>;
}

const nodeTypes={system:SystemNode,continuation:ContinuationNode,sectionHeader:SectionHeaderNode};

function arrangeSectioned(nodes:Node[],edges:Edge[]){
  if(!nodes.length)return{arrangedNodes:[],extraNodes:[],rewiredEdges:edges};
  const gAll=new dagre.graphlib.Graph();gAll.setDefaultEdgeLabel(()=>({}));gAll.setGraph({rankdir:"LR",ranksep:90,nodesep:60});
  nodes.forEach(n=>gAll.setNode(n.id,{width:164,height:82}));edges.forEach(e=>gAll.setEdge(e.source,e.target));dagre.layout(gAll);
  const xVals=Array.from(new Set(nodes.map(n=>Math.round(gAll.node(n.id).x)))).sort((a,b)=>a-b);
  // Keep ordinary diagrams together. Sectioning only becomes useful once an
  // eighth layer would make the single canvas difficult to scan.
  if(xVals.length<=7){
    return {
      arrangedNodes:nodes.map(n=>({...n,type:"system",position:{x:gAll.node(n.id).x-82,y:gAll.node(n.id).y-41}})),
      extraNodes:[],
      rewiredEdges:edges
    };
  }

  const rankByX=new Map(xVals.map((x,index)=>[x,index]));
  const sectionById=new Map(nodes.map(n=>[n.id,Math.floor((rankByX.get(Math.round(gAll.node(n.id).x))||0)/4)]));
  const sectionCount=Math.max(...sectionById.values())+1;
  const sectionNodes=Array.from({length:sectionCount},()=>[] as Node[]);
  nodes.forEach(n=>sectionNodes[sectionById.get(n.id)||0].push({...n,data:{...n.data}}));

  const bridgeByKey=new Map<string,Node>();
  const bridgesBySection=Array.from({length:sectionCount},()=>[] as Node[]);
  const localEdges=Array.from({length:sectionCount},()=>[] as Edge[]);
  edges.forEach(edge=>{
    const sourceSection=sectionById.get(edge.source)||0;
    const targetSection=sectionById.get(edge.target)||0;
    if(sourceSection===targetSection){localEdges[sourceSection].push(edge);return}
    // Back edges stay visible in their source section. Forward edges get a repeated
    // source node at the beginning of the destination section.
    if(targetSection<sourceSection){localEdges[sourceSection].push(edge);return}
    const source=sectionNodes[sourceSection].find(n=>n.id===edge.source);
    if(!source)return;
    const key=`${edge.source}:${targetSection}`;
    let bridge=bridgeByKey.get(key);
    if(!bridge){
      const bridgeId=`sec-header-${targetSection+1}`;
      bridge={id:bridgeId,type:"continuation",position:{x:0,y:0},selectable:false,deletable:false,zIndex:2,data:{...source.data,isBridgeTarget:true,bridgeFromSec:sourceSection+1,bridgeTargetId:edge.source}};
      bridgeByKey.set(key,bridge);
      bridgesBySection[targetSection].push(bridge);
      sectionNodes[sourceSection]=sectionNodes[sourceSection].map(n=>n.id===source.id?{...n,data:{...n.data,bridgeToSec:targetSection+1,bridgeTargetId:bridgeId}}:n);
    }
    localEdges[targetSection].push({...edge,id:`${edge.id}__sec${targetSection+1}`,source:bridge.id});
  });

  const arrangedNodes:Node[]=[];const extraNodes:Node[]=[];const rewiredEdges:Edge[]=[];
  let sectionTop=0;
  sectionNodes.forEach((originals,sectionIndex)=>{
    const bridges=bridgesBySection[sectionIndex];
    const all=[...bridges,...originals];
    const graph=new dagre.graphlib.Graph();graph.setDefaultEdgeLabel(()=>({}));graph.setGraph({rankdir:"LR",ranksep:90,nodesep:60});
    all.forEach(n=>graph.setNode(n.id,{width:164,height:82}));localEdges[sectionIndex].forEach(e=>graph.setEdge(e.source,e.target));dagre.layout(graph);
    let bottom=sectionTop+60;
    originals.forEach(n=>{
      const p=graph.node(n.id);
      const placed={...n,position:{x:p.x-82,y:p.y-41+sectionTop+60}};
      bottom=Math.max(bottom,placed.position.y+82);
      arrangedNodes.push(placed);
    });
    const boundary=bridges[0];
    extraNodes.push({id:`sec-header-${sectionIndex+1}`,type:"sectionHeader",position:{x:0,y:sectionTop},zIndex:2,data:{section:sectionIndex+1,count:originals.length,boundaryLabel:boundary?.data.label,bridgeFromSec:boundary?.data.bridgeFromSec,bridgeTargetId:boundary?.data.bridgeTargetId}});
    rewiredEdges.push(...localEdges[sectionIndex]);
    sectionTop=bottom+110;
  });
  return{arrangedNodes,extraNodes,rewiredEdges};
}

function Canvas({onLog}:{onLog:(l:Log)=>void}){
  const {nodes,edges,onNodesChange,onEdgesChange,execute,undo,redo,clear,remove,past,future}=useDiagramStore();const flow=useReactFlow();
  const [lang,setLang]=useState<"id"|"en">("id");const [status,setStatus]=useState<Status>("ended");const [interim,setInterim]=useState("");const [typed,setTyped]=useState("");const [voice,setVoice]=useState(false);const [seconds,setSeconds]=useState(0);const speech=useRef<WebSpeechProvider|null>(null);const L=labels[lang];
  const isManualLayout=useRef(false);
  const [highlightedId,setHighlightedId]=useState<string|null>(null);
  const [extras,setExtras]=useState<{extraNodes:Node[];rewiredEdges:Edge[]}>({extraNodes:[],rewiredEdges:[]});

  const handleNodesChange=useCallback((changes:NodeChange[])=>{
    for(const c of changes){
      if(c.type==="position"&&Boolean(c.dragging)){
        isManualLayout.current=true;
        break;
      }
    }
    onNodesChange(changes);
  },[onNodesChange]);

  useEffect(()=>{
    const current=useDiagramStore.getState();
    if(current.nodes.length&&!extras.extraNodes.length){
      const res=arrangeSectioned(current.nodes,current.edges);
      queueMicrotask(()=>{
        useDiagramStore.setState({nodes:res.arrangedNodes});
        setExtras({extraNodes:res.extraNodes,rewiredEdges:res.rewiredEdges});
      });
    }
  },[extras.extraNodes.length]);

  const inDegree=useMemo(()=>{const m=new Map<string,number>();edges.forEach(e=>m.set(e.target,(m.get(e.target)||0)+1));return m},[edges]);
  const outDegree=useMemo(()=>{const m=new Map<string,number>();edges.forEach(e=>m.set(e.source,(m.get(e.source)||0)+1));return m},[edges]);

  const displayNodes=useMemo(()=>{
    const list=[...nodes,...extras.extraNodes];
    const knownIds=new Set(list.map(n=>n.id));
    // A controlled React Flow update can occasionally omit a just-created
    // synthetic node while retaining its rewired edge. Reconstructing any such
    // continuation from the boundary node makes the section contract explicit:
    // the next section can never begin after the shared boundary node.
    extras.rewiredEdges.forEach(edge=>{
      if(knownIds.has(edge.source))return;
      const source=nodes.find(n=>String(n.data.bridgeTargetId||"")===edge.source);
      const target=list.find(n=>n.id===edge.target);
      if(!source||!target)return;
      list.push({
        id:edge.source,
        type:"continuation",
        position:{x:target.position.x-254,y:target.position.y},
        selectable:false,
        deletable:false,
        zIndex:2,
        data:{...source.data,bridgeToSec:undefined,isBridgeTarget:true,bridgeFromSec:Number(source.data.bridgeToSec||1)-1,bridgeTargetId:source.id}
      });
      knownIds.add(edge.source);
    });
    return list.map(n=>{
      if(n.type==="sectionHeader")return n;
      return {
        ...n,
        type:n.type==="continuation"?"continuation":"system",
        data:{
          ...n.data,
          isStart:(inDegree.get(n.id)||0)===0&&(outDegree.get(n.id)||0)>0,
          isEnd:(outDegree.get(n.id)||0)===0&&(inDegree.get(n.id)||0)>0,
          isHighlighted:n.id===highlightedId
        }
      };
    });
  },[nodes,extras.extraNodes,extras.rewiredEdges,inDegree,outDegree,highlightedId]);

  const jumpTo=useCallback((targetId:string)=>{
    const target=displayNodes.find(n=>n.id===targetId);
    if(target){
      flow.setCenter(target.position.x+82,target.position.y+41,{duration:650,zoom:Math.max(flow.getZoom(),.95)});
      setHighlightedId(targetId);
      window.setTimeout(()=>setHighlightedId(null),2200);
    }
  },[displayNodes,flow]);

  const submit=useCallback((raw:string)=>{const text=raw.trim();if(!text)return;
    setStatus(s=>s==="listening"||s==="processing"?"processing":s);
    const applied=execute(parseIntent(text));
    if(applied){
      if(!isManualLayout.current){
        window.setTimeout(()=>{
          const current=useDiagramStore.getState();
          const res=arrangeSectioned(current.nodes,current.edges);
          useDiagramStore.setState({nodes:res.arrangedNodes});
          setExtras({extraNodes:res.extraNodes,rewiredEdges:res.rewiredEdges});
          window.setTimeout(()=>flow.fitView({padding:.24,duration:450,maxZoom:1.15}),100);
        },60);
      }else{
        window.setTimeout(()=>flow.fitView({padding:.24,duration:450,maxZoom:1.15}),80);
      }
    }
    onLog({text,applied,time:new Date().toLocaleTimeString(lang==="id"?"id-ID":"en-US",{hour:"2-digit",minute:"2-digit"}),lang});
    setInterim("");window.setTimeout(()=>setStatus(s=>s==="processing"?"listening":s),320)},[execute,flow,lang,onLog]);
  // The recogniser is subscribed once at mount, so route through a ref to avoid a stale submit.
  const submitRef=useRef(submit);useEffect(()=>{submitRef.current=submit},[submit]);
  useEffect(()=>{const p=new WebSpeechProvider();speech.current=p;
    const unsub=p.subscribe(e=>{setInterim(e.transcript);if(e.isFinal&&(!e.confidence||e.confidence>=.55))submitRef.current(e.transcript)});
    const unsubError=p.subscribeError((_error,fatal)=>{if(fatal)setStatus("denied")});
    return()=>{unsub();unsubError();void p.stop()}},[]);
  useEffect(()=>{speech.current?.setLanguage(lang==="id"?"id-ID":"en-US")},[lang]);
  useEffect(()=>{
    const context=(document as Document&{modelContext?:{registerTool:(tool:unknown,options?:{signal?:AbortSignal})=>void|Promise<void>}}).modelContext;
    if(!context?.registerTool)return;const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({name:"apply_diagram_statement",title:"Apply diagram statement",description:"Apply one explicit Indonesian or English architecture statement to the visible diagram using the deterministic parser.",inputSchema:{type:"object",properties:{statement:{type:"string"}},required:["statement"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{const statement=(input as {statement?:unknown})?.statement;if(typeof statement!=="string"||!statement.trim())throw new Error("statement must be a non-empty string");const commands=parseIntent(statement);if(!commands.length)return{applied:false,reason:"No explicit diagram command detected"};if(!execute(commands))return{applied:false,reason:"Command left the diagram unchanged"};return{applied:true,commandCount:commands.length}}},{signal:lifecycle.signal})).catch(()=>undefined);
    return()=>lifecycle.abort();
  },[execute]);
  const ended=status==="ended";useEffect(()=>{if(ended)return;const id=setInterval(()=>setSeconds(x=>x+1),1000);return()=>clearInterval(id)},[ended]);
  const time=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  // React Flow deletes selected elements itself; returning false hands the work to the
  // store instead, so a keyboard delete lands in the same undo history as a spoken one.
  const onBeforeDelete=useCallback(async ({nodes:n,edges:e}:{nodes:Node[];edges:Edge[]})=>{remove(n.map(x=>x.id),e.map(x=>x.id));return false},[remove]);
  const layout=()=>{
    isManualLayout.current=false;
    const current=useDiagramStore.getState();
    const res=arrangeSectioned(current.nodes,current.edges);
    useDiagramStore.setState({nodes:res.arrangedNodes});
    setExtras({extraNodes:res.extraNodes,rewiredEdges:res.rewiredEdges});
    window.setTimeout(()=>flow.fitView({padding:.24,duration:500,maxZoom:1.15}),180);
  };
  const handleClear=()=>{isManualLayout.current=false;setExtras({extraNodes:[],rewiredEdges:[]});clear()};
  const edgesToUse=extras.rewiredEdges.length?extras.rewiredEdges:edges;
  const nodePosMap=useMemo(()=>new Map(displayNodes.map(n=>[n.id,n.position.x])),[displayNodes]);
  const displayEdges=useMemo(()=>edgesToUse.map(e=>{
    const sourceX=nodePosMap.get(e.source)??0;
    const targetX=nodePosMap.get(e.target)??0;
    const isBackEdge=targetX<=sourceX;
    return {
      ...e,
      animated:true,
      type:isBackEdge?"smoothstep":"default",
      style:isBackEdge
        ?{stroke:"#ffbd68",strokeWidth:1.5,strokeDasharray:"4 4"}
        :e.style??{stroke:"#446b5f",strokeWidth:1.5},
      markerEnd:{
        type:MarkerType.ArrowClosed,
        color:isBackEdge?"#ffbd68":"#65d9e8",
        width:15,
        height:15
      }
    };
  }),[edgesToUse,nodePosMap]);
  // Synthetic continuation nodes live outside the diagram store. Remounting the
  // controlled canvas when their identity changes makes React Flow register them
  // before it resolves the rewired cross-section edges.
  const sectionLayoutKey=useMemo(()=>extras.extraNodes.filter(n=>Boolean(n.data.isBridgeTarget)).map(n=>n.id).sort().join("|"),[extras.extraNodes]);
  const startListening=useCallback(()=>{setStatus("initializing");speech.current?.start().then(()=>setStatus("listening")).catch(err=>setStatus(err?.message==="unsupported"?"unavailable":"denied"))},[]);
  // Turning voice off stops the recogniser and hands the whole row to the text field.
  const toggleVoice=()=>{if(voice){void speech.current?.stop();setInterim("");setStatus("ended");setVoice(false)}else{setVoice(true);startListening()}};
  const retry=()=>startListening();
  return <LangContext.Provider value={lang}><JumpContext.Provider value={jumpTo}><main className="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-[#07100e]">
    <header className="glass z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-[#24352e] px-4 sm:px-7">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><GitBranch size={18}/></div><div><h1 className="text-[15px] font-semibold tracking-tight sm:text-base">{L.title}</h1><p className="hidden text-xs text-[#71877d] sm:block">{L.hint}</p></div></div>
      <div className="flex items-center gap-2 sm:gap-4">{voice?<div className="hidden items-center gap-2 text-xs text-[#9bafa6] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>{L.session}<span className="font-mono text-[#dce9e2]">{time}</span></div>:<span className="hidden text-xs text-[#71877d] sm:inline">{L.typeOnly}</span>}<Link href="/panduan" className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2a3d35] bg-[#10201b] px-2.5 text-xs text-[#9bafa6] transition hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><LifeBuoy size={14}/><span className="hidden sm:inline">{L.guide}</span></Link><label className="relative flex items-center"><Languages className="pointer-events-none absolute left-2.5" size={15}/><select aria-label={L.langLabel} value={lang} onChange={e=>setLang(e.target.value as "id"|"en")} className="appearance-none rounded-lg border border-[#2a3d35] bg-[#10201b] py-2 pl-8 pr-7 text-xs text-[#dce9e2]"><option value="id">Bahasa Indonesia</option><option value="en">English</option></select><ChevronDown className="pointer-events-none absolute right-2" size={13}/></label></div>
    </header>
    <section className="relative min-h-0 flex-1">
      <div className="canvas-grid absolute inset-0"><ReactFlow key={sectionLayoutKey} nodes={displayNodes} edges={displayEdges} onNodesChange={handleNodesChange} onEdgesChange={onEdgesChange} onBeforeDelete={onBeforeDelete} deleteKeyCode={["Delete","Backspace"]} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.25}} colorMode="dark"><Background color="transparent"/><Controls position="top-left"/><MiniMap position="top-right" nodeColor="#b7f774" maskColor="rgba(3,10,8,.75)"/></ReactFlow></div>
      <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-[#2b4037] bg-[#0d1916]/90 px-4 py-2 text-xs text-[#94a89f] shadow-lg">{nodes.length} {L.nodes} <span className="mx-2 text-[#3d5149]">•</span> {edges.length} {L.connections}</div>
      {!nodes.length&&<div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><GitBranch className="mx-auto mb-4 text-[#41554c]" size={38}/><p className="font-semibold text-[#b8c8c0]">{L.ready}</p><p className="mt-1 text-sm text-[#71877d]">{L.readyHint}</p><Link href="/panduan" className="pointer-events-auto mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#2a3d35] bg-[#10201b] px-3 py-1.5 text-xs text-[#9bafa6] transition hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><LifeBuoy size={13}/>{L.guide}</Link></div></div>}
    </section>
    <section className="glass z-20 shrink-0 border-t border-[#293b33]">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#203129] px-4 py-2.5 sm:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[.14em] text-[#5f746a]">{voice?L.examples:L.examplesTyped}</span>
        {examples[lang].map(example=><button key={example} type="button" onClick={()=>submit(example)} className="shrink-0 rounded-full border border-[#2a3d35] bg-[#0d1b17] px-3 py-1 text-xs text-[#9bafa6] transition hover:border-primary/50 hover:bg-[#12231d] hover:text-[#e5f0ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{example}</button>)}
      </div>
      <div className={"mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:px-7 "+(voice?"lg:grid-cols-[1fr_340px]":"grid-cols-1")}>
        {voice&&<div className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#2a3d35] bg-[#0d1b17] px-4 py-3 sm:px-5">
          <div className={(status==="listening"?"pulse-ring ":"")+"relative grid h-11 w-11 shrink-0 place-items-center rounded-full "+(status==="denied"||status==="unavailable"?"bg-[#44201f] text-[#ff8b82]":"bg-primary text-primary-foreground")}>
            {status==="denied"||status==="unavailable"||status==="ended"?<MicOff size={19}/>:status==="processing"?<AudioWaveform size={19}/>:<Mic size={19}/>} 
          </div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold">{L[status]}</p>{status==="listening"&&<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">LIVE</span>}</div><p className={(interim?"text-[#e5f0ea]":"text-[#63786f]")+" mt-1 truncate text-sm"}>{interim?`“${interim}”`:L.empty}</p></div>
          {(status==="denied"||status==="unavailable")&&<Button size="sm" variant="secondary" onClick={retry}>{L.retry}</Button>}
        </div>}
        <form onSubmit={e=>{e.preventDefault();submit(typed);setTyped("")}} className="flex items-center gap-2 rounded-2xl border border-[#2a3d35] bg-[#0d1b17] p-2 pl-4"><Command size={17} className="shrink-0 text-[#71877d]"/><input value={typed} onChange={e=>setTyped(e.target.value)} placeholder={L.placeholder} aria-label={L.placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-[#edf6f1] outline-none placeholder:text-[#5f746a]"/><Button type="submit" size="icon" disabled={!typed.trim()}><CornerDownLeft size={17}/></Button></form>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#203129] px-4 py-3 sm:px-7">
        <div className="flex items-center gap-1"><ToolButton onClick={undo} disabled={!past.length} icon={<RotateCcw/>} label={L.undo}/><ToolButton onClick={redo} disabled={!future.length} icon={<Redo2/>} label={L.redo}/><ToolButton onClick={layout} icon={<LayoutGrid/>} label={L.layout}/><ToolButton onClick={toggleVoice} pressed={!voice} icon={voice?<Mic/>:<MicOff/>} label={voice?L.voiceOff:L.voiceOn}/>
          <AlertDialog><AlertDialogTrigger asChild><span><ToolButton icon={<Trash2/>} label={L.clear}/></span></AlertDialogTrigger><AlertDialogContent className="border-[#33483f] bg-[#0d1916] text-white"><AlertDialogHeader><AlertDialogTitle>{L.confirmTitle}</AlertDialogTitle><AlertDialogDescription>{L.confirmBody}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{L.cancel}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={handleClear}>{L.confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>{voice&&<Button variant="secondary" onClick={()=>{void speech.current?.stop();setStatus("ended")}}><X size={16}/><span className="hidden sm:inline">{L.end}</span></Button>}
      </div>
    </section>
  </main></JumpContext.Provider></LangContext.Provider>;
}
function ToolButton({icon,label,onClick,disabled,pressed}:{icon:React.ReactNode;label:string;onClick?:()=>void;disabled?:boolean;pressed?:boolean}){return <button onClick={onClick} disabled={disabled} title={label} aria-label={label} {...(pressed===undefined?{}:{"aria-pressed":pressed})} className={"flex h-9 items-center gap-2 rounded-lg px-2.5 transition hover:bg-[#17251f] hover:text-white disabled:opacity-30 [&_svg]:h-4 [&_svg]:w-4 "+(pressed?"bg-[#17251f] text-primary":"text-[#93a79e]")}><span>{icon}</span><span className="hidden text-xs xl:inline">{label}</span></button>}

export default function Workspace(){
  const [last,setLast]=useState<Log|null>(null);const L=last?labels[last.lang]:null;
  return <ReactFlowProvider><Canvas onLog={setLast}/>
    {/* A pasted paragraph is one "utterance", so the echo has to stay a fixed-size
        preview instead of growing up the screen until it covers the canvas. */}
    {last&&L&&<div aria-live="polite" className="fixed bottom-[150px] left-1/2 z-40 flex w-[min(680px,calc(100vw-2rem))] -translate-x-1/2 items-start gap-2 rounded-xl border border-[#344a40] bg-[#10201b] py-2.5 pl-4 pr-2 text-xs shadow-xl">
      <span className={(last.applied?"text-primary":"text-[#ffbd68]")+" shrink-0 whitespace-nowrap"}>{(last.applied?"\u2713 ":"\u25cb ")+(last.applied?L.applied:L.safe)}</span>
      <p className="max-h-20 min-w-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words text-[#90a59b]">{last.text}</p>
      <button type="button" onClick={()=>setLast(null)} title={L.dismiss} aria-label={L.dismiss} className="shrink-0 rounded-md p-1 text-[#71877d] transition hover:bg-[#17251f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"><X size={14}/></button>
    </div>}
  </ReactFlowProvider>;
}
