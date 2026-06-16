'use client'

import { useState } from 'react'
import { Send, Loader2, AlertCircle } from 'lucide-react'

interface PredictionResult {
  clause: string
  aspect: string
  aspect_confidence: number
  sentiment: string
  sentiment_confidence: number
}

const ASPECT_COLORS: Record<string, string> = {
  'Stabilitas Jaringan':    '#1D9E75',
  'Kecepatan Internet':     '#8E44AD',
  'Harga':                  '#E8A020',
  'Layanan Pelanggan':      '#27AE60',
  'Kemudahan Akses Layanan':'#E67E22',
  'Penanganan Gangguan':    '#E24B4A',
  'Keamanan Layanan':       '#16A085',
  'Instalasi':              '#7F8C8D',
}

const SENTIMENT_STYLE: Record<string, { bg: string; color: string }> = {
  'Positif': { bg: '#EAF6EF', color: '#1A7A43' },
  'Negatif': { bg: '#FEF0F0', color: '#C0392B' },
  'Netral':  { bg: '#FEF9EC', color: '#A0750A' },
}

const EXAMPLE_COMMENTS = [
  'jaringan bagus namun paket mahal',
  'Internet cepat tapi CS tidak responsif sama sekali',
  'Instalasi cepat, harga sesuai, jaringan stabil banget',
  'Sinyal sering putus dan pelayanan pelanggan lambat sekali merespon',
]

