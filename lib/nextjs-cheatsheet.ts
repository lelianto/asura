export type Localized = { id: string; en: string };

export type NextPattern = {
  key: string;
  need: Localized;
  code: string;
  place: Localized;
  model: Localized;
  note?: Localized;
  detail?: string;
};

// Kept as data so the compact reference and the expandable explanations never drift apart.
export const NEXT_PATTERNS: NextPattern[] = [
  { key:"static", need:{id:"Data statis / jarang berubah",en:"Static / rarely changing data"}, code:'fetch(url, { cache: "force-cache" })', place:{id:"Server Component",en:"Server Component"}, model:{id:"Jarang berubah → cache",en:"Rarely changes → cache"}, note:{id:"Ini mengatur Data Cache. Apakah seluruh route statis juga dipengaruhi API dinamis dan konfigurasi route.",en:"This controls the Data Cache. Whether the whole route is static also depends on dynamic APIs and route configuration."} },
  { key:"revalidate", need:{id:"Data berubah berkala",en:"Periodically changing data"}, code:"fetch(url, { next: { revalidate: 60 } })", place:{id:"Server Component",en:"Server Component"}, model:{id:"Cache → segarkan setelah interval",en:"Cache → refresh after an interval"}, note:{id:"Angka adalah umur cache maksimum dalam detik; bisa juga invalidasi on-demand dengan tag.",en:"The number is the maximum cache lifetime in seconds; tag-based on-demand invalidation is also available."} },
  { key:"dynamic", need:{id:"Data personal / harus segar",en:"Personalized / always-fresh data"}, code:'fetch(url, { cache: "no-store" })', place:{id:"Server Component",en:"Server Component"}, model:{id:"Per request → ambil data baru",en:"Per request → fetch fresh data"}, note:{id:"Jangan menyamakan satu opsi fetch dengan keseluruhan strategi route; API request-time juga dapat membuat route dinamis.",en:"Do not equate one fetch option with the entire route strategy; request-time APIs can also make a route dynamic."} },
  { key:"rsc", need:{id:"Ambil data tanpa kirim JS ekstra",en:"Fetch data without extra client JS"}, code:"export default async function Page() {\n  const data = await getData()\n  return <Product data={data} />\n}", place:{id:"app/products/page.tsx",en:"app/products/page.tsx"}, model:{id:"Tanpa “use client” → Server Component",en:"No “use client” → Server Component"} },
  { key:"client", need:{id:"State, event, effect, browser API",en:"State, events, effects, browser APIs"}, code:'"use client"\n\nexport function BuyButton() {\n  return <button onClick={handleBuy}>Buy</button>\n}', place:{id:"Leaf component interaktif",en:"Interactive leaf component"}, model:{id:"Dorong batas client sedekat mungkin ke daun",en:"Push the client boundary as far down as possible"}, note:{id:"Jangan jadikan seluruh page Client Component hanya karena satu tombol perlu event handler.",en:"Do not turn an entire page into a Client Component because one button needs an event handler."} },
  { key:"streaming", need:{id:"Bagian lambat tidak memblokir halaman",en:"A slow section should not block the page"}, code:"<Suspense fallback={<Skeleton />}>\n  <SlowSection />\n</Suspense>", place:{id:"Page / Server Component",en:"Page / Server Component"}, model:{id:"Kirim shell dulu, isi menyusul",en:"Send the shell first, stream content later"} },
  { key:"lazy", need:{id:"Komponen berat belum dibutuhkan",en:"Heavy component is not needed yet"}, code:'const Chart = dynamic(() => import("./Chart"))', place:{id:"Page / component pemakai",en:"Consuming page / component"}, model:{id:"Belum perlu → muat nanti",en:"Not needed now → load later"} },
  { key:"image", need:{id:"Gambar responsif tanpa layout shift",en:"Responsive images without layout shift"}, code:'<Image src="/hero.jpg" width={800} height={500} alt="…" />', place:{id:"Component",en:"Component"}, model:{id:"Dimensi dipesan → CLS berkurang",en:"Reserve dimensions → reduce CLS"}, note:{id:"Untuk gambar hero/LCP, jangan asal lazy-load; prioritaskan resource above-the-fold yang benar-benar penting.",en:"Do not blindly lazy-load a hero/LCP image; prioritize genuinely important above-the-fold resources."} },
  { key:"error", need:{id:"Gagal tanpa menjatuhkan seluruh app",en:"Fail without taking down the whole app"}, code:'"use client"\n\nexport default function Error() {\n  return <p>Something went wrong.</p>\n}', place:{id:"app/dashboard/error.tsx",en:"app/dashboard/error.tsx"}, model:{id:"Boundary dekat fitur → blast radius kecil",en:"Boundary near the feature → smaller blast radius"}, note:{id:"Pasangkan dengan loading.tsx di route segment yang sama untuk state loading instan.",en:"Pair it with loading.tsx in the same route segment for an instant loading state."} },
  { key:"timeout", need:{id:"Request tidak menggantung",en:"Requests must not hang"}, code:"fetch(API, {\n  signal: AbortSignal.timeout(5000),\n})", place:{id:"Fetch / service layer",en:"Fetch / service layer"}, model:{id:"Batasi waktu → fallback atau retry",en:"Bound the wait → fallback or retry"} },
  { key:"debounce", need:{id:"Search tidak memanggil API tiap ketukan",en:"Search should not call the API per keystroke"}, code:"useEffect(() => {\n  const id = setTimeout(() => search(query), 300)\n  return () => clearTimeout(id)\n}, [query])", place:{id:"Client Component",en:"Client Component"}, model:{id:"Ketik → tunggu → cari",en:"Type → wait → search"}, note:{id:"Untuk request yang sudah berjalan, tambahkan AbortController agar hasil lama tidak menimpa hasil baru.",en:"For in-flight requests, add an AbortController so stale results cannot overwrite newer ones."} },
  { key:"csp", need:{id:"Batasi sumber script dan resource",en:"Restrict script and resource origins"}, code:'"Content-Security-Policy": "default-src \'self\'"', place:{id:"next.config.ts / Proxy / server response",en:"next.config.ts / Proxy / server response"}, model:{id:"Server kirim policy → browser menegakkan",en:"Server sends policy → browser enforces"}, note:{id:"Contoh ini hanya titik awal. CSP production perlu directive yang sesuai asset, script, nonce, dan koneksi aplikasi.",en:"This is only a starting point. A production CSP needs directives matching the app's assets, scripts, nonces, and connections."} },
  { key:"cookie", need:{id:"Session cookie lebih aman",en:"Safer session cookies"}, code:"const store = await cookies()\nstore.set(\"session\", token, {\n  httpOnly: true, secure: true,\n  sameSite: \"lax\", path: \"/\",\n})", place:{id:"Server Action / Route Handler",en:"Server Action / Route Handler"}, model:{id:"HttpOnly + Secure + SameSite",en:"HttpOnly + Secure + SameSite"}, note:{id:"Cookie membantu, tetapi authorization tetap harus diperiksa di server pada setiap aksi sensitif.",en:"Cookies help, but authorization must still be checked on the server for every sensitive action."} },
  { key:"bff", need:{id:"API yang cocok untuk kebutuhan UI",en:"An API shaped for the UI"}, code:"// app/api/products/route.ts\nexport async function GET() {\n  const data = await backend()\n  return Response.json(data)\n}", place:{id:"app/api/.../route.ts",en:"app/api/.../route.ts"}, model:{id:"Browser → Next.js BFF → services",en:"Browser → Next.js BFF → services"}, note:{id:"Cocok untuk agregasi/transformasi data dan credential server-side; bukan alasan untuk menduplikasi seluruh backend.",en:"Useful for aggregation, transformation, and server-side credentials; not a reason to duplicate the entire backend."} },
];

