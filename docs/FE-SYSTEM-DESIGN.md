# FE System Design — Kerangka Berpikir & Cheatsheet

> Jangan hafalkan teknologi. Hafalkan **kerangka berpikir** dan hubungan **problem → solusi**.

Materi ini bukan catatan mati: seluruh isinya tersimpan sebagai data di `lib/system-design.ts`,
dirender di halaman `/cheatsheet`, dan **bisa digambar langsung ke kanvas**. Setiap requirement
dan teknik di bawah sudah masuk kosakata parser suara, jadi bisa didikte maupun diklik.

Diverifikasi oleh `tests/system-design.test.ts`.

---

## 1. Perlu dihafal vs tidak

| Perlu dihafal | Tidak perlu dihafal |
|---|---|
| Functional vs non-functional requirements | Daftar 30 pertanyaan requirement |
| Flow: Requirement → Design → Trade-off | Jawaban system design kata-per-kata |
| Enam pertanyaan requirement inti | Semua kemungkinan edge case |
| SSR vs SSG vs ISR vs CSR dan kapan dipakai | Detail internal Next.js yang sangat spesifik |
| Local vs global vs server state | Semua API Zustand/Redux |
| Cache → revalidation → invalidation | Semua konfigurasi React Query |
| Pagination vs infinite scroll vs virtualization | Syntax library virtualization |
| Debounce vs throttle | Implementasi dari nol kalau lupa syntax |
| WebSocket vs SSE vs polling | Detail protokol level rendah |
| Retry, timeout, fallback, graceful degradation | Angka retry/backoff persis |
| Code splitting, lazy loading, CDN | Semua konfigurasi webpack |
| LCP, CLS, INP beserta penyebab dan solusinya | Threshold angka Core Web Vitals persis |
| XSS, CSRF, dasar auth dan token | Detail cryptography |
| Dasar accessibility | Seluruh WCAG |
| Error Boundary dan monitoring | Semua API Sentry |
| Trade-off dari setiap keputusan besar | Nama tools sebanyak-banyaknya |

---

## 2. Kerangka berpikir

Lima langkah, berurutan. Trade-off selalu jadi penutup.

**1. Requirements**
→ User siapa?  
→ Flow utama apa?  
→ Scale berapa?  
→ Device dan network bagaimana?  
→ Performance, reliability, security, SEO?

**2. Architecture**
→ Struktur component atau feature  
→ Rendering strategy  
→ State management  
→ Data fetching  
→ Caching

**3. Quality**
→ Performance  
→ Reliability  
→ Security  
→ Accessibility  
→ Observability

**4. Scale**
→ CDN  
→ Pagination  
→ Virtualization  
→ Code splitting  
→ Caching

**5. Trade-off**
→ Kenapa saya memilih A dibanding B?  
→ Apa yang saya korbankan?  
→ Kapan pilihan ini berhenti masuk akal?

> Bagian trade-off yang paling menunjukkan seniority:
> *"Berdasarkan requirement tadi, saya memilih X karena Y, tetapi trade-off-nya Z."*


---

## 3. Delapan bucket

Daripada menghafal 30 baris, ingat delapan kata ini:

**Performance → Scalability → Reliability → Security → Accessibility → Maintainability → Observability → Compatibility**

Dan polanya: **Requirement → Problem → Technique → Trade-off**


---

## 4. Sepuluh pasangan inti

Kalau waktunya sangat sedikit, ini saja yang dihafal.

| Kalau requirement-nya | Arahnya |
|---|---|
| **SEO** | `SSR` · `SSG` |
| **Static Content** | `SSG` · `CDN` |
| **Frequently Changing Data** | `ISR` · `Revalidation` |
| **Personalized** | `SSR` · `CSR` |
| **Huge List** | `Virtualization` |
| **Realtime Search** | `Debounce` |
| **Slow Network** | `Browser Cache` · `Small Bundle` |
| **Low End Device** | `Minimal Hydration` · `Code Splitting` |
| **API Failure** | `Retry` · `Fallback UI` |
| **Realtime** | `WebSocket` · `SSE` |

---

## 5. Requirement → teknik

Saat interviewer menyebut sebuah non-functional requirement, langsung punya arah solusi.
Kolom terakhir adalah kalimat yang bisa **diucapkan atau diketik** untuk menggambarnya.


