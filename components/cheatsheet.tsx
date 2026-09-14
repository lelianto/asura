"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft,ArrowRight,ArrowUp,BrainCircuit,ChevronDown,Code2,Gauge,GitCompareArrows,Languages,Layers3,MapPin,PenLine,Route,Sparkles,Target} from "lucide-react";
import {parseIntent} from "@/lib/diagram";
import {useDiagramStore} from "@/lib/store";
import {ACRONYMS,BUCKETS,CHEATSHEET,MEMORISE,MENTAL_MODEL,PAIRS,PIPELINE,PIPELINE_SHORT,WEB_VITALS,WORKED_EXAMPLE,pipelineToStatements,rowToStatement,type Bucket,type Row} from "@/lib/system-design";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {NEXT_PATTERNS,NEXT_QUICK_GROUPS,TRADEOFFS} from "@/lib/nextjs-cheatsheet";

const T={
  id:{back:"Kembali ke kanvas",title:"Cheatsheet FE System Design",
    tagline:"Jangan hafalkan teknologi. Hafalkan kerangka berpikir dan hubungan problem → solusi.",
    jump:"Lompat ke bagian",top:"Kembali ke atas",
    glossary:"Kepanjangan singkatan",glossaryLede:"Referensi singkat untuk semua singkatan yang digunakan di halaman ini.",
    pipelineChip:"Alur Next.js",
    pipeline:"Alur Next.js: dari URL sampai interaktif",
    pipelineLede:"Pertanyaan \u201ccoba ceritakan apa yang terjadi saat halaman dibuka\u201d menanyakan urutan ini. Setiap tahap punya satu hal yang bisa dioptimasi \u2014 itu yang membuat jawabannya terdengar terstruktur, bukan hafalan tool.",
    pipelineShort:"Hafalan super singkat",
    pipelineNodeHint:"Nama kotak di kanvas",
    codeChip:"Kode App Router",code:"Next.js App Router: problem → code → letak",
    codeLede:"Pakai ini setelah menentukan requirement dan trade-off. Pilih problem-nya, lihat bentuk kode minimum, lalu ingat boundary tempat kode itu hidup.",
    codeScan:"Peta tanggung jawab",codeScanLede:"Tidak semua tahap perlu dicari “kode React”-nya. Hafalkan siapa yang mengerjakan apa.",
    miniCode:"Mini code",place:"Letak",mental:"Mental model",open:"Buka detail",close:"Tutup detail",
    tradeoffChip:"Trade-off",tradeoffs:"Trade-off yang perlu bisa dijelaskan",
    tradeoffsLede:"Tidak ada pilihan yang selalu menang. Sebutkan apa yang didapat, apa yang dikorbankan, lalu kaitkan keputusan ke requirement.",
    versus:"dibanding",tradeoffClose:"Penutup interview: “Saya memilih A karena requirement X; konsekuensinya Y, dan saya akan mengevaluasi ulang saat Z.”",
    vitals:"Tiga titik performance",
    vitalsLede:"Hampir semua pertanyaan performance berujung ke salah satu dari tiga ini. Kaitkan ke tahap tempat masalahnya muncul.",
    flow:"Kerangka berpikir",flowLede:"Lima langkah ini urut. Trade-off selalu jadi penutup — bagian inilah yang paling menunjukkan seniority.",
    buckets:"Delapan bucket",bucketsLede:"Daripada menghafal 30 baris, ingat delapan kata ini beserta polanya: Requirement → Problem → Technique → Trade-off. Ketuk salah satu untuk melompat ke bagiannya.",
    memo:"Perlu dihafal vs tidak",learn:"Perlu dihafal",skip:"Tidak perlu dihafal",
    pairs:"Sepuluh pasangan inti",pairsLede:"Kalau waktunya sangat sedikit, ini saja yang dihafal. Sisanya lebih baik dipahami.",
    sheet:"Requirement → teknik",sheetLede:"Saat interviewer menyebut sebuah non-functional requirement, Anda langsung punya arah solusi. Klik Gambar untuk memindahkannya ke kanvas.",
    draw:"Gambar",drawAll:"Gambar semua",focus:"Yang didesain di FE",
    example:"Contoh jawaban",weak:"Lemah",strong:"Lebih kuat",
    speak:"Bisa juga diucapkan",speakHint:"Semua istilah di halaman ini sudah dikenali parser suara. Coba ucapkan:"},
  en:{back:"Back to canvas",title:"FE System Design Cheatsheet",
    tagline:"Do not memorise technologies. Memorise the thinking framework and the problem → solution link.",
    jump:"Jump to a section",top:"Back to top",
    glossary:"Abbreviation glossary",glossaryLede:"A quick reference for every abbreviation used on this page.",
    pipelineChip:"Next.js flow",
    pipeline:"The Next.js flow: from URL to interactive",
    pipelineLede:"\u201cWalk me through what happens when the page loads\u201d is a question about this order. Every stage has one thing worth optimising \u2014 that is what makes an answer sound structured rather than memorised.",
    pipelineShort:"The short version",
    pipelineNodeHint:"Box name on the canvas",
    codeChip:"App Router code",code:"Next.js App Router: problem → code → location",
    codeLede:"Use this after choosing the requirement and trade-off. Start with the problem, recognize the smallest useful code shape, then remember the boundary where it belongs.",
    codeScan:"Responsibility map",codeScanLede:"Not every stage needs a “React code” answer. Memorise which layer does what.",
    miniCode:"Mini code",place:"Location",mental:"Mental model",open:"Open details",close:"Close details",
    tradeoffChip:"Trade-offs",tradeoffs:"Trade-offs you should be able to explain",
    tradeoffsLede:"No option always wins. State what you gain, what you give up, then tie the decision back to the requirement.",
    versus:"versus",tradeoffClose:"Interview close: “I chose A because of requirement X; the cost is Y, and I would revisit it when Z changes.”",
    vitals:"Three performance points",
    vitalsLede:"Almost every performance question lands on one of these three. Tie each one to the stage where it goes wrong.",
    flow:"The thinking framework",flowLede:"These five steps are ordered. Trade-off always closes — that is the part that shows seniority.",
    buckets:"Eight buckets",bucketsLede:"Instead of memorising thirty rows, remember these eight words and the pattern: Requirement → Problem → Technique → Trade-off. Tap one to jump to its section.",
    memo:"Worth memorising vs not",learn:"Worth memorising",skip:"Not worth memorising",
    pairs:"Ten core pairs",pairsLede:"If time is short, memorise only these. Understand the rest instead.",
    sheet:"Requirement → technique",sheetLede:"When the interviewer states a non-functional requirement, you already have a direction. Click Draw to move it onto the canvas.",
    draw:"Draw",drawAll:"Draw all",focus:"What you design on the FE",
    example:"A worked answer",weak:"Weak",strong:"Stronger",
    speak:"You can say it out loud",speakHint:"Every term on this page is understood by the voice parser. Try saying:"},
};

