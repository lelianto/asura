export type DiagramCommand =
  | { type: "ADD_NODE"; label: string }
  | { type: "DELETE_NODE"; target: string }
  | { type: "CONNECT"; from: string; to: string }
  | { type: "DISCONNECT"; from: string; to: string }
  | { type: "RENAME_NODE"; target: string; newLabel: string }
  | { type: "SET_TECH"; target: string; tech: string }
  | { type: "BRANCH"; from: string; targets: string[] }
  | { type: "CLEAR" }
  | { type: "UNDO" } | { type: "REDO" };

export type NodeKind = "client" | "edge" | "app" | "service" | "data" | "requirement" | "technique";
type Entry = { pattern: RegExp; label: string; kind: NodeKind };

// Canonical names for things people say out loud. Spoken forms matter more than
// written ones: dictation produces "next js", "post gres", "es tiga", "engine x".
// Order is significant — a multi-word entry must precede any entry whose pattern
// could match a fragment of it.
const vocabulary: Entry[] = [
  // Resolved first: the bare `users?` rule below would otherwise rewrite the
  // tail of this phrase and leave "global User" behind.
  {pattern:/\b(global users|pengguna global|audiens global)\b/gi,label:"Global Audience",kind:"requirement"},
  // clients
  {pattern:/\b(users?|pengguna|pemakai)\b/gi,label:"User",kind:"client"},
  {pattern:/\b(mobile app|aplikasi mobile|aplikasi seluler|apl?ikasi hp)\b/gi,label:"Mobile App",kind:"client"},
  {pattern:/\b(i\s*os app|aplikasi i\s*os)\b/gi,label:"iOS App",kind:"client"},
  {pattern:/\b(android app|aplikasi android)\b/gi,label:"Android App",kind:"client"},
  {pattern:/\b(desktop app|aplikasi desktop)\b/gi,label:"Desktop App",kind:"client"},
  {pattern:/\b(browser|peramban)\b/gi,label:"Browser",kind:"client"},
  // edge / network
  {pattern:/\b(cdn|si di en)\b/gi,label:"CDN",kind:"edge"},
  {pattern:/\b(api gateway|ap?i gateway|gerbang api)\b/gi,label:"API Gateway",kind:"edge"},
  {pattern:/\b((?:load|lod) ?balan[cs]er|penyeimbang beban)\b/gi,label:"Load Balancer",kind:"edge"},
  {pattern:/\b(reverse proxy|proxy balik)\b/gi,label:"Reverse Proxy",kind:"edge"},
  {pattern:/\b(nginx|engine ?x|enjin ?eks)\b/gi,label:"Nginx",kind:"edge"},
  {pattern:/\b(cloudflare|cloud flare)\b/gi,label:"Cloudflare",kind:"edge"},
  {pattern:/\b(vercel|versel)\b/gi,label:"Vercel",kind:"edge"},
  {pattern:/\b(dns|di en es)\b/gi,label:"DNS",kind:"edge"},
  {pattern:/\b(waf|firewall|tembok api)\b/gi,label:"Firewall",kind:"edge"},
  // application layer
  // id-ID hears the spelled-out "je es"/"ji es" as "GS" or "jes"; accept them all.
  {pattern:/\b(frontend application|frontend app|aplikasi frontend|front ?end)\b/gi,label:"Frontend",kind:"app"},
  {pattern:/\b(next ?\.? ?(?:j ?s|g ?s|j[ei] ?es|[jg]es) server|server next ?\.? ?(?:j ?s|g ?s))\b/gi,label:"Next.js Server",kind:"app"},
  {pattern:/\b(next ?\.? ?(?:j ?s|g ?s|j[ei] ?es|[jg]es))\b/gi,label:"Next.js",kind:"app"},
  {pattern:/\b(tan ?stack query|react query|tanstack)\b/gi,label:"TanStack Query",kind:"app"},
  {pattern:/\b(service worker)\b/gi,label:"Service Worker",kind:"app"},
  {pattern:/\b(admin panel|panel admin)\b/gi,label:"Admin Panel",kind:"app"},
  {pattern:/\b(dashboard|dasbor)\b/gi,label:"Dashboard",kind:"app"},
  {pattern:/\b(web server|peladen web)\b/gi,label:"Web Server",kind:"app"},
  {pattern:/\b(react|riakt)\b/gi,label:"React",kind:"app"},
  {pattern:/\b(vue ?j?s?|vyu)\b/gi,label:"Vue",kind:"app"},
  {pattern:/\b(svelte|sfelt)\b/gi,label:"Svelte",kind:"app"},
  {pattern:/\b(angular|anggular)\b/gi,label:"Angular",kind:"app"},
  // services
  {pattern:/\b(b ?f ?f|be ?ef ?ef)\b/gi,label:"BFF",kind:"service"},
  {pattern:/\b(backend api|api backend)\b/gi,label:"Backend API",kind:"service"},
  {pattern:/\b(backend services?|layanan backend|servis backend)\b/gi,label:"Backend Service",kind:"service"},
  {pattern:/\b(rest ?(?:ful)? ?api|res api)\b/gi,label:"REST API",kind:"service"},
  {pattern:/\b(graph ?ql|grafkiuel)\b/gi,label:"GraphQL",kind:"service"},
  {pattern:/\b(web ?socket|websoket)\b/gi,label:"WebSocket",kind:"service"},
  {pattern:/\b(grpc|ge ?er ?pi ?si|ji ?ar ?pi ?si)\b/gi,label:"gRPC",kind:"service"},
  {pattern:/\b(auth service|layanan (?:autentikasi|otentikasi)|servis auth)\b/gi,label:"Auth Service",kind:"service"},
  {pattern:/\b(payment service|layanan pembayaran)\b/gi,label:"Payment Service",kind:"service"},
  {pattern:/\b(notification service|layanan notifikasi)\b/gi,label:"Notification Service",kind:"service"},
  {pattern:/\b(search service|layanan pencarian)\b/gi,label:"Search Service",kind:"service"},
  {pattern:/\b(cron job|kron job|penjadwal tugas)\b/gi,label:"Cron Job",kind:"service"},
  {pattern:/\b(cloud functions?|fungsi cloud)\b/gi,label:"Cloud Function",kind:"service"},
  {pattern:/\b((?:aws )?lambda)\b/gi,label:"Lambda",kind:"service"},
  {pattern:/\b(kubernetes|kubernetis|kubernet|k8s|kube)\b/gi,label:"Kubernetes",kind:"service"},
  {pattern:/\b(docker|doker)\b/gi,label:"Docker",kind:"service"},
  {pattern:/\b(microservices?|mikroservis|layanan mikro)\b/gi,label:"Microservice",kind:"service"},
  {pattern:/\b(monolith|monolit)\b/gi,label:"Monolith",kind:"service"},
  {pattern:/\b(firebase|fire base)\b/gi,label:"Firebase",kind:"service"},
  {pattern:/\b(supabase|supa base)\b/gi,label:"Supabase",kind:"service"},
  {pattern:/\b(stripe|straip)\b/gi,label:"Stripe",kind:"service"},
  {pattern:/\b(observability(?: layer)?|observabilitas)\b/gi,label:"Observability",kind:"service"},
  {pattern:/\b(sentry|sentri)\b/gi,label:"Sentry",kind:"service"},
  {pattern:/\b(prometheus|prometeus)\b/gi,label:"Prometheus",kind:"service"},
  {pattern:/\b(grafana|grafanna)\b/gi,label:"Grafana",kind:"service"},
  // data
  {pattern:/\b(redis|redhis)\b/gi,label:"Redis",kind:"data"},
  {pattern:/\b(post ?gres(?:ql)?|postgre|postgresql)\b/gi,label:"PostgreSQL",kind:"data"},
  {pattern:/\b(my ?s ?q ?l|mai es kiu el)\b/gi,label:"MySQL",kind:"data"},
  {pattern:/\b(mongo di bi|mongo ?(?:db)?)\b/gi,label:"MongoDB",kind:"data"},
  {pattern:/\b(elastic ?search|elastik ?search)\b/gi,label:"Elasticsearch",kind:"data"},
  {pattern:/\b(kafka|kafkha)\b/gi,label:"Kafka",kind:"data"},
  {pattern:/\b(rabbit ?(?:mq|em ?kyu|em ?q))\b/gi,label:"RabbitMQ",kind:"data"},
  {pattern:/\b(message queue|antrian pesan)\b/gi,label:"Message Queue",kind:"data"},
  {pattern:/\b(object storage|penyimpanan objek)\b/gi,label:"Object Storage",kind:"data"},
  {pattern:/\b(data ?warehouse|gudang data)\b/gi,label:"Data Warehouse",kind:"data"},
  {pattern:/\b(local storage|penyimpanan lokal)\b/gi,label:"Local Storage",kind:"data"},
  {pattern:/\b(s ?3|es ?(?:tiga|tri|three))\b/gi,label:"S3",kind:"data"},
  {pattern:/\b(database|basis data)\b/gi,label:"Database",kind:"data"},
  {pattern:/\b(cache|tembolok)\b/gi,label:"Cache",kind:"data"},
  // ---- FE system design: non-functional requirements an interviewer states ----
  {pattern:/\b(fast initial load|load awal cepat|initial load cepat|initial load)\b/gi,label:"Fast Initial Load",kind:"requirement"},
  {pattern:/\b(largest contentful paint|lcp cepat|el ?si ?pi|lcp)\b/gi,label:"LCP",kind:"requirement"},
  {pattern:/\b(interaction to next paint|inp rendah|ai ?en ?pi|inp)\b/gi,label:"INP",kind:"requirement"},
  {pattern:/\b(cumulative layout shift|cls rendah|si ?el ?es|cls)\b/gi,label:"CLS",kind:"requirement"},
  {pattern:/\b(small bundle|bundle kecil|ukuran bundle)\b/gi,label:"Small Bundle",kind:"requirement"},
  {pattern:/\b(memory efficient|hemat memori)\b/gi,label:"Memory Efficient",kind:"requirement"},
  {pattern:/\b(traffic sangat besar|trafik sangat besar|huge traffic|traffic besar|trafik besar)\b/gi,label:"Huge Traffic",kind:"requirement"},
  {pattern:/\b(huge list|list besar|data besar|daftar panjang)\b/gi,label:"Huge List",kind:"requirement"},
  {pattern:/\b(cost efficient|hemat biaya)\b/gi,label:"Cost Efficient",kind:"requirement"},
  {pattern:/\b(unstable network|jaringan tidak stabil)\b/gi,label:"Unstable Network",kind:"requirement"},
  {pattern:/\b(slow network|jaringan lambat|koneksi lambat)\b/gi,label:"Slow Network",kind:"requirement"},
  {pattern:/\b(low ?end device|perangkat lemah|hp kentang)\b/gi,label:"Low End Device",kind:"requirement"},
  {pattern:/\b(api failure|api gagal|api sering gagal)\b/gi,label:"API Failure",kind:"requirement"},
  {pattern:/\b(offline support|dukungan offline|offline)\b/gi,label:"Offline",kind:"requirement"},
  {pattern:/\b(safe deployment|deployment aman|rilis aman)\b/gi,label:"Safe Deployment",kind:"requirement"},
  {pattern:/\b(reliable release|rilis andal)\b/gi,label:"Reliable Release",kind:"requirement"},
  {pattern:/\b(role ?based access|akses berbasis peran)\b/gi,label:"Role Based Access",kind:"requirement"},
  {pattern:/\b(backward compatible|kompatibel mundur)\b/gi,label:"Backward Compatible",kind:"requirement"},
  {pattern:/\b(multi ?language|multi ?bahasa|banyak bahasa)\b/gi,label:"Multi Language",kind:"requirement"},
  {pattern:/\b(many fe teams|banyak tim fe|banyak tim)\b/gi,label:"Many FE Teams",kind:"requirement"},
  {pattern:/\b(reusable ui|ui reusable|komponen reusable)\b/gi,label:"Reusable UI",kind:"requirement"},
  {pattern:/\b(maintainable|mudah dirawat)\b/gi,label:"Maintainable",kind:"requirement"},
  {pattern:/\b(observable|bisa dipantau)\b/gi,label:"Observable",kind:"requirement"},
  {pattern:/\b(accessible|aksesibel)\b/gi,label:"Accessible",kind:"requirement"},
  {pattern:/\b(secure|aman)\b/gi,label:"Secure",kind:"requirement"},
  {pattern:/\b(seo penting|es ?i ?o|seo)\b/gi,label:"SEO",kind:"requirement"},
  {pattern:/\b(realtime search|pencarian realtime|search realtime)\b/gi,label:"Realtime Search",kind:"requirement"},
  {pattern:/\b(frequently changing data|data sering berubah)\b/gi,label:"Frequently Changing Data",kind:"requirement"},
  {pattern:/\b(instant ui|ui instan|terasa instan)\b/gi,label:"Instant UI",kind:"requirement"},
  {pattern:/\b(realtime|real ?time|waktu nyata)\b/gi,label:"Realtime",kind:"requirement"},
  // ---- FE system design: techniques you reach for ----
  {pattern:/\b(ssr|es ?es ?er|server ?side rendering)\b/gi,label:"SSR",kind:"technique"},
  {pattern:/\b(ssg|es ?es ?ji|static ?site generation)\b/gi,label:"SSG",kind:"technique"},
  {pattern:/\b(isr|ai ?es ?er|incremental static regeneration)\b/gi,label:"ISR",kind:"technique"},
  {pattern:/\b(csr|si ?es ?er|client ?side rendering)\b/gi,label:"CSR",kind:"technique"},
  {pattern:/\b(edge rendering|render di edge)\b/gi,label:"Edge Rendering",kind:"technique"},
  {pattern:/\b(code ?splitting|pemecahan kode)\b/gi,label:"Code Splitting",kind:"technique"},
  {pattern:/\b(lazy ?loading|muat malas)\b/gi,label:"Lazy Loading",kind:"technique"},
  {pattern:/\b(tree ?shaking)\b/gi,label:"Tree Shaking",kind:"technique"},
  {pattern:/\b(dynamic import|impor dinamis)\b/gi,label:"Dynamic Import",kind:"technique"},
  {pattern:/\b(bundle analyzer)\b/gi,label:"Bundle Analyzer",kind:"technique"},
  {pattern:/\b(image optimization|optimasi gambar)\b/gi,label:"Image Optimization",kind:"technique"},
  {pattern:/\b(preload|pramuat)\b/gi,label:"Preload",kind:"technique"},
  {pattern:/\b(prefetch|pra ?ambil)\b/gi,label:"Prefetch",kind:"technique"},
  {pattern:/\b(compression|kompresi)\b/gi,label:"Compression",kind:"technique"},
  {pattern:/\b(web ?worker)\b/gi,label:"Web Worker",kind:"technique"},
  {pattern:/\b(virtualization|virtualisasi|windowing)\b/gi,label:"Virtualization",kind:"technique"},
  {pattern:/\b(pagination|paginasi|halaman)\b/gi,label:"Pagination",kind:"technique"},
  {pattern:/\b(infinite scroll|scroll tak terbatas)\b/gi,label:"Infinite Scroll",kind:"technique"},
  {pattern:/\b(debounce|debons)\b/gi,label:"Debounce",kind:"technique"},
  {pattern:/\b(throttle|trotel)\b/gi,label:"Throttle",kind:"technique"},
  {pattern:/\b(skeleton|kerangka muat)\b/gi,label:"Skeleton",kind:"technique"},
  {pattern:/\b(font optimization|optimasi font)\b/gi,label:"Font Optimization",kind:"technique"},
  {pattern:/\b(react hydration|hydration react)\b/gi,label:"React Hydration",kind:"technique"},
  {pattern:/\b(minimal hydration|kurangi hydration|(?<!react )hydration)\b/gi,label:"Minimal Hydration",kind:"technique"},
  {pattern:/\b(cache api)\b/gi,label:"Cache API",kind:"technique"},
  {pattern:/\b(indexed ?db|indeks ?db)\b/gi,label:"IndexedDB",kind:"technique"},
  {pattern:/\b(browser cache|cache browser)\b/gi,label:"Browser Cache",kind:"technique"},
  {pattern:/\b(edge caching|cache di edge)\b/gi,label:"Edge Caching",kind:"technique"},
  {pattern:/\b(cache eviction|pembersihan cache)\b/gi,label:"Cache Eviction",kind:"technique"},
  {pattern:/\b(revalidation|revalidasi)\b/gi,label:"Revalidation",kind:"technique"},
  {pattern:/\b(polling|pol ?ling)\b/gi,label:"Polling",kind:"technique"},
  {pattern:/\b(sse|es ?es ?i|server ?sent events)\b/gi,label:"SSE",kind:"technique"},
  {pattern:/\b(optimistic update|update optimistik)\b/gi,label:"Optimistic Update",kind:"technique"},
  {pattern:/\b(swr)\b/gi,label:"SWR",kind:"technique"},
  {pattern:/\b(retry|coba ulang)\b/gi,label:"Retry",kind:"technique"},
  {pattern:/\b(exponential backoff|backoff eksponensial|backoff)\b/gi,label:"Exponential Backoff",kind:"technique"},
  {pattern:/\b(timeout|batas waktu)\b/gi,label:"Timeout",kind:"technique"},
  {pattern:/\b(abort ?controller)\b/gi,label:"AbortController",kind:"technique"},
  {pattern:/\b(error boundary|batas error)\b/gi,label:"Error Boundary",kind:"technique"},
  {pattern:/\b(fallback ui|ui cadangan|fallback)\b/gi,label:"Fallback UI",kind:"technique"},
  {pattern:/\b(graceful degradation|degradasi anggun)\b/gi,label:"Graceful Degradation",kind:"technique"},
  {pattern:/\b(stale data|data basi)\b/gi,label:"Stale Data",kind:"technique"},
  {pattern:/\b(http ?only cookie|cookie http ?only)\b/gi,label:"HttpOnly Cookie",kind:"technique"},
  {pattern:/\b(csp|content security policy)\b/gi,label:"CSP",kind:"technique"},
  {pattern:/\b(sanitization|sanitasi)\b/gi,label:"Sanitization",kind:"technique"},
  {pattern:/\b(csrf ?token|token csrf|csrf)\b/gi,label:"CSRF Token",kind:"technique"},
  {pattern:/\b(rbac|role ?based access control)\b/gi,label:"RBAC",kind:"technique"},
  {pattern:/\b(route guard|penjaga rute)\b/gi,label:"Route Guard",kind:"technique"},
  {pattern:/\b(semantic html|html semantik)\b/gi,label:"Semantic HTML",kind:"technique"},
  {pattern:/\b(keyboard navigation|navigasi keyboard)\b/gi,label:"Keyboard Navigation",kind:"technique"},
  {pattern:/\b(aria)\b/gi,label:"ARIA",kind:"technique"},
  {pattern:/\b(metadata|meta ?data)\b/gi,label:"Metadata",kind:"technique"},
  {pattern:/\b(sitemap|peta situs)\b/gi,label:"Sitemap",kind:"technique"},
  {pattern:/\b(i18n|internasionalisasi|internationalization)\b/gi,label:"i18n",kind:"technique"},
  {pattern:/\b(locale routing|rute lokal)\b/gi,label:"Locale Routing",kind:"technique"},
  {pattern:/\b(design system|sistem desain)\b/gi,label:"Design System",kind:"technique"},
  {pattern:/\b(monorepo|mono ?repo)\b/gi,label:"Monorepo",kind:"technique"},
  {pattern:/\b(feature flags?|bendera fitur)\b/gi,label:"Feature Flags",kind:"technique"},
  {pattern:/\b(canary rollout|rilis kenari|canary)\b/gi,label:"Canary Rollout",kind:"technique"},
  {pattern:/\b(ci ?\/? ?cd)\b/gi,label:"CI/CD",kind:"technique"},
  {pattern:/\b(api versioning|versi api)\b/gi,label:"API Versioning",kind:"technique"},
  {pattern:/\b(structured logging|log terstruktur)\b/gi,label:"Structured Logging",kind:"technique"},
  {pattern:/\b(web ?vitals)\b/gi,label:"Web Vitals",kind:"technique"},
  {pattern:/\b(rum|real user monitoring)\b/gi,label:"RUM",kind:"technique"},
  {pattern:/\b(e2e|end to end test|tes e2e)\b/gi,label:"E2E Test",kind:"technique"},
  {pattern:/\b(visual regression)\b/gi,label:"Visual Regression",kind:"technique"},
];

