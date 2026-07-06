'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  MessageSquareText,
  RefreshCcw,
} from 'lucide-react'

// Brand tokens — selaras dengan LandingPage
const T = {
  primary: '#085041',
  brand:   '#1D9E75',
  accent:  '#5DCAA5',
}

const navItems = [
  { href: '/dashboard/overview',       label: 'Overview',       icon: LayoutDashboard,    description: 'Ringkasan data' },
  { href: '/dashboard/statistik-data', label: 'Statistik Data', icon: BarChart2,           description: 'Grafik & distribusi' },
  { href: '/dashboard/analisis',       label: 'Analisis',       icon: MessageSquareText,   description: 'Prediksi komentar' },
  { href: '/dashboard/sinkronisasi',   label: 'Sinkronisasi',   icon: RefreshCcw,          description: 'Perbarui data' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <aside className="dashboard-sidebar" style={{ background: T.primary }} />
  }

  return (
    <aside className="dashboard-sidebar" style={{ background: T.primary }}>

      {/* ── Logo ── */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: T.brand,
            borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
              <rect x="1"   y="12" width="5" height="8"  rx="1" fill="white" opacity="0.45"/>
              <rect x="8.5" y="7"  width="5" height="13" rx="1" fill="white" opacity="0.72"/>
              <rect x="16"  y="1"  width="5" height="19" rx="1" fill="white"/>
              <circle cx="20" cy="2" r="3"   fill={T.accent} opacity="0.5"/>
              <circle cx="20" cy="2" r="1.5" fill={T.accent}/>
            </svg>
          </div>
          <div>
            <p style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 15, fontWeight: 600,
              color: '#fff', letterSpacing: '-0.3px', lineHeight: 1,
            }}>
              ISP<span style={{ color: T.accent }}>Lens</span>
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.5px' }}>
              ABSA Platform
            </p>
          </div>
        </Link>
      </div>

      {/* ── Nav label ── */}
      <div style={{ padding: '20px 20px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Menu Utama
        </p>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: '0 12px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none',
                background: isActive ? `${T.brand}30` : 'transparent',
                border: isActive ? `1px solid ${T.accent}45` : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: isActive ? `${T.brand}45` : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon
                  size={15}
                  color={isActive ? T.accent : 'rgba(255,255,255,0.45)'}
                  strokeWidth={isActive ? 2 : 1.6}
                />
              </div>
              <div>
                <p style={{
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
                  {item.description}
                </p>
              </div>
              {isActive && (
                <div style={{
                  marginLeft: 'auto',
                  width: 4, height: 4, borderRadius: '50%',
                  background: T.accent,
                }}/>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer info ── */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `${T.brand}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: T.accent,
            flexShrink: 0,
          }}>
            L
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>ISPLens v1.0</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Open Source · PENS 2025</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
