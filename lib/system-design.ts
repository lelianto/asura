// FE System Design interview material, kept as data so the canvas can draw it
// and the test suite can prove every technique is actually drawable.
//
// The point of this file is the *mapping*, not the list: an interviewer states a
// non-functional requirement, and you answer requirement → technique → trade-off.

export type Bucket =
  | "performance" | "scalability" | "reliability" | "security"
  | "accessibility" | "maintainability" | "observability" | "compatibility";

// The eight buckets, in the order worth reciting.
export const BUCKETS: { key: Bucket; id: string; en: string }[] = [
  { key: "performance",     id: "Performance",     en: "Performance" },
  { key: "scalability",     id: "Scalability",     en: "Scalability" },
  { key: "reliability",     id: "Reliability",     en: "Reliability" },
  { key: "security",        id: "Security",        en: "Security" },
  { key: "accessibility",   id: "Accessibility",   en: "Accessibility" },
  { key: "maintainability", id: "Maintainability", en: "Maintainability" },
  { key: "observability",   id: "Observability",   en: "Observability" },
  { key: "compatibility",   id: "Compatibility",   en: "Compatibility" },
];

// Requirement → Design → Trade-off, as five steps with the questions to ask.
export const MENTAL_MODEL: { step: number; id: string; en: string; asks: { id: string; en: string }[] }[] = [
  { step: 1, id: "Requirements", en: "Requirements", asks: [
    { id: "User siapa?", en: "Who are the users?" },
    { id: "Flow utama apa?", en: "What is the main flow?" },
    { id: "Scale berapa?", en: "What scale?" },
    { id: "Device dan network bagaimana?", en: "What devices and networks?" },
    { id: "Performance, reliability, security, SEO?", en: "Performance, reliability, security, SEO?" },
  ]},
  { step: 2, id: "Architecture", en: "Architecture", asks: [
    { id: "Struktur component atau feature", en: "Component or feature structure" },
    { id: "Rendering strategy", en: "Rendering strategy" },
    { id: "State management", en: "State management" },
    { id: "Data fetching", en: "Data fetching" },
    { id: "Caching", en: "Caching" },
  ]},
  { step: 3, id: "Quality", en: "Quality", asks: [
    { id: "Performance", en: "Performance" }, { id: "Reliability", en: "Reliability" },
    { id: "Security", en: "Security" }, { id: "Accessibility", en: "Accessibility" },
    { id: "Observability", en: "Observability" },
  ]},
  { step: 4, id: "Scale", en: "Scale", asks: [
    { id: "CDN", en: "CDN" }, { id: "Pagination", en: "Pagination" },
    { id: "Virtualization", en: "Virtualization" }, { id: "Code splitting", en: "Code splitting" },
    { id: "Caching", en: "Caching" },
  ]},
  { step: 5, id: "Trade-off", en: "Trade-off", asks: [
    { id: "Kenapa saya memilih A dibanding B?", en: "Why did I choose A over B?" },
    { id: "Apa yang saya korbankan?", en: "What am I giving up?" },
    { id: "Kapan pilihan ini berhenti masuk akal?", en: "When does this choice stop making sense?" },
  ]},
];

// The ten pairs worth memorising when there is no time for anything else.
export const PAIRS: { trigger: string; answer: string[] }[] = [
  { trigger: "SEO",                       answer: ["SSR", "SSG"] },
  { trigger: "Static Content",            answer: ["SSG", "CDN"] },
  { trigger: "Frequently Changing Data",  answer: ["ISR", "Revalidation"] },
  { trigger: "Personalized",              answer: ["SSR", "CSR"] },
  { trigger: "Huge List",                 answer: ["Virtualization"] },
  { trigger: "Realtime Search",           answer: ["Debounce"] },
  { trigger: "Slow Network",              answer: ["Browser Cache", "Small Bundle"] },
  { trigger: "Low End Device",            answer: ["Minimal Hydration", "Code Splitting"] },
  { trigger: "API Failure",               answer: ["Retry", "Fallback UI"] },
  { trigger: "Realtime",                  answer: ["WebSocket", "SSE"] },
];