export const DIAGRAM_KINDS = ["client","edge","app","service","data"] as const satisfies readonly NodeKind[];
export const DESIGN_KINDS = ["requirement","technique"] as const satisfies readonly NodeKind[];
export type DiagramKind = (typeof DIAGRAM_KINDS)[number];

// The public vocabulary surface, used by the docs and by the test suite.
export const VOCABULARY: ReadonlyArray<{label:string;kind:NodeKind}> =
  vocabulary.map(({label,kind})=>({label,kind}));
const kinds=new Map(vocabulary.map(e=>[e.label.toLowerCase(),e.kind]));
// Unrecognised names are plain services; the canvas colours them accordingly.
export const kindOf=(label:string):NodeKind=>kinds.get(label.toLowerCase())??"service";

// Speech-to-text routinely drops a letter from these connectives; repair them
// before any rule runs, otherwise the verb is read as part of a node label.
const misheard: Array<[RegExp, string]> = [
  [/\b(te+r?hubun?g?|terhubun|terhubng|terhbung)\b/gi,"terhubung"],
  [/\b(mengakse?s?|mengases|meng akses)\b/gi,"mengakses"],
  [/\b(bercabag|becabang|bercabng)\b/gi,"bercabang"],
  [/\b(tambakan|tambahan kan|tambahin|nambahin|nambah|tambahkn)\b/gi,"tambahkan"],
  [/\b(manggil|memangil|manggilin)\b/gi,"memanggil"],
  [/\b(ngakses|ngakse)\b/gi,"mengakses"],
  [/\b(nyambungin|nyambungkan|nyambung|sambungin|hubungin|sambungkn)\b/gi,"sambungkan"],
];

