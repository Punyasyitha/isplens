// 'use client'

// import { useState, useEffect } from 'react'
// import { RefreshCcw, Search, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react'

// interface DataRow {
//   id: number
//   username: string
//   text: string
//   timestamp: string
//   provider: string
//   aspect: string
//   sentiment: 'Positif' | 'Negatif' | 'Netral'
// }

// const MOCK_DATA: DataRow[] = [
//   { id:1,  username:'22_tiff',          text:'gw baru beli paket gedean di guna min gmna woi',              timestamp:'6/9/20 2:32 AM',   provider:'Indosat',   aspect:'Harga',                   sentiment:'Negatif' },
//   { id:2,  username:'dragoeder00',      text:'ADMIN KERJA NYA DIM DOANGGGGG',                               timestamp:'10/31/25 12:21 AM',provider:'Telkomsel', aspect:'Layanan Pelanggan',       sentiment:'Negatif' },
//   { id:3,  username:'justnpii_',        text:'Jaringan kaya aqua ngaleng konger, tiba-tiba…',               timestamp:'9/1/25 1:10 AM',   provider:'Indosat',   aspect:'Stabilitas Jaringan',     sentiment:'Negatif' },
//   { id:4,  username:'darn_moli57',      text:'mahal bgt bgt sekarangggg',                                   timestamp:'10/21/25 11:15 AM',provider:'Telkomsel', aspect:'Harga',                   sentiment:'Negatif' },
//   { id:5,  username:'zamrul_51',        text:'Jalan Sman sinus post porefile…',                             timestamp:'9/6/25 9:44 AM',   provider:'IndiHome',  aspect:'Kemudahan Akses Layanan', sentiment:'Negatif' },
//   { id:6,  username:'jhanyinhya',       text:'kenapa tiap jamz sinyal sinyal im3 ngecetilimin bangettttt',  timestamp:'10/20/25 6:07 PM', provider:'IM3',       aspect:'Stabilitas Jaringan',     sentiment:'Negatif' },
//   { id:7,  username:'xiang_creators',   text:'Terbaik sinyal Indosat 5G',                                   timestamp:'8/19/25 7:26 PM',  provider:'Indosat',   aspect:'Kecepatan Internet',      sentiment:'Positif' },
//   { id:8,  username:'anindalumia',      text:'ini krp dr armin im3 bervut lagi ya',                         timestamp:'6/28/26 5:27 PM',  provider:'IM3',       aspect:'Stabilitas Jaringan',     sentiment:'Negatif' },
//   { id:9,  username:'rindyy_29',        text:'Indihome emang terbaik, stabil buat WFH seharian',            timestamp:'7/10/25 8:00 AM',  provider:'IndiHome',  aspect:'Stabilitas Jaringan',     sentiment:'Positif' },
//   { id:10, username:'fahrull_id',       text:'cs by.u susah banget dihubungi, nunggu lama',                 timestamp:'9/15/25 3:20 PM',  provider:'by.U',      aspect:'Layanan Pelanggan',       sentiment:'Negatif' },
//   { id:11, username:'masfrans22',       text:'Biznet kenceng banget, worth it banget nih',                  timestamp:'10/02/25 11:00 AM',provider:'Biznet',    aspect:'Kecepatan Internet',      sentiment:'Positif' },
//   { id:12, username:'ganteng_ok',       text:'sinyal axis hilang-hilang terus padahal bayar mahal',         timestamp:'11/01/25 7:45 AM', provider:'AXIS',      aspect:'Stabilitas Jaringan',     sentiment:'Negatif' },
// ]

// const SENTIMENT_STYLE = {
//   'Positif': { bg: '#EAF6EF', color: '#1A7A43' },
//   'Negatif': { bg: '#FEF0F0', color: '#C0392B' },
//   'Netral':  { bg: '#FEF9EC', color: '#A0750A' },
// }

// const PROVIDERS = ['Semua', 'IndiHome', 'Biznet', 'Telkomsel', 'Indosat', 'IM3', 'by.U', 'AXIS', 'Simpati']
// const PAGE_SIZE = 8

// export default function SinkronisasiPage() {
//   const [syncing, setSyncing]               = useState(false)
//   const [syncDone, setSyncDone]             = useState(false)
//   const [lastSync, setLastSync]             = useState<string | null>(null)
//   const [searchQuery, setSearchQuery]       = useState('')
//   const [selectedProvider, setSelectedProvider] = useState('Semua')
//   const [currentPage, setCurrentPage]       = useState(1)

//   // ── Load lastSync dari localStorage saat mount ──────────
//   useEffect(() => {
//     const saved = localStorage.getItem('isplens_lastSyncTime')
//     if (saved) setLastSync(saved)
//   }, [])

