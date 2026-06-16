'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, MessageSquare, Activity, Database, ChevronDown } from 'lucide-react'

// ── Semua data dihitung langsung dari blind_test_results.csv ──────────
const ASPECTS = [
  'Stabilitas Jaringan', 'Harga', 'Kemudahan Akses Layanan', 'Layanan Pelanggan',
  'Penanganan Gangguan', 'Kecepatan Internet', 'Instalasi', 'Keamanan Layanan',
]

const ASPECT_COLORS: Record<string, string> = {
  'Stabilitas Jaringan':    '#1D9E75',
  'Harga':                  '#E8A020',
  'Kemudahan Akses Layanan':'#8E44AD',
  'Layanan Pelanggan':      '#1A7A43',
  'Penanganan Gangguan':    '#E67E22',
  'Kecepatan Internet':     '#C0392B',
  'Instalasi':              '#7F8C8D',
  'Keamanan Layanan':       '#16A085',
}

type ProviderKey = 'Semua' | 'Indihome' | 'Axis' | 'IM3' | 'ByU' | 'Simpati' | 'Biznet' | 'Indosat'

interface ProviderStats {
  total: number
  neg: number; neu: number; pos: number
  neg_pct: number; neu_pct: number; pos_pct: number
  asp_neg: Record<string, number>
  asp_pos: Record<string, number>
  traffic: Record<string, number>
}