// Leading noise: "oke jadi begini, ...", "tolong ...", "aku mau ...".
const FILLER=/^(?:kalau begitu|ya sudah|yaudah|di sini|sebentar|selanjutnya|basically|alright|sekarang|begini|bentar|tolong|okay|baik|coba|gini|jadi|lalu|mungkin|kemudian|terus|please|right|then|well|anu|nah|yah|hmm+|emm+|mm+|um+|uh+|eh|oke|ok|so|ya)[,\s]+/i;
const ADD_WORDS="tambahkan|tambah|buat|buatkan|bikin|bikinin|pasang|taruh|add|create";
const DEL_WORDS="hapus|hapuskan|buang|hilangkan|singkirkan|delete|remove";
const CLEAR_WORDS="bersihkan|kosongkan|reset|clear|wipe";
// Verbs that turn a pronoun into a speaker rather than a subject: "kita sambungkan …".
const COMMAND_WORDS=`${ADD_WORDS}|${DEL_WORDS}|${CLEAR_WORDS}|sambungkan|sambung|hubungkan|hubung|connect|link|ganti|ubah|rename|putuskan|lepaskan|disconnect|unlink|mulai|memulai|start`;
// "saya ingin tambahkan Redis", and the bare form "kita sambungkan User ke CDN". The
// bare pronoun only goes when a command word follows it, so "saya pindah ke bagian
// berikutnya" keeps its pronoun and stays a sentence the guard can recognise as chatter.
const PRONOUN="aku|saya|kita|kami|gue|gw|we|i";
const INTENT=new RegExp(`^(?:${PRONOUN})\\s+(?:(?:mau|ingin|pengen|akan|want to|wanna|will|would like to|need to)\\s+|(?=(?:${COMMAND_WORDS})\\b))`,"i");

