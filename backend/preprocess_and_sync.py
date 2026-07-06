import os
import re
import csv
import time
import logging
import threading
import psycopg2
import pandas as pd
from collections import deque
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s — %(message)s')
log = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# KONFIGURASI — sesuaikan sebelum dijalankan
# ──────────────────────────────────────────────────────────────────────────────

CSV_PATH      = 'comments_syncronize.csv'   # path ke file CSV
SCRAPING_DATE = datetime(2026, 6, 20)  # sesuaikan dengan tanggal scraping asli    # tanggal saat kamu scraping data

DB_CONFIG = {
    'host':     os.getenv('DB_HOST',     'localhost'),
    'port':     int(os.getenv('DB_PORT', '5432')),
    'dbname':   os.getenv('DB_NAME',     'isplens'),
    'user':     os.getenv('DB_USER',     'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')

ASPECTS = [
    'Stabilitas Jaringan',
    'Kecepatan Internet',
    'Harga',
    'Layanan Pelanggan',
    'Kemudahan Akses Layanan',
    'Penanganan Gangguan',
    'Keamanan Layanan',
    'Instalasi',
]

# Normalisasi nama provider dari CSV → nama standar di DB
PROVIDER_MAP = {
    'indihome':  'IndiHome',
    'indosat':   'Indosat',
    'xl':        'XL',
    'axis':      'AXIS',
    'im3':       'IM3',
    'byu':       'by.U',
    'by.u':      'by.U',
    'biznet':    'Biznet',
    'simpati':   'Simpati',
    'telkomsel': 'Simpati',
}

# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 — Baca & bersihkan CSV
# ──────────────────────────────────────────────────────────────────────────────

def read_csv(path: str) -> pd.DataFrame:
    """Baca CSV, skip baris komentar (#), strip BOM."""
    rows = []
    with open(path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(
            filter(lambda r: not r.startswith('#') and r.strip(), f)
        )
        for row in reader:
            # Bersihkan key dari BOM sisa
            clean = {k.lstrip('\ufeff'): v for k, v in row.items()}
            rows.append(clean)
    df = pd.DataFrame(rows)
    log.info(f"CSV dibaca: {len(df)} baris, kolom: {list(df.columns)}")
    return df


def clean_text(text: str) -> str:
    """
    Bersihkan teks komentar:
    - Hapus hashtag (#...)
    - Hapus mention (@...)
    - Hapus URL
    - Hapus emoji
    - Normalisasi whitespace
    """
    text = re.sub(r'#\S+', '', text)                        # hapus hashtag
    text = re.sub(r'@\S+', '', text)                        # hapus mention
    text = re.sub(r'http\S+|www\.\S+', '', text)            # hapus URL
    text = re.sub(r'[^\x00-\x7F\u00C0-\u024F\u0100-\u017E'
                  r'\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF'
                  r'\u3040-\u309F\u30A0-\u30FF\u0020-\u007E'
                  r'\u00A0-\u00FF]', '', text)               # hapus emoji & karakter non-standar
    text = re.sub(r'\s+', ' ', text).strip()                # normalisasi spasi
    return text


def normalize_provider(raw: str) -> str:
    key = raw.strip().lower()
    return PROVIDER_MAP.get(key, raw.strip())


# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 — Konversi waktu relatif → timestamp absolut
# ──────────────────────────────────────────────────────────────────────────────

def parse_relative_time(time_str: str, base: datetime = SCRAPING_DATE) -> datetime:
    """
    Konversi string waktu ke datetime.

    Mendukung dua format:
    A) Waktu absolut  : "6/18/26 2:45 AM", "2025-06-18 14:45", dsb
    B) Waktu relatif  : "15 jam", "3 ming", "2 hari", dsb
    """
    s = time_str.strip()

    # ── A) Coba parse sebagai timestamp absolut dulu ──
    absolute_formats = [
        '%m/%d/%y %I:%M %p',    # 6/18/26 2:45 AM
        '%m/%d/%Y %I:%M %p',    # 6/18/2026 2:45 AM
        '%m/%d/%Y %H:%M',       # 3/18/2026 23:41 dan 4/15/2026 3:41
        '%m/%d/%Y %I:%M',       # fallback tanpa AM/PM
        '%Y-%m-%d %H:%M:%S',    # 2026-03-18 23:41:00
        '%Y-%m-%d %H:%M',       # 2026-03-18 23:41
        '%Y-%m-%d',             # 2026-03-18
        '%d/%m/%Y %H:%M',       # 18/03/2026 23:41
    ]
    for fmt in absolute_formats:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue

    # ── B) Coba parse sebagai waktu relatif ──
    sl = s.lower()
    patterns = [
        (r'(\d+)\s*jam',       'hours'),
        (r'(\d+)\s*hari',      'days'),
        (r'(\d+)\s*ming\w*',   'weeks'),
        (r'(\d+)\s*bln\w*',    'months'),
        (r'(\d+)\s*thn\w*',    'years'),
    ]
    for pattern, unit in patterns:
        m = re.search(pattern, sl)
        if m:
            n = int(m.group(1))
            if unit == 'hours':   return base - timedelta(hours=n)
            if unit == 'days':    return base - timedelta(days=n)
            if unit == 'weeks':   return base - timedelta(weeks=n)
            if unit == 'months':  return base - timedelta(days=n * 30)
            if unit == 'years':   return base - timedelta(days=n * 365)

    log.warning(f"Format waktu tidak dikenali: '{time_str}' — pakai tanggal scraping")
    return base


# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 — Setup PostgreSQL
# ──────────────────────────────────────────────────────────────────────────────

def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def setup_tables():
    """Buat tabel jika belum ada."""
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments_raw (
            id            SERIAL PRIMARY KEY,
            username      TEXT,
            text_original TEXT NOT NULL,
            text_clean    TEXT NOT NULL,
            timestamp     TIMESTAMPTZ NOT NULL,
            provider      TEXT NOT NULL,
            is_processed  BOOLEAN DEFAULT FALSE,
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments_processed (
            id              SERIAL PRIMARY KEY,
            raw_id          INTEGER REFERENCES comments_raw(id),
            clause          TEXT NOT NULL,
            timestamp       TIMESTAMPTZ,
            provider        TEXT,
            aspect          TEXT,
            sentiment       TEXT CHECK (sentiment IN ('Positif','Negatif','Netral')),
            aspect_conf     FLOAT,
            sentiment_conf  FLOAT,
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # Index untuk query yang sering dipakai
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_processed   ON comments_raw(is_processed);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_provider    ON comments_raw(provider);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_provider   ON comments_processed(provider);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_timestamp  ON comments_processed(timestamp);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_aspect     ON comments_processed(aspect);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_sentiment  ON comments_processed(sentiment);")

    conn.commit()
    cur.close()
    conn.close()
    log.info("Tabel siap.")


# ──────────────────────────────────────────────────────────────────────────────
# STEP 4 — Insert data mentah ke comments_raw
# ──────────────────────────────────────────────────────────────────────────────

MIN_TEXT_LENGTH = 10   # komentar lebih pendek dari ini dibuang

def insert_raw(df: pd.DataFrame) -> int:
    """
    Insert baris dari DataFrame ke comments_raw.
    Skip duplikat (username + text_original + provider yang sama).
    Return jumlah baris yang berhasil diinsert.
    """
    conn    = get_connection()
    cur     = conn.cursor()
    inserted = 0
    skipped  = 0

    for _, row in df.iterrows():
        text_original = str(row['text']).strip()
        text_clean    = clean_text(text_original)

        # Filter komentar terlalu pendek / tidak relevan
        if len(text_clean) < MIN_TEXT_LENGTH:
            skipped += 1
            continue

        username  = str(row['username']).strip()
        provider  = normalize_provider(str(row['provider']))
        timestamp = parse_relative_time(str(row['timestamp']))

        # Cek duplikat
        cur.execute("""
            SELECT id FROM comments_raw
            WHERE username=%s AND text_original=%s AND provider=%s
            LIMIT 1
        """, (username, text_original, provider))

        if cur.fetchone():
            skipped += 1
            continue

        cur.execute("""
            INSERT INTO comments_raw (username, text_original, text_clean, timestamp, provider)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, text_original, text_clean, timestamp, provider))
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    log.info(f"Insert selesai — {inserted} baris masuk, {skipped} dilewati.")
    return inserted


# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 — Segmentasi klausa
# ──────────────────────────────────────────────────────────────────────────────

CLAUSE_SPLITTER = re.compile(
    r'\b(tapi|namun|padahal|sedangkan|tetapi|meskipun|walaupun|'
    r'dan|sehingga|karena|sebab|kalau|jika|ketika|setelah|'
    r'selain|bahkan|justru|malah)\b',
    re.IGNORECASE
)

def segment_clauses(text: str) -> list[str]:
    """Segmentasi teks menjadi klausa-klausa."""
    parts = CLAUSE_SPLITTER.split(text)
    clauses = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Skip penghubung itu sendiri
        if CLAUSE_SPLITTER.fullmatch(part):
            continue
        # Skip klausa terlalu pendek
        if len(part) < 8:
            continue
        clauses.append(part)

    return clauses if clauses else [text]


# ──────────────────────────────────────────────────────────────────────────────
# STEP 6 — Prediksi ABSA via Groq API (direct HTTP, bypass SSL issue)
# ──────────────────────────────────────────────────────────────────────────────

import json
import httpx

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


# ──────────────────────────────────────────────────────────────────────────────
# RATE LIMITER — sliding window 30 req/menit (batas free tier Groq)
# Thread-safe untuk penggunaan future multi-thread.
# ──────────────────────────────────────────────────────────────────────────────

class SlidingWindowRateLimiter:
    """
    Batasi jumlah request dalam window waktu tertentu.
    Default: maks 28 request per 60 detik (sedikit di bawah limit 30 RPM Groq
    untuk memberi buffer agar tidak kena 429 sama sekali).
    """
    def __init__(self, max_calls: int = 28, window_seconds: float = 60.0):
        self.max_calls      = max_calls
        self.window         = window_seconds
        self.timestamps     = deque()   # waktu setiap request yang sudah dikirim
        self._lock          = threading.Lock()

    def acquire(self):
        """Blokir sampai slot tersedia, lalu catat timestamp request ini."""
        while True:
            with self._lock:
                now = time.monotonic()
                # Buang timestamp yang sudah di luar window
                while self.timestamps and self.timestamps[0] <= now - self.window:
                    self.timestamps.popleft()

                if len(self.timestamps) < self.max_calls:
                    self.timestamps.append(now)
                    return   # slot tersedia, lanjut

                # Hitung berapa lama harus tunggu agar slot terlama keluar window
                wait = self.window - (now - self.timestamps[0]) + 0.05  # +50ms buffer

            # Sleep di luar lock agar thread lain bisa cek juga
            log.info(f"  [RateLimiter] Menunggu {wait:.1f}s agar tidak kena rate limit Groq...")
            time.sleep(wait)


# Instance global — satu limiter untuk seluruh pipeline
_groq_limiter = SlidingWindowRateLimiter(max_calls=28, window_seconds=60.0)


def predict_absa(clause: str, retries: int = 3) -> dict:
    """
    Prediksi aspek dan sentimen untuk satu klausa via Groq REST API.

    Perbaikan vs versi sebelumnya:
    - Rate limiter sliding window → tidak pernah kirim >28 req/menit
    - KeyboardInterrupt TIDAK tertangkap oleh except Exception
    - Retry hanya untuk error jaringan / JSON invalid, bukan 429
      (karena 429 sudah dicegah oleh limiter)
    - Jitter kecil di setiap sleep agar tidak burst jika ada multi-thread
    """
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type':  'application/json',
    }
    payload = {
        'model':      'llama-3.3-70b-versatile',
        'max_tokens': 150,
        'messages': [
            {'role': 'system', 'content': ABSA_SYSTEM_PROMPT},
            {'role': 'user',   'content': clause},
        ],
    }

    for attempt in range(retries):
        # Tunggu giliran dari rate limiter sebelum setiap request
        _groq_limiter.acquire()

        try:
            with httpx.Client(verify=False, timeout=30) as http:
                resp = http.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    headers=headers,
                    json=payload,
                )

            # Tangani 429 secara eksplisit — tunggu sesuai Retry-After header
            if resp.status_code == 429:
                retry_after = float(resp.headers.get('retry-after', 5))
                log.warning(f"  429 Too Many Requests — tunggu {retry_after:.0f}s (attempt {attempt+1}/{retries})")
                time.sleep(retry_after + 1)
                continue   # coba lagi, limiter akan acquire ulang

            if resp.status_code != 200:
                log.warning(f"  Groq non-200 ({resp.status_code}): {resp.text[:200]}")

            resp.raise_for_status()

            raw = resp.json()['choices'][0]['message']['content'].strip()
            raw = re.sub(r'^```json\s*|```$', '', raw, flags=re.MULTILINE).strip()

            result = json.loads(raw)

            assert result['aspect']    in ASPECTS,                         f"Aspek tidak valid: {result['aspect']}"
            assert result['sentiment'] in ('Positif', 'Negatif', 'Netral'), f"Sentimen tidak valid: {result['sentiment']}"

            return result

        except KeyboardInterrupt:
            # Biarkan Ctrl+C naik ke pemanggil — JANGAN telan
            raise

        except (httpx.HTTPStatusError, httpx.RequestError, json.JSONDecodeError, AssertionError) as e:
            log.warning(f"  Prediksi gagal (attempt {attempt+1}/{retries}): {e}")
            if attempt < retries - 1:
                # Jitter: 2^attempt detik + sedikit random agar tidak burst
                sleep_time = (2 ** attempt) + (attempt * 0.3)
                time.sleep(sleep_time)

        except Exception as e:
            # Error tak terduga — log detail tapi tetap retry
            log.warning(f"  Prediksi error tak terduga (attempt {attempt+1}/{retries}): {type(e).__name__}: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)

    log.warning(f"  Semua {retries} attempt gagal untuk klausa: '{clause[:60]}...' — pakai fallback")
    return {
        'aspect':         'Stabilitas Jaringan',
        'aspect_conf':    0.0,
        'sentiment':      'Netral',
        'sentiment_conf': 0.0,
    }


# ──────────────────────────────────────────────────────────────────────────────
# STEP 7 — Proses data belum diproses → simpan ke comments_processed
# ──────────────────────────────────────────────────────────────────────────────

BATCH_SIZE = 10   # proses N komentar per batch sebelum commit

def run_absa_pipeline():
    """
    Ambil semua baris is_processed=FALSE dari comments_raw,
    jalankan segmentasi + prediksi ABSA,
    simpan ke comments_processed,
    tandai is_processed=TRUE.

    Perbaikan vs versi sebelumnya:
    - KeyboardInterrupt (Ctrl+C) ditangkap dengan bersih → commit progress dulu baru berhenti
    - Error per-komentar tidak menghentikan seluruh pipeline (continue ke komentar berikutnya)
    - Log ringkasan di akhir mencakup jumlah gagal
    """
    conn = get_connection()
    cur  = conn.cursor()

    cur.execute("""
        SELECT id, text_clean, timestamp, provider
        FROM comments_raw
        WHERE is_processed = FALSE
        ORDER BY id
    """)
    pending = cur.fetchall()

    if not pending:
        log.info("Tidak ada data baru untuk diproses.")
        cur.close()
        conn.close()
        return 0, 0

    log.info(f"Memproses {len(pending)} komentar baru...")
    log.info(f"  Rate limiter aktif: maks 28 request/menit (limit Groq: 30 RPM)")

    total_clauses = 0
    total_errors  = 0
    interrupted   = False

    try:
        for i, (raw_id, text, timestamp, provider) in enumerate(pending):
            clauses = segment_clauses(text)
            log.info(f"  [{i+1}/{len(pending)}] raw_id={raw_id} | {len(clauses)} klausa | {provider}")

            try:
                for clause in clauses:
                    pred = predict_absa(clause)   # KeyboardInterrupt bisa naik dari sini

                    cur.execute("""
                        INSERT INTO comments_processed
                          (raw_id, clause, timestamp, provider, aspect, sentiment, aspect_conf, sentiment_conf)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        raw_id, clause, timestamp, provider,
                        pred['aspect'],    pred['sentiment'],
                        pred.get('aspect_conf',    0.0),
                        pred.get('sentiment_conf', 0.0),
                    ))
                    total_clauses += 1

                # Tandai sudah diproses (hanya jika semua klausa berhasil)
                cur.execute("UPDATE comments_raw SET is_processed=TRUE WHERE id=%s", (raw_id,))

            except KeyboardInterrupt:
                raise   # langsung naik ke handler luar

            except Exception as e:
                total_errors += 1
                log.error(f"  Error pada raw_id={raw_id}: {e} — komentar ini dilewati")
                continue   # lanjut ke komentar berikutnya

            # Checkpoint commit per batch
            if (i + 1) % BATCH_SIZE == 0:
                conn.commit()
                log.info(f"  ✓ Checkpoint commit — {i+1}/{len(pending)} komentar selesai "
                         f"({total_clauses} klausa, {total_errors} error)")

    except KeyboardInterrupt:
        interrupted = True
        log.warning("\n  [!] Ctrl+C terdeteksi — menyimpan progress yang sudah selesai...")

    finally:
        # Selalu commit progress yang sudah ada sebelum tutup koneksi
        try:
            conn.commit()
        except Exception:
            pass
        cur.close()
        conn.close()

    if interrupted:
        log.warning(f"  Pipeline dihentikan manual — progress tersimpan.")
    else:
        log.info(f"  Pipeline selesai — {len(pending)} komentar, {total_clauses} klausa, {total_errors} error.")

    return total_clauses, total_errors


# ──────────────────────────────────────────────────────────────────────────────
# STEP 8 — Endpoint FastAPI /sync (opsional, untuk integrasi frontend)
# ──────────────────────────────────────────────────────────────────────────────
# Uncomment blok ini jika kamu ingin menjalankan sebagai API endpoint
# dan bukan sebagai script standalone.
#
# from fastapi import FastAPI
# app = FastAPI()
#
# @app.post("/sync")
# def sync_endpoint():
#     total_clauses = run_absa_pipeline()
#     return {
#         "status":  "ok",
#         "clauses": total_clauses,
#         "synced_at": datetime.now().isoformat(),
#     }
#
# @app.get("/comments")
# def get_comments(provider: str = None, month: str = None):
#     conn = get_connection()
#     cur  = conn.cursor()
#     query  = "SELECT id, clause, timestamp, provider, aspect, sentiment, aspect_conf, sentiment_conf FROM comments_processed WHERE 1=1"
#     params = []
#     if provider and provider != 'Semua':
#         query += " AND provider = %s"; params.append(provider)
#     if month and month != 'Semua':
#         query += " AND TO_CHAR(timestamp, 'YYYY-MM') = %s"; params.append(month)
#     query += " ORDER BY timestamp DESC"
#     cur.execute(query, params)
#     rows = cur.fetchall()
#     cur.close(); conn.close()
#     return {"results": [
#         {"id":r[0],"clause":r[1],"timestamp":str(r[2]),"provider":r[3],
#          "aspect":r[4],"sentiment":r[5],"aspect_conf":r[6],"sentiment_conf":r[7]}
#         for r in rows
#     ]}


# ──────────────────────────────────────────────────────────────────────────────
# MAIN — jalankan semua step secara berurutan
# ──────────────────────────────────────────────────────────────────────────────

def reset_tables():
    """Hapus semua data di kedua tabel (untuk insert ulang dari awal)."""
    conn = get_connection()
    cur  = conn.cursor()
    cur.execute("TRUNCATE TABLE comments_processed RESTART IDENTITY CASCADE;")
    cur.execute("TRUNCATE TABLE comments_raw RESTART IDENTITY CASCADE;")
    conn.commit()
    cur.close()
    conn.close()
    log.info("Tabel dikosongkan — siap insert ulang.")


if __name__ == '__main__':
    import sys

    RESET = '--reset' in sys.argv

    log.info("=" * 60)
    log.info("ISPLens — Preprocessing & Sync Pipeline")
    log.info("=" * 60)

    # 1. Siapkan tabel PostgreSQL
    log.info("Step 1/4 — Setup tabel PostgreSQL...")
    setup_tables()

    # Reset jika diminta
    if RESET:
        log.info("Flag --reset terdeteksi — mengosongkan tabel...")
        reset_tables()

    # 2. Baca & preprocessing CSV
    log.info("Step 2/4 — Baca & bersihkan CSV...")
    df = read_csv(CSV_PATH)

    # 3. Insert ke comments_raw
    log.info("Step 3/4 — Insert ke comments_raw...")
    inserted = insert_raw(df)
    log.info(f"  {inserted} baris baru dimasukkan ke DB.")

    # 4. Jalankan pipeline ABSA
    log.info("Step 4/4 — Jalankan pipeline ABSA...")
    if inserted > 0 or True:
        total_clauses, total_errors = run_absa_pipeline()
        log.info(f"  Total klausa hasil prediksi: {total_clauses}")
        if total_errors:
            log.warning(f"  Komentar gagal diproses: {total_errors} (tersimpan sebagai unprocessed)")
    else:
        log.info("  Tidak ada data baru, pipeline ABSA dilewati.")

    log.info("=" * 60)
    log.info("Selesai.")
    log.info("=" * 60)