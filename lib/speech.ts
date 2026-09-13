export type SpeechEvent={transcript:string;isFinal:boolean;confidence?:number;timestamp:number};
export type SpeechEventHandler=(event:SpeechEvent)=>void;
export interface SpeechProvider{start():Promise<void>;stop():Promise<void>;subscribe(callback:SpeechEventHandler):()=>void;setLanguage(language:string):void}

type BrowserRecognition={continuous:boolean;interimResults:boolean;lang:string;start:()=>void;stop:()=>void;onresult:((e:{resultIndex:number;results:ArrayLike<{0:{transcript:string;confidence:number};isFinal:boolean}>})=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null};
export class WebSpeechProvider implements SpeechProvider{
  private recognition:BrowserRecognition|null=null;private listeners=new Set<SpeechEventHandler>();private intentional=false;private active=false;private language="id-ID";
  setLanguage(language:string){this.language=language;if(this.recognition)this.recognition.lang=language}
  subscribe(callback:SpeechEventHandler){this.listeners.add(callback);return()=>this.listeners.delete(callback)}
  async start(){
    const w=window as unknown as {SpeechRecognition?:new()=>BrowserRecognition;webkitSpeechRecognition?:new()=>BrowserRecognition};
    const Recognition=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Recognition)throw new Error("unsupported");
    if(!this.recognition){const r=new Recognition();r.continuous=true;r.interimResults=true;r.lang=this.language;
      r.onresult=(event)=>{for(let i=event.resultIndex;i<event.results.length;i++){const x=event.results[i];this.listeners.forEach(fn=>fn({transcript:x[0].transcript,isFinal:x.isFinal,confidence:x[0].confidence,timestamp:Date.now()}))}};
      r.onend=()=>{if(this.active&&!this.intentional)setTimeout(()=>{try{r.start()}catch{}},350)};this.recognition=r;
    }this.intentional=false;this.active=true;this.recognition.start();
  }
  async stop(){this.intentional=true;this.active=false;this.recognition?.stop()}
}