export type Row = {
  node: string;            // what gets drawn on the canvas
  id: string; en: string;  // how it is phrased to a reader
  bucket: Bucket;
  focus: { id: string; en: string };
  techniques: string[];    // every one of these must be drawable
};

// Interviewer states a requirement → this is the shape of a good answer.
export const CHEATSHEET: Row[] = [
  { node: "Fast Initial Load", id: "Load awal cepat", en: "Fast initial load", bucket: "performance",
    focus: { id: "Kurangi JS dan resource awal", en: "Reduce initial JS and resources" },
    techniques: ["SSR", "SSG", "Code Splitting", "Lazy Loading", "Tree Shaking"] },
  { node: "LCP", id: "LCP cepat", en: "Fast LCP", bucket: "performance",
    focus: { id: "Prioritaskan konten above-the-fold", en: "Prioritise above-the-fold content" },
    techniques: ["Preload", "Image Optimization", "CDN", "SSR"] },
  { node: "INP", id: "INP rendah", en: "Low INP", bucket: "performance",
    focus: { id: "Jangan blokir main thread", en: "Do not block the main thread" },
    techniques: ["Web Worker", "Debounce", "Virtualization"] },
  { node: "CLS", id: "CLS rendah", en: "Low CLS", bucket: "performance",
    focus: { id: "Pesan ruang sebelum resource muncul", en: "Reserve space before resources land" },
    techniques: ["Image Optimization", "Skeleton", "Font Optimization"] },
  { node: "Instant UI", id: "UI terasa instan", en: "Instant-feeling UI", bucket: "performance",
    focus: { id: "Perbarui UI sebelum server selesai", en: "Update the UI before the server finishes" },
    techniques: ["Optimistic Update", "Stale Data"] },
  { node: "Small Bundle", id: "Bundle kecil", en: "Small bundle size", bucket: "performance",
    focus: { id: "Kirim JS sesuai kebutuhan", en: "Ship only the JS you need" },
    techniques: ["Dynamic Import", "Code Splitting", "Tree Shaking", "Bundle Analyzer"] },
  { node: "Memory Efficient", id: "Hemat memori", en: "Memory efficient", bucket: "performance",
    focus: { id: "Batasi data dan component aktif", en: "Limit active data and components" },
    techniques: ["Virtualization", "Pagination", "Cache Eviction"] },

  { node: "Huge Traffic", id: "Traffic sangat besar", en: "Very high traffic", bucket: "scalability",
    focus: { id: "Kurangi request ke origin", en: "Reduce requests reaching the origin" },
    techniques: ["CDN", "Edge Caching", "ISR", "Browser Cache"] },
  { node: "Huge List", id: "List atau data sangat besar", en: "Huge lists or datasets", bucket: "scalability",
    focus: { id: "Jangan render semuanya", en: "Do not render everything" },
    techniques: ["Pagination", "Infinite Scroll", "Virtualization"] },
  { node: "Global Audience", id: "Pengguna tersebar global", en: "Globally distributed users", bucket: "scalability",
    focus: { id: "Dekatkan resource ke pengguna", en: "Move resources closer to the user" },
    techniques: ["CDN", "Edge Rendering"] },
  { node: "Cost Efficient", id: "Hemat biaya", en: "Cost efficient", bucket: "scalability",
    focus: { id: "Kurangi compute dan bandwidth origin", en: "Cut origin compute and bandwidth" },
    techniques: ["CDN", "ISR", "SSG", "Image Optimization"] },
  { node: "Realtime Search", id: "Search realtime", en: "Realtime search", bucket: "scalability",
    focus: { id: "Hindari request tiap ketukan", en: "Avoid a request per keystroke" },
    techniques: ["Debounce", "AbortController", "Browser Cache"] },

  { node: "Unstable Network", id: "Jaringan tidak stabil", en: "Unstable network", bucket: "reliability",
    focus: { id: "Pulih otomatis", en: "Recover automatically" },
    techniques: ["Retry", "Exponential Backoff", "Timeout", "AbortController"] },
  { node: "API Failure", id: "API sering gagal", en: "Flaky API", bucket: "reliability",
    focus: { id: "Turun kelas dengan anggun", en: "Degrade gracefully" },
    techniques: ["Error Boundary", "Fallback UI", "Stale Data", "Graceful Degradation"] },
  { node: "Offline", id: "Dukungan offline", en: "Offline support", bucket: "reliability",
    focus: { id: "Simpan resource penting secara lokal", en: "Keep key resources locally" },
    techniques: ["Service Worker", "Cache API", "IndexedDB"] },
  { node: "Frequently Changing Data", id: "Data sering berubah", en: "Frequently changing data", bucket: "reliability",
    focus: { id: "Jaga server state tetap sinkron", en: "Keep server state in sync" },
    techniques: ["TanStack Query", "SWR", "Revalidation", "Polling"] },
  { node: "Realtime", id: "Realtime", en: "Realtime", bucket: "reliability",
    focus: { id: "Server mendorong ke client", en: "The server pushes to the client" },
    techniques: ["WebSocket", "SSE"] },
  { node: "Safe Deployment", id: "Deployment aman", en: "Safe deployment", bucket: "reliability",
    focus: { id: "Bisa rilis dan rollback dengan aman", en: "Release and roll back safely" },
    techniques: ["CI/CD", "Feature Flags", "Canary Rollout"] },
  { node: "Reliable Release", id: "Rilis tanpa regresi", en: "Regression-free releases", bucket: "reliability",
    focus: { id: "Tangkap regresi sebelum production", en: "Catch regressions before production" },
    techniques: ["E2E Test", "Visual Regression"] },

  { node: "Secure", id: "Aman", en: "Secure", bucket: "security",
    focus: { id: "Kecilkan attack surface di FE", en: "Shrink the front-end attack surface" },
    techniques: ["HttpOnly Cookie", "CSP", "Sanitization", "CSRF Token"] },
  { node: "Role Based Access", id: "Akses berbasis peran", en: "Role-based access", bucket: "security",
    focus: { id: "Batasi UI dan route — tetap ditegakkan di backend", en: "Gate UI and routes — still enforced on the backend" },
    techniques: ["RBAC", "Route Guard"] },

  { node: "Accessible", id: "Dapat diakses semua orang", en: "Accessible to everyone", bucket: "accessibility",
    focus: { id: "Semua orang bisa memakai UI", en: "Everyone can operate the UI" },
    techniques: ["Semantic HTML", "Keyboard Navigation", "ARIA"] },

  { node: "Many FE Teams", id: "Banyak tim frontend", en: "Many front-end teams", bucket: "maintainability",
    focus: { id: "Kurangi coupling antar-feature", en: "Reduce coupling between features" },
    techniques: ["Design System", "Monorepo"] },
  { node: "Reusable UI", id: "UI yang dipakai ulang", en: "Reusable UI", bucket: "maintainability",
    focus: { id: "Standardisasi component", en: "Standardise components" },
    techniques: ["Design System"] },
  { node: "Maintainable", id: "Mudah dirawat", en: "Maintainable", bucket: "maintainability",
    focus: { id: "Pisahkan tanggung jawab", en: "Separate concerns" },
    techniques: ["Design System", "Monorepo", "Feature Flags"] },

  { node: "Observable", id: "Masalah user terlihat", en: "User problems are visible", bucket: "observability",
    focus: { id: "Ketahui masalah user di production", en: "Know what users hit in production" },
    techniques: ["Sentry", "RUM", "Web Vitals", "Structured Logging"] },

  { node: "SEO", id: "SEO penting", en: "SEO matters", bucket: "compatibility",
    focus: { id: "HTML harus tersedia untuk crawler", en: "HTML must exist for crawlers" },
    techniques: ["SSR", "SSG", "ISR", "Metadata", "Semantic HTML", "Sitemap"] },
  { node: "Slow Network", id: "Jaringan lambat", en: "Slow network", bucket: "compatibility",
    focus: { id: "Kurangi transfer dan jumlah request", en: "Cut transfer size and request count" },
    techniques: ["Compression", "Browser Cache", "Image Optimization", "Prefetch"] },
  { node: "Low End Device", id: "Perangkat kelas bawah", en: "Low-end devices", bucket: "compatibility",
    focus: { id: "Kurangi kerja browser", en: "Give the browser less work" },
    techniques: ["Code Splitting", "Lazy Loading", "Virtualization", "Minimal Hydration"] },
  { node: "Multi Language", id: "Banyak bahasa", en: "Multiple languages", bucket: "compatibility",
    focus: { id: "UI tidak mengunci satu bahasa", en: "The UI is not hard-coded to one language" },
    techniques: ["i18n", "Locale Routing"] },
  { node: "Backward Compatible", id: "FE lama tetap jalan", en: "Old clients keep working", bucket: "compatibility",
    focus: { id: "FE lama tidak langsung rusak", en: "Older front ends do not break at once" },
    techniques: ["API Versioning", "Feature Flags"] },
];

