// Auto-generated dari blind_test_results.csv
// 366 klausa | 279 kalimat | 7 provider

export const PROVIDERS = ['Semua', 'Axis', 'Biznet', 'ByU', 'IM3', 'Indihome', 'Indosat', 'Simpati'] as const
export type Provider = typeof PROVIDERS[number]

export const ASPECTS = [
  'Stabilitas Jaringan', 'Harga', 'Kemudahan Akses Layanan',
  'Layanan Pelanggan', 'Penanganan Gangguan', 'Kecepatan Internet',
  'Instalasi', 'Keamanan Layanan',
] as const

export const SENTIMENTS = ['Negatif', 'Netral', 'Positif'] as const

// ── OVERVIEW (semua provider) ─────────────────────────────
export const OVERVIEW = {
  total_kalimat:      279,
  total_klausa:       366,
  total_provider:     7,
  avg_conf_aspect:    91.8,
  avg_conf_sentiment: 97.9,
  sentiment_dist: { Negatif: 207, Netral: 145, Positif: 14 },
  aspect_dist: {
    'Stabilitas Jaringan':      170,
    'Harga':                     58,
    'Kemudahan Akses Layanan':   53,
    'Layanan Pelanggan':         26,
    'Penanganan Gangguan':       24,
    'Kecepatan Internet':        13,
    'Instalasi':                 11,
    'Keamanan Layanan':          11,
  },
  top_pairs: {
    'Stabilitas Jaringan — Negatif':      129,
    'Harga — Netral':                      37,
    'Stabilitas Jaringan — Netral':        36,
    'Kemudahan Akses Layanan — Netral':    27,
    'Kemudahan Akses Layanan — Negatif':   24,
  },
  sentiment_per_provider: [
    { provider: 'Axis',     sentiment: 'Negatif', count: 58 },
    { provider: 'Axis',     sentiment: 'Netral',  count: 28 },
    { provider: 'Axis',     sentiment: 'Positif', count:  1 },
    { provider: 'Biznet',   sentiment: 'Negatif', count:  8 },
    { provider: 'Biznet',   sentiment: 'Netral',  count: 12 },
    { provider: 'ByU',      sentiment: 'Negatif', count: 27 },
    { provider: 'ByU',      sentiment: 'Netral',  count:  8 },
    { provider: 'IM3',      sentiment: 'Negatif', count: 31 },
    { provider: 'IM3',      sentiment: 'Netral',  count: 21 },
    { provider: 'IM3',      sentiment: 'Positif', count:  5 },
    { provider: 'Indihome', sentiment: 'Negatif', count: 72 },
    { provider: 'Indihome', sentiment: 'Netral',  count: 47 },
    { provider: 'Indihome', sentiment: 'Positif', count:  3 },
    { provider: 'Indosat',  sentiment: 'Negatif', count:  4 },
    { provider: 'Indosat',  sentiment: 'Netral',  count:  8 },
    { provider: 'Simpati',  sentiment: 'Negatif', count:  7 },
    { provider: 'Simpati',  sentiment: 'Netral',  count: 21 },
    { provider: 'Simpati',  sentiment: 'Positif', count:  5 },
  ],
}