const SPOKEN=["SEO penting bercabang ke es es er dan es es ji","jaringan lambat bercabang ke kompresi dan optimasi gambar","daftar panjang bercabang ke paginasi dan virtualisasi","api sering gagal bercabang ke coba ulang dan ui cadangan"];

// Sticky header + sticky bucket nav, so an anchor must clear both before it lands.
const ANCHOR="scroll-mt-[104px] sm:scroll-mt-[124px]";
const COUNT=Object.fromEntries(BUCKETS.map(b=>[b.key,CHEATSHEET.filter(r=>r.bucket===b.key).length])) as Record<Bucket,number>;

function Chip({children,tone="technique"}:{children:React.ReactNode;tone?:"technique"|"requirement"}){
  const color=tone==="requirement"?"#ff8f6b":"#8ab4ff";
  return <span className="inline-flex items-center gap-1.5 rounded-md border border-[#263831] bg-[#0f1c18] px-2 py-1 text-xs text-[#bccec4]">
    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{background:color}}/><span className="break-words">{children}</span></span>;
}

function DrawButton({onClick,active,label,className=""}:{onClick:()=>void;active:boolean;label:string;className?:string}){
  return <button type="button" onClick={onClick}
    className={"inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+(active?"border-primary bg-primary text-primary-foreground":"border-[#2a3d35] bg-[#10201b] text-[#9bafa6] hover:border-primary/50 hover:text-white")+" "+className}>
    <PenLine size={12}/>{label}</button>;
}

// Which bucket section is under the sticky nav right now, so the matching chip
// can light up and scroll itself into view on narrow screens.
// Keep this in DOM order; the last section above the sticky line wins.
const NAV_KEYS=["next-code","tradeoffs","pipeline",...BUCKETS.map(b=>b.key)];

function useActiveBucket(){
  const [active,setActive]=useState("");
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    let frame=0;
    const read=()=>{
      frame=0;
      const line=(window.innerWidth<640?104:124)+12;
      let current="";
      for(const key of NAV_KEYS){
        const el=document.getElementById(key);
        if(el&&el.getBoundingClientRect().top<=line)current=key;
      }
      setActive(current);setScrolled(window.scrollY>640);
    };
    const onScroll=()=>{if(!frame)frame=window.requestAnimationFrame(read)};
    read();
    window.addEventListener("scroll",onScroll,{passive:true});
    window.addEventListener("resize",onScroll,{passive:true});
    return()=>{window.cancelAnimationFrame(frame);window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll)};
  },[]);
  return {active,scrolled};
}