// What is worth memorising, and what is not. The left column is the framework;
// the right column is detail you can look up.
export const MEMORISE: { learn: string; skip: string }[] = [
  { learn: "Functional vs non-functional requirements", skip: "Daftar 30 pertanyaan requirement" },
  { learn: "Flow: Requirement → Design → Trade-off", skip: "Jawaban system design kata-per-kata" },
  { learn: "Enam pertanyaan requirement inti", skip: "Semua kemungkinan edge case" },
  { learn: "SSR vs SSG vs ISR vs CSR dan kapan dipakai", skip: "Detail internal Next.js yang sangat spesifik" },
  { learn: "Local vs global vs server state", skip: "Semua API Zustand/Redux" },
  { learn: "Cache → revalidation → invalidation", skip: "Semua konfigurasi React Query" },
  { learn: "Pagination vs infinite scroll vs virtualization", skip: "Syntax library virtualization" },
  { learn: "Debounce vs throttle", skip: "Implementasi dari nol kalau lupa syntax" },
  { learn: "WebSocket vs SSE vs polling", skip: "Detail protokol level rendah" },
  { learn: "Retry, timeout, fallback, graceful degradation", skip: "Angka retry/backoff persis" },
  { learn: "Code splitting, lazy loading, CDN", skip: "Semua konfigurasi webpack" },
  { learn: "LCP, CLS, INP beserta penyebab dan solusinya", skip: "Threshold angka Core Web Vitals persis" },
  { learn: "XSS, CSRF, dasar auth dan token", skip: "Detail cryptography" },
  { learn: "Dasar accessibility", skip: "Seluruh WCAG" },
  { learn: "Error Boundary dan monitoring", skip: "Semua API Sentry" },
  { learn: "Trade-off dari setiap keputusan besar", skip: "Nama tools sebanyak-banyaknya" },
];

