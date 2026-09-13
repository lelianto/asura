export type DiagramCommand =
  | { type: "ADD_NODE"; label: string }
  | { type: "DELETE_NODE"; target: string }
  | { type: "CONNECT"; from: string; to: string }
  | { type: "DISCONNECT"; from: string; to: string }
  | { type: "RENAME_NODE"; target: string; newLabel: string }
  | { type: "BRANCH"; from: string; targets: string[] }
  | { type: "UNDO" } | { type: "REDO" };

const vocab: Array<[RegExp, string]> = [
  [/\b(next\s*\.?\s*j\s*s)\b/gi,"Next.js"],[/\b(tan\s*stack query|react query|tanstack)\b/gi,"TanStack Query"],
  [/\b(b\s*f\s*f|be ef ef)\b/gi,"BFF"],[/\b(web\s*socket)\b/gi,"WebSocket"],[/\b(cdn)\b/gi,"CDN"],
  [/\b(user|pengguna)\b/gi,"User"],[/\b(redis)\b/gi,"Redis"],[/\b(api gateway)\b/gi,"API Gateway"],
  [/\b(graph\s*ql)\b/gi,"GraphQL"],[/\b(backend api)\b/gi,"Backend API"],[/\b(mobile app|aplikasi mobile)\b/gi,"Mobile App"],
  [/\b(service worker)\b/gi,"Service Worker"],[/\b(local storage)\b/gi,"Local Storage"],[/\b(auth service)\b/gi,"Auth Service"],
];

export function normalize(raw:string){
  let text=raw.trim().replace(/[.,!?]+$/g,"");
  for(const [pattern,value] of vocab)text=text.replace(pattern,value);
  return text.replace(/^(nah|jadi|kemudian|terus|lalu|mungkin|di sini|kalau begitu|okay|oke|so|then|basically)[,\s]+/i,"").trim();
}
const clean=(s:string)=>normalize(s).replace(/^(our|the|sebuah|si)\s+/i,"").trim().replace(/\s+(kita|kami)$/i,"").trim();

export function parseIntent(raw:string):DiagramCommand[]{
  const text=normalize(raw);
  if(/^(undo|balik|batalkan( yang terakhir)?)$/i.test(text))return[{type:"UNDO"}];
  if(/^(redo|ulangi( lagi)?)$/i.test(text))return[{type:"REDO"}];
  let m=text.match(/^(?:hapus|delete|remove)\s+(.+)$/i);
  if(m)return[{type:"DELETE_NODE",target:clean(m[1])}];
  m=text.match(/^(?:ganti|ubah|rename)\s+(.+?)\s+(?:jadi|menjadi|to)\s+(.+)$/i);
  if(m)return[{type:"RENAME_NODE",target:clean(m[1]),newLabel:clean(m[2])}];
  m=text.match(/^(.+?)\s+(?:bercabang ke|branches? to)\s+(.+)$/i);
  if(m)return[{type:"BRANCH",from:clean(m[1]),targets:m[2].split(/\s+(?:dan|and)\s+|,/i).map(clean).filter(Boolean)}];
  m=text.match(/^(?:tambahkan|tambah|buat|add|create)\s+(.+)$/i);
  if(m)return[{type:"ADD_NODE",label:clean(m[1])}];
  m=text.match(/^dari\s+(.+?)\s+ke\s+(.+)$/i);
  if(m)return chain(clean(m[1]),m[2]);
  m=text.match(/^(?:connect\s+)?(.+?)\s+(?:terhubung ke|connects? to|masuk melalui|menuju|ke)\s+(.+)$/i);
  if(m)return chain(clean(m[1]),m[2]);
  return[];
}
function chain(first:string,tail:string):DiagramCommand[]{
  const parts=[first,...tail.split(/\s+(?:(?:lalu|kemudian|then)\s+)?ke\s+/i).map(clean)].filter(Boolean);
  return parts.slice(0,-1).map((from,i)=>({type:"CONNECT",from,to:parts[i+1]}));
}