export function normalize(raw:string){
  let text=raw.trim().replace(/\s+/g," ").replace(/[.,!?]+$/g,"");
  for(const [pattern,value] of misheard)text=text.replace(pattern,value);
  for(const {pattern,label} of vocabulary)text=text.replace(pattern,label);
  // "user user terhubung" — a stutter or a re-recognised word, not two nodes.
  // "BFF-nya", "CDN-nya" — a possessive suffix, not part of the name.
  let previous="";
  while(previous!==text){previous=text;text=text.replace(/\b([\w.]+)(\s+\1)+\b/gi,"$1").replace(/-nya\b/gi,"")}
  // Speakers stack these: "oke jadi begini, tolong tambahkan Redis".
  previous="";
  while(previous!==text){previous=text;text=text.replace(FILLER,"").replace(INTENT,"").trim()}
  return text.trim();
}

// Verbs that mean "this node talks to that node".
const VERBS="terhubung(?: kembali)?(?: ke| dengan| dengan ke)?|tersambung(?: kembali)?(?: ke)?|connects? to|connected to|menuju(?: ke)?|masuk melalui|masuk lewat|masuk ke|melewati|melalui|lewat|via|mengakses|akses|memanggil|panggil|mengirim(?: kembali)? ke|kirim(?: kembali)? ke|meneruskan(?: kembali)? ke|diteruskan(?: kembali)? ke|dikembalikan(?: kembali)? ke|menghasilkan|accesses|access|calls|call|sends? to|routes? to|forwards? to|(?<!\\bcache\\s+)hits?|queries|query";
const LINK=new RegExp(`\\s+(?:(?:lalu|kemudian|terus|sebelum|setelah(?: itu)?|selanjutnya|berikutnya|then|after(?: that)?|before|next|dan|and)\\s+)?(?:${VERBS}|ke|to)\\s+`,"i");
// Words that introduce a command; used to decide whether "dan" joins two statements.
const HAS_VERB=new RegExp(`\\b(?:${VERBS}|ke|to|bercabang|branch(?:es)?|${ADD_WORDS}|${DEL_WORDS}|ganti|ubah|rename|putuskan|lepaskan|disconnect|unlink|sambungkan|hubungkan)\\b`,"i");
// "Web terbuat dari Next.js" describes the node, it does not name it.
const TECH=/^(.+?)\s+(?:yang\s+)?(?:terbuat dari|terbuat dengan|dibuat dari|dibuat dengan|dibangun dengan|dibangun di atas|berbasis|pakai|memakai|menggunakan|built with|built on|made with|made of|written in|using|powered by)\s+(.+)$/i;

