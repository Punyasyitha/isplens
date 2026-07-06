"""
app.py — ISPLens Backend (Flask)
=================================
Endpoint:
  POST /api/sync       — proses komentar baru dari comments_raw → comments_processed
  GET  /api/comments   — ambil hasil dari comments_processed (dengan filter)
  GET  /api/stats      — ringkasan statistik per provider

Jalankan:
  pip install flask flask-cors psycopg2-binary anthropic python-dotenv
  python app.py
"""

import os
import re
import json
import time
import logging
import threading
import anthropic
import psycopg2
import psycopg2.extras
from collections import deque
from datetime import datetime
from flask import Flask, jsonify, request
import requests as http_requests
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s — %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # izinkan request dari Next.js frontend

# ──────────────────────────────────────────────────────────────────────────────
# KONFIGURASI
# ──────────────────────────────────────────────────────────────────────────────

DB_CONFIG = {
    'host':     os.getenv('DB_HOST',     'localhost'),
    'port':     int(os.getenv('DB_PORT', '5432')),
    'dbname':   os.getenv('DB_NAME',     'isplens'),
    'user':     os.getenv('DB_USER',     'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

ASPECTS = [
    'Stabilitas Jaringan', 'Kecepatan Internet', 'Harga',
    'Layanan Pelanggan', 'Kemudahan Akses Layanan',
    'Penanganan Gangguan', 'Keamanan Layanan', 'Instalasi',
]

ABSA_SYSTEM_PROMPT = f"""Kamu adalah model ABSA (Aspect-Based Sentiment Analysis) untuk komentar pelanggan ISP Indonesia.

Tugasmu: diberikan satu klausa teks, tentukan:
1. ASPEK — pilih SATU dari daftar berikut:
   {', '.join(ASPECTS)}

2. SENTIMEN — pilih SATU dari: Positif, Negatif, Netral

3. CONFIDENCE — nilai float 0.0–1.0 untuk masing-masing prediksi

Balas HANYA dalam format JSON berikut, tanpa penjelasan tambahan:
{{
  "aspect": "...",
  "aspect_conf": 0.00,
  "sentiment": "...",
  "sentiment_conf": 0.00
}}"""

CLAUSE_SPLITTER = re.compile(
    r'\b(tapi|namun|padahal|sedangkan|tetapi|meskipun|walaupun|'
    r'dan|sehingga|karena|sebab|kalau|jika|ketika|setelah|'
    r'selain|bahkan|justru|malah)\b',
    re.IGNORECASE
)

BATCH_SIZE = 10  # commit ke DB setiap N komentar

# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def segment_clauses(text: str) -> list:
    parts = CLAUSE_SPLITTER.split(text)
    clauses = [
        p.strip() for p in parts
        if p.strip() and not CLAUSE_SPLITTER.fullmatch(p.strip()) and len(p.strip()) >= 8
    ]
    return clauses or [text]


# ──────────────────────────────────────────────────────────────────────────────
# RATE LIMITER — sliding window untuk Anthropic API
# Claude Haiku free tier: ~50 req/menit. Kita batasi 45 untuk safety margin.
# ──────────────────────────────────────────────────────────────────────────────

class SlidingWindowRateLimiter:
    def __init__(self, max_calls: int = 45, window_seconds: float = 60.0):
        self.max_calls  = max_calls
        self.window     = window_seconds
        self.timestamps = deque()
        self._lock      = threading.Lock()

    def acquire(self):
        while True:
            with self._lock:
                now = time.monotonic()
                while self.timestamps and self.timestamps[0] <= now - self.window:
                    self.timestamps.popleft()
                if len(self.timestamps) < self.max_calls:
                    self.timestamps.append(now)
                    return
                wait = self.window - (now - self.timestamps[0]) + 0.05
            log.info(f"  [RateLimiter] Menunggu {wait:.1f}s agar tidak kena rate limit...")
            time.sleep(wait)


_api_limiter = SlidingWindowRateLimiter(max_calls=45, window_seconds=60.0)


def predict_absa(clause: str, retries: int = 3) -> dict:
    """Panggil predict_api.py (port 8000) yang sudah jalan dengan model IndoBERT."""
    for attempt in range(retries):
        try:
            resp = http_requests.post(
                'http://localhost:8000/predict',
                json={'text': clause},
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get('results', [])
            if not results:
                raise ValueError("Empty results from predict_api")
            # Ambil hasil pertama (satu klausa → satu prediksi)
            r = results[0]
            return {
                'aspect':       r['aspect'],
                'aspect_conf':  r.get('aspect_confidence', 0.0),
                'sentiment':    r['sentiment'],
                'sentiment_conf': r.get('sentiment_confidence', 0.0),
            }
        except KeyboardInterrupt:
            raise
        except Exception as e:
            log.warning(f"predict_absa gagal attempt {attempt+1}: {type(e).__name__}: {e}")
            if attempt < retries - 1:
                time.sleep(1)

    return {'aspect': 'Stabilitas Jaringan', 'aspect_conf': 0.0,
            'sentiment': 'Netral', 'sentiment_conf': 0.0}


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINT — POST /sync
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/api/sync', methods=['POST'])
def sync():
    """
    Proses semua komentar di comments_raw yang belum diproses (is_processed=FALSE).
    Setiap komentar → segmentasi klausa → prediksi ABSA → simpan ke comments_processed.
    """
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # Ambil semua komentar belum diproses
        cur.execute("""
            SELECT id, text_clean, timestamp, provider
            FROM comments_raw
            WHERE is_processed = FALSE
            ORDER BY id
        """)
        pending = cur.fetchall()

        if not pending:
            return jsonify({
                'status':    'ok',
                'message':   'Tidak ada data baru.',
                'processed': 0,
                'clauses':   0,
                'synced_at': datetime.now().isoformat(),
            })

        log.info(f"/sync — memproses {len(pending)} komentar baru")

        total_clauses = 0
        inserted      = 0  # komentar berhasil diproses & disimpan
        failed        = 0  # komentar gagal diproses
        errors        = []

        for i, row in enumerate(pending):
            raw_id    = row['id']
            text      = row['text_clean']
            timestamp = row['timestamp']
            provider  = row['provider']

            try:
                clauses = segment_clauses(text)
                log.info(f"  [{i+1}/{len(pending)}] raw_id={raw_id} | {len(clauses)} klausa | {provider}")

                for clause in clauses:
                    pred = predict_absa(clause)

                    cur.execute("""
                        INSERT INTO comments_processed
                          (raw_id, clause, timestamp, provider,
                           aspect, sentiment, aspect_conf, sentiment_conf)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        raw_id, clause, timestamp, provider,
                        pred['aspect'],    pred['sentiment'],
                        pred.get('aspect_conf', 0.0),
                        pred.get('sentiment_conf', 0.0),
                    ))
                    total_clauses += 1

                # Tandai sudah diproses
                cur.execute(
                    "UPDATE comments_raw SET is_processed=TRUE WHERE id=%s",
                    (raw_id,)
                )
                inserted += 1

                # Commit per batch
                if (i + 1) % BATCH_SIZE == 0:
                    conn.commit()
                    log.info(f"  Checkpoint commit — {i+1} komentar selesai")

            except Exception as e:
                failed += 1
                errors.append({'raw_id': raw_id, 'error': str(e)})
                log.error(f"  Error pada raw_id={raw_id}: {e}")
                continue

        conn.commit()
        log.info(f"/api/sync selesai — {len(pending)} komentar, {total_clauses} klausa, {failed} gagal")

        return jsonify({
            'status':    'ok',
            'inserted':  inserted,
            'skipped':   0,
            'processed': len(pending),
            'failed':    failed,
            'clauses':   total_clauses,
            'errors':    errors,
            'synced_at': datetime.now().isoformat(),
        })

    except Exception as e:
        conn.rollback()
        log.error(f"/sync error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

    finally:
        cur.close()
        conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINT — GET /comments
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/api/comments', methods=['GET'])
def get_comments():
    """
    Ambil hasil dari comments_processed.
    Query params:
      ?provider=IndiHome   — filter provider (opsional)
      ?month=2025-06       — filter bulan format YYYY-MM (opsional)
      ?aspect=Harga        — filter aspek (opsional)
      ?sentiment=Negatif   — filter sentimen (opsional)
      ?limit=100           — batas jumlah baris (default 200)
    """
    provider  = request.args.get('provider')
    month     = request.args.get('month')
    aspect    = request.args.get('aspect')
    sentiment = request.args.get('sentiment')
    limit     = int(request.args.get('limit', 200))

    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        query  = """
            SELECT
                cp.id,
                cp.raw_id,
                cp.clause          AS text,
                cr.username        AS username,
                cp.timestamp,
                cp.provider,
                cp.aspect,
                cp.sentiment,
                cp.aspect_conf,
                cp.sentiment_conf
            FROM comments_processed cp
            LEFT JOIN comments_raw cr ON cr.id = cp.raw_id
            WHERE 1=1
        """
        params = []

        if provider and provider != 'Semua':
            query += " AND cp.provider = %s";                        params.append(provider)
        if month and month != 'Semua':
            query += " AND TO_CHAR(cp.timestamp, 'YYYY-MM') = %s";   params.append(month)
        if aspect and aspect != 'Semua':
            query += " AND cp.aspect = %s";                           params.append(aspect)
        if sentiment and sentiment != 'Semua':
            query += " AND cp.sentiment = %s";                        params.append(sentiment)

        query += " ORDER BY cp.timestamp DESC LIMIT %s"
        params.append(limit)

        cur.execute(query, params)
        rows = cur.fetchall()

        results = []
        for r in rows:
            results.append({
                'id':             r['id'],
                'raw_id':         r['raw_id'],
                'username':       r['username'] or '@unknown',
                'text':           r['text'],
                'timestamp':      r['timestamp'].isoformat() if r['timestamp'] else None,
                'provider':       r['provider'],
                'aspect':         r['aspect'],
                'sentiment':      r['sentiment'],
                'aspect_conf':    round(r['aspect_conf'] or 0, 4),
                'sentiment_conf': round(r['sentiment_conf'] or 0, 4),
            })

        return jsonify({'status': 'ok', 'count': len(results), 'results': results})

    except Exception as e:
        log.error(f"/comments error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

    finally:
        cur.close()
        conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINT — GET /stats
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Ringkasan statistik untuk StatistikDataPage.
    Query params:
      ?provider=IndiHome   — filter provider (opsional)
    """
    provider = request.args.get('provider')

    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        params = []
        where  = "WHERE 1=1"
        if provider and provider != 'Semua':
            where += " AND provider = %s"
            params.append(provider)

        # Sentimen summary
        cur.execute(f"""
            SELECT
                COUNT(*)                                         AS total,
                COUNT(*) FILTER (WHERE sentiment='Negatif')     AS neg,
                COUNT(*) FILTER (WHERE sentiment='Netral')      AS neu,
                COUNT(*) FILTER (WHERE sentiment='Positif')     AS pos
            FROM comments_processed {where}
        """, params)
        summary = dict(cur.fetchone())

        total = summary['total'] or 1  # hindari divide by zero
        summary['neg_pct'] = round(summary['neg'] / total * 100, 1)
        summary['neu_pct'] = round(summary['neu'] / total * 100, 1)
        summary['pos_pct'] = round(summary['pos'] / total * 100, 1)

        # Distribusi aspek
        cur.execute(f"""
            SELECT
                aspect,
                COUNT(*) FILTER (WHERE sentiment='Negatif') AS neg,
                COUNT(*) FILTER (WHERE sentiment='Positif') AS pos,
                COUNT(*)                                     AS total
            FROM comments_processed {where}
            GROUP BY aspect
            ORDER BY total DESC
        """, params)
        aspects = [dict(r) for r in cur.fetchall()]

        # Tren per bulan
        cur.execute(f"""
            SELECT
                TO_CHAR(timestamp, 'YYYY-MM')                   AS month,
                provider,
                aspect,
                COUNT(*) FILTER (WHERE sentiment='Negatif')     AS neg,
                COUNT(*) FILTER (WHERE sentiment='Positif')     AS pos,
                COUNT(*)                                         AS total
            FROM comments_processed {where}
            GROUP BY month, provider, aspect
            ORDER BY month
        """, params)
        trend = [dict(r) for r in cur.fetchall()]

        return jsonify({
            'status':  'ok',
            'summary': summary,
            'aspects': aspects,
            'trend':   trend,
        })

    except Exception as e:
        log.error(f"/stats error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

    finally:
        cur.close()
        conn.close()


# ──────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=True)
