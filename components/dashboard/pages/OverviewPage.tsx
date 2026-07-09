'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo, useRef } from 'react'
import { TrendingUp, TrendingDown, Activity, Database, Loader2 } from 'lucide-react'

// ── Konstanta ──────────────────────────────────────────────────
type ProviderKey = 'Semua' | 'IndiHome' | 'AXIS' | 'IM3' | 'by.U' | 'Telkomsel' | 'Biznet' | 'XL'

const ANALYSIS_HISTORY_KEY = 'isplens_last_analysis_history'

type AnalyzeHistoryRow = {
  text: string
  time: string
  aspect: string
  sentiment: 'Positif' | 'Negatif' | 'Netral'
}

const ANALYZE_HISTORY_FALLBACK: AnalyzeHistoryRow[] = [
  { text: 'Biznet makin sini makin ga karuan jaringannya, kecepatan 12 mbps',  time: '10/12', aspect: 'Stabilitas Jaringan', sentiment: 'Negatif' },
  { text: 'Keluhan Indihome 4 hari tidak ditangani, tidak ada follow up',      time: '10/14', aspect: 'Penanganan Gangguan', sentiment: 'Negatif' },
  { text: 'Paket Ramadan IM3 worth it, kenceng dan harga terjangkau',          time: '10/07', aspect: 'Harga',               sentiment: 'Positif' },
  { text: 'Sinyal Axis 3 hari gaada terus, sangat mengganggu aktivitas kerja', time: '10/18', aspect: 'Stabilitas Jaringan', sentiment: 'Negatif' },
]

const PROVIDERS: ProviderKey[] = ['Semua', 'IndiHome', 'AXIS', 'IM3', 'by.U', 'Telkomsel', 'Biznet', 'XL']

const PROVIDER_ORDER: ProviderKey[] = ['IndiHome', 'AXIS', 'IM3', 'by.U', 'Telkomsel', 'Biznet', 'XL']

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

// ── Tipe untuk data tren dari /stats ───────────────────────────
interface TrendPoint {
  month: string
  neg: number; pos: number; neu: number; total: number
  neg_pct: number; pos_pct: number
}

interface ProviderTrend {
  provider: string
  color: string
  points: TrendPoint[]
}

const PROVIDER_COLORS: Record<string, string> = {
  'IndiHome':  '#E53935',  // Merah
  'IM3':       '#F57C00',  // Oranye
  'XL':        '#29B6F6',  // Biru Muda
  'AXIS':      '#7B1FA2',  // Ungu
  'Telkomsel': '#800020',  // Burgundy
  'Biznet':    '#1565C0',  // Biru Tua
  'by.U':      '#EC407A',  // Pink
}

// ── Bobot expert hasil kuesioner (normalisasi dari skor Likert) ─
const EXPERT_WEIGHTS: Record<string, number> = {
  'Kecepatan Internet':      5 / 33,
  'Stabilitas Jaringan':     5 / 33,
  'Penanganan Gangguan':     5 / 33,
  'Keamanan Layanan':        5 / 33,
  'Layanan Pelanggan':       4 / 33,
  'Harga':                   3 / 33,
  'Kemudahan Akses Layanan': 3 / 33,
  'Instalasi':               3 / 33,
}

// ── Sentiment Heatmap — per provider, positif vs negatif ─────
const MONTHS_LABEL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

