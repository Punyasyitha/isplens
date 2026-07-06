'use client'

import React, { useState, useEffect } from 'react'

// ── Semua data dari blind_test_results.csv ────────────────────────────
const ASPECTS = [
  'Stabilitas Jaringan','Harga','Kemudahan Akses Layanan','Layanan Pelanggan',
  'Penanganan Gangguan','Kecepatan Internet','Instalasi','Keamanan Layanan',
]

type ProviderKey = 'Semua' | 'Indihome' | 'Axis' | 'IM3' | 'ByU' | 'Simpati' | 'Biznet' | 'Indosat' | 'XL'

interface ProviderStats {
  total: number
  neg: number; neu: number; pos: number
  neg_pct: number; neu_pct: number; pos_pct: number
  asp_neg: Record<string, number>
  asp_pos: Record<string, number>
  traffic: Record<string, number>
}

const CSV_STATS: Record<ProviderKey, ProviderStats> = {
  Semua:   { total:395, neg:322, neu:45,  pos:28,  neg_pct:81.5, neu_pct:11.4, pos_pct:7.1,
    asp_neg:{'Stabilitas Jaringan':149,'Harga':41,'Kemudahan Akses Layanan':33,'Layanan Pelanggan':38,'Penanganan Gangguan':32,'Kecepatan Internet':18,'Instalasi':2,'Keamanan Layanan':9},
    asp_pos:{'Stabilitas Jaringan':6,'Harga':4,'Kemudahan Akses Layanan':3,'Layanan Pelanggan':4,'Penanganan Gangguan':0,'Kecepatan Internet':3,'Instalasi':1,'Keamanan Layanan':7},
    traffic:{'Stabilitas Jaringan':39.5,'Harga':12.7,'Kemudahan Akses Layanan':12.2,'Layanan Pelanggan':15.2,'Penanganan Gangguan':8.4,'Kecepatan Internet':5.3,'Instalasi':0.8,'Keamanan Layanan':4.6}},
  Indihome:{ total:122, neg:109, neu:10,  pos:3,   neg_pct:89.3, neu_pct:8.2,  pos_pct:2.5,
    asp_neg:{'Stabilitas Jaringan':49,'Harga':10,'Kemudahan Akses Layanan':9,'Layanan Pelanggan':12,'Penanganan Gangguan':23,'Kecepatan Internet':5,'Instalasi':1,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':1,'Harga':1,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':41.8,'Harga':10.7,'Kemudahan Akses Layanan':8.2,'Layanan Pelanggan':13.1,'Penanganan Gangguan':20.5,'Kecepatan Internet':4.9,'Instalasi':0.8,'Keamanan Layanan':0.0}},
  Axis:    { total:88,  neg:80,  neu:6,   pos:2,   neg_pct:90.9, neu_pct:6.8,  pos_pct:2.3,
    asp_neg:{'Stabilitas Jaringan':42,'Harga':12,'Kemudahan Akses Layanan':6,'Layanan Pelanggan':7,'Penanganan Gangguan':3,'Kecepatan Internet':5,'Instalasi':0,'Keamanan Layanan':5},
    asp_pos:{'Stabilitas Jaringan':1,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':51.1,'Harga':14.8,'Kemudahan Akses Layanan':6.8,'Layanan Pelanggan':11.4,'Penanganan Gangguan':3.4,'Kecepatan Internet':6.8,'Instalasi':0.0,'Keamanan Layanan':5.7}},
  IM3:     { total:56,  neg:42,  neu:8,   pos:6,   neg_pct:75.0, neu_pct:14.3, pos_pct:10.7,
    asp_neg:{'Stabilitas Jaringan':18,'Harga':8,'Kemudahan Akses Layanan':6,'Layanan Pelanggan':5,'Penanganan Gangguan':0,'Kecepatan Internet':2,'Instalasi':1,'Keamanan Layanan':2},
    asp_pos:{'Stabilitas Jaringan':3,'Harga':1,'Kemudahan Akses Layanan':2,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':39.3,'Harga':17.9,'Kemudahan Akses Layanan':23.2,'Layanan Pelanggan':10.7,'Penanganan Gangguan':0.0,'Kecepatan Internet':3.6,'Instalasi':1.8,'Keamanan Layanan':3.6}},
  ByU:     { total:35,  neg:34,  neu:1,   pos:0,   neg_pct:97.1, neu_pct:2.9,  pos_pct:0.0,
    asp_neg:{'Stabilitas Jaringan':20,'Harga':0,'Kemudahan Akses Layanan':6,'Layanan Pelanggan':5,'Penanganan Gangguan':2,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':1},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':57.1,'Harga':0.0,'Kemudahan Akses Layanan':20.0,'Layanan Pelanggan':14.3,'Penanganan Gangguan':5.7,'Kecepatan Internet':0.0,'Instalasi':0.0,'Keamanan Layanan':2.9}},
  Simpati: { total:33,  neg:15,  neu:6,   pos:12,  neg_pct:45.5, neu_pct:18.2, pos_pct:36.4,
    asp_neg:{'Stabilitas Jaringan':2,'Harga':6,'Kemudahan Akses Layanan':2,'Layanan Pelanggan':3,'Penanganan Gangguan':1,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':1},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':1,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':3,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':1,'Keamanan Layanan':7},
    traffic:{'Stabilitas Jaringan':6.1,'Harga':21.2,'Kemudahan Akses Layanan':15.2,'Layanan Pelanggan':27.3,'Penanganan Gangguan':3.0,'Kecepatan Internet':0.0,'Instalasi':3.0,'Keamanan Layanan':24.2}},
  Biznet:  { total:20,  neg:12,  neu:8,   pos:0,   neg_pct:60.0, neu_pct:40.0, pos_pct:0.0,
    asp_neg:{'Stabilitas Jaringan':5,'Harga':1,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':4,'Penanganan Gangguan':2,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':25.0,'Harga':10.0,'Kemudahan Akses Layanan':10.0,'Layanan Pelanggan':40.0,'Penanganan Gangguan':10.0,'Kecepatan Internet':0.0,'Instalasi':5.0,'Keamanan Layanan':0.0}},
  Indosat: { total:12,  neg:8,   neu:2,   pos:2,   neg_pct:66.7, neu_pct:16.7, pos_pct:16.7,
    asp_neg:{'Stabilitas Jaringan':3,'Harga':0,'Kemudahan Akses Layanan':1,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':4,'Instalasi':0,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':1,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':25.0,'Harga':0.0,'Kemudahan Akses Layanan':16.7,'Layanan Pelanggan':8.3,'Penanganan Gangguan':0.0,'Kecepatan Internet':41.7,'Instalasi':0.0,'Keamanan Layanan':8.3}},
  XL:      { total:29,  neg:22,  neu:4,   pos:3,   neg_pct:75.9, neu_pct:13.8, pos_pct:10.3,
    asp_neg:{'Stabilitas Jaringan':10,'Harga':4,'Kemudahan Akses Layanan':3,'Layanan Pelanggan':2,'Penanganan Gangguan':1,'Kecepatan Internet':2,'Instalasi':0,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':1,'Harga':1,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':1,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':37.9,'Harga':17.2,'Kemudahan Akses Layanan':10.3,'Layanan Pelanggan':13.8,'Penanganan Gangguan':3.4,'Kecepatan Internet':6.9,'Instalasi':0.0,'Keamanan Layanan':0.0}},
}

const PROVIDERS: ProviderKey[] = ['Semua','Indihome','Axis','IM3','ByU','Simpati','Biznet','Indosat','XL']

export default function StatistikDataPage() {
  // Baca provider dari URL query param ?provider=xxx yang di-set Topbar
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('Semua')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('provider') as ProviderKey | null
    if (p && CSV_STATS[p]) setSelectedProvider(p)
  }, [])

  // Dengarkan perubahan URL (ketika Topbar update query param)
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search)
      const p = params.get('provider') as ProviderKey | null
      if (p && CSV_STATS[p]) setSelectedProvider(p)
      else setSelectedProvider('Semua')
    }
    window.addEventListener('popstate', handler)
    window.addEventListener('providerchange', handler)
    return () => {
      window.removeEventListener('popstate', handler)
      window.removeEventListener('providerchange', handler)
    }
  }, [])

  const d = CSV_STATS[selectedProvider]

  // Providers to show in peer-to-peer table (exclude 'Semua')
  const peerProviders = PROVIDERS.filter((p) => p !== 'Semua') as Exclude<ProviderKey, 'Semua'>[]

  // Determine which providers to display based on selection
  const displayProviders = selectedProvider === 'Semua' ? peerProviders : [selectedProvider as Exclude<ProviderKey, 'Semua'>]

  // Aspects with at least some data across all displayed providers
  const activeAspects = ASPECTS.filter((asp) =>
    displayProviders.some((p) => (CSV_STATS[p].asp_neg[asp] ?? 0) + (CSV_STATS[p].asp_pos[asp] ?? 0) > 0)
  )

  // Dominant aspect per provider
  const dominantAspect = (p: Exclude<ProviderKey, 'Semua'>) => {
    const stats = CSV_STATS[p]
    return ASPECTS.reduce((best, asp) => {
      const traffic = stats.traffic[asp] ?? 0
      return traffic > (stats.traffic[best] ?? 0) ? asp : best
    }, ASPECTS[0])
  }

  const ASPECT_COLORS: Record<string, string> = {
    'Stabilitas Jaringan':     '#1D9E75',
    'Kecepatan Internet':      '#8E44AD',
    'Harga':                   '#E8A020',
    'Layanan Pelanggan':       '#27AE60',
    'Kemudahan Akses Layanan': '#E67E22',
    'Penanganan Gangguan':     '#E24B4A',
    'Keamanan Layanan':        '#16A085',
    'Instalasi':               '#7F8C8D',
  }

  return (
    <div className="animate-fade-in">

      {/* ── Header + provider filter ── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#085041', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Hasil Eksperimen — Perbandingan Antar Provider
        </p>
        <p style={{ fontSize: 12, color: '#3D6B5C', marginBottom: 14 }}>
          Distribusi aspek dan sentimen komentar pelanggan ISP per provider
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PROVIDERS.map((p) => (
            <button key={p} onClick={() => setSelectedProvider(p)}
              style={{
                fontSize: 11, padding: '5px 12px', borderRadius: 100, cursor: 'pointer',
                border: p === selectedProvider ? '1.5px solid #085041' : '1px solid #B8DDD2',
                background: p === selectedProvider ? '#085041' : '#fff',
                color: p === selectedProvider ? '#fff' : '#3D6B5C',
                fontWeight: p === selectedProvider ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {p === 'Semua' ? 'Semua Provider' : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Peer-to-peer summary table ── */}
      <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBF4EF', display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>Ringkasan per Provider</p>
          <p style={{ fontSize: 11, color: '#3D6B5C' }}>
            {selectedProvider === 'Semua' ? `${peerProviders.length} provider` : selectedProvider} · {d.total} klausa
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F4FBF8' }}>
                {[
                  { label: 'Provider', w: 120 },
                  { label: 'Total Klausa', w: 100 },
                  { label: 'Negatif', w: 90 },
                  { label: 'Netral', w: 90 },
                  { label: 'Positif', w: 90 },
                  { label: 'Aspek Dominan', w: 200 },
                  { label: 'Traffic (%)', w: 100 },
                ].map(({ label, w }) => (
                  <th key={label} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500,
                    color: '#3D6B5C', letterSpacing: '0.5px', textTransform: 'uppercase',
                    borderBottom: '1px solid #B8DDD2', minWidth: w,
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayProviders.map((p, i) => {
                const s = CSV_STATS[p]
                const dom = dominantAspect(p)
                const domColor = ASPECT_COLORS[dom] ?? '#1D9E75'
                const isLast = i === displayProviders.length - 1
                const td = (content: React.ReactNode, extra?: React.CSSProperties) => (
                  <td style={{ padding: '11px 14px', borderBottom: isLast ? 'none' : '1px solid #EBF4EF', verticalAlign: 'middle', ...extra }}>
                    {content}
                  </td>
                )
                return (
                  <tr key={p}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F4FBF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    style={{ transition: 'background 0.1s' }}
                  >
                    {td(<span style={{ fontWeight: 500, color: '#085041' }}>{p}</span>)}
                    {td(<span style={{ color: '#042C1E', fontVariantNumeric: 'tabular-nums' }}>{s.total}</span>)}
                    {td(
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#C0392B', background: '#FEF0F0', border: '1px solid #FADADD', borderRadius: 6, padding: '3px 9px' }}>
                          {s.neg} <span style={{ fontWeight: 400, fontSize: 10 }}>({s.neg_pct}%)</span>
                        </span>
                      </span>
                    )}
                    {td(
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#A0750A', background: '#FEF9EC', border: '1px solid #FDEDC5', borderRadius: 6, padding: '3px 9px' }}>
                        {s.neu} <span style={{ fontWeight: 400, fontSize: 10 }}>({s.neu_pct}%)</span>
                      </span>
                    )}
                    {td(
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#1A7A43', background: '#EAF6EF', border: '1px solid #B8DDD2', borderRadius: 6, padding: '3px 9px' }}>
                        {s.pos} <span style={{ fontWeight: 400, fontSize: 10 }}>({s.pos_pct}%)</span>
                      </span>
                    )}
                    {td(
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: domColor, background: `${domColor}12`, border: `1px solid ${domColor}35`, borderRadius: 6, padding: '3px 9px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: domColor, display: 'inline-block', flexShrink: 0 }} />
                        {dom}
                      </span>
                    )}
                    {td(
                      <span style={{ fontSize: 12, color: '#3D6B5C', fontVariantNumeric: 'tabular-nums' }}>
                        {s.traffic[dom].toFixed(1)}%
                      </span>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Peer-to-peer aspek detail table ── */}
      <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBF4EF' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 2 }}>Detail Aspek per Provider</p>
          <p style={{ fontSize: 11, color: '#3D6B5C' }}>Jumlah klausa negatif dan positif per aspek</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F4FBF8' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#3D6B5C', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid #B8DDD2', minWidth: 200 }}>
                  Aspek
                </th>
                {displayProviders.map((p) => (
                  <th key={p} colSpan={2} style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: '#3D6B5C', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid #B8DDD2', borderLeft: '1px solid #EBF4EF', minWidth: 110 }}>
                    {p}
                  </th>
                ))}
              </tr>
              <tr style={{ background: '#FAFCFB' }}>
                <td style={{ padding: '7px 14px', borderBottom: '1px solid #EBF4EF' }} />
                {displayProviders.map((p) => (
                  <React.Fragment key={p}>
                    <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 10, color: '#C0392B', fontWeight: 500, borderBottom: '1px solid #EBF4EF', borderLeft: '1px solid #EBF4EF' }}>NEG</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 10, color: '#1A7A43', fontWeight: 500, borderBottom: '1px solid #EBF4EF' }}>POS</td>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeAspects.map((asp, i) => {
                const aspColor = ASPECT_COLORS[asp] ?? '#1D9E75'
                const isLast = i === activeAspects.length - 1
                return (
                  <tr key={asp}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F4FBF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    style={{ transition: 'background 0.1s' }}
                  >
                    <td style={{ padding: '10px 14px', borderBottom: isLast ? 'none' : '1px solid #EBF4EF' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#042C1E' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: aspColor, display: 'inline-block', flexShrink: 0 }} />
                        {asp}
                      </span>
                    </td>
                    {displayProviders.map((p) => {
                      const neg = CSV_STATS[p].asp_neg[asp] ?? 0
                      const pos = CSV_STATS[p].asp_pos[asp] ?? 0
                      return (
                        <React.Fragment key={p}>
                          <td style={{ padding: '10px 10px', textAlign: 'center', borderBottom: isLast ? 'none' : '1px solid #EBF4EF', borderLeft: '1px solid #EBF4EF' }}>
                            {neg > 0
                              ? <span style={{ fontSize: 12, fontWeight: 500, color: '#C0392B', background: '#FEF0F0', borderRadius: 5, padding: '2px 8px' }}>{neg}</span>
                              : <span style={{ fontSize: 12, color: '#B8DDD2' }}>—</span>
                            }
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', borderBottom: isLast ? 'none' : '1px solid #EBF4EF' }}>
                            {pos > 0
                              ? <span style={{ fontSize: 12, fontWeight: 500, color: '#1A7A43', background: '#EAF6EF', borderRadius: 5, padding: '2px 8px' }}>{pos}</span>
                              : <span style={{ fontSize: 12, color: '#B8DDD2' }}>—</span>
                            }
                          </td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sentimen stacked bar per provider ── */}
      <div className="card animate-fade-up" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 2 }}>Distribusi Sentimen per Provider</p>
          <p style={{ fontSize: 11, color: '#3D6B5C' }}>Proporsi negatif · netral · positif dari total klausa</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayProviders.map((p) => {
            const s = CSV_STATS[p]
            return (
              <div key={p}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#085041', minWidth: 90 }}>{p}</span>
                  <span style={{ fontSize: 11, color: '#3D6B5C' }}>{s.total} klausa</span>
                </div>
                <div style={{ height: 22, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${s.neg_pct}%`, background: '#E24B4A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.neg_pct >= 8 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>{s.neg_pct}%</span>}
                  </div>
                  <div style={{ width: `${s.neu_pct}%`, background: '#E8A020', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.neu_pct >= 8 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>{s.neu_pct}%</span>}
                  </div>
                  <div style={{ width: `${s.pos_pct}%`, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.pos_pct >= 8 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>{s.pos_pct}%</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          {[['#E24B4A', 'Negatif'], ['#E8A020', 'Netral'], ['#1D9E75', 'Positif']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: '#3D6B5C' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