const CSV_STATS: Record<ProviderKey, ProviderStats> = {
  Semua:   { total:366, neg:207, neu:145, pos:14,  neg_pct:56.6, neu_pct:39.6, pos_pct:3.8,
    asp_neg:{'Stabilitas Jaringan':129,'Harga':20,'Kemudahan Akses Layanan':24,'Layanan Pelanggan':10,'Penanganan Gangguan':10,'Kecepatan Internet':10,'Instalasi':3,'Keamanan Layanan':1},
    asp_pos:{'Stabilitas Jaringan':5,'Harga':1,'Kemudahan Akses Layanan':2,'Layanan Pelanggan':0,'Penanganan Gangguan':2,'Kecepatan Internet':2,'Instalasi':0,'Keamanan Layanan':2},
    traffic:{'Stabilitas Jaringan':46.4,'Harga':15.8,'Kemudahan Akses Layanan':14.5,'Layanan Pelanggan':7.1,'Penanganan Gangguan':6.6,'Kecepatan Internet':3.6,'Instalasi':3.0,'Keamanan Layanan':3.0}},
  Indihome:{ total:122, neg:72,  neu:47,  pos:3,   neg_pct:59.0, neu_pct:38.5, pos_pct:2.5,
    asp_neg:{'Stabilitas Jaringan':46,'Harga':6,'Kemudahan Akses Layanan':3,'Layanan Pelanggan':5,'Penanganan Gangguan':7,'Kecepatan Internet':4,'Instalasi':1,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':1,'Layanan Pelanggan':0,'Penanganan Gangguan':1,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':48.4,'Harga':14.8,'Kemudahan Akses Layanan':6.6,'Layanan Pelanggan':9.8,'Penanganan Gangguan':12.3,'Kecepatan Internet':4.9,'Instalasi':1.6,'Keamanan Layanan':1.6}},
  Axis:    { total:87,  neg:58,  neu:28,  pos:1,   neg_pct:66.7, neu_pct:32.2, pos_pct:1.1,
    asp_neg:{'Stabilitas Jaringan':38,'Harga':7,'Kemudahan Akses Layanan':10,'Layanan Pelanggan':0,'Penanganan Gangguan':1,'Kecepatan Internet':2,'Instalasi':0,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':1,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':57.5,'Harga':16.1,'Kemudahan Akses Layanan':17.2,'Layanan Pelanggan':2.3,'Penanganan Gangguan':1.1,'Kecepatan Internet':2.3,'Instalasi':2.3,'Keamanan Layanan':1.1}},
  IM3:     { total:57,  neg:31,  neu:21,  pos:5,   neg_pct:54.4, neu_pct:36.8, pos_pct:8.8,
    asp_neg:{'Stabilitas Jaringan':17,'Harga':5,'Kemudahan Akses Layanan':4,'Layanan Pelanggan':1,'Penanganan Gangguan':1,'Kecepatan Internet':2,'Instalasi':1,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':3,'Harga':1,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':40.4,'Harga':24.6,'Kemudahan Akses Layanan':14.0,'Layanan Pelanggan':3.5,'Penanganan Gangguan':5.3,'Kecepatan Internet':5.3,'Instalasi':7.0,'Keamanan Layanan':0.0}},
  ByU:     { total:35,  neg:27,  neu:8,   pos:0,   neg_pct:77.1, neu_pct:22.9, pos_pct:0.0,
    asp_neg:{'Stabilitas Jaringan':21,'Harga':0,'Kemudahan Akses Layanan':3,'Layanan Pelanggan':1,'Penanganan Gangguan':1,'Kecepatan Internet':0,'Instalasi':1,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':65.7,'Harga':5.7,'Kemudahan Akses Layanan':14.3,'Layanan Pelanggan':5.7,'Penanganan Gangguan':2.9,'Kecepatan Internet':0.0,'Instalasi':2.9,'Keamanan Layanan':2.9}},
  Simpati: { total:33,  neg:7,   neu:21,  pos:5,   neg_pct:21.2, neu_pct:63.6, pos_pct:15.2,
    asp_neg:{'Stabilitas Jaringan':3,'Harga':1,'Kemudahan Akses Layanan':2,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':1},
    asp_pos:{'Stabilitas Jaringan':1,'Harga':0,'Kemudahan Akses Layanan':1,'Layanan Pelanggan':0,'Penanganan Gangguan':1,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':2},
    traffic:{'Stabilitas Jaringan':15.2,'Harga':15.2,'Kemudahan Akses Layanan':27.3,'Layanan Pelanggan':6.1,'Penanganan Gangguan':9.1,'Kecepatan Internet':0.0,'Instalasi':6.1,'Keamanan Layanan':21.2}},
  Biznet:  { total:20,  neg:8,   neu:12,  pos:0,   neg_pct:40.0, neu_pct:60.0, pos_pct:0.0,
    asp_neg:{'Stabilitas Jaringan':1,'Harga':1,'Kemudahan Akses Layanan':2,'Layanan Pelanggan':3,'Penanganan Gangguan':0,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':10.0,'Harga':15.0,'Kemudahan Akses Layanan':35.0,'Layanan Pelanggan':30.0,'Penanganan Gangguan':5.0,'Kecepatan Internet':5.0,'Instalasi':0.0,'Keamanan Layanan':0.0}},
  Indosat: { total:12,  neg:4,   neu:8,   pos:0,   neg_pct:33.3, neu_pct:66.7, pos_pct:0.0,
    asp_neg:{'Stabilitas Jaringan':3,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':1,'Instalasi':0,'Keamanan Layanan':0},
    asp_pos:{'Stabilitas Jaringan':0,'Harga':0,'Kemudahan Akses Layanan':0,'Layanan Pelanggan':0,'Penanganan Gangguan':0,'Kecepatan Internet':0,'Instalasi':0,'Keamanan Layanan':0},
    traffic:{'Stabilitas Jaringan':66.7,'Harga':16.7,'Kemudahan Akses Layanan':8.3,'Layanan Pelanggan':0.0,'Penanganan Gangguan':0.0,'Kecepatan Internet':8.3,'Instalasi':0.0,'Keamanan Layanan':0.0}},
}

// Provider bar chart — distribusi klausa per provider (relatif terhadap max=122)
const PROVIDER_BARS = [
  { name: 'Indihome', total: 122, fill: 100 },
  { name: 'Axis',     total:  87, fill:  71 },
  { name: 'IM3',      total:  57, fill:  46 },
  { name: 'ByU',      total:  35, fill:  28 },
  { name: 'Simpati',  total:  33, fill:  27 },
  { name: 'Biznet',   total:  20, fill:  16 },
  { name: 'Indosat',  total:  12, fill:   9 },
]

// Analyze history — 4 baris dari data CSV nyata
const ANALYZE_HISTORY = [
  { text: 'Biznet makin sini makin ga karuan jaringannya, kecepatan 12 mbps',   time: '10/12', aspect: 'Stabilitas Jaringan', sentiment: 'Negatif' },
  { text: 'Keluhan Indihome 4 hari tidak ditangani, tidak ada follow up',       time: '10/14', aspect: 'Penanganan Gangguan', sentiment: 'Negatif' },
  { text: 'Paket Ramadan IM3 worth it, kenceng dan harga terjangkau',           time: '10/07', aspect: 'Harga',               sentiment: 'Positif' },
  { text: 'Sinyal Axis 3 hari gaada terus, sangat mengganggu aktivitas kerja',  time: '10/18', aspect: 'Stabilitas Jaringan', sentiment: 'Negatif' },
]

const PROVIDERS: ProviderKey[] = ['Semua', 'Indihome', 'Axis', 'IM3', 'ByU', 'Simpati', 'Biznet', 'Indosat']

export default function OverviewPage() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('Semua')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const d = CSV_STATS[selectedProvider]

  // Stat cards — computed from selected provider
  const statCards = [
    { label: 'Total Klausa',     value: String(d.total),   change: '100%',              up: true,  icon: Database },
    { label: 'Sentimen Negatif', value: String(d.neg),     change: `${d.neg_pct}%`,     up: false, icon: TrendingDown },
    { label: 'Sentimen Netral',  value: String(d.neu),     change: `${d.neu_pct}%`,     up: true,  icon: Activity },
    { label: 'Sentimen Positif', value: String(d.pos),     change: `${d.pos_pct}%`,     up: true,  icon: TrendingUp },
  ]

  // Traffic by aspect — dari data provider terpilih
  const trafficByAspect = ASPECTS.map((asp) => ({
    label: asp,
    pct: d.traffic[asp] ?? 0,
    color: ASPECT_COLORS[asp],
  })).filter((a) => a.pct > 0).sort((a, b) => b.pct - a.pct)

  return (
    <div className="animate-fade-in">

      {/* ── Provider Selector ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#085041', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5DCAA5', display: 'inline-block' }} />
          {selectedProvider === 'Semua' ? 'Semua Provider' : selectedProvider}
          <ChevronDown size={13} style={{ opacity: 0.7 }} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: '#fff', border: '1px solid #B8DDD2', borderRadius: 10,
            minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden', zIndex: 100,
          }}>
            {PROVIDERS.map((p) => (
              <button key={p} onClick={() => { setSelectedProvider(p); setDropdownOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '9px 16px',
                  textAlign: 'left', fontSize: 13, border: 'none', cursor: 'pointer',
                  color: p === selectedProvider ? '#1D9E75' : '#042C1E',
                  background: p === selectedProvider ? '#E1F5EE' : 'transparent',
                  fontWeight: p === selectedProvider ? 500 : 400,
                }}
              >
                {p === 'Semua' ? 'Semua Provider' : p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
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
                <span style={{ fontSize: 11, color: '#3D6B5C' }}>dari total klausa</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 24 }}>

        {/* Provider distribution (only on Semua) / Aspek breakdown (on specific provider) */}
        <div className="card animate-fade-up anim-delay-2">
          {selectedProvider === 'Semua' ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 4 }}>Distribusi Klausa per Provider</p>
              <p style={{ fontSize: 11, color: '#3D6B5C', marginBottom: 20 }}>Total 366 klausa dari 7 provider ISP</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PROVIDER_BARS.map((p) => (
                  <div key={p.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#3D6B5C', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: '#3D6B5C' }}>{p.total} klausa</span>
                    </div>
                    <div style={{ height: 8, background: '#E1F5EE', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ width: `${p.fill}%`, height: '100%', background: '#1D9E75', borderRadius: 100 }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 4 }}>
                Breakdown Aspek — {selectedProvider}
              </p>
              <p style={{ fontSize: 11, color: '#3D6B5C', marginBottom: 20 }}>
                {d.total} klausa · Negatif {d.neg_pct}% · Netral {d.neu_pct}% · Positif {d.pos_pct}%
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ASPECTS.map((asp) => {
                  const neg = d.asp_neg[asp] ?? 0
                  const pos = d.asp_pos[asp] ?? 0
                  const total = neg + pos
                  if (total === 0) return null
                  const maxAsp = Math.max(...ASPECTS.map((a) => (d.asp_neg[a] ?? 0) + (d.asp_pos[a] ?? 0)))
                  return (
                    <div key={asp}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#3D6B5C', fontWeight: 500 }}>{asp}</span>
                        <span style={{ fontSize: 11, color: '#3D6B5C' }}>
                          <span style={{ color: '#C0392B' }}>↓{neg}</span>
                          {pos > 0 && <span style={{ color: '#1D9E75', marginLeft: 6 }}>↑{pos}</span>}
                        </span>
                      </div>
                      <div style={{ height: 8, background: '#E1F5EE', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ width: `${(total / maxAsp) * 100}%`, height: '100%', background: ASPECT_COLORS[asp], borderRadius: 100 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Donut — Traffic by Aspect */}
        <div className="card animate-fade-up anim-delay-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 4 }}>Traffic by Aspek</p>
          <p style={{ fontSize: 11, color: '#3D6B5C', marginBottom: 16 }}>
            {selectedProvider === 'Semua' ? '366 klausa total' : `${d.total} klausa · ${selectedProvider}`}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <svg viewBox="0 0 100 100" width={100} height={100}>
              {(() => {
                let offset = 0
                return trafficByAspect.map((item, i) => {
                  const circumference = 2 * Math.PI * 35
                  const strokeDash = (item.pct / 100) * circumference
                  const el = (
                    <circle key={i} cx="50" cy="50" r="35" fill="none"
                      stroke={item.color} strokeWidth="12"
                      strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                      strokeDashoffset={-offset} transform="rotate(-90 50 50)"
                    />
                  )
                  offset += strokeDash
                  return el
                })
              })()}
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {trafficByAspect.map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#3D6B5C', flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#085041' }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Analyze History ── */}
      <div className="card animate-fade-up anim-delay-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>Analyze History</p>
            <p style={{ fontSize: 11, color: '#3D6B5C' }}>Riwayat analisis komentar terbaru</p>
          </div>
          <a href="/dashboard/analisis" style={{ fontSize: 12, color: '#1D9E75', textDecoration: 'none', fontWeight: 500 }}>
            Lihat Semua →
          </a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #B8DDD2' }}>
              {['Komentar', 'Waktu', 'Status', 'Aspek', 'Sentimen'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 500, color: '#3D6B5C', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ANALYZE_HISTORY.map((row, i) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
