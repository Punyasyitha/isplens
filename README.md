# ISPSense — Netalyze Frontend

Platform Aspect-Based Sentiment Analysis untuk layanan Internet Service Provider (ISP) Indonesia.

> **Stack:** Next.js 15 · TypeScript · Tailwind CSS · Python FastAPI (backend)

---

## 📁 Struktur Folder

```
ispsense/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (global CSS, metadata)
│   ├── page.tsx                  # Landing page (route: /)
│   └── dashboard/
│       ├── layout.tsx            # Dashboard layout (Sidebar + Topbar)
│       ├── page.tsx              # Redirect → /dashboard/overview
│       ├── overview/
│       │   └── page.tsx          # Halaman Overview
│       ├── statistik-data/
│       │   └── page.tsx          # Halaman Statistik Data
│       ├── analisis/
│       │   └── page.tsx          # Halaman Analisis Komentar
│       └── sinkronisasi/
│           └── page.tsx          # Halaman Sinkronisasi Data
│
├── components/
│   ├── landing/
│   │   └── LandingPage.tsx       # Komponen landing page lengkap
│   └── dashboard/
│       ├── Sidebar.tsx           # Sidebar navigasi (fixed, navy)
│       ├── Topbar.tsx            # Header dengan search & provider filter
│       └── pages/
│           ├── OverviewPage.tsx      # UI halaman overview + stat cards
│           ├── StatistikDataPage.tsx # Grafik batang & donut sentimen
│           ├── AnalisisPage.tsx      # Form analisis + hasil prediksi
│           └── SinkronisasiPage.tsx  # Tabel data + tombol sinkronisasi
│
├── lib/
│   ├── api.ts                    # API client → Python FastAPI backend
│   └── types.ts                  # TypeScript interfaces (request/response)
│
├── styles/
│   └── globals.css               # Design tokens, animasi, utility classes
│
├── .env.local                    # Konfigurasi URL backend
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Cara Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Konfigurasi environment
Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Jalankan development server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📄 Halaman & Navigasi

| Route | Nama | Fungsi |
|---|---|---|
| `/` | Landing Page | Presentasi platform ISPSense |
| `/dashboard/overview` | Overview | Ringkasan total data, tren bulanan, riwayat analisis |
| `/dashboard/statistik-data` | Statistik Data | Grafik distribusi aspek & sentimen per provider |
| `/dashboard/analisis` | Analisis | Input komentar → prediksi aspek + sentimen |
| `/dashboard/sinkronisasi` | Sinkronisasi | Tabel data komentar + tombol update dari Instagram |

---

## 🔌 Integrasi Backend

Frontend berkomunikasi dengan backend Python (FastAPI) melalui `lib/api.ts`.

### Endpoint yang digunakan:

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/predict` | Prediksi aspek & sentimen dari teks |
| `GET` | `/overview` | Data statistik untuk halaman Overview |
| `GET` | `/statistik` | Data distribusi untuk halaman Statistik |
| `GET` | `/data` | Data tabel untuk halaman Sinkronisasi |
| `POST` | `/sync` | Trigger sinkronisasi data dari Instagram |

---

## 🎨 Design System

- **Font Display:** Playfair Display (heading, angka besar)
- **Font Body:** DM Sans (teks, label, navigasi)
- **Primary Color:** `#0B1F3A` (navy)
- **Accent Color:** `#2D8EFF` (biru)
- **Sentiment:**
  - Positif → `#1A7A43` / `#EAF6EF`
  - Negatif → `#C0392B` / `#FEF0F0`
  - Netral → `#A0750A` / `#FEF9EC`

---

## 📚 Referensi

- Proyek Akhir: *Aspect-Based Sentiment Analysis pada Perusahaan ISP* — Masyitha Fahra Nabila, PENS 2025
- Model: `indobenchmark/indobert-base-p1` (IndoBERT)
- Data: Komentar Instagram provider ISP Indonesia (Apify scraper)