export const NEXT_QUICK_GROUPS: { title: Localized; items: string[] }[] = [
  { title:{id:"Infrastructure",en:"Infrastructure"}, items:["DNS", "HTTPS / TLS", "CDN routing"] },
  { title:{id:"Next.js",en:"Next.js"}, items:["Cache", "Rendering", "RSC", "Streaming", "Metadata", "Route Handler"] },
  { title:{id:"Browser",en:"Browser"}, items:["DOM", "CSSOM", "Render Tree", "Layout", "Paint", "Composite"] },
  { title:{id:"React",en:"React"}, items:["Client boundary", "Hydration", "Interaction", "Optimistic UI"] },
  { title:{id:"Optimasi kode",en:"Code optimization"}, items:["Lazy loading", "Image", "Font", "Debounce", "Retry", "Virtualization", "Web Vitals"] },
  { title:{id:"Security",en:"Security"}, items:["CSP", "Secure cookie", "CSRF / server validation"] },
];

export type Tradeoff = {
  area: Localized;
  left: string;
  right: string;
  tension: Localized;
};

export const TRADEOFFS: Tradeoff[] = [
  {area:{id:"Rendering",en:"Rendering"},left:"SSG",right:"SSR",tension:{id:"Kecepatan dan mudah di-cache vs data segar dan personal",en:"Speed and cacheability vs fresh, personalized data"}},
  {area:{id:"Rendering",en:"Rendering"},left:"SSG",right:"ISR",tension:{id:"Kesederhanaan statis vs pembaruan berkala",en:"Static simplicity vs periodic freshness"}},
  {area:{id:"Rendering",en:"Rendering"},left:"SSR",right:"CSR",tension:{id:"HTML awal dan SEO vs interaksi yang berpusat di client",en:"Initial HTML and SEO vs client-led interactivity"}},
  {area:{id:"Komponen",en:"Components"},left:"RSC",right:"Client Component",tension:{id:"JS dan hydration lebih sedikit vs interaktivitas",en:"Less JS and hydration vs interactivity"}},
  {area:{id:"Data fetching",en:"Data fetching"},left:"Parallel",right:"Sequential",tension:{id:"Lebih cepat vs menjaga dependensi antar-request",en:"Speed vs handling request dependencies"}},
  {area:{id:"Response",en:"Response"},left:"Streaming",right:"Wait all",tension:{id:"UI awal lebih cepat vs implementasi lebih sederhana",en:"Faster initial UI vs simpler implementation"}},
  {area:{id:"Caching",en:"Caching"},left:"Cache",right:"Fresh data",tension:{id:"Performa dan skalabilitas vs freshness",en:"Performance and scalability vs freshness"}},
  {area:{id:"CDN",en:"CDN"},left:"Cache hit",right:"Origin request",tension:{id:"Respons cepat vs response paling baru",en:"Fast response vs latest response"}},
  {area:{id:"JavaScript",en:"JavaScript"},left:"Code splitting",right:"Single bundle",tension:{id:"JS awal lebih kecil vs lebih sedikit chunk/request",en:"Smaller initial JS vs fewer chunks and requests"}},
  {area:{id:"Loading",en:"Loading"},left:"Lazy",right:"Eager",tension:{id:"Load awal cepat vs langsung tersedia",en:"Fast initial load vs immediate availability"}},
  {area:{id:"Prefetch",en:"Prefetch"},left:"Prefetch",right:"On-demand",tension:{id:"Navigasi cepat vs hemat bandwidth",en:"Fast navigation vs lower bandwidth use"}},
  {area:{id:"Hydration",en:"Hydration"},left:"Less client JS",right:"More client JS",tension:{id:"Performa vs interaktivitas",en:"Performance vs interactivity"}},
  {area:{id:"List besar",en:"Large lists"},left:"Virtualization",right:"Render all",tension:{id:"Render lebih ringan vs kompleksitas tambahan",en:"Faster rendering vs added complexity"}},
  {area:{id:"Search",en:"Search"},left:"Debounce",right:"Immediate",tension:{id:"Request lebih sedikit vs respons tertunda",en:"Fewer requests vs delayed response"}},
  {area:{id:"Mutation",en:"Mutation"},left:"Optimistic",right:"Wait server",tension:{id:"UX terasa cepat vs rollback lebih rumit",en:"Fast-feeling UX vs rollback complexity"}},
  {area:{id:"Failure",en:"Failure"},left:"Retry",right:"Fail fast",tension:{id:"Peluang pulih vs tambahan latency dan load",en:"Recovery chance vs extra latency and load"}},
  {area:{id:"Failure",en:"Failure"},left:"Stale cache",right:"Fresh fetch",tension:{id:"Availability vs freshness",en:"Availability vs freshness"}},
  {area:{id:"Gambar",en:"Images"},left:"Quality",right:"Small size",tension:{id:"Kualitas visual vs LCP dan bandwidth",en:"Visual quality vs LCP and bandwidth"}},
  {area:{id:"Security",en:"Security"},left:"Strict CSP",right:"Flexible CSP",tension:{id:"Perlindungan lebih kuat vs fleksibilitas pihak ketiga",en:"Stronger protection vs third-party flexibility"}},
  {area:{id:"Observability",en:"Observability"},left:"More monitoring",right:"Less monitoring",tension:{id:"Visibilitas masalah vs overhead dan biaya",en:"Issue visibility vs overhead and cost"}},
];