### Performance

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Load awal cepat** | Kurangi JS dan resource awal | `SSR` · `SSG` · `Code Splitting` · `Lazy Loading` · `Tree Shaking` | `Fast Initial Load bercabang ke SSR dan SSG dan Code Splitting dan Lazy Loading dan Tree Shaking` |
| **LCP cepat** | Prioritaskan konten above-the-fold | `Preload` · `Image Optimization` · `CDN` · `SSR` | `LCP bercabang ke Preload dan Image Optimization dan CDN dan SSR` |
| **INP rendah** | Jangan blokir main thread | `Web Worker` · `Debounce` · `Virtualization` | `INP bercabang ke Web Worker dan Debounce dan Virtualization` |
| **CLS rendah** | Pesan ruang sebelum resource muncul | `Image Optimization` · `Skeleton` · `Font Optimization` | `CLS bercabang ke Image Optimization dan Skeleton dan Font Optimization` |
| **UI terasa instan** | Perbarui UI sebelum server selesai | `Optimistic Update` · `Stale Data` | `Instant UI bercabang ke Optimistic Update dan Stale Data` |
| **Bundle kecil** | Kirim JS sesuai kebutuhan | `Dynamic Import` · `Code Splitting` · `Tree Shaking` · `Bundle Analyzer` | `Small Bundle bercabang ke Dynamic Import dan Code Splitting dan Tree Shaking dan Bundle Analyzer` |
| **Hemat memori** | Batasi data dan component aktif | `Virtualization` · `Pagination` · `Cache Eviction` | `Memory Efficient bercabang ke Virtualization dan Pagination dan Cache Eviction` |

### Scalability

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Traffic sangat besar** | Kurangi request ke origin | `CDN` · `Edge Caching` · `ISR` · `Browser Cache` | `Huge Traffic bercabang ke CDN dan Edge Caching dan ISR dan Browser Cache` |
| **List atau data sangat besar** | Jangan render semuanya | `Pagination` · `Infinite Scroll` · `Virtualization` | `Huge List bercabang ke Pagination dan Infinite Scroll dan Virtualization` |
| **Pengguna tersebar global** | Dekatkan resource ke pengguna | `CDN` · `Edge Rendering` | `Global Audience bercabang ke CDN dan Edge Rendering` |
| **Hemat biaya** | Kurangi compute dan bandwidth origin | `CDN` · `ISR` · `SSG` · `Image Optimization` | `Cost Efficient bercabang ke CDN dan ISR dan SSG dan Image Optimization` |
| **Search realtime** | Hindari request tiap ketukan | `Debounce` · `AbortController` · `Browser Cache` | `Realtime Search bercabang ke Debounce dan AbortController dan Browser Cache` |

### Reliability

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Jaringan tidak stabil** | Pulih otomatis | `Retry` · `Exponential Backoff` · `Timeout` · `AbortController` | `Unstable Network bercabang ke Retry dan Exponential Backoff dan Timeout dan AbortController` |
| **API sering gagal** | Turun kelas dengan anggun | `Error Boundary` · `Fallback UI` · `Stale Data` · `Graceful Degradation` | `API Failure bercabang ke Error Boundary dan Fallback UI dan Stale Data dan Graceful Degradation` |
| **Dukungan offline** | Simpan resource penting secara lokal | `Service Worker` · `Cache API` · `IndexedDB` | `Offline bercabang ke Service Worker dan Cache API dan IndexedDB` |
| **Data sering berubah** | Jaga server state tetap sinkron | `TanStack Query` · `SWR` · `Revalidation` · `Polling` | `Frequently Changing Data bercabang ke TanStack Query dan SWR dan Revalidation dan Polling` |
| **Realtime** | Server mendorong ke client | `WebSocket` · `SSE` | `Realtime bercabang ke WebSocket dan SSE` |
| **Deployment aman** | Bisa rilis dan rollback dengan aman | `CI/CD` · `Feature Flags` · `Canary Rollout` | `Safe Deployment bercabang ke CI/CD dan Feature Flags dan Canary Rollout` |
| **Rilis tanpa regresi** | Tangkap regresi sebelum production | `E2E Test` · `Visual Regression` | `Reliable Release bercabang ke E2E Test dan Visual Regression` |

