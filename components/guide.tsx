"use client";
import {useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Check,GitBranch,Languages,Lightbulb,LifeBuoy,Mic,Quote} from "lucide-react";
import {guide,wordsByKind,guideKinds} from "@/lib/guide";
import {type DiagramKind} from "@/lib/diagram";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";

const KIND_COLOR:Record<DiagramKind,string>={client:"#b7f774",edge:"#65d9e8",app:"#ffbd68",service:"#a990ff",data:"#ff9bc7"};
const KINDS=guideKinds;

function Box({label,color="#a990ff"}:{label:string;color?:string}){
  return <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#2f4339] bg-[#101f1a] px-2.5 py-1.5 text-xs text-[#e2efe8]">
    <span className="h-1.5 w-1.5 rounded-full" style={{background:color}}/>{label}</span>;
}

function Preview({preview}:{preview:{shape:string;nodes:string[]}}){
  const {shape,nodes}=preview;
  if(shape==="branch")return <div className="flex items-center gap-2">
    <Box label={nodes[0]} color="#a990ff"/><ArrowRight size={13} className="shrink-0 text-[#5d7269]"/>
    <span className="flex flex-col gap-1.5">{nodes.slice(1).map(n=><Box key={n} label={n} color="#ff9bc7"/>)}</span>
  </div>;
  return <div className="flex flex-wrap items-center gap-2">
    {nodes.map((n,i)=><span key={n+i} className="flex items-center gap-2">
      {i>0&&<ArrowRight size={13} className="shrink-0 text-[#5d7269]"/>}
      <Box label={n} color={i===0?"#b7f774":i===nodes.length-1?"#ffbd68":"#65d9e8"}/>
    </span>)}
  </div>;
}

export default function Guide(){
  const [lang,setLang]=useState<"id"|"en">("id");
  const [copied,setCopied]=useState("");
  const G=guide[lang];
  const copy=(text:string)=>{void navigator.clipboard?.writeText(text).then(()=>{setCopied(text);window.setTimeout(()=>setCopied(""),1400)}).catch(()=>undefined)};

  return <main className="min-h-dvh bg-[#07100e] pb-24">
    <header className="glass sticky top-0 z-20 border-b border-[#24352e]">
      <div className="mx-auto flex h-[64px] max-w-[880px] items-center justify-between gap-3 px-5">
        <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#9bafa6] transition hover:bg-[#17251f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <ArrowLeft size={16}/><span className="hidden sm:inline">{G.back}</span>
        </Link>
        <Select value={lang} onValueChange={v=>setLang(v as "id"|"en")}><SelectTrigger aria-label={lang==="id"?"Bahasa panduan":"Guide language"} className="h-9 w-[52px] rounded-lg border-[#2a3d35] bg-[#10201b] px-2.5 text-xs text-[#dce9e2] sm:w-[168px]"><Languages size={14} className="shrink-0 text-[#71877d]"/><SelectValue/></SelectTrigger><SelectContent className="border-[#2a3d35] bg-[#0d1916] text-[#dce9e2]"><SelectItem value="id">Bahasa Indonesia</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select>
      </div>
    </header>

    <div className="mx-auto max-w-[880px] px-5">
      <section className="border-b border-[#1e2e27] py-12">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><GitBranch size={20}/></div>
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-tight text-[#eef7f2] sm:text-[42px]">{G.title}</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[#9db0a7]">{G.tagline}</p>
      </section>

      <section className="border-b border-[#1e2e27] py-11">
        <h2 className="mb-6 text-lg font-semibold text-[#e6f1eb]">{G.stepsTitle}</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {G.steps.map((s,i)=><li key={s.title} className="rounded-2xl border border-[#25382f] bg-[#0c1815] p-5">
            <span className="mb-3 grid h-7 w-7 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{i+1}</span>
            <h3 className="mb-1.5 text-[15px] font-semibold text-[#e6f1eb]">{s.title}</h3>
            <p className="text-[13px] leading-relaxed text-[#8fa49b]">{s.body}</p>
          </li>)}
        </ol>
      </section>

      <section className="border-b border-[#1e2e27] py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{G.recipesTitle}</h2>
        <p className="mb-7 mt-1.5 max-w-[58ch] text-sm text-[#8fa49b]">{G.recipesLede}</p>
        <div className="grid gap-3">
          {G.recipes.map(r=><article key={r.goal} className="rounded-2xl border border-[#25382f] bg-[#0c1815] p-5 sm:p-6">
            <h3 className="mb-4 text-[15px] font-semibold text-[#e6f1eb]">{r.goal}</h3>
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-[#5f746a]"><Quote size={11}/>{G.sayLabel}</p>
                <div className="flex flex-col items-start gap-1.5">
                  {r.say.map(s=><button key={s} type="button" onClick={()=>copy(s)}
                    className="group flex max-w-full items-center gap-2 rounded-lg border border-[#2a3d35] bg-[#10201b] px-3 py-2 text-left text-[13px] text-[#dceade] transition hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <Mic size={12} className="shrink-0 text-[#6d857a] group-hover:text-primary"/>
                    <span className="truncate">“{s}”</span>
                    {copied===s&&<Check size={12} className="ml-auto shrink-0 text-primary"/>}
                  </button>)}
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[.14em] text-[#5f746a]">{G.resultLabel}</p>
                <div className="mb-3"><Preview preview={r.preview}/></div>
                <p className="text-[13px] leading-relaxed text-[#8fa49b]">{r.result}</p>
              </div>
            </div>
          </article>)}
        </div>
      </section>

      <section className="border-b border-[#1e2e27] py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{G.wordsTitle}</h2>
        <p className="mb-7 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{G.wordsLede}</p>
        <div className="grid gap-5">
          {KINDS.map(kind=><div key={kind}>
            <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-[#c6d6cd]">
              <span className="h-2 w-2 rounded-full" style={{background:KIND_COLOR[kind]}}/>{G.groups[kind]}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {wordsByKind(kind).map(w=><span key={w} className="rounded-md border border-[#263831] bg-[#0f1c18] px-2.5 py-1 text-xs text-[#a9bdb3]">{w}</span>)}
            </div>
          </div>)}
        </div>
        <p className="mt-7 rounded-xl border-l-2 border-primary bg-[#0d1a16] px-4 py-3 text-[13px] leading-relaxed text-[#9db0a7]">{G.freeform}</p>
      </section>

      <section className="border-b border-[#1e2e27] py-11">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#e6f1eb]"><Lightbulb size={17} className="text-primary"/>{G.tipsTitle}</h2>
        <ul className="grid gap-2.5">
          {G.tips.map(t=><li key={t} className="flex gap-3 text-[14px] leading-relaxed text-[#9db0a7]">
            <Check size={15} className="mt-1 shrink-0 text-primary"/><span>{t}</span></li>)}
        </ul>
      </section>

      <section className="py-11">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#e6f1eb]"><LifeBuoy size={17} className="text-[#ffbd68]"/>{G.troubleTitle}</h2>
        <div className="overflow-hidden rounded-2xl border border-[#25382f]">
          {G.trouble.map((t,i)=><div key={t.problem} className={(i?"border-t border-[#1e2e27] ":"")+"grid gap-1.5 p-4 sm:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] sm:gap-6 sm:p-5 "+(i%2?"bg-[#0c1815]":"")}>
            <p className="text-[13.5px] font-medium text-[#dce9e2]">{t.problem}</p>
            <p className="text-[13.5px] leading-relaxed text-[#8fa49b]">{t.fix}</p>
          </div>)}
        </div>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <ArrowLeft size={15}/>{G.back}
        </Link>
      </section>
    </div>
  </main>;
}
