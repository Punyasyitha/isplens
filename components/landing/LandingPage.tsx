'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'

// ── BRAND TOKENS ──────────────────────────────────────────
const T = {
  primary:   '#085041',
  dark:      '#0F6E56',
  brand:     '#1D9E75',
  accent:    '#5DCAA5',
  light:     '#9FE1CB',
  muted:     '#E1F5EE',
  surface:   '#F4FBF8',
  text:      '#042C1E',
  textMuted: '#3D6B5C',
  border:    '#B8DDD2',
  pos:       '#1D9E75',
  neg:       '#E24B4A',
  neu:       '#EF9F27',
}

const NAV_LINKS = ['Fitur', 'Aspek Analisis', 'Cara Kerja', 'FAQ']

const FEATURES = [
  { icon: '◎', name: 'Aspect-Based Analysis',  desc: 'Identifikasi sentimen untuk setiap aspek layanan secara terpisah pada suatu teks.' },
  { icon: '▲', name: 'Visualisasi Interaktif',  desc: 'Dashboard dengan grafik dan tren sentimen per aspek yang mudah dipahami stakeholder atau pengguna.' },
  { icon: '↻', name: 'Sinkronisasi',            desc: 'Proses update data ulasan dengan melakukan sinkronisasi dari akun Instagram resmi ISP.' },
  { icon: '⊞', name: 'Perbandingan ISP',        desc: 'Bandingkan sentimen dan aspek antar provider ISP berbeda untuk analisis kompetitif yang mendalam.' },
  { icon: '▤', name: 'Ekspor Laporan',          desc: 'Ekspor hasil analisis ke PDF, Excel, atau JSON untuk meninjau lebih dalam hasil analisis yang diinginkan.' },
  { icon: '⬡', name: 'REST API Backend',        desc: 'Python FastAPI backend yang dapat diintegrasikan langsung ke sistem internal.' },
]

const ASPECTS = [
  { emoji: '⚡',  name: 'Kecepatan Internet',       desc: 'Analisis keluhan & pujian terkait kecepatan download/upload dan konsistensi koneksi.', tag: 'Speed' },
  { emoji: '💰',  name: 'Harga',                    desc: 'Sentimen pelanggan terhadap keterjangkauan tarif, promo, dan nilai paket yang ditawarkan.', tag: 'Pricing' },
  { emoji: '📡',  name: 'Stabilitas Jaringan',      desc: 'Deteksi keluhan gangguan, downtime, sinyal lemah, dan kualitas konektivitas secara umum.', tag: 'Network Quality' },
  { emoji: '🎧',  name: 'Layanan Pelanggan',        desc: 'Evaluasi respons, ketanggapan CS, dan pengalaman after-sales service.', tag: 'Customer Service' },
  { emoji: '🔧',  name: 'Instalasi',                desc: 'Penilaian terhadap proses pemasangan, kualitas perangkat, dan ketepatan teknisi di lokasi pelanggan.', tag: 'Installation' },
  { emoji: '🔒',  name: 'Keamanan Layanan',         desc: 'Sentimen terkait perlindungan data, privasi pengguna, dan keamanan jaringan dari ancaman siber.', tag: 'Security' },
  { emoji: '📱',  name: 'Kemudahan Akses Layanan',  desc: 'Penilaian seberapa mudah pelanggan mengakses, mengelola, dan memanfaatkan layanan yang disediakan.', tag: 'Accessibility' },
  { emoji: '🛠️', name: 'Penanganan Gangguan',       desc: 'Evaluasi kecepatan dan ketepatan ISP dalam merespons serta memperbaiki gangguan jaringan.', tag: 'Troubleshooting' },
]

const STEPS = [
  { n: '1', title: 'Input Ulasan',                  desc: 'Masukkan teks ulasan pelanggan secara manual pada kolom yang tertera.' },
  { n: '2', title: 'Klasifikasi Aspek & Sentimen',  desc: 'Model mengidentifikasi aspek yang dibahas dan menentukan polaritas sentimennya.' },
  { n: '3', title: 'Confidence',                    desc: 'Muncul nilai akurasi confidence score dari tiap aspek dan sentimen yang berhasil diklasifikasikan.' },
  { n: '4', title: 'Visualisasi Hasil',             desc: 'Hasil tampil dalam bentuk kolom untuk mewakili tiap klausa yang mengandung multi-aspek & multi-sentimen.' },
]

