"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft,ArrowRight,ArrowUp,Languages,PenLine,Sparkles,Target} from "lucide-react";
import {parseIntent} from "@/lib/diagram";
import {useDiagramStore} from "@/lib/store";
import {BUCKETS,CHEATSHEET,MEMORISE,MENTAL_MODEL,PAIRS,WORKED_EXAMPLE,rowToStatement,type Bucket,type Row} from "@/lib/system-design";

const T={
  id:{back:"Kembali ke kanvas",title:"Cheatsheet FE System Design",
    tagline:"Jangan hafalkan teknologi. Hafalkan kerangka berpikir dan hubungan problem → solusi.",
    jump:"Lompat ke bucket",top:"Kembali ke atas",
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
    jump:"Jump to a bucket",top:"Back to top",
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
function useActiveBucket(){
  const [active,setActive]=useState<Bucket|"">("");
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    let frame=0;
    const read=()=>{
      frame=0;
      const line=(window.innerWidth<640?104:124)+12;
      let current:Bucket|""="";
      for(const b of BUCKETS){
        const el=document.getElementById(b.key);
        if(el&&el.getBoundingClientRect().top<=line)current=b.key;
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

  return <main className="min-h-dvh overflow-x-hidden bg-[#07100e] pb-20 sm:pb-24">
    <header className="glass sticky top-0 z-20 border-b border-[#24352e]">
      <div className="mx-auto flex h-14 max-w-[980px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#9bafa6] transition hover:bg-[#17251f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <ArrowLeft size={16}/><span className="hidden sm:inline">{L.back}</span></Link>
        <label className="relative flex items-center">
          <Languages className="pointer-events-none absolute left-2.5 text-[#71877d]" size={15}/>
          <select aria-label={lang==="id"?"Bahasa halaman":"Page language"} value={lang} onChange={e=>setLang(e.target.value as "id"|"en")}
            className="appearance-none rounded-lg border border-[#2a3d35] bg-[#10201b] py-1.5 pl-8 pr-3 text-xs text-[#dce9e2]">
            <option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
      </div>
    </header>

    <nav aria-label={L.jump} className="glass sticky top-14 z-10 border-b border-[#1e2e27] sm:top-16">
      <div className="mx-auto max-w-[980px] px-4 sm:px-6">
        <div ref={strip} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      className={"fixed bottom-5 right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-[#2a3d35] bg-[#10201b]/95 text-[#cfe0d6] shadow-[0_10px_24px_rgba(0,0,0,.4)] backdrop-blur transition hover:border-primary/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 "+(scrolled?"opacity-100":"pointer-events-none opacity-0")}>
      <ArrowUp size={18}/></button>
  </main>;
}
