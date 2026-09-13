import { VOCABULARY, DIAGRAM_KINDS, type DiagramKind } from "./diagram.ts";

export type Preview =
  | { shape: "single"; nodes: [string] }
  | { shape: "chain"; nodes: string[] }
  | { shape: "branch"; nodes: string[] };

export type Recipe = { goal: string; say: string[]; result: string; preview: Preview };
export type Trouble = { problem: string; fix: string };

export type Guide = {
  title: string; tagline: string; back: string;
  stepsTitle: string; steps: { title: string; body: string }[];
  recipesTitle: string; recipesLede: string; recipes: Recipe[];
  sayLabel: string; resultLabel: string;
  wordsTitle: string; wordsLede: string; groups: Record<DiagramKind, string>;
  freeform: string;
  tipsTitle: string; tips: string[];
  troubleTitle: string; trouble: Trouble[];
  problemLabel: string; fixLabel: string;
};

// Every sentence under `say` is asserted by tests/guide.test.ts to really work,
// so the guide can never teach a phrase the parser ignores.
export const guide: Record<"id" | "en", Guide> = {
  id: {
    title: "Panduan Singkat",
    tagline: "Gambar arsitektur cukup dengan bicara. Tidak ada tombol yang perlu dihafal.",
    back: "Kembali ke kanvas",
    stepsTitle: "Tiga langkah untuk mulai",
    steps: [
      { title: "Izinkan mikrofon", body: "Saat aplikasi dibuka, browser akan bertanya. Pilih Izinkan. Bila sudah terlanjur ditolak, buka pengaturan situs di browser dan izinkan mikrofon." },
      { title: "Ucapkan satu kalimat", body: "Bicara biasa saja, lalu berhenti sejenak. Contohnya: “tambahkan Redis”. Tidak perlu menekan apa pun." },
      { title: "Kotak muncul sendiri", body: "Diagram langsung berubah. Bila hasilnya keliru, ucapkan “batalkan” untuk kembali seperti semula." },
    ],
    recipesTitle: "Yang bisa Anda ucapkan",
    recipesLede: "Tujuh hal ini sudah cukup untuk menggambar hampir semua arsitektur. Klik contohnya untuk menyalin.",
    sayLabel: "Ucapkan",
    resultLabel: "Yang terjadi",
    recipes: [
      { goal: "Membuat kotak baru", result: "Satu kotak baru muncul. Warnanya menyesuaikan jenisnya sendiri.",
        say: ["tambahkan Redis", "bikin Auth Service", "tambahkan API Gateway"],
        preview: { shape: "single", nodes: ["Redis"] } },
      { goal: "Menghubungkan dua kotak", result: "Muncul panah dari kotak pertama ke kotak kedua. Kotak yang belum ada dibuatkan otomatis.",
        say: ["User terhubung ke CDN", "CDN mengakses Web", "BFF memanggil Redis"],
        preview: { shape: "chain", nodes: ["User", "CDN"] } },
      { goal: "Menyambung berantai", result: "Beberapa panah sekaligus, mengikuti urutan yang Anda sebut.",
        say: ["dari User ke CDN lalu ke Next js", "User ke CDN lalu ke BFF terus ke Redis"],
        preview: { shape: "chain", nodes: ["User", "CDN", "Next.js"] } },
      { goal: "Bercabang ke beberapa tujuan", result: "Satu kotak sumber menembak ke beberapa kotak tujuan sekaligus.",
        say: ["BFF bercabang ke Redis dan GraphQL"],
        preview: { shape: "branch", nodes: ["BFF", "Redis", "GraphQL"] } },
      { goal: "Mengganti nama", result: "Nama kotak berubah, semua panahnya tetap tersambung.",
        say: ["ganti BFF jadi Backend API", "ubah CDN menjadi Cloudflare"],
        preview: { shape: "single", nodes: ["Backend API"] } },
      { goal: "Menghapus", result: "Kotak hilang beserta panahnya. Untuk membuang panahnya saja, sebut kata “koneksi”.",
        say: ["hapus Redis", "buang CDN", "hapus koneksi User ke CDN"],
        preview: { shape: "single", nodes: ["Redis"] } },
      { goal: "Membatalkan", result: "Kembali ke keadaan sebelumnya. Bisa diulang sampai 100 langkah ke belakang.",
        say: ["batalkan", "ulangi"],
        preview: { shape: "single", nodes: ["…"] } },
    ],
    wordsTitle: "Kata yang sudah dikenali",
    wordsLede: "Nama-nama ini dirapikan otomatis. Ucapkan seperti biasa — “next js” menjadi Next.js, “post gres” menjadi PostgreSQL. Warna titik menunjukkan warna kotaknya di kanvas.",
    groups: {
      client: "Pengguna & perangkat",
      edge: "Jaringan & gerbang",
      app: "Aplikasi & tampilan",
      service: "Layanan & pihak ketiga",
      data: "Penyimpanan & antrian",
    },
    freeform: "Nama lain tetap boleh. “tambahkan Legacy Billing” akan membuat kotak bernama Legacy Billing, walau kata itu tidak ada di daftar.",
    tipsTitle: "Agar lebih mudah dikenali",
    tips: [
      "Satu kalimat, lalu jeda sebentar. Kalimat panjang yang menyambung sulit dipisah.",
      "Sebut nama teknologi apa adanya: “next js”, “graph ql”, “be ef ef”, “post gres”.",
      "Obrolan biasa diabaikan. Anda aman berdiskusi tanpa diagram ikut berubah.",
      "Kata sopan seperti “tolong” atau “coba” boleh saja, tidak mengganggu.",
      "Bila mikrofon sedang tidak bisa dipakai, ketik saja perintahnya di kolom kanan bawah.",
      "Simpan hasilnya lewat Desain tersimpan agar bisa dibuka lagi nanti di browser yang sama.",
    ],
    troubleTitle: "Kalau belum berhasil",
    problemLabel: "Keluhan",
    fixLabel: "Yang perlu dilakukan",
    trouble: [
      { problem: "Tulisan “Izin mikrofon ditolak”", fix: "Buka ikon gembok di address bar browser, izinkan mikrofon, lalu tekan tombol Coba lagi." },
      { problem: "Sudah bicara tapi diagram diam saja", fix: "Kemungkinan kalimatnya belum berbentuk perintah. Coba mulai dengan kata “tambahkan”, atau pakai kata “ke” di antara dua nama." },
      { problem: "Nama kotaknya jadi kepanjangan", fix: "Sebut nama yang pendek. Nama lebih dari lima kata sengaja ditolak agar obrolan tidak ikut tergambar." },
      { problem: "Kotaknya dobel dengan nama mirip", fix: "Nama dicocokkan persis, tetapi huruf besar-kecil diabaikan. Ucapkan “ganti” untuk menyeragamkan namanya." },
      { problem: "Salah ucap dan terlanjur tergambar", fix: "Ucapkan “batalkan”. Kalau ingin mengulanginya lagi, ucapkan “ulangi”." },
      { problem: "Kalimatnya sudah benar tapi garisnya tidak muncul", fix: "Buka Editor manual di bar bawah. Di sana kotak, garis, dan garis putus-putus bisa dibuat sendiri tanpa menebak kalimat." },
    ],
  },
  en: {
    title: "Quick Guide",
    tagline: "Draw architecture by talking. There are no buttons to memorise.",
    back: "Back to canvas",
    stepsTitle: "Three steps to start",
    steps: [
      { title: "Allow the microphone", body: "Your browser asks when the app opens. Choose Allow. If you already declined, open the site settings in your browser and allow the microphone." },
      { title: "Say one sentence", body: "Speak normally, then pause. For example: “add Redis”. Nothing to press." },
      { title: "The box appears", body: "The diagram updates immediately. If it came out wrong, say “undo” to put it back." },
    ],
    recipesTitle: "What you can say",
    recipesLede: "These seven cover almost any architecture. Click an example to copy it.",
    sayLabel: "Say",
    resultLabel: "What happens",
    recipes: [
      { goal: "Create a new box", result: "One new box appears. Its colour follows what kind of thing it is.",
        say: ["add Redis", "create Auth Service", "add API Gateway"],
        preview: { shape: "single", nodes: ["Redis"] } },
      { goal: "Connect two boxes", result: "An arrow appears from the first box to the second. Missing boxes are created for you.",
        say: ["User connects to CDN", "CDN accesses Web", "BFF calls Redis"],
        preview: { shape: "chain", nodes: ["User", "CDN"] } },
      { goal: "Chain several hops", result: "Several arrows at once, following the order you said them.",
        say: ["from User to CDN then to Next js", "User to CDN then to BFF"],
        preview: { shape: "chain", nodes: ["User", "CDN", "Next.js"] } },
      { goal: "Branch to several targets", result: "One source box points at several targets at the same time.",
        say: ["BFF branches to Redis and GraphQL"],
        preview: { shape: "branch", nodes: ["BFF", "Redis", "GraphQL"] } },
      { goal: "Rename", result: "The box gets a new name and keeps every arrow attached.",
        say: ["rename BFF to Backend API", "rename CDN to Cloudflare"],
        preview: { shape: "single", nodes: ["Backend API"] } },
      { goal: "Delete", result: "The box and its arrows disappear. To remove only an arrow, say the word “connection”.",
        say: ["delete Redis", "remove CDN", "delete connection User to CDN"],
        preview: { shape: "single", nodes: ["Redis"] } },
      { goal: "Undo", result: "Back to how it was. You can step back up to 100 times.",
        say: ["undo", "redo"],
        preview: { shape: "single", nodes: ["…"] } },
    ],
    wordsTitle: "Words already recognised",
    wordsLede: "These names are tidied up for you. Say them normally — “next js” becomes Next.js, “post gres” becomes PostgreSQL. The dot colour matches the box colour on the canvas.",
    groups: {
      client: "People & devices",
      edge: "Network & gateways",
      app: "Apps & interfaces",
      service: "Services & third parties",
      data: "Storage & queues",
    },
    freeform: "Any other name works too. “add Legacy Billing” creates a box called Legacy Billing even though it is not on the list.",
    tipsTitle: "Getting recognised more easily",
    tips: [
      "One sentence, then a short pause. Long run-on sentences are hard to split.",
      "Say technology names plainly: “next js”, “graph ql”, “be ef ef”, “post gres”.",
      "Ordinary conversation is ignored, so you can discuss freely without the diagram changing.",
      "Polite words like “please” are fine and get stripped automatically.",
      "If the microphone is unavailable, just type the command in the box at the bottom right.",
      "Save your work under Saved designs so you can open it again later in the same browser.",
    ],
    troubleTitle: "If it is not working",
    problemLabel: "Problem",
    fixLabel: "What to do",
    trouble: [
      { problem: "It says “Microphone permission denied”", fix: "Open the padlock icon in the address bar, allow the microphone, then press Try again." },
      { problem: "You spoke but nothing happened", fix: "The sentence probably was not a command. Start with “add”, or put “to” between two names." },
      { problem: "The box name came out too long", fix: "Use a short name. Names longer than five words are rejected on purpose so conversation is not drawn." },
      { problem: "Duplicate boxes with similar names", fix: "Names match exactly, though upper and lower case are ignored. Say “rename” to make them consistent." },
      { problem: "You misspoke and it was drawn", fix: "Say “undo”. To put it back again, say “redo”." },
      { problem: "The sentence was right but no line appeared", fix: "Open the Manual editor in the bottom bar. Boxes, lines and dashed lines can all be drawn there by hand." },
    ],
  },
};

export const wordsByKind = (kind: DiagramKind) =>
  VOCABULARY.filter(v => v.kind === kind).map(v => v.label);
export const guideKinds = DIAGRAM_KINDS;