const FAQ_ITEMS = [
  {
    q: 'Apa itu ABSA?',
    a: 'Aspect-Based Sentiment Analysis (ABSA) adalah pendekatan analisis sentimen yang tidak hanya menentukan sentimen positif, negatif, atau netral secara keseluruhan, tetapi juga mengidentifikasi aspek spesifik yang menjadi objek ulasan tersebut. ABSA mampu mengenali beberapa aspek sekaligus secara terpisah.',
  },
  {
    q: 'Bagaimana pendekatan Aspect-Based Sentiment pada teks ulasan?',
    a: 'Pada kasus tertentu, satu ulasan sering memuat lebih dari satu aspek dengan sentimen berbeda, teks terlebih dahulu dipecah menjadi klausa-klausa yang lebih kecil menggunakan segmentasi berbasis konjungsi. Setiap klausa kemudian dianalisis secara oleh model klasifikasi aspek untuk menentukan topik yang dibahas dan model klasifikasi sentimen untuk menentukan polaritasnya. Pendekatan ini memungkinkan sistem menangani komentar multi-aspek dan multi-sentimen secara akurat.',
  },
  {
    q: 'Mengapa studi kasus menggunakan teks ulasan pada perusahaan Internet Service Provider?',
    a: 'Layanan Internet Service Provider di Indonesia masih sering dikeluhkan pelanggan. Komentar pelanggan tersebar luas di media sosial, salah satunya, Instagram dalam volume besar, bersifat tidak terstruktur, dan mustahil dianalisis secara manual. ISP menjadi domain yang tepat karena memiliki aspek layanan yang jelas dan relevan, serta memberikan insight yang secara langsung kepada calon pelanggan, agar dapat memilih ISP yang sesuai kebutuhan.',
  },
]

// ── LOGO COMPONENT ────────────────────────────────────────
function ISPLensLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
      <span style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 17, fontWeight: 600,
        color: dark ? '#fff' : T.primary,
        letterSpacing: '-0.3px',
      }}>
        ISP<span style={{ color: T.accent }}>Lens</span>
      </span>
    </div>
  )
}

