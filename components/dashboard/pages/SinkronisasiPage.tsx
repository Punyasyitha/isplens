'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCcw, Search, ChevronLeft, ChevronRight, Loader2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

interface DataRow {
  id: number
  username: string
  text: string
  timestamp: string
  provider: string
  aspect: string
  sentiment: 'Positif' | 'Negatif' | 'Netral'
}

interface SyncResult {
  inserted: number
  skipped: number
  processed: number
  failed: number
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

const SENTIMENT_STYLE = {
  'Positif': { bg: '#EAF6EF', color: '#1A7A43' },
  'Negatif': { bg: '#FEF0F0', color: '#C0392B' },
  'Netral':  { bg: '#FEF9EC', color: '#A0750A' },
}

const PROVIDERS = ['Semua', 'IndiHome', 'AXIS', 'IM3', 'by.U', 'Telkomsel', 'Biznet', 'XL']
const PAGE_SIZE = 8

// ── Ganti dengan base URL backend kamu ────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Normalisasi nama provider dari backend agar konsisten
function normalizeProvider(raw: string): string {
  const map: Record<string, string> = {
    'indihome': 'IndiHome', 'xl home': 'XL', 'xl': 'XL',
    'axis': 'AXIS', 'im3': 'IM3', 'byu': 'by.U', 'by.u': 'by.U',
    'simpati': 'Telkomsel', 'telkomsel': 'Telkomsel',
    'biznet': 'Biznet', 'indosat': 'Indosat',
  }
  return map[(raw ?? '').toLowerCase().trim()] ?? raw
}

export default function SinkronisasiPage() {
  const [data, setData]                   = useState<DataRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [syncStatus, setSyncStatus]       = useState<SyncStatus>('idle')
  const [syncResult, setSyncResult]       = useState<SyncResult | null>(null)
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)
  const [lastSync, setLastSync]           = useState<string | null>(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedProvider, setSelectedProvider] = useState('Semua')
  const [currentPage, setCurrentPage]     = useState(1)