//   // ── Handle sync ──────────────────────────────────────────
//   const handleSync = async () => {
//     setSyncing(true)
//     setSyncDone(false)
//     await new Promise((r) => setTimeout(r, 2200))
//     setSyncing(false)
//     setSyncDone(true)

//     // Simpan waktu sync ke localStorage
//     const now = new Date().toLocaleString('id-ID', {
//       day: '2-digit', month: 'short', year: 'numeric',
//       hour: '2-digit', minute: '2-digit',
//     })
//     setLastSync(now)
//     localStorage.setItem('isplens_lastSyncTime', now)

//     // Auto-dismiss banner setelah 4 detik
//     setTimeout(() => setSyncDone(false), 4000)
//   }

//   const filtered = MOCK_DATA.filter((row) => {
//     const matchProvider = selectedProvider === 'Semua' || row.provider === selectedProvider
//     const matchSearch   = searchQuery === '' ||
//       row.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       row.username.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchProvider && matchSearch
//   })

//   const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
//   const pageData   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

//   return (
//     <div className="animate-fade-in">

//       {/* ── Header actions ── */}
//       <div
//         className="animate-fade-up"
//         style={{
//           display: 'flex', alignItems: 'center',
//           justifyContent: 'space-between',
//           marginBottom: 20, flexWrap: 'wrap', gap: 12,
//         }}
//       >
//         {/* Kiri: tombol sync + info last sync */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//           <button
//             onClick={handleSync}
//             disabled={syncing}
//             style={{
//               display: 'flex', alignItems: 'center', gap: 8,
//               background: syncing ? '#B8DDD2' : '#085041',
//               color: syncing ? '#3D6B5C' : '#fff',
//               border: 'none', borderRadius: 9,
//               padding: '11px 22px', fontSize: 13, fontWeight: 500,
//               cursor: syncing ? 'not-allowed' : 'pointer',
//               transition: 'all 0.2s',
//             }}
//           >
//             {syncing
//               ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
//               : <RefreshCcw size={14} />}
//             {syncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
//           </button>

//           {/* Info terakhir sync — muncul kalau ada data */}
//           {lastSync && (
//             <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
//               <Clock size={11} color="#3D6B5C" />
//               <span style={{ fontSize: 11, color: '#3D6B5C' }}>
//                 Terakhir sync: <strong style={{ color: '#085041' }}>{lastSync}</strong>
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Kanan: search + provider filter */}
//         <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
//           <div style={{
//             display: 'flex', alignItems: 'center', gap: 8,
//             background: '#fff', border: '1px solid #B8DDD2',
//             borderRadius: 8, padding: '8px 14px', width: 200,
//           }}>
//             <Search size={13} color="#3D6B5C" />
//             <input
//               type="text"
//               placeholder="Cari komentar..."
//               value={searchQuery}
//               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
//               style={{
//                 border: 'none', background: 'transparent', outline: 'none',
//                 fontSize: 12, color: '#042C1E', width: '100%',
//               }}
//             />
//           </div>