// One worked example of the answer shape the interviewer is listening for.
export const WORKED_EXAMPLE = {
  prompt: {
    id: "Platform ini dipakai 10 juta siswa, mayoritas mobile, banyak di jaringan lambat.",
    en: "Ten million students use this platform, mostly on mobile, many on slow networks.",
  },
  weak: { id: "Saya akan pakai Next.js.", en: "I'll use Next.js." },
  strong: [
    { need: "Scale", answer: ["CDN", "Edge Caching", "ISR"] },
    { need: "Slow Network", answer: ["Compression", "Image Optimization", "Small Bundle"] },
    { need: "Low End Device", answer: ["Minimal Hydration", "Code Splitting"] },
    { need: "Reliability", answer: ["Retry", "Stale Data", "Graceful Degradation"] },
    { need: "Observability", answer: ["RUM", "Web Vitals"] },
  ],
  closing: {
    id: "Baru setelah itu Next.js disebut — sebagai salah satu cara mengeksekusi keputusan di atas, bukan sebagai jawabannya.",
    en: "Only then does Next.js come up — as one way to execute those decisions, not as the answer itself.",
  },
};

// Turning a cheatsheet row into something the canvas can draw.
export const rowToStatement = (row: Row) =>
  `${row.node} bercabang ke ${row.techniques.join(" dan ")}`;