### Security

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Aman** | Kecilkan attack surface di FE | `HttpOnly Cookie` · `CSP` · `Sanitization` · `CSRF Token` | `Secure bercabang ke HttpOnly Cookie dan CSP dan Sanitization dan CSRF Token` |
| **Akses berbasis peran** | Batasi UI dan route — tetap ditegakkan di backend | `RBAC` · `Route Guard` | `Role Based Access bercabang ke RBAC dan Route Guard` |

### Accessibility

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Dapat diakses semua orang** | Semua orang bisa memakai UI | `Semantic HTML` · `Keyboard Navigation` · `ARIA` | `Accessible bercabang ke Semantic HTML dan Keyboard Navigation dan ARIA` |

### Maintainability

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Banyak tim frontend** | Kurangi coupling antar-feature | `Design System` · `Monorepo` | `Many FE Teams bercabang ke Design System dan Monorepo` |
| **UI yang dipakai ulang** | Standardisasi component | `Design System` | `Reusable UI bercabang ke Design System` |
| **Mudah dirawat** | Pisahkan tanggung jawab | `Design System` · `Monorepo` · `Feature Flags` | `Maintainable bercabang ke Design System dan Monorepo dan Feature Flags` |

### Observability

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **Masalah user terlihat** | Ketahui masalah user di production | `Sentry` · `RUM` · `Web Vitals` · `Structured Logging` | `Observable bercabang ke Sentry dan RUM dan Web Vitals dan Structured Logging` |

### Compatibility

| Requirement | Yang didesain di FE | Teknik | Ucapkan |
|---|---|---|---|
| **SEO penting** | HTML harus tersedia untuk crawler | `SSR` · `SSG` · `ISR` · `Metadata` · `Semantic HTML` · `Sitemap` | `SEO bercabang ke SSR dan SSG dan ISR dan Metadata dan Semantic HTML dan Sitemap` |
| **Jaringan lambat** | Kurangi transfer dan jumlah request | `Compression` · `Browser Cache` · `Image Optimization` · `Prefetch` | `Slow Network bercabang ke Compression dan Browser Cache dan Image Optimization dan Prefetch` |
| **Perangkat kelas bawah** | Kurangi kerja browser | `Code Splitting` · `Lazy Loading` · `Virtualization` · `Minimal Hydration` | `Low End Device bercabang ke Code Splitting dan Lazy Loading dan Virtualization dan Minimal Hydration` |
| **Banyak bahasa** | UI tidak mengunci satu bahasa | `i18n` · `Locale Routing` | `Multi Language bercabang ke i18n dan Locale Routing` |
| **FE lama tetap jalan** | FE lama tidak langsung rusak | `API Versioning` · `Feature Flags` | `Backward Compatible bercabang ke API Versioning dan Feature Flags` |

---

## 6. Contoh jawaban

> "Platform ini dipakai 10 juta siswa, mayoritas mobile, banyak di jaringan lambat."

**Jangan langsung:** "Saya akan pakai Next.js."

**Lebih kuat:**

- **Scale** → `CDN`, `Edge Caching`, `ISR`
- **Slow Network** → `Compression`, `Image Optimization`, `Small Bundle`
- **Low End Device** → `Minimal Hydration`, `Code Splitting`
- **Reliability** → `Retry`, `Stale Data`, `Graceful Degradation`
- **Observability** → `RUM`, `Web Vitals`

Baru setelah itu Next.js disebut — sebagai salah satu cara mengeksekusi keputusan di atas, bukan sebagai jawabannya.


---

## 7. Memakainya di kanvas

Tiga cara, semuanya menghasilkan diagram yang sama:

1. **Klik** — buka `/cheatsheet`, tekan *Gambar* pada baris mana pun, atau *Gambar semua* untuk satu bucket.
2. **Ketik** — salin kolom *Ucapkan* ke kolom perintah di kanan bawah kanvas.
3. **Ucapkan** — misalnya *"SEO penting bercabang ke es es er dan es es ji"*.

Requirement digambar berwarna **coral**, teknik berwarna **biru**, sehingga problem dan solusi
langsung terbaca terpisah di kanvas.

Lihat juga: [`VOICE-COMMANDS.md`](./VOICE-COMMANDS.md) untuk tata bahasa perintah dan kosakata lengkap.
