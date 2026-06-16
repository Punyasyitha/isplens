'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, ChevronDown } from 'lucide-react'

// Brand tokens — selaras dengan LandingPage
const T = {
  primary:   '#085041',
  brand:     '#1D9E75',
  accent:    '#5DCAA5',
  muted:     '#E1F5EE',
  text:      '#042C1E',
  textMuted: '#3D6B5C',
  border:    '#B8DDD2',
  surface:   '#F4FBF8',
}

const ISP_PROVIDERS = ['Semua Provider', 'IndiHome', 'Biznet', 'Telkomsel', 'Indosat', 'IM3', 'by.U', 'AXIS', 'Simpati']

const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  '/dashboard/overview':       { title: 'Overview',        desc: 'Ringkasan data ulasa pelanggan Internet Service Provider' },
  '/dashboard/statistik-data': { title: 'Statistik Data',  desc: 'Visualisasi distribusi aspek dan sentimen tiap provider' },
  '/dashboard/analisis':       { title: 'Analisis',        desc: 'Analisis aspek & sentimen ulasan pelanggan terhadap layanan ISP' },
  '/dashboard/sinkronisasi':   { title: 'Sinkronisasi',    desc: 'Perbarui data ulasan terbaru dari akun Instagram resmi ISP' },
}

export default function Topbar() {
  const pathname = usePathname()
  const [selectedISP, setSelectedISP] = useState('Semua Provider')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const pageInfo = PAGE_TITLES[pathname] ?? { title: 'Dashboard', desc: 'ISPLens' }

  // Dropdown provider hanya tampil di halaman Statistik Data
  // const showProviderDropdown = pathname === '/dashboard/statistik-data'

  return (
    <header style={{
      height: 64,
      background: '#fff',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky', top: 0, zIndex: 40,
    }}>

      {/* ── Page Title ── */}
      <div>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 17, fontWeight: 600,
          color: T.primary, letterSpacing: '-0.3px', lineHeight: 1.2,
        }}>
          {pageInfo.title}
        </h1>
        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
          {pageInfo.desc}
        </p>
      </div>

      {/* ── Right Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 8, padding: '7px 14px', width: 200,
        }}>
          <Search size={13} color={T.textMuted} />
          <input
            type="text"
            placeholder="Cari komentar..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 12, color: T.text, width: '100%',
            }}
          />
        </div>

        {/* Provider Selector — hanya tampil di halaman Statistik Data */}
        {/* {showProviderDropdown && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: T.primary, color: '#fff',
                border: 'none', borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', letterSpacing: '0.1px',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: T.accent, display: 'inline-block',
              }}/>
              {selectedISP}
              <ChevronDown size={12} style={{ opacity: 0.6 }}/>
            </button>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: '#fff',
                border: `1px solid ${T.border}`,
                borderRadius: 10, minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                overflow: 'hidden', zIndex: 100,
              }}>
                {ISP_PROVIDERS.map((isp) => (
                  <button
                    key={isp}
                    onClick={() => { setSelectedISP(isp); setIsDropdownOpen(false) }}
                    style={{
                      display: 'block', width: '100%',
                      padding: '9px 16px', textAlign: 'left',
                      fontSize: 13,
                      color: isp === selectedISP ? T.brand : T.text,
                      background: isp === selectedISP ? T.muted : 'transparent',
                      border: 'none', cursor: 'pointer',
                      fontWeight: isp === selectedISP ? 500 : 400,
                      transition: 'background 0.15s',
                    }}
                  >
                    {isp}
                  </button>
                ))}
              </div>
            )}
          </div>
        )} */}
      </div>
    </header>
  )
}