// ── STATISTIK PER PROVIDER ────────────────────────────────
export const STATS_BY_PROVIDER: Record<string, {
  total_klausa: number
  total_kalimat: number
  avg_conf_aspect: number
  avg_conf_sentiment: number
  sentiment_dist: Record<string, number>
  aspect_dist: Record<string, number>
  top_pairs: Record<string, number>
}> = {
  Axis: {
    total_klausa: 87, total_kalimat: 69,
    avg_conf_aspect: 88.2, avg_conf_sentiment: 97.5,
    sentiment_dist: { Negatif: 58, Netral: 28, Positif: 1 },
    aspect_dist: { 'Stabilitas Jaringan': 49, 'Harga': 14, 'Kemudahan Akses Layanan': 12, 'Kecepatan Internet': 2, 'Penanganan Gangguan': 7, 'Instalasi': 2, 'Keamanan Layanan': 1 },
    top_pairs: { 'Stabilitas Jaringan — Negatif': 37, 'Harga — Netral': 8, 'Kemudahan Akses Layanan — Negatif': 8, 'Penanganan Gangguan — Negatif': 6, 'Stabilitas Jaringan — Netral': 11 },
  },
  Biznet: {
    total_klausa: 20, total_kalimat: 17,
    avg_conf_aspect: 94.1, avg_conf_sentiment: 98.6,
    sentiment_dist: { Negatif: 8, Netral: 12, Positif: 0 },
    aspect_dist: { 'Stabilitas Jaringan': 4, 'Harga': 3, 'Kemudahan Akses Layanan': 8, 'Layanan Pelanggan': 3, 'Instalasi': 2 },
    top_pairs: { 'Kemudahan Akses Layanan — Netral': 7, 'Stabilitas Jaringan — Negatif': 3, 'Harga — Netral': 2, 'Layanan Pelanggan — Netral': 2, 'Instalasi — Negatif': 2 },
  },
  ByU: {
    total_klausa: 35, total_kalimat: 26,
    avg_conf_aspect: 91.0, avg_conf_sentiment: 97.8,
    sentiment_dist: { Negatif: 27, Netral: 8, Positif: 0 },
    aspect_dist: { 'Stabilitas Jaringan': 22, 'Harga': 5, 'Kemudahan Akses Layanan': 4, 'Penanganan Gangguan': 2, 'Kecepatan Internet': 2 },
    top_pairs: { 'Stabilitas Jaringan — Negatif': 19, 'Harga — Negatif': 4, 'Kemudahan Akses Layanan — Negatif': 3, 'Stabilitas Jaringan — Netral': 3, 'Penanganan Gangguan — Negatif': 2 },
  },
  IM3: {
    total_klausa: 57, total_kalimat: 43,
    avg_conf_aspect: 92.4, avg_conf_sentiment: 97.9,
    sentiment_dist: { Negatif: 31, Netral: 21, Positif: 5 },
    aspect_dist: { 'Stabilitas Jaringan': 28, 'Harga': 11, 'Kemudahan Akses Layanan': 9, 'Layanan Pelanggan': 4, 'Penanganan Gangguan': 3, 'Kecepatan Internet': 2 },
    top_pairs: { 'Stabilitas Jaringan — Negatif': 20, 'Harga — Netral': 7, 'Kemudahan Akses Layanan — Netral': 6, 'Stabilitas Jaringan — Netral': 7, 'Layanan Pelanggan — Positif': 3 },
  },
  Indihome: {
    total_klausa: 122, total_kalimat: 94,
    avg_conf_aspect: 92.7, avg_conf_sentiment: 98.1,
    sentiment_dist: { Negatif: 72, Netral: 47, Positif: 3 },
    aspect_dist: { 'Stabilitas Jaringan': 55, 'Harga': 16, 'Kemudahan Akses Layanan': 14, 'Layanan Pelanggan': 13, 'Penanganan Gangguan': 11, 'Kecepatan Internet': 5, 'Instalasi': 5, 'Keamanan Layanan': 3 },
    top_pairs: { 'Stabilitas Jaringan — Negatif': 40, 'Harga — Netral': 11, 'Stabilitas Jaringan — Netral': 12, 'Kemudahan Akses Layanan — Netral': 8, 'Penanganan Gangguan — Negatif': 9 },
  },
  Indosat: {
    total_klausa: 12, total_kalimat: 10,
    avg_conf_aspect: 93.5, avg_conf_sentiment: 98.2,
    sentiment_dist: { Negatif: 4, Netral: 8, Positif: 0 },
    aspect_dist: { 'Stabilitas Jaringan': 4, 'Harga': 4, 'Kemudahan Akses Layanan': 2, 'Keamanan Layanan': 2 },
    top_pairs: { 'Harga — Netral': 4, 'Stabilitas Jaringan — Negatif': 3, 'Kemudahan Akses Layanan — Netral': 2, 'Keamanan Layanan — Netral': 2, 'Stabilitas Jaringan — Netral': 1 },
  },
  Simpati: {
    total_klausa: 33, total_kalimat: 20,
    avg_conf_aspect: 91.3, avg_conf_sentiment: 97.4,
    sentiment_dist: { Negatif: 7, Netral: 21, Positif: 5 },
    aspect_dist: { 'Stabilitas Jaringan': 8, 'Harga': 5, 'Kemudahan Akses Layanan': 4, 'Layanan Pelanggan': 6, 'Penanganan Gangguan': 1, 'Kecepatan Internet': 2, 'Instalasi': 2, 'Keamanan Layanan': 5 },
    top_pairs: { 'Layanan Pelanggan — Positif': 4, 'Stabilitas Jaringan — Netral': 5, 'Harga — Netral': 5, 'Keamanan Layanan — Netral': 4, 'Kemudahan Akses Layanan — Netral': 3 },
  },
}

// ── HELPER FUNCTIONS ──────────────────────────────────────
export function getStats(provider: Provider) {
  if (provider === 'Semua') return null
  return STATS_BY_PROVIDER[provider] ?? null
}

export function getSentimentColor(sentiment: string): string {
  return sentiment === 'Positif' ? '#1D9E75'
       : sentiment === 'Negatif' ? '#E24B4A'
       : '#EF9F27'
}

export function getSentimentBg(sentiment: string): string {
  return sentiment === 'Positif' ? 'rgba(29,158,117,0.12)'
       : sentiment === 'Negatif' ? 'rgba(226,75,74,0.12)'
       : 'rgba(239,159,39,0.12)'
}
