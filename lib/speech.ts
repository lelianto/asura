export type SpeechEvent={transcript:string;isFinal:boolean;confidence?:number;timestamp:number};
export type SpeechEventHandler=(event:SpeechEvent)=>void;
export type SpeechErrorHandler=(error:string,fatal:boolean)=>void;
export interface SpeechProvider{start():Promise<void>;stop():Promise<void>;subscribe(callback:SpeechEventHandler):()=>void;subscribeError(callback:SpeechErrorHandler):()=>void;setLanguage(language:string):void}

// Errors the browser will keep raising until the user intervenes; restarting is pointless.
const FATAL=new Set(["not-allowed","service-not-allowed","audio-capture","language-not-supported"]);

type BrowserRecognition={continuous:boolean;interimResults:boolean;lang:string;start:()=>void;stop:()=>void;onresult:((e:{resultIndex:number;results:ArrayLike<{0:{transcript:string;confidence:number};isFinal:boolean}>})=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null};
export class WebSpeechProvider implements SpeechProvider{
  private recognition:BrowserRecognition|null=null;private listeners=new Set<SpeechEventHandler>();private errorListeners=new Set<SpeechErrorHandler>();
  private intentional=false;private active=false;private language="id-ID";private retries=0;private timer:ReturnType<typeof setTimeout>|null=null;
  setLanguage(language:string){this.language=language;if(this.recognition)this.recognition.lang=language}
  subscribe(callback:SpeechEventHandler){this.listeners.add(callback);return()=>this.listeners.delete(callback)}
  subscribeError(callback:SpeechErrorHandler){this.errorListeners.add(callback);return()=>this.errorListeners.delete(callback)}
  private emitError(error:string,fatal:boolean){this.errorListeners.forEach(fn=>fn(error,fatal))}
  async start(){
    const w=window as unknown as {SpeechRecognition?:new()=>BrowserRecognition;webkitSpeechRecognition?:new()=>BrowserRecognition};
    const Recognition=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Recognition)throw new Error("unsupported");
    if(!this.recognition){const r=new Recognition();r.continuous=true;r.interimResults=true;r.lang=this.language;
      r.onresult=(event)=>{this.retries=0;for(let i=event.resultIndex;i<event.results.length;i++){const x=event.results[i];this.listeners.forEach(fn=>fn({transcript:x[0].transcript,isFinal:x.isFinal,confidence:x[0].confidence,timestamp:Date.now()}))}};
      r.onerror=(e)=>{const fatal=FATAL.has(e.error);if(fatal){this.active=false;this.clearTimer()}this.emitError(e.error,fatal)};
      // `continuous` recognition still ends on its own after silence; restart with backoff.
      r.onend=()=>{if(!this.active||this.intentional)return;
        if(this.retries>=8){this.active=false;this.emitError("restart-limit",true);return}
        const delay=Math.min(350*2**this.retries++,8000);
        this.clearTimer();this.timer=setTimeout(()=>{if(!this.active||this.intentional)return;try{r.start()}catch{/* already running */}},delay)};
      this.recognition=r;
    }
    this.recognition.lang=this.language;this.intentional=false;this.active=true;this.retries=0;this.clearTimer();
    try{this.recognition.start()}catch{/* start() throws if it is already running */}
  }
  async stop(){this.intentional=true;this.active=false;this.clearTimer();this.recognition?.stop()}
  private clearTimer(){if(this.timer){clearTimeout(this.timer);this.timer=null}}
}