export default function Cheatsheet(){
  const [lang,setLang]=useState<"id"|"en">("id");
  const [drawn,setDrawn]=useState("");
  const router=useRouter();const L=T[lang];
  const execute=useDiagramStore(s=>s.execute);
  const {active,scrolled}=useActiveBucket();
  const strip=useRef<HTMLDivElement>(null);
  const chips=useRef<Record<string,HTMLAnchorElement|null>>({});

  // Keep the active chip centred by moving the strip only — never the page.
  useEffect(()=>{
    const rail=strip.current,chip=active?chips.current[active]:null;
    if(!rail||!chip)return;
    rail.scrollTo({left:chip.offsetLeft-rail.clientWidth/2+chip.offsetWidth/2,behavior:"smooth"});
  },[active]);

  const draw=useCallback((statements:string[],key:string)=>{
    for(const statement of statements)execute(parseIntent(statement));
    setDrawn(key);window.setTimeout(()=>router.push("/"),260);
  },[execute,router]);
  const drawRow=(row:Row)=>draw([rowToStatement(row)],row.node);
  const drawBucket=(bucket:Bucket)=>draw(CHEATSHEET.filter(r=>r.bucket===bucket).map(rowToStatement),bucket);
  const drawPipeline=()=>draw(pipelineToStatements(),"pipeline");

  return <main className="min-h-dvh overflow-x-hidden bg-[#07100e] pb-20 sm:pb-24">
    <header className="glass sticky top-0 z-20 border-b border-[#24352e]">
      <div className="mx-auto flex h-14 max-w-[980px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#9bafa6] transition hover:bg-[#17251f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <ArrowLeft size={16}/><span className="hidden sm:inline">{L.back}</span></Link>
        <Select value={lang} onValueChange={v=>setLang(v as "id"|"en")}><SelectTrigger aria-label={lang==="id"?"Bahasa halaman":"Page language"} className="h-9 w-10 justify-center gap-0 rounded-lg border-[#2a3d35] bg-[#10201b] px-0 text-[#dce9e2] [&>[data-slot=select-value]]:hidden [&>svg:last-child]:hidden sm:w-[156px] sm:justify-between sm:gap-2 sm:px-2.5 sm:[&>[data-slot=select-value]]:flex sm:[&>svg:last-child]:block"><Languages size={14} className="shrink-0 text-[#71877d]"/><SelectValue className="text-[11px] leading-none"/></SelectTrigger><SelectContent align="end" className="border-[#2a3d35] bg-[#0d1916] text-xs text-[#dce9e2]"><SelectItem className="text-xs" value="id">Bahasa Indonesia</SelectItem><SelectItem className="text-xs" value="en">English</SelectItem></SelectContent></Select>
      </div>
    </header>

    <nav aria-label={L.jump} className="glass sticky top-14 z-10 border-b border-[#1e2e27] sm:top-16">
      <div className="mx-auto max-w-[980px] px-4 sm:px-6">
        <div ref={strip} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <a href="#pipeline" ref={el=>{chips.current.pipeline=el}}
            aria-current={active==="pipeline"?"true":undefined}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+(active==="pipeline"?"border-primary bg-primary text-primary-foreground":"border-primary/45 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20")}>
            <Route size={13}/>{L.pipelineChip}<span className={active==="pipeline"?"text-primary-foreground/70":"text-primary/60"}>{PIPELINE.length}</span></a>
          <a href="#next-code" ref={el=>{chips.current["next-code"]=el}}
            aria-current={active==="next-code"?"true":undefined}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+(active==="next-code"?"border-primary bg-primary text-primary-foreground":"border-primary/45 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20")}>
            <Code2 size={13}/>{L.codeChip}<span className={active==="next-code"?"text-primary-foreground/70":"text-primary/60"}>{NEXT_PATTERNS.length}</span></a>
          <a href="#tradeoffs" ref={el=>{chips.current.tradeoffs=el}}
            aria-current={active==="tradeoffs"?"true":undefined}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+(active==="tradeoffs"?"border-[#ff8f6b] bg-[#ff8f6b] text-[#24110b]":"border-[#ff8f6b]/45 bg-[#ff8f6b]/10 text-[#ffad91] hover:border-[#ff8f6b] hover:bg-[#ff8f6b]/15")}>
            <GitCompareArrows size={13}/>{L.tradeoffChip}<span className={active==="tradeoffs"?"text-[#24110b]/65":"text-[#ffad91]/60"}>{TRADEOFFS.length}</span></a>
          <span aria-hidden="true" className="my-1 w-px shrink-0 bg-[#25382f]"/>
          {BUCKETS.map(b=><a key={b.key} href={"#"+b.key} ref={el=>{chips.current[b.key]=el}}
            aria-current={active===b.key?"true":undefined}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary "+(active===b.key?"border-primary/60 bg-primary/12 text-primary":"border-[#2a3d35] bg-[#10201b] text-[#a9bcb2] hover:border-primary/40 hover:text-white")}>
            {b[lang]}<span className={active===b.key?"text-primary/70":"text-[#5f746a]"}>{COUNT[b.key]}</span></a>)}
        </div>
      </div>
    </nav>

    <div className="mx-auto max-w-[980px] px-4 sm:px-6">
      <section className="border-b border-[#1e2e27] py-9 sm:py-12">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Target size={20}/></div>
        <h1 className="text-[27px] font-semibold leading-[1.12] tracking-tight text-[#eef7f2] sm:text-[34px] lg:text-[40px]">{L.title}</h1>
        <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-[#9db0a7] sm:text-[15px]">{L.tagline}</p>
      </section>

      <section id="next-code" className={ANCHOR+" border-b border-[#1e2e27] py-9 sm:py-11"}>
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#e6f1eb]"><Code2 size={17} className="text-primary"/>{L.code}</h2>
          <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-[#8fa49b]">{L.codeLede}</p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {NEXT_PATTERNS.map((pattern,i)=><details key={pattern.key} className="group min-w-0 max-w-full rounded-xl border border-[#25382f] bg-[#0c1815] open:border-primary/35 sm:first:col-span-2 sm:[&:nth-child(2)]:col-span-2">
            <summary className="flex min-h-[64px] cursor-pointer list-none items-start gap-3 rounded-xl px-3.5 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden sm:px-4">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">{String(i+1).padStart(2,"0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-snug text-[#e6f1eb]">{pattern.need[lang]}</span>
                <code className="mt-1 block truncate text-[11.5px] text-[#7f978b]">{pattern.code.split("\n")[0]}</code>
              </span>
              <ChevronDown size={16} aria-hidden="true" className="mt-1 shrink-0 text-[#64796f] transition-transform group-open:rotate-180"/>
            </summary>
            <div className="border-t border-[#1e2e27] px-3.5 pb-4 pt-3.5 sm:px-4">
              <div className="grid gap-3">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[.13em] text-[#61766c]">{L.miniCode}</p>
                  <pre className="overflow-x-auto rounded-lg border border-[#21332b] bg-[#07100e] p-3 text-[12px] leading-relaxed text-[#cfe0d6] [tab-size:2]"><code>{pattern.code}</code></pre>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-lg bg-[#0f1c18] px-3 py-2.5"><MapPin size={13} className="mt-0.5 shrink-0 text-[#8ab4ff]"/><span className="text-[12.5px] leading-relaxed text-[#9db0a7]"><b className="font-semibold text-[#c9d9d1]">{L.place}:</b> {pattern.place[lang]}</span></div>
                  <div className="flex items-start gap-2 rounded-lg bg-[#0f1c18] px-3 py-2.5"><BrainCircuit size={13} className="mt-0.5 shrink-0 text-[#ff8f6b]"/><span className="text-[12.5px] leading-relaxed text-[#9db0a7]"><b className="font-semibold text-[#c9d9d1]">{L.mental}:</b> {pattern.model[lang]}</span></div>
                </div>
                {pattern.note&&<p className="border-l-2 border-primary/35 pl-3 text-[12.5px] leading-relaxed text-[#81988d]">{pattern.note[lang]}</p>}
              </div>
            </div>
          </details>)}
        </div>

        <div className="mt-7 rounded-2xl border border-[#25382f] bg-[#0a1512] p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#e6f1eb]"><Layers3 size={15} className="text-[#8ab4ff]"/>{L.codeScan}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#8fa49b]">{L.codeScanLede}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NEXT_QUICK_GROUPS.map(group=><div key={group.title.en} className="rounded-xl border border-[#21332b] bg-[#0c1815] p-3.5">
              <h4 className="text-[12px] font-semibold uppercase tracking-[.11em] text-primary">{group.title[lang]}</h4>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#9db0a7]">{group.items.join(" → ")}</p>
            </div>)}
          </div>
        </div>
      </section>

      <section id="tradeoffs" className={ANCHOR+" border-b border-[#1e2e27] py-9 sm:py-11"}>
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#e6f1eb]"><GitCompareArrows size={17} className="text-[#ff8f6b]"/>{L.tradeoffs}</h2>
          <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-[#8fa49b]">{L.tradeoffsLede}</p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {TRADEOFFS.map((item,i)=><article key={`${item.area.en}-${item.left}-${item.right}`} className="min-w-0 rounded-xl border border-[#25382f] bg-[#0c1815] p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#6f857a]">{item.area[lang]}</span>
              <span className="text-[10px] tabular-nums text-[#53685e]">{String(i+1).padStart(2,"0")}</span>
            </div>
            <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <span className="min-w-0 rounded-lg border border-primary/25 bg-primary/8 px-2.5 py-2 text-center text-[12.5px] font-semibold leading-snug text-[#dff2d4]">{item.left}</span>
              <GitCompareArrows size={13} className="shrink-0 text-[#52675d]" aria-label={L.versus}/>
              <span className="min-w-0 rounded-lg border border-[#ff8f6b]/25 bg-[#ff8f6b]/7 px-2.5 py-2 text-center text-[12.5px] font-semibold leading-snug text-[#f3d2c7]">{item.right}</span>
            </div>
            <p className="mt-3 border-t border-[#1e2e27] pt-2.5 text-[12.5px] leading-relaxed text-[#94a89e]">{item.tension[lang]}</p>
          </article>)}
        </div>

        <p className="mt-5 rounded-xl border border-[#ff8f6b]/25 bg-[#160f0d] px-4 py-3 text-[13px] leading-relaxed text-[#d7b9af]">{L.tradeoffClose}</p>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{L.glossary}</h2>
        <p className="mb-6 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{L.glossaryLede}</p>
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACRONYMS.map(item=><div key={item.short} className="rounded-xl border border-[#25382f] bg-[#0c1815] px-3.5 py-3">
            <dt className="text-[13px] font-semibold text-primary">{item.short}</dt>
            <dd className="mt-1 text-[12.5px] leading-relaxed text-[#9db0a7]">{item.long}</dd>
          </div>)}
        </dl>
      </section>

      <section id="pipeline" className={ANCHOR+" border-b border-[#1e2e27] py-9 sm:py-11"}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#e6f1eb]"><Route size={17} className="text-primary"/>{L.pipeline}</h2>
            <p className="mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{L.pipelineLede}</p>
          </div>
          <DrawButton onClick={drawPipeline} active={drawn==="pipeline"} label={L.drawAll}/>
        </div>

        <div className="rounded-2xl border border-[#25382f] bg-[#0c1815] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#5f746a]">{L.pipelineShort}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {PIPELINE_SHORT.map((step,i)=><span key={step} className="flex items-center gap-1.5">
              {i>0&&<ArrowRight size={11} className="text-[#3f5349]"/>}
              <span className="rounded-md bg-[#0f1c18] px-2 py-1 text-xs text-[#cfe0d6]">{step}</span></span>)}
          </div>
        </div>

        <ol className="mt-2 grid gap-2">
          {PIPELINE.map((stage,i)=><li key={stage.node} className="flex gap-3 rounded-xl border border-[#25382f] bg-[#0c1815] px-3.5 py-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">{i+1}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-semibold text-[#e6f1eb]">{stage[lang]}</h3>
                {stage.node!==stage[lang]&&<span title={L.pipelineNodeHint} className="rounded bg-[#0f1c18] px-1.5 py-0.5 text-[10px] text-[#5f746a]">{stage.node}</span>}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#8fa49b]">{stage.notes[lang]}</p>
            </div>
          </li>)}
        </ol>

        <h3 className="mt-8 flex items-center gap-2 text-[15px] font-semibold text-[#e6f1eb]"><Gauge size={15} className="text-[#ff8f6b]"/>{L.vitals}</h3>
        <p className="mb-4 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{L.vitalsLede}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {WEB_VITALS.map(v=><div key={v.node} className="rounded-xl border border-[#25382f] bg-[#0c1815] px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#ff8f6b]">{v.node}</span>
              <span className="rounded bg-[#0f1c18] px-1.5 py-0.5 text-[10px] text-[#5f746a]">{v.at}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#8fa49b]">{v[lang]}</p>
          </div>)}
        </div>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{L.flow}</h2>
        <p className="mb-6 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b] sm:mb-7">{L.flowLede}</p>
        <ol className="grid gap-2.5">
          {MENTAL_MODEL.map(step=><li key={step.step} className="rounded-2xl border border-[#25382f] bg-[#0c1815] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{step.step}</span>
              <h3 className="text-[15px] font-semibold text-[#e6f1eb]">{step[lang]}</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">{step.asks.map(a=><span key={a.id} className="rounded-md bg-[#0f1c18] px-2.5 py-1 text-xs text-[#9db0a7]">{a[lang]}</span>)}</div>
          </li>)}
        </ol>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{L.buckets}</h2>
        <p className="mb-6 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{L.bucketsLede}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
          {BUCKETS.map((b,i)=><span key={b.key} className="flex items-center gap-2">
            {i>0&&<ArrowRight size={12} className="hidden text-[#3f5349] sm:block"/>}
            <a href={"#"+b.key} className="rounded-lg border border-[#2a3d35] bg-[#10201b] px-3 py-1.5 text-xs font-medium text-[#cfe0d6] transition hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{b[lang]}</a></span>)}
        </div>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="mb-6 text-lg font-semibold text-[#e6f1eb]">{L.memo}</h2>
        <div className="overflow-hidden rounded-2xl border border-[#25382f]">
          <div className="hidden grid-cols-2 gap-4 border-b border-[#1e2e27] bg-[#0c1815] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[.14em] sm:grid">
            <span className="text-primary">{L.learn}</span><span className="text-[#5f746a]">{L.skip}</span></div>
          {MEMORISE.map((m,i)=><div key={m.learn} className={"grid gap-1.5 px-4 py-3 text-[13px] sm:grid-cols-2 sm:gap-4 sm:px-5 sm:py-2.5 "+(i%2?"bg-[#0c1815]":"")}>
            <span className="flex items-start gap-2 text-[#dce9e2]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary sm:hidden"/>{m.learn}</span>
            <span className="flex items-start gap-2 text-[#7b8f85]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b4e45] sm:hidden"/>
              <span className="line-through decoration-[#3b4e45]">{m.skip}</span></span>
          </div>)}
        </div>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{L.pairs}</h2>
        <p className="mb-6 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{L.pairsLede}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAIRS.map(p=><div key={p.trigger} className="flex flex-col gap-2.5 rounded-xl border border-[#25382f] bg-[#0c1815] px-3.5 py-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <Chip tone="requirement">{p.trigger}</Chip>
              <ArrowRight size={13} className="shrink-0 text-[#4d6258]"/>
              {p.answer.map(a=><Chip key={a}>{a}</Chip>)}
            </div>
            <DrawButton className="self-start sm:self-center" active={drawn===p.trigger} label={L.draw}
              onClick={()=>draw([`${p.trigger} bercabang ke ${p.answer.join(" dan ")}`],p.trigger)}/>
          </div>)}
        </div>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{L.sheet}</h2>
        <p className="mb-6 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b] sm:mb-7">{L.sheetLede}</p>
        <div className="grid gap-7">
          {BUCKETS.map(bucket=>{
            const rows=CHEATSHEET.filter(r=>r.bucket===bucket.key);
            return <div key={bucket.key} id={bucket.key} className={ANCHOR}>
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#243630] pb-2.5">
                <h3 className="text-[13px] font-semibold uppercase tracking-[.12em] text-[#c6d6cd]">{bucket[lang]}</h3>
                <span className="text-[11px] text-[#5f746a]">{rows.length}</span>
                <DrawButton className="ml-auto" active={drawn===bucket.key} label={L.drawAll} onClick={()=>drawBucket(bucket.key)}/>
              </div>
              <div className="grid gap-2">
                {rows.map(row=><article key={row.node} className="rounded-xl border border-[#25382f] bg-[#0c1815] p-3.5 sm:p-4">
                  <div className="mb-2.5 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-semibold text-[#e6f1eb]">{row[lang]}</h4>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#8fa49b]"><span className="text-[#5f746a]">{L.focus}: </span>{row.focus[lang]}</p>
                    </div>
                    <DrawButton active={drawn===row.node} label={L.draw} onClick={()=>drawRow(row)}/>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip tone="requirement">{row.node}</Chip>
                    <ArrowRight size={12} className="shrink-0 text-[#4d6258]"/>
                    {row.techniques.map(t=><Chip key={t}>{t}</Chip>)}
                  </div>
                </article>)}
              </div>
            </div>;
          })}
        </div>
      </section>

      <section className="border-b border-[#1e2e27] py-9 sm:py-11">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#e6f1eb]"><Sparkles size={17} className="shrink-0 text-primary"/>{L.example}</h2>
        <p className="mb-5 rounded-xl border border-[#2a3d35] bg-[#0d1b17] px-4 py-3 text-[13.5px] italic leading-relaxed text-[#cfe0d6] sm:text-[14px]">“{WORKED_EXAMPLE.prompt[lang]}”</p>
        <div className="mb-4 rounded-xl border border-[#44302a] bg-[#160f0d] px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#ff8f6b]">{L.weak}</p>
          <p className="text-[13.5px] text-[#b9a49e]">“{WORKED_EXAMPLE.weak[lang]}”</p>
        </div>
        <div className="rounded-xl border border-[#25382f] bg-[#0c1815] p-3.5 sm:p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-primary">{L.strong}</p>
          <div className="grid gap-2">
            {WORKED_EXAMPLE.strong.map(line=><div key={line.need} className="flex flex-wrap items-center gap-1.5">
              <Chip tone="requirement">{line.need}</Chip><ArrowRight size={12} className="shrink-0 text-[#4d6258]"/>
              {line.answer.map(a=><Chip key={a}>{a}</Chip>)}</div>)}
          </div>
          <p className="mt-4 border-t border-[#1e2e27] pt-3 text-[13px] leading-relaxed text-[#8fa49b]">{WORKED_EXAMPLE.closing[lang]}</p>
          <div className="mt-4"><DrawButton active={drawn==="example"} label={L.drawAll}
            onClick={()=>draw(WORKED_EXAMPLE.strong.map(l=>`${l.need} bercabang ke ${l.answer.join(" dan ")}`),"example")}/></div>
        </div>
      </section>

      <section className="py-9 sm:py-11">
        <h2 className="text-lg font-semibold text-[#e6f1eb]">{L.speak}</h2>
        <p className="mb-5 mt-1.5 max-w-[62ch] text-sm text-[#8fa49b]">{L.speakHint}</p>
        <div className="grid gap-1.5">
          {SPOKEN.map(s=><span key={s} className="rounded-lg border border-[#2a3d35] bg-[#10201b] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#dceade]">“{s}”</span>)}
        </div>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <ArrowLeft size={15}/>{L.back}</Link>
      </section>
    </div>

    <button type="button" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} title={L.top} aria-label={L.top}
      aria-hidden={!scrolled} tabIndex={scrolled?0:-1}
      style={{bottom:"max(1.25rem, env(safe-area-inset-bottom))"}}
      className={"fixed right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-[#2a3d35] bg-[#10201b]/95 text-[#cfe0d6] shadow-[0_10px_24px_rgba(0,0,0,.4)] backdrop-blur transition hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:hidden "+(scrolled?"opacity-100":"pointer-events-none opacity-0")}>
      <ArrowUp size={18}/></button>
  </main>;
}