// ── FAQ COMPONENT ─────────────────────────────────────────
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" style={{ background: T.surface, padding: '90px 48px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.brand, marginBottom: 12 }}>FAQ</p>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 600, color: T.primary, letterSpacing: '-0.4px', marginBottom: 14 }}>
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.75, maxWidth: 480, margin: '0 auto' }}>
            Belum menemukan jawaban yang dicari? Lihat dokumentasi lengkap di GitHub.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} style={{
                background: '#fff',
                border: `1px solid ${isOpen ? T.brand : T.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 16,
                    padding: '18px 22px', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: T.primary, lineHeight: 1.5 }}>
                    {item.q}
                  </span>
                  <span style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                    background: isOpen ? T.brand : T.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 300,
                    color: isOpen ? '#fff' : T.brand,
                    transition: 'background 0.2s, color 0.2s',
                    lineHeight: 1,
                  }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <div style={{
                  maxHeight: isOpen ? 300 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}>
                  <p style={{
                    fontSize: 13, color: T.textMuted, lineHeight: 1.75,
                    padding: '14px 22px 18px',
                    borderTop: `1px solid ${T.border}`,
                  }}>
                    {item.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function LandingPage() {
  const [_menuOpen, setMenuOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, scrollLeft: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.pageX, scrollLeft: scrollRef.current?.scrollLeft ?? 0 }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    const dx = e.pageX - dragStart.current.x
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: T.text, background: '#fff', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.border}`,
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px',
      }}>
        <ISPLensLogo dark={false} />
        <ul style={{ display: 'flex', gap: 28, listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_LINKS.map((l) => (
            <li key={l}>
              <a href={`#${l.toLowerCase().replace(' ', '-')}`}
                style={{ fontSize: 13, fontWeight: 500, color: T.textMuted, textDecoration: 'none' }}>
                {l}
              </a>
            </li>
          ))}
        </ul>
        <Link href="/dashboard/overview" style={{
          background: T.brand, color: '#fff', fontSize: 13, fontWeight: 500,
          padding: '9px 20px', borderRadius: 8, textDecoration: 'none',
        }}>
          Buka Dashboard →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', background: T.primary, position: 'relative',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
        padding: '100px 48px 80px',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}/>
        <div style={{ position:'absolute', top:-80, right:-80, width:500, height:500, background:`radial-gradient(circle,${T.brand}30 0%,transparent 70%)`, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-120, left:-40, width:420, height:420, background:`radial-gradient(circle,${T.accent}18 0%,transparent 70%)`, pointerEvents:'none' }}/>

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${T.brand}25`, border: `1px solid ${T.accent}50`,
              borderRadius: 100, padding: '6px 14px', marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, display: 'inline-block', animation: 'pulse 2s infinite' }}/>
              <span style={{ fontSize: 11, fontWeight: 500, color: T.accent, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Open Source · ABSA Platform
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif', fontSize: 46, lineHeight: 1.18,
              fontWeight: 600, color: '#fff', marginBottom: 20, letterSpacing: '-0.5px',
            }}>
              Analisis Sentimen<br/>
              <span style={{ color: T.accent }}>Berbasis Aspek</span><br/>
              untuk Layanan ISP
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.62)', marginBottom: 36, fontWeight: 300 }}>
              Platform cerdas untuk menganalisis ulasan pelanggan terhadap aspek-aspek spesifik layanan Internet Service Provider — secara otomatis dan akurat.
            </p>

            <div style={{ display: 'flex', gap: 14 }}>
              <Link href="/dashboard/overview" style={{
                background: T.brand, color: '#fff', fontSize: 14, fontWeight: 500,
                padding: '13px 28px', borderRadius: 9, textDecoration: 'none',
              }}>
                Buka Dashboard
              </Link>
              <a href="#cara-kerja" style={{
                background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500,
                padding: '13px 28px', borderRadius: 9, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>

          <div>
            <div style={{
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.accent}30`,
              borderRadius: 16, padding: 24, backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Analisis Real-time</span>
                {/* <span style={{ fontSize: 11, fontWeight: 500, background: `${T.brand}35`, color: T.accent, padding: '4px 10px', borderRadius: 100 }}>● Live</span> */}
              </div>

              {[
                { label:'Positif', pct:68, color: T.accent, track:`${T.accent}25` },
                { label:'Negatif', pct:21, color:'#EF6E6D', track:'rgba(239,110,109,0.15)' },
                { label:'Netral',  pct:11, color: T.neu,    track:`${T.neu}25` },
              ].map((s) => (
                <div key={s.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: s.color }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: s.track, borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 100 }}/>
                  </div>
                </div>
              ))}

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }}/>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { name:'Kecepatan Internet 93%', val:'Positif 74%', c: T.accent },
                  { name:'Harga 95%',     val:'Negatif 58%', c:'#EF6E6D' },
                  { name:'Stabilitas Jaringan 97%',  val:'Positif 61%', c: T.accent },
                  { name:'Penanganan Gangguan 92%',   val:'Negatif 44%', c:'#EF6E6D' },
                ].map((a) => (
                  <div key={a.name} style={{
                    background: 'rgba(255,255,255,0.07)', border: `1px solid ${T.accent}20`,
                    borderRadius: 8, padding: '8px 10px',
                  }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{a.name}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: a.c }}>{a.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fitur" style={{ padding: '90px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.brand, marginBottom: 12 }}>Fitur Utama</p>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 600, color: T.primary, letterSpacing: '-0.4px', marginBottom: 14 }}>
            Semua yang Anda butuhkan<br/>dalam satu platform
          </h2>
          <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.75, maxWidth: 520, marginBottom: 52 }}>
            Dari input teks tunggal hingga analisis batch, ISPLens menyediakan tools lengkap untuk memahami sentimen pelanggan ISP.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {FEATURES.map((f) => (
              <div key={f.name} style={{
                background: '#fff', border: `1px solid ${T.border}`, borderRadius: 14, padding: 28,
                position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 8px 32px ${T.brand}14` }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: T.brand }}/>
                <div style={{ width: 44, height: 44, background: T.muted, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 18 }}>
                  {f.icon}
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, color: T.primary, marginBottom: 8 }}>{f.name}</p>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ASPECTS ── */}
      <section id="aspek-analisis" style={{ background: T.primary, padding: '90px 0 90px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto 40px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.accent, marginBottom: 12 }}>Dimensi Analisis</p>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 600, color: '#fff', letterSpacing: '-0.4px', marginBottom: 14 }}>
            8 Aspek Kritis<br/>Layanan ISP
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 520 }}>
            Setiap aspek dianalisis menggunakan model yang dilatih khusus pada data ulasan pelanggan Internet Service Provider (ISP) Indonesia.
          </p>
        </div>

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            display: 'flex', gap: 16, overflowX: 'auto',
            paddingRight: 48, paddingBottom: 4,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        >
          {ASPECTS.map((a) => (
            <div key={a.name} style={{
              flexShrink: 0,
              width: 'calc((100vw - 48px - 48px - 48px) / 4)',
              maxWidth: 280,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.accent}25`,
              borderRadius: 12, padding: 22,
              transition: 'background 0.2s',
              pointerEvents: isDragging ? 'none' : 'auto',
            }}
              onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.background = `${T.brand}20` }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              <div style={{ fontSize: 22, marginBottom: 14 }}>{a.emoji}</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 6 }}>{a.name}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{a.desc}</p>
              <p style={{ fontSize: 11, color: T.accent, marginTop: 12, fontWeight: 500 }}>→ {a.tag}</p>
            </div>
          ))}
        </div>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="cara-kerja" style={{ background: T.surface, padding: '90px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.brand, marginBottom: 12 }}>Cara Kerja</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 600, color: T.primary, letterSpacing: '-0.4px', marginBottom: 14 }}>
              Dari teks ulasan<br/>menjadi <span style={{ color: T.brand }}>insight bermakna</span>
            </h2>
            <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.75, maxWidth: 480, margin: '0 auto' }}>
              Proses analisis yang mengidentifikasi setiap aspek dan sentimennya secara terpisah.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 28, left: '10%', right: '10%', height: 1, background: T.border, zIndex: 0 }}/>
            {STEPS.map((s) => (
              <div key={s.n} style={{ textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#fff', border: `2px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: T.primary,
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = T.brand; (e.currentTarget as HTMLDivElement).style.color = T.brand }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.color = T.primary }}
                >
                  {s.n}
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: T.primary, marginBottom: 8 }}>{s.title}</p>
                <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── CTA ── */}
      <section style={{ background: T.primary, padding: '90px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 350, background: `radial-gradient(circle,${T.brand}22 0%,transparent 70%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.accent, marginBottom: 14 }}>Mulai Sekarang</p>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 600, color: '#fff', letterSpacing: '-0.4px', maxWidth: 500, margin: '0 auto 16px' }}>
            Tempel ulasan pelanggan, dapatkan analisis aspek dan sentimen dalam hitungan detik.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Gratis, open source, dan menggunakan model bahasa Indonesia terpercaya.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Link href="/dashboard/overview" style={{
              background: T.brand, color: '#fff', fontSize: 14, fontWeight: 500,
              padding: '13px 28px', borderRadius: 9, textDecoration: 'none',
            }}>
              Buka Dashboard →
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{
              background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500,
              padding: '13px 28px', borderRadius: 9, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              Lihat di GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: T.primary, borderTop: `1px solid ${T.accent}20`,
        padding: '28px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ISPLensLogo dark={true} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>© 2026 · ISPLens — PENS. Semua hak dilindungi.</p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['GitHub', 'API Docs'].map((l) => (
            <a key={l} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}