function SentimentHeatmap({ providerTrends, loading, selectedProvider }: {
  providerTrends: ProviderTrend[]
  loading: boolean
  selectedProvider: string
}) {
  const [hovered, setHovered] = useState<{provider: string; sentiment: 'positif' | 'negatif'; col: number} | null>(null)
  const [pageIndex, setPageIndex] = useState(0)

  // Reset ke halaman pertama saat provider berubah
  useEffect(() => {
    setPageIndex(0)
  }, [selectedProvider])

  // Filter berdasarkan selectedProvider, lalu sort
  const filtered = selectedProvider === 'Semua'
    ? providerTrends
    : providerTrends.filter(p => p.provider === selectedProvider)

  const visible = [...filtered].sort((a, b) => {
    const indexA = PROVIDER_ORDER.indexOf(a.provider as ProviderKey)
    const indexB = PROVIDER_ORDER.indexOf(b.provider as ProviderKey)
    if (indexA === -1 && indexB === -1) return a.provider.localeCompare(b.provider)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  useEffect(() => {
    if (pageIndex >= visible.length) setPageIndex(Math.max(0, visible.length - 1))
  }, [pageIndex, visible.length])

  if (loading) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#3D6B5C', fontSize: 12 }}>
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      Memuat heatmap provider...
    </div>
  )

  if (visible.length === 0) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3D6B5C', fontSize: 12, flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 20 }}>📊</span>
      <span>
        {selectedProvider === 'Semua'
          ? 'Belum ada provider yang berhasil disinkronisasi'
          : `Belum ada data sinkronisasi dari ${selectedProvider}`}
      </span>
      <span style={{ fontSize: 11, color: '#A0750A' }}>Lakukan sinkronisasi terlebih dahulu</span>
    </div>
  )

  const getColor = (pct: number, total: number, sentiment: 'positif' | 'negatif') => {
    if (total === 0) return '#F4F4F4'

    if (sentiment === 'positif') {
      if (pct >= 80) return '#1A7A43'
      if (pct >= 60) return '#1D9E75'
      if (pct >= 40) return '#5DCAA5'
      if (pct >= 20) return '#A7E3C7'
      return '#DDF5EA'
    }

    if (pct >= 80) return '#7B2020'
    if (pct >= 60) return '#C0392B'
    if (pct >= 40) return '#E24B4A'
    if (pct >= 20) return '#F08A84'
    return '#FAD9D7'
  }

  const textColor = (pct: number, total: number) => {
    if (total === 0) return '#B0B0B0'
    return pct >= 60 ? '#fff' : '#042C1E'
  }

  const CELL_W = 44
  const CELL_H = 28
  const LABEL_W = 76

  const currentProvider = visible[pageIndex]

  const renderHeatmap = (provider: ProviderTrend, sentiment: 'positif' | 'negatif') => {
    return (
      <div style={{ minWidth: LABEL_W + CELL_W * 12 }}>
        <div style={{ display: 'flex', marginLeft: LABEL_W }}>
          {MONTHS_LABEL.map((m) => (
            <div key={`${provider.provider}-${sentiment}-${m}`} style={{ width: CELL_W, textAlign: 'center', fontSize: 10, color: '#3D6B5C', fontWeight: 500, paddingBottom: 4 }}>
              {m}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: LABEL_W, fontSize: 11, color: '#085041', fontWeight: 500, paddingRight: 8, textAlign: 'right', flexShrink: 0 }}>
            {sentiment === 'positif' ? 'Positif' : 'Negatif'}
          </div>
          {provider.points.map((p, col) => {
            const value = sentiment === 'positif' ? p.pos_pct : p.neg_pct
            const total = p.total
            const isHovered = hovered?.provider === provider.provider && hovered?.sentiment === sentiment && hovered?.col === col
            return (
              <div
                key={`${provider.provider}-${sentiment}-${col}`}
                onMouseEnter={() => setHovered({ provider: provider.provider, sentiment, col })}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: CELL_W,
                  height: CELL_H,
                  background: getColor(value, total, sentiment),
                  borderRadius: 4,
                  margin: '0 1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.1s',
                  boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {total > 0 && (
                  <span style={{ fontSize: 9, color: textColor(value, total), fontWeight: 600 }}>
                    {value.toFixed(0)}%
                  </span>
                )}
                {isHovered && total > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#042C1E', color: '#fff', borderRadius: 6,
                    padding: '6px 10px', fontSize: 10, whiteSpace: 'nowrap',
                    zIndex: 10, pointerEvents: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{provider.provider} · {sentiment === 'positif' ? 'Positif' : 'Negatif'} · {MONTHS_LABEL[col]}</div>
                    <div style={{ color: sentiment === 'positif' ? '#5DCAA5' : '#E24B4A' }}>
                      {sentiment === 'positif' ? 'Positif' : 'Negatif'}: {value.toFixed(1)}% ({sentiment === 'positif' ? p.pos : p.neg})
                    </div>
                    <div style={{ color: '#aaa' }}>Total: {p.total} kalimat</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 4 }}>
            Tren Sentimen per Bulan
          </p>
          <p style={{ fontSize: 11, color: '#3D6B5C' }}>
            Pagination provider tersinkron: halaman {pageIndex + 1} dari {visible.length}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={pageIndex === 0}
            style={{
              border: '1px solid #B8DDD2', background: pageIndex === 0 ? '#F4FBF8' : '#fff', color: '#085041',
              borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: pageIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Sebelumnya
          </button>
          <span style={{ fontSize: 12, color: '#3D6B5C', minWidth: 110, textAlign: 'center' }}>
            {currentProvider?.provider ?? '-'}
          </span>
          <button
            onClick={() => setPageIndex((prev) => Math.min(visible.length - 1, prev + 1))}
            disabled={pageIndex >= visible.length - 1}
            style={{
              border: '1px solid #B8DDD2', background: pageIndex >= visible.length - 1 ? '#F4FBF8' : '#fff', color: '#085041',
              borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: pageIndex >= visible.length - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Berikutnya
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: '#3D6B5C' }}>Skala heatmap:</span>
        {[
          { color: '#DDF5EA', label: 'Rendah' },
          { color: '#5DCAA5', label: 'Sedang' },
          { color: '#1D9E75', label: 'Tinggi' },
          { color: '#F4F4F4', label: 'No data', border: '1px solid #ddd' },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: border ?? 'none', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#3D6B5C' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: 10, color: '#3D6B5C', marginLeft: 8 }}>| Negatif memakai skala merah</span>
      </div>

      <div style={{ border: '1px solid #E1F5EE', borderRadius: 14, background: '#fff', padding: 14, boxShadow: '0 6px 18px rgba(8,80,65,0.04)' }}>
        {currentProvider ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 4 }}>{currentProvider.provider}</p>
                <p style={{ fontSize: 11, color: '#3D6B5C' }}>
                  Provider berhasil disinkronisasi · {currentProvider.points.filter((p) => p.total > 0).length} bulan data · {currentProvider.points.reduce((sum, point) => sum + point.total, 0)} kalimat
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#1A7A43', background: '#EAF6EF', borderRadius: 999, padding: '4px 10px', fontWeight: 500 }}>
                  Positif {currentProvider.points.reduce((sum, point) => sum + point.pos, 0)}
                </span>
                <span style={{ fontSize: 11, color: '#C0392B', background: '#FEF0F0', borderRadius: 999, padding: '4px 10px', fontWeight: 500 }}>
                  Negatif {currentProvider.points.reduce((sum, point) => sum + point.neg, 0)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#1A7A43', marginBottom: 8 }}>Heatmap Positif</p>
                {renderHeatmap(currentProvider, 'positif')}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#C0392B', marginBottom: 8 }}>Heatmap Negatif</p>
                {renderHeatmap(currentProvider, 'negatif')}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// ── Kinerja provider: badge tren berdasarkan slope neg_pct ─────
function ProviderTrendBadges({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null

  const first = points[0].neg_pct
  const last  = points[points.length - 1].neg_pct
  const delta = last - first
  const abs   = Math.abs(delta).toFixed(1)

  if (Math.abs(delta) < 1) {
    return (
      <span style={{ fontSize: 11, color: '#A0750A', background: '#FEF9EC', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
        → Stabil
      </span>
    )
  }
  return delta < 0 ? (
    <span style={{ fontSize: 11, color: '#1A7A43', background: '#EAF6EF', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
      ↓ Membaik {abs}pp
    </span>
  ) : (
    <span style={{ fontSize: 11, color: '#C0392B', background: '#FEF0F0', borderRadius: 6, padding: '2px 8px', fontWeight: 500 }}>
      ↑ Memburuk {abs}pp
    </span>
  )
}


// ── Grafik Temporal Sentimen Berbobot Expert ──────────────────
interface RawTrendRow {
  month: string
  provider: string
  aspect: string
  neg: number
  pos: number
  total: number
}

const ALL_ASPECTS = Object.keys(EXPERT_WEIGHTS)

function WeightedTemporalChart({ rawTrend, loading, selectedProvider }: {
  rawTrend: RawTrendRow[]
  loading: boolean
  selectedProvider: string
}) {
  const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

  // Toggle aspek — default semua aktif (pakai expert weight)
  const [activeAspects, setActiveAspects] = useState<Set<string>>(() => new Set(ALL_ASPECTS))


  const toggleAspect = (asp: string) => {
    setActiveAspects(prev => {
      const next = new Set(prev)
      if (next.has(asp)) {
        if (next.size === 1) return prev // minimal 1 aspek aktif
        next.delete(asp)
      } else {
        next.add(asp)
      }
      return next
    })
  }

  // Hitung bobot aktif
  const activeWeights = useMemo(() => {
    const filtered: Record<string, number> = {}
    for (const asp of activeAspects) {
      filtered[asp] = EXPERT_WEIGHTS[asp] ?? (1 / 8)
    }
    // Normalisasi agar total = 1 (penting saat aspek dikurangi)
    const total = Object.values(filtered).reduce((a, b) => a + b, 0)
    for (const k in filtered) filtered[k] = filtered[k] / total
    return filtered
  }, [activeAspects])

  // Hover state untuk garis provider: pertebal garis + tampilkan tooltip nama provider
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ provider: string; color: string; month: string; total: number } | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const handleLineHover = (provider: string, e: React.MouseEvent) => {
    setHoveredLine(provider)
    const rect = chartContainerRef.current?.getBoundingClientRect()
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  // Deteksi tahun dari data (bukan hardcode currentYear)
  const displayYear = useMemo(() => {
    if (rawTrend.length === 0) return String(new Date().getFullYear())
    const counted: Record<string, number> = {}
    for (const r of rawTrend) {
      const y = r.month.substring(0, 4)
      counted[y] = (counted[y] || 0) + 1
    }
    return Object.entries(counted).sort((a, b) => b[1] - a[1])[0][0]
  }, [rawTrend])

  const chartData = useMemo(() => {
    // Kelompokkan: provider → month → aspect → {neg, pos, total}
    const map: Record<string, Record<string, Record<string, {neg:number; pos:number; total:number}>>> = {}
    for (const row of rawTrend) {
      if (!map[row.provider]) map[row.provider] = {}
      if (!map[row.provider][row.month]) map[row.provider][row.month] = {}
      map[row.provider][row.month][row.aspect] = {
        neg: row.neg || 0, pos: row.pos || 0, total: row.total || 0,
      }
    }

    return Object.entries(map)
      .filter(([prov]) => selectedProvider === 'Semua' || prov === selectedProvider)
      .map(([prov, monthMap]) => {
        const scores: (number | null)[] = []
        const totals: number[] = []
        for (let m = 1; m <= 12; m++) {
          const key = `${displayYear}-${String(m).padStart(2, '0')}`
          const aspectData = monthMap[key]
          if (!aspectData) { scores.push(null); totals.push(0); continue }

          let weightedScore = 0
          let hasData = false
          let monthTotal = 0
          for (const [aspect, weight] of Object.entries(activeWeights)) {
            const d = aspectData[aspect]
            if (d && d.total > 0) {
              weightedScore += ((d.pos - d.neg) / d.total) * weight
              hasData = true
              monthTotal += d.total
            }
          }
          scores.push(hasData ? Math.round(weightedScore * 1000) / 1000 : null)
          totals.push(monthTotal)
        }
        return { provider: prov, color: PROVIDER_COLORS[prov] ?? '#999', scores, totals }
      })
  }, [rawTrend, selectedProvider, displayYear, activeWeights])

  // SVG dimensions
  const W = 640, H = 200, ML = 44, MR = 16, MT = 14, MB = 28
  const chartW = W - ML - MR
  const chartH = H - MT - MB
  const xPos = (i: number) => ML + (i / 11) * chartW
  const yPos = (v: number) => MT + ((1 - v) / 2) * chartH // map -1..1 → chartH..0

  if (loading) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#3D6B5C', fontSize: 12 }}>
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      Memuat grafik sentimen...
    </div>
  )

  if (chartData.length === 0) return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3D6B5C', fontSize: 12, flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 20 }}>📈</span>
      <span>Belum ada data untuk ditampilkan</span>
      <span style={{ fontSize: 11, color: '#A0750A' }}>Lakukan sinkronisasi terlebih dahulu</span>
    </div>
  )

  const gridValues = [-1, 0, 1]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 2 }}>
            Tren Sentimen Temporal · {displayYear}
          </p>
          <p style={{ fontSize: 11, color: '#3D6B5C' }}>
            Skor agregat bulanan per provider · skala −1 (negatif) hingga +1 (positif) · ternormalisasi per volume komentar
          </p>
        </div>

      </div>

      {/* Toggle Aspek */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#3D6B5C', fontWeight: 500 }}>Filter Aspek:</span>
          <button onClick={() => setActiveAspects(new Set(ALL_ASPECTS))} style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 100,
            border: '1px solid #B8DDD2', background: '#F4FBF8',
            color: '#3D6B5C', cursor: 'pointer',
          }}>Semua</button>
          <button onClick={() => {
            const top = ALL_ASPECTS.slice(0, 3) // Kecepatan, Stabilitas, Penanganan
            setActiveAspects(new Set(top))
          }} style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 100,
            border: '1px solid #B8DDD2', background: '#F4FBF8',
            color: '#3D6B5C', cursor: 'pointer',
          }}>Teknis</button>
          <button onClick={() => {
            setActiveAspects(new Set(['Layanan Pelanggan', 'Penanganan Gangguan', 'Kemudahan Akses Layanan']))
          }} style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 100,
            border: '1px solid #B8DDD2', background: '#F4FBF8',
            color: '#3D6B5C', cursor: 'pointer',
          }}>Layanan</button>
          <button onClick={() => {
            setActiveAspects(new Set(['Harga', 'Instalasi']))
          }} style={{
            fontSize: 9, padding: '2px 8px', borderRadius: 100,
            border: '1px solid #B8DDD2', background: '#F4FBF8',
            color: '#3D6B5C', cursor: 'pointer',
          }}>Harga & Instalasi</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {ALL_ASPECTS.map(asp => {
            const isActive = activeAspects.has(asp)
            const w = (EXPERT_WEIGHTS[asp] * 100).toFixed(0)
            return (
              <button key={asp} onClick={() => toggleAspect(asp)} style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 100,
                border: `1px solid ${isActive ? '#1D9E75' : '#D0D0D0'}`,
                background: isActive ? '#E1F5EE' : '#F9F9F9',
                color: isActive ? '#085041' : '#999',
                cursor: 'pointer', transition: 'all 0.15s',
                fontWeight: isActive ? 500 : 400,
              }}>
                {asp} <span style={{ opacity: 0.6 }}>{w}%</span>
              </button>
            )
          })}
        </div>
        {activeAspects.size < ALL_ASPECTS.size && (
          <p style={{ fontSize: 10, color: '#A0750A', marginTop: 5 }}>
            ⚠ Menampilkan {activeAspects.size} dari {ALL_ASPECTS.size} aspek — bobot dinormalisasi ulang
          </p>
        )}
      </div>

      {/* Legend provider */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 10 }}>
        {chartData.map(d => (
          <div key={d.provider} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 3, borderRadius: 2, background: d.color }} />
            <span style={{ fontSize: 11, color: '#3D6B5C' }}>{d.provider}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <div ref={chartContainerRef} style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid lines & Y labels */}
          {gridValues.map(v => (
            <g key={v}>
              <line
                x1={ML} y1={yPos(v)} x2={W - MR} y2={yPos(v)}
                stroke={v === 0 ? '#085041' : '#B8DDD2'}
                strokeWidth={v === 0 ? 1.5 : 0.7}
                strokeDasharray={v === 0 ? undefined : '3 3'}
              />
              <text x={ML - 6} y={yPos(v) + 3.5} textAnchor="end" fontSize={10} fontWeight={v === 0 ? '600' : '400'} fill="#3D6B5C">
                {v > 0 ? `+${v}` : `${v}`}
              </text>
            </g>
          ))}

          {/* X axis month labels */}
          {MONTHS.map((m, i) => (
            <text key={m} x={xPos(i)} y={H - 7} textAnchor="middle" fontSize={9} fill="#3D6B5C">
              {m}
            </text>
          ))}

          {/* Lines per provider */}
          {chartData.map(d => {
            const pts = d.scores
              .map((v, i) => v !== null ? { x: xPos(i), y: yPos(v), score: v, total: d.totals[i], month: MONTHS[i] } : null)
              .filter(Boolean) as { x: number; y: number; score: number; total: number; month: string }[]

            if (pts.length === 0) return null
            const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

            const isHovered = hoveredLine === d.provider
            const isDimmed = hoveredLine !== null && !isHovered

            return (
              <g key={d.provider}>
                {/* Garis tampak (pertebal + terangi saat hover) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={isHovered ? 4 : 2}
                  strokeOpacity={isDimmed ? 0.25 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-width 0.15s ease, stroke-opacity 0.15s ease' }}
                  pointerEvents="none"
                />
                {/* Hit-area transparan lebih lebar supaya mudah di-hover */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  onMouseEnter={(e) => handleLineHover(d.provider, e)}
                  onMouseMove={(e) => handleLineHover(d.provider, e)}
                  onMouseLeave={() => { setHoveredLine(null); setTooltipPos(null) }}
                  style={{ cursor: 'pointer' }}
                />
                {/* Titik data — radius mengikuti jumlah data (n) pada bulan tsb */}
                {pts.map((p, i) => (
                  <circle
                    key={i} cx={p.x} cy={p.y}
                    r={isHovered ? 4 : 3}
                    fill={d.color} stroke="#fff" strokeWidth={1.5}
                    strokeOpacity={isDimmed ? 0.25 : 1}
                    fillOpacity={isDimmed ? 0.25 : 1}
                    style={{ transition: 'r 0.15s ease, fill-opacity 0.15s ease', cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      setHoveredLine(d.provider)
                      setHoveredPoint({ provider: d.provider, color: d.color, month: p.month, total: p.total })
                      const rect = chartContainerRef.current?.getBoundingClientRect()
                      if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                    }}
                    onMouseMove={(e) => {
                      const rect = chartContainerRef.current?.getBoundingClientRect()
                      if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                    }}
                    onMouseLeave={() => { setHoveredLine(null); setHoveredPoint(null); setTooltipPos(null) }}
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Tooltip detail titik (provider, bulan, skor, jumlah data) saat titik di-hover */}
        {hoveredPoint && tooltipPos && (
          <div style={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y - 14,
            transform: 'translate(-50%, -100%)',
            background: '#042C1E',
            color: '#fff',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 11,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: hoveredPoint.color, flexShrink: 0 }} />
              {hoveredPoint.provider} · {hoveredPoint.month}
            </div>
            <div>n = {hoveredPoint.total} komentar{hoveredPoint.total < 10 ? ' ⚠ data sedikit' : ''}</div>
          </div>
        )}

        {/* Tooltip nama provider saat garis (bukan titik) di-hover */}
        {hoveredLine && !hoveredPoint && tooltipPos && (
          <div style={{
            position: 'absolute',
            left: tooltipPos.x,
            top: tooltipPos.y - 14,
            transform: 'translate(-50%, -100%)',
            background: '#042C1E',
            color: '#fff',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: chartData.find(d => d.provider === hoveredLine)?.color ?? '#999',
              flexShrink: 0,
            }} />
            Provider: {hoveredLine}
          </div>
        )}
      </div>

      {/* Keterangan bobot aktif */}
      <p style={{ fontSize: 10, color: '#3D6B5C', marginTop: 8, opacity: 0.7 }}>
        Bobot expert judgment: {
          Object.entries(activeWeights).map(([asp, w]) => `${asp} (${(w*100).toFixed(1)}%)`).join(' · ')
        }
      </p>
      <p style={{ fontSize: 10, color: '#3D6B5C', marginTop: 4, opacity: 0.7 }}>
        Arahkan kursor ke titik untuk melihat jumlah komentar (n) pada bulan tsb — n kecil berarti hati-hati menafsirkan lonjakan skornya
      </p>
    </div>
  )
}

export default function OverviewPage() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('Semua')

  // Tren per provider dari /stats
  const [providerTrends, setProviderTrends] = useState<ProviderTrend[]>([])
  const [rawTrend, setRawTrend]             = useState<RawTrendRow[]>([])
  const [trendLoading, setTrendLoading]     = useState(true)
  const syncedProviders = providerTrends.map((providerTrend) => providerTrend.provider as ProviderKey)
  const [analysisHistory, setAnalysisHistory] = useState<AnalyzeHistoryRow[]>(ANALYZE_HISTORY_FALLBACK)

  useEffect(() => {
    if (selectedProvider !== 'Semua' && syncedProviders.length > 0 && !syncedProviders.includes(selectedProvider)) {
      setSelectedProvider('Semua')
    }
  }, [selectedProvider, syncedProviders])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const readHistory = () => {
      const raw = window.localStorage.getItem(ANALYSIS_HISTORY_KEY)
      if (!raw) {
        setAnalysisHistory(ANALYZE_HISTORY_FALLBACK)
        return
      }

      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAnalysisHistory(parsed.slice(0, 8))
          return
        }
      } catch {
        // fallback below
      }

      setAnalysisHistory(ANALYZE_HISTORY_FALLBACK)
    }

    readHistory()

    const handleHistoryUpdate = () => readHistory()
    window.addEventListener('analysishistoryupdated', handleHistoryUpdate)
    window.addEventListener('storage', handleHistoryUpdate)

    return () => {
      window.removeEventListener('analysishistoryupdated', handleHistoryUpdate)
      window.removeEventListener('storage', handleHistoryUpdate)
    }
  }, [])

  // Fetch sekali saja saat mount — filter dilakukan di chart
  useEffect(() => {
    setTrendLoading(true)
    fetch(`${API_BASE}/api/stats`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status !== 'ok' || !json.trend?.length) {
          setProviderTrends([])
          setRawTrend([])
          return
        }
        // Simpan raw trend untuk grafik berbobot
        setRawTrend(json.trend)
        const currentYear = new Date().getFullYear()
        const allProviders = [...new Set<string>(json.trend.map((r: any) => r.provider))]

        const trends: ProviderTrend[] = allProviders.map((prov) => {
          // Inisialisasi 12 bulan kosong
          const byMonth: Record<string, { neg: number; pos: number; neu: number; total: number }> = {}
          for (let m = 1; m <= 12; m++) {
            byMonth[`${currentYear}-${String(m).padStart(2, '0')}`] = { neg: 0, pos: 0, neu: 0, total: 0 }
          }
          // Isi dari API
          for (const row of json.trend.filter((r: any) => r.provider === prov)) {
            if (!byMonth[row.month]) byMonth[row.month] = { neg: 0, pos: 0, neu: 0, total: 0 }
            byMonth[row.month].neg   += row.neg   ?? 0
            byMonth[row.month].pos   += row.pos   ?? 0
            byMonth[row.month].neu   += row.neu   ?? 0
            byMonth[row.month].total += row.total ?? 0
          }
          const points: TrendPoint[] = Object.keys(byMonth).sort().map((month) => {
            const m = byMonth[month]
            const t = m.total || 1
            return {
              month, neg: m.neg, pos: m.pos, neu: m.neu ?? 0, total: m.total,
              neg_pct: m.total > 0 ? Math.round((m.neg / t) * 1000) / 10 : 0,
              pos_pct: m.total > 0 ? Math.round((m.pos / t) * 1000) / 10 : 0,
            }
          })
          return { provider: prov, color: PROVIDER_COLORS[prov] ?? '#999', points }
        })
        setProviderTrends(trends)
      })
      .catch(() => setProviderTrends([]))
      .finally(() => setTrendLoading(false))
  }, [])

  const filteredTrends = selectedProvider === 'Semua'
    ? providerTrends
    : providerTrends.filter(p => p.provider === selectedProvider)

  const summary = filteredTrends.reduce(
    (acc, provider) => {
      provider.points.forEach((point) => {
        acc.total += point.total
        acc.neg += point.neg
        acc.neu += point.neu
        acc.pos += point.pos
      })
      return acc
    },
    { total: 0, neg: 0, neu: 0, pos: 0 }
  )

  const statCards = [
    { label: 'Total Kalimat',     value: String(summary.total), change: '100%', up: true, icon: Database },
    { label: 'Sentimen Negatif', value: String(summary.neg),   change: summary.total > 0 ? `${((summary.neg / summary.total) * 100).toFixed(1)}%` : '0%', up: false, icon: TrendingDown },
    { label: 'Sentimen Netral',  value: String(summary.neu),   change: summary.total > 0 ? `${((summary.neu / summary.total) * 100).toFixed(1)}%` : '0%', up: true, icon: Activity },
    { label: 'Sentimen Positif', value: String(summary.pos),   change: summary.total > 0 ? `${((summary.pos / summary.total) * 100).toFixed(1)}%` : '0%', up: true, icon: TrendingUp },
  ]

  return (
    <div className="animate-fade-in">

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {selectedProvider !== 'Semua' && (
          <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#3D6B5C', background: '#E1F5EE', padding: '4px 12px', borderRadius: 100, fontWeight: 500 }}>
              📡 Provider: {selectedProvider}
            </span>
          </div>
        )}
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} className="stat-card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#3D6B5C', fontWeight: 500, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 6 }}>
                    {card.label}
                  </p>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600, color: '#085041', letterSpacing: '-0.8px', lineHeight: 1 }}>
                    {card.value}
                  </p>
                </div>
                <div style={{ width: 36, height: 36, background: '#E1F5EE', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="#1D9E75" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                {card.up ? <TrendingUp size={11} color="#1A7A43" /> : <TrendingDown size={11} color="#C0392B" />}
                <span style={{ fontSize: 11, color: card.up ? '#1A7A43' : '#C0392B', fontWeight: 500 }}>{card.change}</span>
                <span style={{ fontSize: 11, color: '#3D6B5C' }}>dari total kalimat</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── GRAFIK TEMPORAL BERBOBOT ── */}
      <div className="card animate-fade-up anim-delay-1" style={{ marginBottom: 24 }}>
        <WeightedTemporalChart
          rawTrend={rawTrend}
          loading={trendLoading}
          selectedProvider={selectedProvider}
        />
      </div>

      {/* ── Analyze History ── */}
      <div className="card animate-fade-up anim-delay-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>Analyze History</p>
            <p style={{ fontSize: 11, color: '#3D6B5C' }}>Riwayat analisis komentar terbaru</p>
          </div>
          <Link href="/dashboard/analisis" style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>
            Lihat Semua →
          </Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #B8DDD2' }}>
              {['Komentar', 'Waktu', 'Status', 'Aspek', 'Sentimen', 'Aksi'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#3D6B5C', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysisHistory.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F4FBF8' }}>
                <td style={{ padding: '11px 12px', fontSize: 13, color: '#042C1E', maxWidth: 280 }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {row.text}
                  </span>
                </td>
                <td style={{ padding: '11px 12px', fontSize: 12, color: '#3D6B5C', whiteSpace: 'nowrap' }}>{row.time}</td>
                <td style={{ padding: '11px 12px' }}>
                  <span className="badge" style={{ background: '#EAF6EF', color: '#1A7A43', fontSize: 11 }}>✓ Executed</span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <span className="badge" style={{ background: '#E1F5EE', color: '#0F6E56' }}>{row.aspect}</span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <span className="badge" style={
                    row.sentiment === 'Positif' ? { background: '#EAF6EF', color: '#1A7A43' } :
                    row.sentiment === 'Negatif' ? { background: '#FEF0F0', color: '#C0392B' } :
                    { background: '#FEF9EC', color: '#A0750A' }
                  }>
                    {row.sentiment}
                  </span>
                </td>
                <td style={{ padding: '11px 12px' }}>
                  <Link
                    href="/dashboard/analisis"
                    style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500, textDecoration: 'none' }}
                  >
                    Buka
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}