// "Redis dong", "CDN aja", "BFF itu" — particles, never part of the name.
const PARTICLE=/\s+(?:saya|aku|gue|gw|kita|kami|itu|ini|tersebut|sendiri|tuh|nih|nya|dong|sih|deh|ya|kok|aja|saja|lah|kan)$/i;
// Architecture is described as a plan: "User nanti akan terhubung ke CDN". The tense
// words cling to whichever label they touch, so strip them from both ends of it —
// otherwise "User bakal" becomes a second node standing next to the real "User".
const PLAN=/^(?:nanti(?:nya)?|akan|bakal)\s+|\s+(?:nanti(?:nya)?|akan|bakal)$/gi;
const ALL="semua(?:nya)?|seluruh(?:nya)?|all|everything";
const CANVAS="nodes?|diagram(?:nya)?|kanvas(?:nya)?|canvas|papan";
const CLEAR_ALL=new RegExp(`^(?:(?:${DEL_WORDS}|${CLEAR_WORDS})\\s+(?:the\\s+)?(?:${ALL})(?:\\s+(?:${CANVAS}))?|(?:${CLEAR_WORDS})\\s+(?:the\\s+)?(?:${CANVAS})|mulai (?:lagi )?dari awal|start over)$`,"i");
// Prose verbs end a name and start a description: "API Client menangani request",
// "Error Frontend dapat dikirim ke Sentry". Everything from here on is explanation.
const TRUNCATE=/\s+(?:menangani|menggunakan|melakukan|memiliki|berisi|berupa|menentukan|memperhatikan|mengurangi|menyederhanakan|mengambil|memisahkan|merender|membutuhkan|dikirim|diteruskan|dikumpulkan|divalidasi|ditangani|disimpan|diperbarui|digunakan|dipaksakan|cocok untuk|penting)\b.*$|\s+(?:seperti|misalnya|contohnya|yaitu|antara lain|agar|supaya|sehingga|karena|sebab|sementara|sedangkan|tetapi|namun|meskipun|walaupun|selama|ketika|saat|jika|kalau|dengan)\b.*$/i;
// Discourse markers bracket a name on either side: "Pertama, UI Layer", "BFF kemudian".
const MARKER=/^(?:pertama|kedua|ketiga|terakhir|berikutnya|selanjutnya|kemudian|lalu|terus|setelah itu|sebelum itu|misalnya|contohnya|kembali|akhirnya|sebenarnya|justru|bahkan|juga)[,\s]+|[,\s]+(?:pertama|kedua|ketiga|terakhir|berikutnya|selanjutnya|kemudian|lalu|terus|misalnya|contohnya|kembali|akhirnya|sebenarnya|juga)$/gi;
// Modals and negators trail a subject: "Server State dapat", "Asset tersebut dapat".
const AUX=/\s+(?:dapat|bisa|boleh|harus|perlu|sudah|telah|sedang|masih|tetap|hanya|sebaiknya|sebisa mungkin|mungkin|tidak|bukan|jangan)$/i;
// Words that decorate a name without belonging to it: "di dalam Frontend",
// "beberapa backend services", "the API Gateway".
const OPENER=/^(?:our|the|sebuah|suatu|si|sang|di dalam|didalam|dalam|di|pada|melalui|lewat|via|menuju|inside|within|beberapa|banyak|sejumlah|berbagai|several|multiple|some)\s+/i;
// "API Gateway atau BFF", "CDN atau Edge Layer", "API/BFF" — one box named twice.
const ALIAS=/\s*\/\s*|\s+(?:atau|or)\s+/i;
// What is left when a step carries only grammar: "terhubung", "kembali", "lalu".
const FRAGMENT=new RegExp(`^(?:${VERBS}|kembali|lagi|terus|lalu|kemudian|juga|ini|itu|sini|situ)$`,"i");
function clean(raw:string){
  let text=normalize(raw).replace(TRUNCATE,"").trim();
  let previous="";
  while(previous!==text){previous=text;
    text=text.replace(PARTICLE,"").replace(PLAN,"").replace(AUX,"").replace(MARKER,"").replace(OPENER,"").trim()}
  // A node name never contains a comma; what follows one is always commentary.
  if(text.includes(","))text=text.split(",")[0].trim();
  if(FRAGMENT.test(text))return"";
  // Unknown terms keep the casing they were spoken with; canonical ones are left alone.
  // A stop is not a word boundary worth capitalising across: "Next.js Server" is one
  // name that happens to contain a dot, and title-casing it produced "Next.Js Server",
  // a second node standing next to the real one.
  if(!kinds.has(text.toLowerCase()))text=text.replace(/(?<![\w.])[a-z]/g,c=>c.toUpperCase());
  // Keep the half the vocabulary recognises, so the alias lands on the existing node.
  if(ALIAS.test(text)&&!kinds.has(text.toLowerCase())){
    const halves=text.split(ALIAS).map(x=>x.trim()).filter(Boolean);
    const known=halves.find(h=>kinds.has(h.toLowerCase()));
    if(known)text=known;
  }
  return text;
}
type Term={label:string;tech?:string};
// "Web menggunakan Next.js" must be split before clean() runs: "menggunakan" both
// introduces a technology and ends a name, and the technology reading wins.
function term(raw:string):Term{
  const m=normalize(raw).match(TECH);
  return m?{label:clean(m[1]),tech:clean(m[2])}:{label:clean(raw)};
}