  // ── Format timestamp lokal ──────────────────────────────────
  const nowLabel = () =>
    new Date().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  // ── Ambil semua komentar dari backend ──────────────────────
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/comments`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      // Backend diharapkan mengembalikan array DataRow
      // Sesuaikan field mapping jika nama kolom berbeda
      const rows: DataRow[] = (json.results ?? json.data ?? []).map((r: any) => ({        id:        r.id,
        username:  r.username,
        text:      r.text,
        timestamp: r.timestamp,
        provider:  normalizeProvider(r.provider),
        aspect:    r.aspect   ?? r.aspect_label   ?? '-',
        sentiment: mapSentiment(r.sentiment ?? r.sentiment_label),
      }))
      setData(rows)
    } catch (err: any) {
      console.error('Gagal fetch komentar:', err)
      // Jangan reset data yang sudah ada — biarkan tampil
    } finally {
      setLoading(false)
    }
  }, [])

  // Petakan nilai sentimen dari backend ke label tampilan
  function mapSentiment(val: string): 'Positif' | 'Negatif' | 'Netral' {
    const v = (val ?? '').toLowerCase()
    if (v === 'positif' || v === 'positive') return 'Positif'
    if (v === 'negatif' || v === 'negative') return 'Negatif'
    return 'Netral'
  }

  // ── Load data saat mount + lastSync dari localStorage ──────
  useEffect(() => {
    const saved = localStorage.getItem('isplens_lastSyncTime')
    if (saved) setLastSync(saved)
    fetchComments()
  }, [fetchComments])

  // ── Trigger sinkronisasi ────────────────────────────────────
  const handleSync = async () => {
    setSyncStatus('syncing')
    setSyncResult(null)
    setErrorMsg(null)

    try {
      // POST ke endpoint sync — backend jalankan preprocess_and_sync.py
      const res = await fetch(`${API_BASE}/api/sync`, { method: 'POST' })
      const json = await res.json()

      if (!res.ok) {
        // Backend mungkin kembalikan pesan error (misal rate limit)
        throw new Error(json.detail ?? json.message ?? `HTTP ${res.status}`)
      }

      const result: SyncResult = {
        inserted:  json.inserted  ?? 0,
        skipped:   json.skipped   ?? 0,
        processed: json.processed ?? 0,
        failed:    json.failed    ?? 0,
      }
      setSyncResult(result)
      setSyncStatus('success')

      // Simpan waktu sync
      const label = nowLabel()
      setLastSync(label)
      localStorage.setItem('isplens_lastSyncTime', label)

      // Refresh tabel dengan data terbaru
      await fetchComments()

      // Auto-dismiss banner setelah 6 detik
      setTimeout(() => setSyncStatus('idle'), 6000)
    } catch (err: any) {
      const msg: string = err.message ?? 'Terjadi kesalahan tidak dikenal'
      setErrorMsg(msg)
      setSyncStatus('error')
      // Auto-dismiss error banner setelah 8 detik
      setTimeout(() => setSyncStatus('idle'), 8000)
    }
  }

  // ── Filter & paginasi ───────────────────────────────────────
  const filtered = data.filter((row) => {
    const matchProvider = selectedProvider === 'Semua' || row.provider === selectedProvider
    const matchSearch   = searchQuery === '' ||
      row.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.username.toLowerCase().includes(searchQuery.toLowerCase())
    return matchProvider && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const isSyncing  = syncStatus === 'syncing'

  return (
    <div className="animate-fade-in">

      {/* ── Header actions ── */}
      <div
        className="animate-fade-up"
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20, flexWrap: 'wrap', gap: 12,
        }}
      >
        {/* Kiri: tombol sync + info last sync */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: isSyncing ? '#B8DDD2' : '#085041',
              color: isSyncing ? '#3D6B5C' : '#fff',
              border: 'none', borderRadius: 9,
              padding: '11px 22px', fontSize: 13, fontWeight: 500,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isSyncing
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCcw size={14} />}
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
          </button>

          {lastSync && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={11} color="#3D6B5C" />
              <span style={{ fontSize: 11, color: '#3D6B5C' }}>
                Terakhir sync: <strong style={{ color: '#085041' }}>{lastSync}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Kanan: search + provider filter */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #B8DDD2',
            borderRadius: 8, padding: '8px 14px', width: 200,
          }}>
            <Search size={13} color="#3D6B5C" />
            <input
              type="text"
              placeholder="Cari komentar..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 12, color: '#042C1E', width: '100%',
              }}
            />
          </div>

          <select
            value={selectedProvider}
            onChange={(e) => { setSelectedProvider(e.target.value); setCurrentPage(1) }}
            style={{
              border: '1px solid #B8DDD2', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, color: '#042C1E',
              background: '#fff', outline: 'none', cursor: 'pointer',
            }}
          >
            {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Banner: sedang memproses (dengan progress hint) ── */}
      {isSyncing && (
        <div className="animate-fade-in" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#EEF7FF', border: '1px solid #B3D9FF',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        }}>
          <Loader2 size={16} color="#1565C0" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, color: '#1565C0', fontWeight: 500, marginBottom: 1 }}>
              Sinkronisasi sedang berjalan…
            </p>
            <p style={{ fontSize: 11, color: '#3A6EA5' }}>
              Mengambil komentar baru, menjalankan preprocessing & prediksi ABSA. Mohon tunggu.
            </p>
          </div>
        </div>
      )}

      {/* ── Banner: sukses ── */}
      {syncStatus === 'success' && syncResult && (
        <div className="animate-fade-in" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#EAF6EF', border: '1px solid #B7E4CC',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#1D9E75" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: '#1A7A43', fontWeight: 500, marginBottom: 3 }}>
                Sinkronisasi berhasil · {lastSync}
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <Stat label="Komentar baru" value={syncResult.inserted} color="#085041" />
                <Stat label="Diproses ABSA" value={syncResult.processed} color="#1D9E75" />
                <Stat label="Dilewati (duplikat)" value={syncResult.skipped} color="#A0750A" />
                {syncResult.failed > 0 && (
                  <Stat label="Gagal prediksi" value={syncResult.failed} color="#C0392B" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSyncStatus('idle')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#3D6B5C' }}
          >×</button>
        </div>
      )}

      {/* ── Banner: error ── */}
      {syncStatus === 'error' && (
        <div className="animate-fade-in" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FEF0F0', border: '1px solid #F5C6C6',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} color="#C0392B" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, color: '#C0392B', fontWeight: 500, marginBottom: 1 }}>
                Sinkronisasi gagal
              </p>
              <p style={{ fontSize: 11, color: '#7B2020', maxWidth: 480 }}>
                {errorMsg ?? 'Tidak dapat terhubung ke server. Periksa koneksi atau coba lagi.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSyncStatus('idle')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#7B2020' }}
          >×</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="card animate-fade-up anim-delay-1" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header meta */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #B8DDD2',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>Overview Data</p>
            <p style={{ fontSize: 11, color: '#3D6B5C' }}>
              Menampilkan {filtered.length} dari {data.length} entri
              {lastSync && (
                <span style={{ marginLeft: 8, color: '#B8DDD2' }}>
                  · Terakhir sync: {lastSync}
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#3D6B5C', fontSize: 13 }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <p>Memuat data komentar…</p>
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#3D6B5C', fontSize: 13 }}>
              <p>Belum ada data. Klik <strong>Sinkronisasi</strong> untuk mengambil komentar.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F4FBF8' }}>
                  {['Username', 'Teks Komentar', 'Timestamp', 'Provider', 'Aspek', 'Sentimen'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 500, color: '#3D6B5C',
                        letterSpacing: '0.4px', textTransform: 'uppercase',
                        borderBottom: '1px solid #B8DDD2', whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row) => {
                  const sentStyle = SENTIMENT_STYLE[row.sentiment] ?? SENTIMENT_STYLE['Netral']
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: '1px solid #F4FBF8', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F4FBF8')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 16px', fontSize: 12, color: '#3D6B5C', whiteSpace: 'nowrap' }}>
                        @{row.username}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#042C1E', maxWidth: 260 }}>
                        <span style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}>
                          {row.text}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: '#3D6B5C', whiteSpace: 'nowrap' }}>
                        {row.timestamp}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500,
                          padding: '3px 9px', borderRadius: 6,
                          background: '#E1F5EE', color: '#1D9E75',
                        }}>
                          {row.provider}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 12, color: '#3D6B5C' }}>{row.aspect}</span>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span className="badge" style={{ background: sentStyle.bg, color: sentStyle.color }}>
                          {row.sentiment}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div style={{
            padding: '14px 20px', borderTop: '1px solid #B8DDD2',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: 12, color: '#3D6B5C' }}>
              Halaman {currentPage} dari {totalPages}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  border: '1px solid #B8DDD2',
                  background: currentPage === 1 ? '#F4FBF8' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronLeft size={13} color={currentPage === 1 ? '#3D6B5C' : '#042C1E'} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Tampilkan halaman di sekitar currentPage
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
                return start + i
              }).filter(p => p <= totalPages).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 7,
                    border: p === currentPage ? 'none' : '1px solid #B8DDD2',
                    background: p === currentPage ? '#085041' : '#fff',
                    color: p === currentPage ? '#fff' : '#042C1E',
                    fontSize: 12, fontWeight: p === currentPage ? 500 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  border: '1px solid #B8DDD2',
                  background: currentPage === totalPages ? '#F4FBF8' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={13} color={currentPage === totalPages ? '#3D6B5C' : '#042C1E'} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ── Helper kecil untuk stat ringkasan ──────────────────────────
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ fontSize: 11, color: '#3D6B5C' }}>
      <strong style={{ color, fontSize: 13 }}>{value}</strong> {label}
    </span>
  )
}