//           <select
//             value={selectedProvider}
//             onChange={(e) => { setSelectedProvider(e.target.value); setCurrentPage(1) }}
//             style={{
//               border: '1px solid #B8DDD2', borderRadius: 8,
//               padding: '8px 14px', fontSize: 12, color: '#042C1E',
//               background: '#fff', outline: 'none', cursor: 'pointer',
//             }}
//           >
//             {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* ── Sync success banner (auto-dismiss 4 detik) ── */}
//       {syncDone && (
//         <div
//           className="animate-fade-in"
//           style={{
//             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//             background: '#EAF6EF', border: '1px solid #B7E4CC',
//             borderRadius: 10, padding: '12px 16px', marginBottom: 16,
//           }}
//         >
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <span style={{
//               width: 22, height: 22, borderRadius: '50%',
//               background: '#1D9E75', display: 'flex', alignItems: 'center',
//               justifyContent: 'center', fontSize: 12, color: '#fff', flexShrink: 0,
//             }}>✓</span>
//             <div>
//               <p style={{ fontSize: 13, color: '#1A7A43', fontWeight: 500, marginBottom: 1 }}>
//                 Sinkronisasi berhasil
//               </p>
//               <p style={{ fontSize: 11, color: '#3D6B5C' }}>
//                 Data komentar terbaru telah dimuat · {lastSync}
//               </p>
//             </div>
//           </div>
//           {/* Dismiss manual */}
//           <button
//             onClick={() => setSyncDone(false)}
//             style={{
//               background: 'none', border: 'none', cursor: 'pointer',
//               fontSize: 16, color: '#3D6B5C', lineHeight: 1, padding: '0 4px',
//             }}
//           >×</button>
//         </div>
//       )}

//       {/* ── Table ── */}
//       <div className="card animate-fade-up anim-delay-1" style={{ padding: 0, overflow: 'hidden' }}>
//         {/* Table header meta */}
//         <div style={{
//           padding: '16px 20px', borderBottom: '1px solid #B8DDD2',
//           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//         }}>
//           <div>
//             <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>Overview Data</p>
//             <p style={{ fontSize: 11, color: '#3D6B5C' }}>
//               Menampilkan {filtered.length} dari {MOCK_DATA.length} entri
//               {lastSync && (
//                 <span style={{ marginLeft: 8, color: '#B8DDD2' }}>
//                   · Terakhir sync: {lastSync}
//                 </span>
//               )}
//             </p>
//           </div>
//         </div>

//         <div style={{ overflowX: 'auto' }}>
//           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//             <thead>
//               <tr style={{ background: '#F4FBF8' }}>
//                 {['Username', 'Teks Komentar', 'Timestamp', 'Provider', 'Aspek', 'Sentimen'].map((h) => (
//                   <th
//                     key={h}
//                     style={{
//                       padding: '10px 16px', textAlign: 'left',
//                       fontSize: 11, fontWeight: 500, color: '#3D6B5C',
//                       letterSpacing: '0.4px', textTransform: 'uppercase',
//                       borderBottom: '1px solid #B8DDD2', whiteSpace: 'nowrap',
//                     }}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {pageData.map((row) => {
//                 const sentStyle = SENTIMENT_STYLE[row.sentiment]
//                 return (
//                   <tr
//                     key={row.id}
//                     style={{ borderBottom: '1px solid #F4FBF8', transition: 'background 0.15s' }}
//                     onMouseEnter={(e) => (e.currentTarget.style.background = '#F4FBF8')}
//                     onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
//                   >
//                     <td style={{ padding: '11px 16px', fontSize: 12, color: '#3D6B5C', whiteSpace: 'nowrap' }}>
//                       @{row.username}
//                     </td>
//                     <td style={{ padding: '11px 16px', fontSize: 13, color: '#042C1E', maxWidth: 260 }}>
//                       <span style={{
//                         display: '-webkit-box',
//                         WebkitLineClamp: 2,
//                         WebkitBoxOrient: 'vertical',
//                         overflow: 'hidden',
//                         lineHeight: 1.5,
//                       }}>
//                         {row.text}
//                       </span>
//                     </td>
//                     <td style={{ padding: '11px 16px', fontSize: 11, color: '#3D6B5C', whiteSpace: 'nowrap' }}>
//                       {row.timestamp}
//                     </td>
//                     <td style={{ padding: '11px 16px' }}>
//                       <span style={{
//                         fontSize: 11, fontWeight: 500,
//                         padding: '3px 9px', borderRadius: 6,
//                         background: '#E1F5EE', color: '#1D9E75',
//                       }}>
//                         {row.provider}
//                       </span>
//                     </td>
//                     <td style={{ padding: '11px 16px' }}>
//                       <span style={{ fontSize: 12, color: '#3D6B5C' }}>{row.aspect}</span>
//                     </td>
//                     <td style={{ padding: '11px 16px' }}>
//                       <span className="badge" style={{ background: sentStyle.bg, color: sentStyle.color }}>
//                         {row.sentiment}
//                       </span>
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div style={{
//           padding: '14px 20px', borderTop: '1px solid #B8DDD2',
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         }}>
//           <p style={{ fontSize: 12, color: '#3D6B5C' }}>
//             Halaman {currentPage} dari {totalPages}
//           </p>
//           <div style={{ display: 'flex', gap: 6 }}>
//             <button
//               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//               disabled={currentPage === 1}
//               style={{
//                 width: 30, height: 30, borderRadius: 7,
//                 border: '1px solid #B8DDD2',
//                 background: currentPage === 1 ? '#F4FBF8' : '#fff',
//                 cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}
//             >
//               <ChevronLeft size={13} color={currentPage === 1 ? '#3D6B5C' : '#042C1E'} />
//             </button>

//             {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
//               <button
//                 key={p}
//                 onClick={() => setCurrentPage(p)}
//                 style={{
//                   width: 30, height: 30, borderRadius: 7,
//                   border: p === currentPage ? 'none' : '1px solid #B8DDD2',
//                   background: p === currentPage ? '#085041' : '#fff',
//                   color: p === currentPage ? '#fff' : '#042C1E',
//                   fontSize: 12, fontWeight: p === currentPage ? 500 : 400,
//                   cursor: 'pointer',
//                 }}
//               >
//                 {p}
//               </button>
//             ))}

//             <button
//               onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//               disabled={currentPage === totalPages}
//               style={{
//                 width: 30, height: 30, borderRadius: 7,
//                 border: '1px solid #B8DDD2',
//                 background: currentPage === totalPages ? '#F4FBF8' : '#fff',
//                 cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}
//             >
//               <ChevronRight size={13} color={currentPage === totalPages ? '#3D6B5C' : '#042C1E'} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//       `}</style>
//     </div>
//   )
// }