// Speech arrives one sentence at a time, so a whole utterance used to be one statement.
// Typed and pasted input carries entire paragraphs, and the parser has to read those the
// same way the microphone delivers them: one sentence, one statement. A stop only divides
// when a capital follows it, because dictation spells the name out as "next. js" too.
export function parseIntent(raw:string):DiagramCommand[]{
  return raw.split(/[.!?;]+\s+(?=[A-Z])|\n+/).flatMap(sentence=>{
    const text=normalize(sentence);
    return text?splitClauses(text).flatMap(c=>guard(parseClause(c))):[];
  });
}

// The microphone is always on, so ordinary conversation reaches the parser too.
// "kita pindah ke bagian berikutnya" fits the "A ke B" shape but names no node;
// pronouns and discourse markers never appear in an architecture label.
const CHATTY=/\b(saya|aku|kita|kami|anda|kamu|kalian|mereka|menurut|sepertinya|rasanya|mungkin|nanti|tadi|bisa|akan|harus|ingin|mau|let's|lets|we|i|you|they|think|guess|maybe|please)\b/i;
const plausible=(label:string)=>!!label&&label.split(/\s+/).length<=5&&!CHATTY.test(label);
// One implausible name discredits the whole statement, so drop it entirely.
function guard(commands:DiagramCommand[]):DiagramCommand[]{
  const names=commands.flatMap(c=>
    c.type==="ADD_NODE"?[c.label]:
    c.type==="DELETE_NODE"?[c.target]:
    c.type==="CONNECT"||c.type==="DISCONNECT"?[c.from,c.to]:
    c.type==="RENAME_NODE"?[c.target,c.newLabel]:
    c.type==="SET_TECH"?[c.target,c.tech]:
    c.type==="BRANCH"?[c.from,...c.targets]:[]);
  return names.every(plausible)?commands:[];
}

// "A terhubung ke B dan B mengakses C" is two statements; "bercabang ke A dan B"
// is one. Only split on "dan" when each side carries its own verb.
const SEQUENCE=/,\s*(?:kemudian|lalu|terus|setelah itu|selanjutnya|berikutnya|then|after that)\s+/i;
function splitClauses(text:string):string[]{
  const parts=text.split(/\s+(?:dan|and)\s+/i).map(s=>s.trim()).filter(Boolean);
  const byConjunction=parts.length>1&&parts.every(p=>HAS_VERB.test(p))?parts:[text];
  // Only split a sequence when both halves stand on their own: "User ke CDN, lalu ke
  // Next.js" is one chain, and splitting it would strand "ke Next.js".
  return byConjunction.flatMap(clause=>{
    const halves=clause.split(SEQUENCE).map(x=>x.trim()).filter(Boolean);
    return halves.length>1&&halves.every(h=>parseClause(h).length>0)?halves:[clause];
  });
}

// "frontend sebaiknya tidak mengambil semuanya melalui application server" states what
// the design avoids. Drawing it would assert the opposite of what was said.
const NEGATED=/\b(?:tidak|jangan|bukan|tanpa|belum|hindari|avoid|never|not|no longer)\b/i;
// "Di luar flow utama, Frontend terhubung ke X" — scene-setting before the comma.
// Never applied to "dari …", where the opening phrase names the source node.
// A condition or purpose never names the subject, so it always goes ("Untuk offline
// atau unstable network, Browser bercabang ke …"). A place might ("Di CDN, request
// diteruskan ke Origin"), so it only goes when it mentions no node the parser knows.
const PREAMBLE=/^(?:(untuk|kalau|jika|ketika|saat|sementara|sedangkan|karena|agar|supaya|selain|misalnya|meskipun|walaupun)|(?:di|pada|dalam|setelah|sebelum|dengan|terakhir|pertama|berikutnya|selanjutnya|kemudian))\b[^,]{0,70},\s*/i;
const mentionsKnown=(text:string)=>{const low=text.toLowerCase();for(const label of kinds.keys())if(low.includes(label))return true;return false};
function parseClause(raw:string):DiagramCommand[]{
  let text=raw.trim();
  if(NEGATED.test(text))return[];
  // Only drop the opening phrase when it carries no statement of its own.
  const preamble=text.match(PREAMBLE);
  if(preamble&&!HAS_VERB.test(preamble[0])&&(preamble[1]||!mentionsKnown(preamble[0]))){
    const rest=text.slice(preamble[0].length).trim();
    if(HAS_VERB.test(rest))text=rest;
  }
  if(/^(undo|balik|batalkan( yang terakhir)?)$/i.test(text))return[{type:"UNDO"}];
  if(/^(redo|ulangi( lagi)?)$/i.test(text))return[{type:"REDO"}];
  // "hapus semua node", "bersihkan kanvas", "clear all" wipe everything; the object is
  // required, so a stray "clear" picked up from conversation cannot erase the diagram.
  if(CLEAR_ALL.test(text.replace(PARTICLE,"").trim()))return[{type:"CLEAR"}];
  let m=text.match(new RegExp(`^(?:(?:putuskan|lepaskan|disconnect|unlink)|(?:${DEL_WORDS})\\s+(?:(?:semua|seluruh|all)\\s+)?(?:koneksi|connection|edge|link))\\s+`+`(?:koneksi\\s+)?(?:dari\\s+|from\\s+)?(.+?)\\s+(?:dari|from|ke|to)\\s+(.+)$`,"i"));
  if(m)return[{type:"DISCONNECT",from:clean(m[1]),to:clean(m[2])}];
  m=text.match(new RegExp(`^(?:${DEL_WORDS})\\s+(.+)$`,"i"));
  if(m)return[{type:"DELETE_NODE",target:clean(m[1])}];
  m=text.match(/^(?:ganti|ubah|rename)\s+(.+?)\s+(?:jadi|menjadi|to)\s+(.+)$/i);
  if(m)return[{type:"RENAME_NODE",target:clean(m[1]),newLabel:clean(m[2])}];
  m=text.match(/^(.+?)\s+(?:(?:bercabang|terpecah|terbagi|dibagi|dipecah)\s+(?:ke dalam|menjadi|jadi|ke)|branch(?:es)?\s+(?:into|to)|splits?\s+into)\s+(.+)$/i);
  // A branch target carrying its own verb is the next statement, not a target:
  // "bercabang ke unit test, kemudian terhubung ke build" lists four tests, not five.
  if(m){const from=term(m[1]),targets=m[2].split(/\s+(?:dan|and|atau|or)\s+|,/i).filter(seg=>!LINK.test(seg)).map(term).filter(t=>t.label);
    return[{type:"BRANCH",from:from.label,targets:targets.map(t=>t.label)},...techOf([from,...targets])]}
  // "saya mulai dari User", "kita mulai dengan Browser" — the opener names a real node.
  m=text.match(/^(?:(?:saya|aku|kita|kami|we|i)\s+)?(?:mulai|memulai|start|starting|begin)\s+(?:dari|dengan|with|from|at)\s+(.+)$/i);
  if(m)return LINK.test(m[1])?chain(m[1]):[{type:"ADD_NODE",label:clean(m[1])}];
  m=text.match(new RegExp(`^(?:${ADD_WORDS})\\s+(.+)$`,"i"));
  if(m){if(LINK.test(m[1]))return chain(m[1]);
    const added=m[1].split(/\s+(?:dan|and)\s+|,/i).map(term).filter(t=>t.label);
    return[...added.map(t=>({type:"ADD_NODE",label:t.label}) as DiagramCommand),...techOf(added)]}
  m=text.match(/^(?:dari|from|melalui|lewat|via)\s+(.+)$/i);
  if(m&&LINK.test(m[1]))return chain(m[1]);
  if(LINK.test(text))return chain(text.replace(/^(?:connect|sambungkan|hubungkan|sambung|hubung)\s+/i,""));
  // Last resort: "Frontend Application misalnya menggunakan Next.js" annotates a node
  // without connecting anything. Harmless when the node does not exist — the store
  // ignores a SET_TECH whose target it cannot find.
  const described=term(text);
  if(described.tech)return[{type:"SET_TECH",target:described.label,tech:described.tech}];
  return[];
}

// "User terhubung ke CDN lalu ke Next.js" -> consecutive CONNECTs. A step may name
// several nodes ("terhubung ke Database dan Object Storage"), which fans out.
const PROTOCOL=/^(?:https?|tls|ssl|tcp|udp|json|xml)$/i;
function chain(phrase:string):DiagramCommand[]{
  const steps=phrase.split(LINK)
    .map(part=>part.split(/\s+(?:dan|and)\s+/i).map(term).filter(t=>t.label&&!PROTOCOL.test(t.label)))
    .filter(step=>step.length);
  const links=steps.slice(0,-1).flatMap((from,i)=>
    from.flatMap(a=>steps[i+1].map(b=>({type:"CONNECT",from:a.label,to:b.label}) as DiagramCommand)));
  return[...links,...techOf(steps.flat())];
}
const techOf=(terms:Term[]):DiagramCommand[]=>
  terms.filter(t=>t.tech).map(t=>({type:"SET_TECH",target:t.label,tech:t.tech!}));
