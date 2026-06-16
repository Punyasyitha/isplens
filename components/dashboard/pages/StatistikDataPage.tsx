'use client'

import { useState, useEffect } from 'react'

// ── Semua data dari blind_test_results.csv ────────────────────────────
const ASPECTS = [
  'Stabilitas Jaringan','Harga','Kemudahan Akses Layanan','Layanan Pelanggan',
  'Penanganan Gangguan','Kecepatan Internet','Instalasi','Keamanan Layanan',
]

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

const PROVIDERS: ProviderKey[] = ['Semua','Indihome','Axis','IM3','ByU','Simpati','Biznet','Indosat']

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

  // Bar chart aspects
  const aspects = ASPECTS.map((label) => ({
    label,
    neg: d.asp_neg[label] ?? 0,
    pos: d.asp_pos[label] ?? 0,
  })).filter((a) => a.neg + a.pos > 0)

  const maxVal = Math.max(...aspects.flatMap((a) => [a.neg, a.pos]), 1)

  const sentimentSummary = [
    { label: 'Negatif', pct: d.neg_pct, count: d.neg, color: '#E24B4A', ring: '#FADADD' },
    { label: 'Netral',  pct: d.neu_pct, count: d.neu, color: '#E8A020', ring: '#FEF3DC' },
    { label: 'Positif', pct: d.pos_pct, count: d.pos, color: '#1D9E75', ring: '#D5F5E3' },
  ]

  return (
    <div className="animate-fade-in">

      {/* ── Provider info strip ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#3D6B5C' }}>Menampilkan data untuk:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#085041', background: '#E1F5EE', padding: '4px 12px', borderRadius: 100 }}>
            {selectedProvider === 'Semua' ? 'Semua Provider' : selectedProvider}
          </span>
          <span style={{ fontSize: 12, color: '#3D6B5C' }}>— {d.total} klausa</span>
        </div>

        {/* Provider tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PROVIDERS.map((p) => (
            <button key={p} onClick={() => setSelectedProvider(p)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 100, cursor: 'pointer',
                border: p === selectedProvider ? '1px solid #1D9E75' : '1px solid #B8DDD2',
                background: p === selectedProvider ? '#1D9E75' : '#fff',
                color: p === selectedProvider ? '#fff' : '#3D6B5C',
                fontWeight: p === selectedProvider ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {p === 'Semua' ? 'Semua' : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <div className="card animate-fade-up" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600, color: '#085041', letterSpacing: '-0.3px', marginBottom: 4 }}>
            Grafik Persebaran Klasifikasi Aspek
          </p>
          <p style={{ fontSize: 12, color: '#3D6B5C' }}>
            Distribusi komentar positif vs negatif per aspek
            {selectedProvider !== 'Semua' && ` — ${selectedProvider}`}
            {' '}({d.total} klausa total)
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, background: '#E24B4A', borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: '#3D6B5C' }}>Negatif</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, background: '#1D9E75', borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: '#3D6B5C' }}>Positif</span>
          </div>
        </div>

        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {aspects.map((asp) => (
            <div key={asp.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#3D6B5C', minWidth: 200 }}>{asp.label}</span>
                <span style={{ fontSize: 11, color: '#3D6B5C' }}>{asp.neg + asp.pos} total</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {/* Negatif */}
                <div style={{ flex: 1, height: 18, background: '#FEF0F0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  {asp.neg > 0 && (
                    <div style={{ position:'absolute', right:0, top:0, height:'100%', width:`${(asp.neg/maxVal)*100}%`, background:'#E24B4A', borderRadius:4 }} />
                  )}
                  <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#C0392B', fontWeight:500 }}>
                    {asp.neg}
                  </span>
                </div>
                {/* Positif */}
                <div style={{ flex: 1, height: 18, background: '#E1F5EE', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                  {asp.pos > 0 && (
                    <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(asp.pos/maxVal)*100}%`, background:'#1D9E75', borderRadius:4 }} />
                  )}
                  <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#0F6E56', fontWeight:500 }}>
                    {asp.pos}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sentiment Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {sentimentSummary.map((item, i) => (
          <div key={i} className="card animate-fade-up" style={{ animationDelay: `${i * 0.1 + 0.2}s`, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <svg viewBox="0 0 90 90" width={90} height={90}>
                  <circle cx="45" cy="45" r="36" fill="none" stroke={item.ring} strokeWidth="10" />
                  <circle cx="45" cy="45" r="36" fill="none" stroke={item.color} strokeWidth="10"
                    strokeDasharray={`${(item.pct / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                    strokeDashoffset={2 * Math.PI * 36 * 0.25}
                    transform="rotate(-90 45 45)"
                  />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'Playfair Display, serif', fontSize:18, fontWeight:600, color:item.color, lineHeight:1 }}>
                    {item.pct}%
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#085041', marginBottom: 4 }}>{item.label}</p>
            <p style={{ fontSize: 12, color: '#3D6B5C' }}>{item.count} klausa</p>
            <p style={{ fontSize: 11, color: '#3D6B5C', marginTop: 6, lineHeight: 1.5 }}>
              Sentimen {item.label} dari {d.total} klausa
              {selectedProvider !== 'Semua' && ` ${selectedProvider}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
