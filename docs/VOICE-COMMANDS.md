# asuradraw — Referensi Perintah Suara

**Versi parser** `1.0` · **Bahasa** Bahasa Indonesia, English · **Status** stabil

Ucapkan keputusan arsitektur; sistem menggambarkannya. Dokumen ini adalah
referensi lengkap untuk tata bahasa perintah, kosakata yang dikenali, aturan
penolakan, dan API program.

---

## Daftar Isi

1. [Mulai Cepat](#mulai-cepat)
2. [Konsep](#konsep)
3. [Pipeline Pemrosesan Ucapan](#pipeline-pemrosesan-ucapan)
4. [Referensi Perintah](#referensi-perintah)
5. [Referensi Kosakata](#referensi-kosakata)
6. [Aturan Penolakan](#aturan-penolakan)
7. [API Program](#api-program)
8. [Tool MCP](#tool-mcp)
9. [Pengujian](#pengujian)

---

## Mulai Cepat

```
npm run install:ci     # sekali, instal terkunci
npm run dev            # server pengembangan, port 5173
npm test               # 90 test (butuh Node >= 22.13)
```

Buka aplikasi, izinkan mikrofon, lalu ucapkan:

```
"tambahkan API Gateway"
"dari pengguna ke CDN lalu ke next js"
"BFF bercabang ke Redis dan GraphQL"
```

Tanpa mikrofon, gunakan kolom ketik di kanan bawah atau klik chip pada panel
**COBA UCAPKAN**. Keduanya melewati parser yang sama persis.

---

## Konsep

| Istilah | Arti |
|---|---|
| **Node** | Satu kotak pada kanvas. Diidentifikasi oleh **label**, bukan posisi. |
| **Label** | Nama node. Pencocokan bersifat *case-insensitive* dan harus unik. |
| **Kind** | Klasifikasi node yang menentukan warnanya: `client`, `edge`, `app`, `service`, `data`. Disimpulkan dari kosakata; default `service`. |
| **Tech** | Anotasi teknologi opsional yang tampil di bawah label. |
| **Edge** | Koneksi berarah dari satu node ke node lain. Duplikat diabaikan. |
| **Statement** | Satu kalimat ucapan. Bisa menghasilkan nol, satu, atau banyak perintah. |

**Node dibuat otomatis.** Perintah `CONNECT` dan `BRANCH` membuat node yang belum
ada, jadi `"User ke CDN"` pada kanvas kosong menghasilkan dua node dan satu edge.

**Riwayat dibatasi 100 langkah.** Perintah yang tidak mengubah apa pun tidak
membuat langkah undo.

---

## Pipeline Pemrosesan Ucapan

Setiap ucapan melewati tujuh tahap sebelum menjadi perintah.

```
transkrip mentah
   │
   ├─ 1. Perbaikan STT ......... "tehubung" → "terhubung"
   ├─ 2. Normalisasi kosakata .. "next js" → "Next.js"
   ├─ 3. Peluruhan gagap ....... "user user" → "User"
   ├─ 4. Pelucutan sufiks ...... "BFF-nya" → "BFF"
   ├─ 5. Pelucutan filler ...... "oke jadi begini, …" → "…"
   ├─ 6. Pemisahan klausa ...... "A ke B dan C ke D" → dua statement
   └─ 7. Pencocokan aturan ..... → DiagramCommand[]
                                   │
                                   └─ 8. Guard kelayakan → [] jika tidak layak
```

### 1. Perbaikan STT

Pengenal suara rutin menjatuhkan huruf dari kata kerja penghubung. Bentuk berikut
diperbaiki sebelum aturan apa pun dijalankan.

| Terdengar sebagai | Diperbaiki menjadi |
|---|---|
| `tehubung`, `terhubun`, `terhbung` | `terhubung` |
| `ngakses`, `ngakse`, `mengakse` | `mengakses` |
| `manggil`, `memangil`, `manggilin` | `memanggil` |
| `nyambung`, `sambungin`, `hubungin` | `sambungkan` |
| `tambahin`, `nambahin`, `tambakan` | `tambahkan` |
| `bercabag`, `becabang` | `bercabang` |

### 3–4. Peluruhan gagap dan sufiks

`"user user user ke CDN"` → `"User ke CDN"`. Kata identik berurutan diruntuhkan
berulang hingga stabil. Sufiks `-nya` dibuang: `"BFF-nya"` → `"BFF"`.

### 5. Pelucutan filler

Diulang selama masih cocok, sehingga filler bertumpuk tertangani.

> `kalau begitu` · `ya sudah` · `yaudah` · `di sini` · `sebentar` · `selanjutnya`
> · `basically` · `alright` · `sekarang` · `begini` · `bentar` · `tolong` · `okay`
> · `baik` · `coba` · `gini` · `jadi` · `lalu` · `mungkin` · `kemudian` · `terus`
> · `please` · `right` · `then` · `well` · `anu` · `nah` · `yah` · `hmm` · `emm`
> · `mm` · `um` · `uh` · `eh` · `oke` · `ok` · `so` · `ya`

Frasa niat juga dilucuti: `aku|saya|kita|kami|gue|we|i` + `mau|ingin|pengen|akan|want to|wanna|need to`.

Partikel di akhir label dibuang: `dong` · `sih` · `deh` · `aja` · `saja` · `kok`
· `lah` · `kan` · `ya` · `itu` · `ini` · `tuh` · `nih` · `nya` · `kita` · `kami`.

### 6. Pemisahan klausa

`dan` / `and` memisah dua pernyataan **hanya bila kedua sisi punya kata kerja
sendiri**. Ini menjaga daftar target `BRANCH` tetap utuh.

| Ucapan | Hasil |
|---|---|
| `A ke B dan C ke D` | dua `CONNECT` — kedua sisi punya `ke` |
| `BFF bercabang ke Redis dan GraphQL` | satu `BRANCH` — `GraphQL` tidak punya kata kerja |
| `tambahkan Redis dan hapus CDN` | `ADD_NODE` + `DELETE_NODE` |
| `tambahkan Redis dan GraphQL` | dua `ADD_NODE` — daftar nama pada satu perintah |

---

## Referensi Perintah

Aturan dicoba **berurutan**; yang pertama cocok menang. Urutan ini penting:
`hapus koneksi A ke B` diuji sebelum `hapus A`, sehingga tidak salah menghapus node.

### `ADD_NODE`

Membuat node baru. Diam saja bila label sudah ada.

```
{ type: "ADD_NODE", label: string }
```

| | |
|---|---|
| **Sintaks ID** | `(tambahkan\|tambah\|buat\|buatkan\|bikin\|bikinin\|pasang\|taruh) <label>` |
| **Sintaks EN** | `(add\|create) <label>` |
| **Banyak node** | Pisahkan dengan `dan` / `and` / koma |
| **Idempoten** | Ya — label yang sudah ada tidak diduplikasi |

```
"tambahkan API Gateway"              → ADD_NODE "API Gateway"
"bikin Auth Service"                 → ADD_NODE "Auth Service"
"tambahkan Redis dan GraphQL"        → ADD_NODE "Redis", ADD_NODE "GraphQL"
"add Load Balancer"                  → ADD_NODE "Load Balancer"
```

> **Catatan.** Bila label mengandung kata penghubung, perintah berubah menjadi
> rantai koneksi: `"tambahkan Redis ke BFF"` → `CONNECT Redis → BFF` (kedua node
> dibuat otomatis).

### `CONNECT`

Menghubungkan dua node secara berarah. Node yang belum ada akan dibuat.

```
{ type: "CONNECT", from: string, to: string }
```

| | |
|---|---|
| **Sintaks** | `[dari\|from] <A> <penghubung> <B> [<penghubung> <C> …]` |
| **Prefiks opsional** | `connect` · `sambungkan` · `hubungkan` · `sambung` · `hubung` |
| **Rantai** | Sambung dengan `lalu` · `kemudian` · `terus` · `then` |
| **Idempoten** | Ya — edge yang sudah ada tidak diduplikasi |
| **Self-loop** | Ditolak diam-diam (`A ke A` tidak menghasilkan edge) |

**Kata penghubung yang dikenali**

| Indonesia | English |
|---|---|
| `ke` · `terhubung ke` · `terhubung dengan` · `tersambung ke` · `menuju` · `menuju ke` · `mengakses` · `akses` · `memanggil` · `panggil` · `mengirim ke` · `kirim ke` · `meneruskan ke` · `diteruskan ke` · `masuk melalui` · `masuk lewat` · `masuk ke` · `melalui` · `lewat` · `via` | `to` · `connects to` · `connect to` · `connected to` · `accesses` · `access` · `calls` · `call` · `sends to` · `routes to` · `forwards to` · `hits` · `hit` · `queries` · `query` |

```
"User terhubung ke CDN"                      → CONNECT User → CDN
"dari Mobile App ke BFF lalu ke Redis"       → CONNECT Mobile App → BFF
                                               CONNECT BFF → Redis
"Next js manggil graph ql"                   → CONNECT Next.js → GraphQL
"CDN accesses Web"                           → CONNECT CDN → Web
"User ke CDN lalu ke Next js terus ke BFF"   → tiga CONNECT berurutan
```

### `BRANCH`

Menghubungkan satu sumber ke beberapa target sekaligus.

```
{ type: "BRANCH", from: string, targets: string[] }
```

| | |
|---|---|
| **Sintaks ID** | `<A> bercabang ke <B> dan <C>[, <D>…]` |
| **Sintaks EN** | `<A> branches to <B> and <C>` |
| **Pemisah target** | `dan` · `and` · koma |

```
"BFF bercabang ke Redis dan GraphQL"   → BRANCH BFF → [Redis, GraphQL]
"BFF branches to Redis and PostgreSQL" → BRANCH BFF → [Redis, PostgreSQL]
```

### `DISCONNECT`

Menghapus satu edge tanpa menyentuh node.

```
{ type: "DISCONNECT", from: string, to: string }
```

| | |
|---|---|
| **Sintaks ID** | `(putuskan\|lepaskan) [koneksi] <A> (dari\|ke) <B>` |
| | `(hapus\|buang\|hilangkan) (koneksi\|edge\|link) <A> ke <B>` |
| **Sintaks EN** | `(disconnect\|unlink) <A> (from\|to) <B>` |
| | `(delete\|remove) (connection\|edge\|link) <A> to <B>` |
| **Node hilang** | Tidak ada perubahan; bukan error |

```
"putuskan User dari CDN"          → DISCONNECT User → CDN
"hapus koneksi CDN ke Next js"    → DISCONNECT CDN → Next.js
"delete connection User to CDN"   → DISCONNECT User → CDN
```

### `DELETE_NODE`

Menghapus node beserta seluruh edge yang menyentuhnya.

```
{ type: "DELETE_NODE", target: string }
```

| | |
|---|---|
| **Sintaks ID** | `(hapus\|hapuskan\|buang\|hilangkan\|singkirkan) <label>` |
| **Sintaks EN** | `(delete\|remove) <label>` |
| **Label tidak ada** | Tidak ada perubahan; tidak membuat langkah undo |

```
"hapus Redis"       → DELETE_NODE "Redis"
"buang CDN aja"     → DELETE_NODE "CDN"
"remove Nginx"      → DELETE_NODE "Nginx"
```

### `RENAME_NODE`

Mengganti label node; seluruh edge tetap utuh.

```
{ type: "RENAME_NODE", target: string, newLabel: string }
```

| | |
|---|---|
| **Sintaks ID** | `(ganti\|ubah) <lama> (jadi\|menjadi) <baru>` |
| **Sintaks EN** | `rename <lama> to <baru>` |
| **Tabrakan nama** | **Ditolak.** Label baru yang sudah dipakai node lain akan membuat pencocokan ambigu, jadi perintah diabaikan. |

```
"ganti BFF jadi Backend API"           → RENAME_NODE BFF → "Backend API"
"ubah local storage menjadi Redis"     → RENAME_NODE "Local Storage" → "Redis"
"rename CDN to Cloudflare"             → RENAME_NODE CDN → "Cloudflare"
```

### `SET_TECH`

Mencatat teknologi sebuah node tanpa mengubah namanya. Selalu menyertai perintah
lain; tidak pernah berdiri sendiri.

```
{ type: "SET_TECH", target: string, tech: string }
```

| | |
|---|---|
| **Sintaks ID** | `<label> (terbuat dari\|terbuat dengan\|dibuat dari\|dibuat dengan\|dibangun dengan\|dibangun di atas\|berbasis\|pakai\|memakai\|menggunakan) <tech>` |
| **Sintaks EN** | `<label> (built with\|built on\|made with\|made of\|written in\|using\|powered by) <tech>` |
| **Tampilan** | Baris kecil di bawah label node |

```
"tambahkan Web terbuat dari next js"
  → ADD_NODE "Web", SET_TECH Web = "Next.js"

"CDN mengakses Web terbuat dari Next js"
  → CONNECT CDN → Web, SET_TECH Web = "Next.js"

"tambahkan Dashboard memakai tan stack query"
  → ADD_NODE "Dashboard", SET_TECH Dashboard = "TanStack Query"
```

### `UNDO` / `REDO`

Harus berdiri sendiri sebagai satu ucapan penuh.

```
{ type: "UNDO" }   { type: "REDO" }
```

| | |
|---|---|
| **Sintaks UNDO** | `undo` · `balik` · `batalkan` · `batalkan yang terakhir` |
| **Sintaks REDO** | `redo` · `ulangi` · `ulangi lagi` |
| **Kedalaman** | 100 langkah; snapshot terlama dibuang |
| **Perilaku** | Perintah baru mengosongkan tumpukan redo |

---

## Referensi Kosakata

163 entri, 649 bentuk ucapan. Setiap bentuk diverifikasi oleh sapuan uji otomatis
(`tests/vocabulary.test.ts`) yang mengenumerasi seluruh string yang dapat dicocokkan
tiap pola, lalu memastikan hasil normalisasinya sama dengan label kanonik.

**Nama di luar kosakata tetap diterima apa adanya.** `"tambahkan Legacy Billing"`
membuat node `Legacy Billing` dengan kind `service`.

#### `client` — Titik masuk manusia atau perangkat.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `User` | `user` · `users` · `pengguna` · `pemakai` |
| `Mobile App` | `mobile app` · `aplikasi mobile` · `aplikasi seluler` · `apikasi hp` · `aplikasi hp` |
| `iOS App` | `ios app` · `i os app` · `aplikasi ios` · `aplikasi i os` |
| `Android App` | `android app` · `aplikasi android` |
| `Desktop App` | `desktop app` · `aplikasi desktop` |
| `Browser` | `browser` · `peramban` |

#### `edge` — Lapisan jaringan di depan aplikasi.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `CDN` | `cdn` · `si di en` |
| `API Gateway` | `api gateway` · `ai gateway` · `gerbang api` |
| `Load Balancer` | `loadbalancer` · `loadbalanser` · `load balancer` · `load balanser` · `lodbalancer` · `lodbalanser` · `lod balancer` · `lod balanser` · `penyeimbang beban` |
| `Reverse Proxy` | `reverse proxy` · `proxy balik` |
| `Nginx` | `nginx` · `enginex` · `engine x` · `enjineks` · `enjin eks` |
| `Cloudflare` | `cloudflare` · `cloud flare` |
| `Vercel` | `vercel` · `versel` |
| `DNS` | `dns` · `di en es` |
| `Firewall` | `waf` · `firewall` · `tembok api` |

#### `app` — Lapisan aplikasi dan antarmuka.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `Frontend` | `frontend application` · `frontend app` · `aplikasi frontend` · `frontend` · `front end` |
| `Next.js Server` | `nextjs server` · `nextj s server` · `nextgs server` · `nextg s server` · `nextjees server` · `nextje es server` · `nextjies server` · `nextji es server` · `nextjes server` · `nextges server` · `next js server` · `next j s server` · `next gs server` · `next g s server` · `next jees server` · `next je es server` · `next jies server` · `next ji es server` · `next jes server` · `next ges server` · `next.js server` · `next.j s server` · `next.gs server` · `next.g s server` · `next.jees server` · `next.je es server` · `next.jies server` · `next.ji es server` · `next.jes server` · `next.ges server` · `next. js server` · `next. j s server` · `next. gs server` · `next. g s server` · `next. jees server` · `next. je es server` · `next. jies server` · `next. ji es server` · `next. jes server` · `next. ges server` · `next .js server` · `next .j s server` · `next .gs server` · `next .g s server` · `next .jees server` · `next .je es server` · `next .jies server` · `next .ji es server` · `next .jes server` · `next .ges server` · `next . js server` · `next . j s server` · `next . gs server` · `next . g s server` · `next . jees server` · `next . je es server` · `next . jies server` · `next . ji es server` · `next . jes server` · `next . ges server` · `server nextjs` · `server nextj s` · `server nextgs` · `server nextg s` · `server next js` · `server next j s` · `server next gs` · `server next g s` · `server next.js` · `server next.j s` · `server next.gs` · `server next.g s` · `server next. js` · `server next. j s` · `server next. gs` · `server next. g s` · `server next .js` · `server next .j s` · `server next .gs` · `server next .g s` · `server next . js` · `server next . j s` · `server next . gs` · `server next . g s` |
| `Next.js` | `nextjs` · `nextj s` · `nextgs` · `nextg s` · `nextjees` · `nextje es` · `nextjies` · `nextji es` · `nextjes` · `nextges` · `next js` · `next j s` · `next gs` · `next g s` · `next jees` · `next je es` · `next jies` · `next ji es` · `next jes` · `next ges` · `next.js` · `next.j s` · `next.gs` · `next.g s` · `next.jees` · `next.je es` · `next.jies` · `next.ji es` · `next.jes` · `next.ges` · `next. js` · `next. j s` · `next. gs` · `next. g s` · `next. jees` · `next. je es` · `next. jies` · `next. ji es` · `next. jes` · `next. ges` · `next .js` · `next .j s` · `next .gs` · `next .g s` · `next .jees` · `next .je es` · `next .jies` · `next .ji es` · `next .jes` · `next .ges` · `next . js` · `next . j s` · `next . gs` · `next . g s` · `next . jees` · `next . je es` · `next . jies` · `next . ji es` · `next . jes` · `next . ges` |
| `TanStack Query` | `tanstack query` · `tan stack query` · `react query` · `tanstack` |
| `Service Worker` | `service worker` |
| `Admin Panel` | `admin panel` · `panel admin` |
| `Dashboard` | `dashboard` · `dasbor` |
| `Web Server` | `web server` · `peladen web` |
| `React` | `react` · `riakt` |
| `Vue` | `vue` · `vues` · `vuej` · `vuejs` · `vue s` · `vue j` · `vue js` · `vyu` |
| `Svelte` | `svelte` · `sfelt` |
| `Angular` | `angular` · `anggular` |

#### `service` — Layanan komputasi dan pihak ketiga.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `BFF` | `bff` · `bf f` · `b ff` · `b f f` · `beefef` · `beef ef` · `be efef` · `be ef ef` |
| `Backend API` | `backend api` · `api backend` |
| `Backend Service` | `backend service` · `backend services` · `layanan backend` · `servis backend` |
| `REST API` | `restapi` · `rest api` · `restfulapi` · `restful api` · `rest fulapi` · `rest ful api` · `res api` |
| `GraphQL` | `graphql` · `graph ql` · `grafkiuel` |
| `WebSocket` | `websocket` · `web socket` · `websoket` |
| `gRPC` | `grpc` · `geerpisi` · `geerpi si` · `geer pisi` · `geer pi si` · `ge erpisi` · `ge erpi si` · `ge er pisi` · `ge er pi si` · `jiarpisi` · `jiarpi si` · `jiar pisi` · `jiar pi si` · `ji arpisi` · `ji arpi si` · `ji ar pisi` · `ji ar pi si` |
| `Auth Service` | `auth service` · `layanan autentikasi` · `layanan otentikasi` · `servis auth` |
| `Payment Service` | `payment service` · `layanan pembayaran` |
| `Notification Service` | `notification service` · `layanan notifikasi` |
| `Search Service` | `search service` · `layanan pencarian` |
| `Cron Job` | `cron job` · `kron job` · `penjadwal tugas` |
| `Cloud Function` | `cloud function` · `cloud functions` · `fungsi cloud` |
| `Lambda` | `lambda` · `aws lambda` |
| `Kubernetes` | `kubernetes` · `kubernetis` · `kubernet` · `k8s` · `kube` |
| `Docker` | `docker` · `doker` |
| `Microservice` | `microservice` · `microservices` · `mikroservis` · `layanan mikro` |
| `Monolith` | `monolith` · `monolit` |
| `Firebase` | `firebase` · `fire base` |
| `Supabase` | `supabase` · `supa base` |
| `Stripe` | `stripe` · `straip` |
| `Observability` | `observability` · `observability layer` · `observabilitas` |
| `Sentry` | `sentry` · `sentri` |
| `Prometheus` | `prometheus` · `prometeus` |
| `Grafana` | `grafana` · `grafanna` |

#### `data` — Penyimpanan, cache, dan antrian.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `Redis` | `redis` · `redhis` |
| `PostgreSQL` | `postgres` · `postgresql` · `post gres` · `post gresql` · `postgre` |
| `MySQL` | `mysql` · `mysq l` · `mys ql` · `mys q l` · `my sql` · `my sq l` · `my s ql` · `my s q l` · `mai es kiu el` |
| `MongoDB` | `mongo di bi` · `mongo` · `mongodb` · `mongo db` |
| `Elasticsearch` | `elasticsearch` · `elastic search` · `elastiksearch` · `elastik search` |
| `Kafka` | `kafka` · `kafkha` |
| `RabbitMQ` | `rabbitmq` · `rabbitemkyu` · `rabbitem kyu` · `rabbitemq` · `rabbitem q` · `rabbit mq` · `rabbit emkyu` · `rabbit em kyu` · `rabbit emq` · `rabbit em q` |
| `Message Queue` | `message queue` · `antrian pesan` |
| `Object Storage` | `object storage` · `penyimpanan objek` |
| `Data Warehouse` | `datawarehouse` · `data warehouse` · `gudang data` |
| `Local Storage` | `local storage` · `penyimpanan lokal` |
| `S3` | `s3` · `s 3` · `estiga` · `estri` · `esthree` · `es tiga` · `es tri` · `es three` |
| `Database` | `database` · `basis data` |
| `Cache` | `cache` · `tembolok` |

#### `requirement` — Non-functional requirement yang disebut interviewer.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `Global Audience` | `global users` · `pengguna global` · `audiens global` |
| `Fast Initial Load` | `fast initial load` · `load awal cepat` · `initial load` |
| `LCP` | `lcp` · `elsipi` · `elsi pi` · `el sipi` · `el si pi` · `largest contentful paint` |
| `INP` | `inp` · `aienpi` · `aien pi` · `ai enpi` · `ai en pi` · `interaction to next paint` |
| `CLS` | `cls` · `sieles` · `siel es` · `si eles` · `si el es` · `cumulative layout shift` |
| `Small Bundle` | `small bundle` · `bundle kecil` · `ukuran bundle` |
| `Memory Efficient` | `memory efficient` · `hemat memori` |
| `Huge Traffic` | `huge traffic` · `traffic besar` · `trafik besar` |
| `Huge List` | `huge list` · `list besar` · `data besar` · `daftar panjang` |
| `Cost Efficient` | `cost efficient` · `hemat biaya` |
| `Unstable Network` | `unstable network` · `jaringan tidak stabil` |
| `Slow Network` | `slow network` · `jaringan lambat` · `koneksi lambat` |
| `Low End Device` | `lowend device` · `low end device` · `perangkat lemah` · `hp kentang` |
| `API Failure` | `api failure` · `api gagal` · `api sering gagal` |
| `Offline` | `offline support` · `dukungan offline` · `offline` |
| `Safe Deployment` | `safe deployment` · `deployment aman` · `rilis aman` |
| `Reliable Release` | `reliable release` · `rilis andal` |
| `Role Based Access` | `rolebased access` · `role based access` · `akses berbasis peran` |
| `Backward Compatible` | `backward compatible` · `kompatibel mundur` |
| `Multi Language` | `multilanguage` · `multi language` · `multibahasa` · `multi bahasa` · `banyak bahasa` |
| `Many FE Teams` | `many fe teams` · `banyak tim fe` · `banyak tim` |
| `Reusable UI` | `reusable ui` · `ui reusable` · `komponen reusable` |
| `Maintainable` | `maintainable` · `mudah dirawat` |
| `Observable` | `observable` · `bisa dipantau` |
| `Accessible` | `accessible` · `aksesibel` |
| `Secure` | `secure` · `aman` |
| `SEO` | `seo` · `esio` · `esi o` · `es io` · `es i o` |
| `Realtime Search` | `realtime search` · `pencarian realtime` · `search realtime` |
| `Frequently Changing Data` | `frequently changing data` · `data sering berubah` |
| `Instant UI` | `instant ui` · `ui instan` · `terasa instan` |
| `Realtime` | `realtime` · `real time` · `waktu nyata` |

#### `technique` — Teknik yang dipakai untuk menjawab requirement.

| Label kanonik | Bentuk ucapan yang dikenali |
|---|---|
| `SSR` | `ssr` · `eseser` · `eses er` · `es eser` · `es es er` · `serverside rendering` · `server side rendering` |
| `SSG` | `ssg` · `esesji` · `eses ji` · `es esji` · `es es ji` · `staticsite generation` · `static site generation` |
| `ISR` | `isr` · `aieser` · `aies er` · `ai eser` · `ai es er` · `incremental static regeneration` |
| `CSR` | `csr` · `sieser` · `sies er` · `si eser` · `si es er` · `clientside rendering` · `client side rendering` |
| `Edge Rendering` | `edge rendering` · `render di edge` |
| `Code Splitting` | `codesplitting` · `code splitting` · `pemecahan kode` |
| `Lazy Loading` | `lazyloading` · `lazy loading` · `muat malas` |
| `Tree Shaking` | `treeshaking` · `tree shaking` |
| `Dynamic Import` | `dynamic import` · `impor dinamis` |
| `Bundle Analyzer` | `bundle analyzer` |
| `Image Optimization` | `image optimization` · `optimasi gambar` |
| `Preload` | `preload` · `pramuat` |
| `Prefetch` | `prefetch` · `praambil` · `pra ambil` |
| `Compression` | `compression` · `kompresi` |
| `Web Worker` | `webworker` · `web worker` |
| `Virtualization` | `virtualization` · `virtualisasi` · `windowing` |
| `Pagination` | `pagination` · `paginasi` · `halaman` |
| `Infinite Scroll` | `infinite scroll` · `scroll tak terbatas` |
| `Debounce` | `debounce` · `debons` |
| `Throttle` | `throttle` · `trotel` |
| `Skeleton` | `skeleton` · `kerangka muat` |
| `Font Optimization` | `font optimization` · `optimasi font` |
| `React Hydration` | `react hydration` · `hydration react` |
| `Minimal Hydration` | `minimal hydration` · `kurangi hydration` · `hydration` |
| `Cache API` | `cache api` |
| `IndexedDB` | `indexeddb` · `indexed db` · `indeksdb` · `indeks db` |
| `Browser Cache` | `browser cache` · `cache browser` |
| `Edge Caching` | `edge caching` · `cache di edge` |
| `Cache Eviction` | `cache eviction` · `pembersihan cache` |
| `Revalidation` | `revalidation` · `revalidasi` |
| `Polling` | `polling` · `pol ling` |
| `SSE` | `sse` · `esesi` · `eses i` · `es esi` · `es es i` · `serversent events` · `server sent events` |
| `Optimistic Update` | `optimistic update` · `update optimistik` |
| `SWR` | `swr` |
| `Retry` | `retry` · `coba ulang` |
| `Exponential Backoff` | `exponential backoff` · `backoff eksponensial` · `backoff` |
| `Timeout` | `timeout` · `batas waktu` |
| `AbortController` | `abortcontroller` · `abort controller` |
| `Error Boundary` | `error boundary` · `batas error` |
| `Fallback UI` | `fallback ui` · `ui cadangan` · `fallback` |
| `Graceful Degradation` | `graceful degradation` · `degradasi anggun` |
| `Stale Data` | `stale data` · `data basi` |
| `HttpOnly Cookie` | `httponly cookie` · `http only cookie` · `cookie httponly` · `cookie http only` |
| `CSP` | `csp` · `content security policy` |
| `Sanitization` | `sanitization` · `sanitasi` |
| `CSRF Token` | `csrftoken` · `csrf token` · `token csrf` · `csrf` |
| `RBAC` | `rbac` · `rolebased access control` · `role based access control` |
| `Route Guard` | `route guard` · `penjaga rute` |
| `Semantic HTML` | `semantic html` · `html semantik` |
| `Keyboard Navigation` | `keyboard navigation` · `navigasi keyboard` |
| `ARIA` | `aria` |
| `Metadata` | `metadata` · `meta data` |
| `Sitemap` | `sitemap` · `peta situs` |
| `i18n` | `i18n` · `internasionalisasi` · `internationalization` |
| `Locale Routing` | `locale routing` · `rute lokal` |
| `Design System` | `design system` · `sistem desain` |
| `Monorepo` | `monorepo` · `mono repo` |
| `Feature Flags` | `feature flag` · `feature flags` · `bendera fitur` |
| `Canary Rollout` | `canary rollout` · `rilis kenari` · `canary` |
| `CI/CD` | `cicd` · `ci cd` · `ci/cd` · `ci/ cd` · `ci /cd` · `ci / cd` |
| `API Versioning` | `api versioning` · `versi api` |
| `Structured Logging` | `structured logging` · `log terstruktur` |
| `Web Vitals` | `webvitals` · `web vitals` |
| `RUM` | `rum` · `real user monitoring` |
| `E2E Test` | `e2e` · `end to end test` · `tes e2e` |
| `Visual Regression` | `visual regression` |

---

## Aturan Penolakan

Mikrofon menyala terus, jadi percakapan biasa juga sampai ke parser. Ucapan
ditolak — menghasilkan `[]`, tanpa perubahan diagram — bila salah satu berlaku:

| Aturan | Alasan | Contoh yang ditolak |
|---|---|---|
| Tidak ada aturan yang cocok | Bukan perintah eksplisit | `"iya betul sekali"` |
| Sebuah nama > 5 kata | Nama arsitektur selalu pendek | `"kembali ke desain yang kita bahas kemarin sore"` |
| Sebuah nama mengandung penanda percakapan | Kata ganti tidak pernah jadi nama node | `"kita pindah ke bagian berikutnya"` |

**Penanda percakapan.** `saya` · `aku` · `kita` · `kami` · `anda` · `kamu` ·
`kalian` · `mereka` · `menurut` · `sepertinya` · `rasanya` · `mungkin` · `nanti` ·
`tadi` · `bisa` · `akan` · `harus` · `ingin` · `mau` · `let's` · `lets` · `we` ·
`i` · `you` · `they` · `think` · `guess` · `maybe` · `please`

Penolakan bersifat **seluruh pernyataan**: satu nama tidak layak membatalkan
semua perintah dari klausa itu, bukan hanya bagian yang bermasalah.

```
"kita pindah ke bagian berikutnya"                  → []
"menurut saya lebih baik kita kembali ke desain awal" → []
"let's move on to the next topic"                    → []
"nanti saya kirim ke kamu ya"                        → []
```

Ambang kepercayaan pengenal suara adalah **0.55**; hasil final di bawah itu
dibuang sebelum mencapai parser.

---

## API Program

### `lib/diagram.ts`

```ts
parseIntent(raw: string): DiagramCommand[]
```
Mengubah satu ucapan menjadi daftar perintah. Deterministik dan bebas efek
samping. Mengembalikan `[]` bila ucapan bukan perintah eksplisit.

```ts
normalize(raw: string): string
```
Menjalankan tahap 1–5 pipeline. **Idempoten** — `normalize(normalize(x)) === normalize(x)`
dijamin oleh uji untuk setiap label kanonik.

```ts
kindOf(label: string): NodeKind
```
Menyimpulkan klasifikasi node dari kosakata. Case-insensitive. Default `"service"`.

```ts
VOCABULARY: ReadonlyArray<{ label: string; kind: NodeKind }>
```
Permukaan kosakata publik, dipakai dokumen ini dan uji.

```ts
type NodeKind = "client" | "edge" | "app" | "service" | "data"

type DiagramCommand =
  | { type: "ADD_NODE";    label: string }
  | { type: "DELETE_NODE"; target: string }
  | { type: "CONNECT";     from: string; to: string }
  | { type: "DISCONNECT";  from: string; to: string }
  | { type: "RENAME_NODE"; target: string; newLabel: string }
  | { type: "SET_TECH";    target: string; tech: string }
  | { type: "BRANCH";      from: string; targets: string[] }
  | { type: "UNDO" }
  | { type: "REDO" }
```

### `lib/store.ts`

```ts
useDiagramStore.getState().execute(commands: DiagramCommand[]): boolean
```
Menerapkan perintah secara atomik. **Mengembalikan `true` hanya bila diagram
benar-benar berubah.** Perintah yang tidak mengubah apa pun tidak membuat langkah
undo, dan UI memakai nilai balik ini untuk memilih antara "Diterapkan" dan
"Tidak ada perubahan".

| Anggota | Tipe | Keterangan |
|---|---|---|
| `nodes` | `Node[]` | Node React Flow; `data.label`, `data.kind`, `data.tech` |
| `edges` | `Edge[]` | Edge berarah, teranimasi |
| `past` / `future` | `Snapshot[]` | Tumpukan riwayat, dibatasi 100 |
| `execute(c)` | `=> boolean` | Terapkan perintah; `false` bila tidak ada perubahan |
| `undo()` / `redo()` | `=> void` | Diam bila tumpukan kosong |
| `clear()` | `=> void` | Kosongkan kanvas; dapat di-undo; diam bila sudah kosong |

### `lib/speech.ts`

```ts
class WebSpeechProvider implements SpeechProvider {
  start(): Promise<void>              // menolak dengan Error("unsupported")
  stop(): Promise<void>
  subscribe(cb: (e: SpeechEvent) => void): () => void
  subscribeError(cb: (error: string, fatal: boolean) => void): () => void
  setLanguage(language: string): void // "id-ID" | "en-US"
}
```

Pengenalan berjalan `continuous` dengan hasil interim. Browser tetap mengakhiri
sesi saat hening, jadi provider memulai ulang otomatis dengan **backoff
eksponensial** (350 ms → 8 s, maksimum 8 percobaan).

| Error | `fatal` | Perilaku |
|---|---|---|
| `not-allowed`, `service-not-allowed` | ✔ | Berhenti; status UI → izin ditolak |
| `audio-capture`, `language-not-supported` | ✔ | Berhenti |
| `no-speech`, `aborted`, `network` | ✘ | Mulai ulang dengan backoff |
| `restart-limit` (sintetis) | ✔ | Menyerah setelah 8 percobaan beruntun |

### `lib/examples.ts`

```ts
examples: Record<"id" | "en", string[]>
```
Kalimat yang tampil pada panel **COBA UCAPKAN**. Uji memastikan setiap entri
benar-benar terparse, sehingga panel tidak pernah menampilkan kalimat yang
diabaikan parser.

---

## Tool MCP

Bila halaman berjalan di dalam host yang menyediakan `document.modelContext`,
workspace mendaftarkan satu tool.

```
apply_diagram_statement
```

Menerapkan satu pernyataan arsitektur eksplisit — Indonesia atau Inggris — ke
diagram yang terlihat, memakai parser deterministik yang sama.

**Input**

```json
{
  "type": "object",
  "properties": { "statement": { "type": "string" } },
  "required": ["statement"],
  "additionalProperties": false
}
```

**Output**

| Kondisi | Balasan |
|---|---|
| Berhasil | `{ "applied": true, "commandCount": number }` |
| Bukan perintah | `{ "applied": false, "reason": "No explicit diagram command detected" }` |
| Cocok tapi tidak mengubah | `{ "applied": false, "reason": "Command left the diagram unchanged" }` |
| `statement` kosong / bukan string | melempar `Error` |

Anotasi: `readOnlyHint: false`, `untrustedContentHint: false`. Registrasi
dibatalkan lewat `AbortController` saat komponen dilepas.

---

## Pengujian

```
npm test        # 90 test    (node --test, butuh Node >= 22.13)
npm run typecheck
npm run lint
```

| Berkas | Test | Cakupan |
|---|---|---|
| `tests/diagram.test.ts` | 14 | Tata bahasa dasar, Indonesia + Inggris |
| `tests/store.test.ts` | 16 | Mutasi graf, undo/redo, batas riwayat |
| `tests/speech.test.ts` | 9 | Error pengenal, backoff, batas restart |
| `tests/transcript.test.ts` | 16 | Transkrip berantakan, guard percakapan |
| `tests/pronunciation.test.ts` | 13 | Logat Indonesia, istilah Inggris |
| `tests/vocabulary.test.ts` | 17 | Integritas kosakata, sapuan 274 bentuk |
| `tests/documentation.test.ts` | 5 | Setiap contoh di dokumen ini tetap benar |

Uji kosakata mengenumerasi setiap string yang dapat dicocokkan oleh tiap pola,
lalu memastikan bentuk itu (a) dinormalisasi ke label kanoniknya dan (b) berfungsi
sebagai nama node di dalam perintah nyata. Sapuan inilah yang menemukan
`"mongo di bi"` menghasilkan `"MongoDBdi bi"` karena alternatif yang lebih pendek
cocok lebih dulu.