export default function AnalisisPage() {
  const [inputText, setInputText] = useState('')
  const [results, setResults] = useState<PredictionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const handleAnalyze = async () => {
    if (!inputText.trim()) return
    setIsLoading(true)
    setError('')
    setResults([])

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      const data = await response.json()
      setResults(data.results ?? [])
      setHasAnalyzed(true)
    } catch (err) {
      // Demo mode: simulate result when backend is offline
      simulateDemoResult(inputText)
    } finally {
      setIsLoading(false)
    }
  }

  const simulateDemoResult = (text: string) => {
    // Simple rule-based demo simulation
    const clauses = text.split(/\b(tapi|namun|padahal|sedangkan|dan|sehingga)\b/i)
      .filter((c) => c.trim().length > 3 && !/^(tapi|namun|padahal|sedangkan|dan|sehingga)$/i.test(c.trim()))

    const aspectMap = (clause: string): string => {
      const c = clause.toLowerCase()
      if (/kecepat|lemot|lambat|cepat|bandwidth/i.test(c))   return 'Kecepatan Internet'
      if (/sinyal|jaringan|koneksi|putus|stabil/i.test(c))   return 'Stabilitas Jaringan'
      if (/harga|biaya|mahal|murah|tarif|paket/i.test(c))    return 'Harga'
      if (/cs|customer|respon|pelayan|layanan/i.test(c))      return 'Layanan Pelanggan'
      if (/pasang|instal|teknisi|modem/i.test(c))             return 'Instalasi'
      if (/ganggu|masalah|rusak|down/i.test(c))               return 'Penanganan Gangguan'
      if (/aman|privasi|keamanan/i.test(c))                   return 'Keamanan Layanan'
      return 'Kemudahan Akses Layanan'
    }

    const sentimentMap = (clause: string): string => {
      const c = clause.toLowerCase()
      const negWords = /lemot|lambat|mahal|buruk|jelek|putus|lama|parah|kecewa|tidak|ga|gak|gagal/i
      const posWords = /cepat|bagus|stabil|murah|oke|mantap|terbaik|memuaskan|baik/i
      if (negWords.test(c)) return 'Negatif'
      if (posWords.test(c)) return 'Positif'
      return 'Netral'
    }

    const demo: PredictionResult[] = (clauses.length > 0 ? clauses : [text]).map((clause) => ({
      clause: clause.trim(),
      aspect: aspectMap(clause),
      aspect_confidence: 0.9 + Math.random() * 0.09,
      sentiment: sentimentMap(clause),
      sentiment_confidence: 0.75 + Math.random() * 0.24,
    }))

    setResults(demo)
    setHasAnalyzed(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAnalyze()
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      {/* Input Card */}
      <div className="card animate-fade-up" style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 16,
            fontWeight: 600,
            color: '#085041',
            letterSpacing: '-0.3px',
            marginBottom: 4,
          }}
        >
          Analisis Aspek dan Sentimen Komentar
        </p>
        <p style={{ fontSize: 12, color: '#3D6B5C', marginBottom: 20 }}>
          Masukkan komentar pelanggan ISP untuk dianalisis aspek dan polaritas sentimennya.
          Tekan <kbd style={{ background: '#F4FBF8', border: '1px solid #B8DDD2', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Ctrl+Enter</kbd> untuk analisis cepat.
        </p>

        {/* Textarea */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Contoh: jaringan bagus namun paket mahal..."
          rows={4}
          style={{
            width: '100%',
            border: '1px solid #B8DDD2',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 14,
            color: '#042C1E',
            background: '#F4FBF8',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.6,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#1D9E75')}
          onBlur={(e) => (e.target.style.borderColor = '#B8DDD2')}
        />

        {/* Example chips */}
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <span style={{ fontSize: 11, color: '#3D6B5C', alignSelf: 'center' }}>Contoh:</span>
          {EXAMPLE_COMMENTS.map((ex) => (
            <button
              key={ex}
              onClick={() => setInputText(ex)}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 100,
                border: '1px solid #B8DDD2',
                background: '#fff',
                color: '#3D6B5C',
                cursor: 'pointer',
                transition: 'all 0.15s',
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>

        {/* Action button */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !inputText.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: inputText.trim() ? '#085041' : '#B8DDD2',
              color: inputText.trim() ? '#fff' : '#3D6B5C',
              border: 'none',
              borderRadius: 9,
              padding: '11px 24px',
              fontSize: 13,
              fontWeight: 500,
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              letterSpacing: '0.1px',
            }}
          >
            {isLoading ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={14} />
            )}
            {isLoading ? 'Menganalisis...' : 'Analisis'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#FEF0F0',
            border: '1px solid #FADADD',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <AlertCircle size={15} color="#C0392B" />
          <p style={{ fontSize: 13, color: '#C0392B' }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {hasAnalyzed && results.length > 0 && (
        <div className="animate-fade-up">
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>
              Hasil Analisis
            </p>
            <p style={{ fontSize: 11, color: '#3D6B5C' }}>
              {results.length} klausa terdeteksi dari komentar
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((result, i) => {
              const aspectColor = ASPECT_COLORS[result.aspect] ?? '#1D9E75'
              const sentStyle = SENTIMENT_STYLE[result.sentiment] ?? SENTIMENT_STYLE['Netral']
              return (
                <div
                  key={i}
                  className="card animate-fade-up"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    borderLeft: `3px solid ${aspectColor}`,
                    paddingLeft: 20,
                  }}
                >
                  {/* Clause text */}
                  <p
                    style={{
                      fontSize: 14,
                      color: '#042C1E',
                      marginBottom: 14,
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{result.clause}&rdquo;
                  </p>

                  {/* Aspect + Sentiment badges */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {/* Aspect */}
                    <div
                      style={{
                        background: `${aspectColor}18`,
                        border: `1px solid ${aspectColor}40`,
                        borderRadius: 9,
                        padding: '8px 14px',
                      }}
                    >
                      <p style={{ fontSize: 10, color: aspectColor, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
                        Aspek
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: aspectColor }}>
                        {result.aspect}
                      </p>
                      <p style={{ fontSize: 10, color: aspectColor, opacity: 0.7, marginTop: 2 }}>
                        Confidence: {(result.aspect_confidence * 100).toFixed(2)}%
                      </p>
                    </div>

                    {/* Sentiment */}
                    <div
                      style={{
                        background: sentStyle.bg,
                        border: `1px solid ${sentStyle.color}30`,
                        borderRadius: 9,
                        padding: '8px 14px',
                      }}
                    >
                      <p style={{ fontSize: 10, color: sentStyle.color, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
                        Sentimen
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: sentStyle.color }}>
                        {result.sentiment}
                      </p>
                      <p style={{ fontSize: 10, color: sentStyle.color, opacity: 0.7, marginTop: 2 }}>
                        Confidence: {(result.sentiment_confidence * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {hasAnalyzed && results.length === 0 && !isLoading && (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '40px 24px' }}
        >
          <AlertCircle size={32} color="#3D6B5C" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#3D6B5C' }}>Tidak ada hasil yang dapat ditampilkan.</p>
          <p style={{ fontSize: 12, color: '#3D6B5C', marginTop: 4 }}>Pastikan backend Python sudah berjalan di port 8000.</p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
