"""
insert_labelling.py
"""

import os
import csv
import logging
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2

load_dotenv()
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s — %(message)s')
log = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# KONFIGURASI
# ──────────────────────────────────────────────────────────────────────────────

CSV_PATH = 'labelling_with_timestamp.csv'   # file hasil generate timestamp

DB_CONFIG = {
    'host':     os.getenv('DB_HOST',     'localhost'),
    'port':     int(os.getenv('DB_PORT', '5432')),
    'dbname':   os.getenv('DB_NAME',     'isplens_sync'),
    'user':     os.getenv('DB_USER',     'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

# Normalisasi provider
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
    'telkomsel': 'Telkomsel',
}

# Normalisasi sentimen → pastikan sesuai CHECK constraint DB
SENTIMENT_MAP = {
    'positif': 'Positif',
    'negatif': 'Negatif',
    'netral':  'Netral',
    'positive': 'Positif',
    'negative': 'Negatif',
    'neutral':  'Netral',
}

# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def normalize_provider(raw: str) -> str:
    return PROVIDER_MAP.get(raw.strip().lower(), raw.strip())


def normalize_sentiment(raw: str) -> str:
    return SENTIMENT_MAP.get(raw.strip().lower(), 'Netral')


def parse_timestamp(ts_str: str) -> datetime:
    formats = [
        '%Y-%m-%d %H:%M',
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d',
        '%m/%d/%Y %H:%M',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(ts_str.strip(), fmt)
        except ValueError:
            continue
    log.warning(f"Timestamp tidak dikenali: '{ts_str}' — pakai 2025-01-01")
    return datetime(2025, 1, 1)


def setup_tables(conn):
    """Buat tabel jika belum ada."""
    cur = conn.cursor()
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
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_processed  ON comments_raw(is_processed);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_raw_provider   ON comments_raw(provider);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_provider  ON comments_processed(provider);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_timestamp ON comments_processed(timestamp);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_aspect    ON comments_processed(aspect);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_proc_sentiment ON comments_processed(sentiment);")
    conn.commit()
    cur.close()
    log.info("Tabel siap.")


def reset_tables(conn):
    """Hapus semua data (truncate cascade)."""
    cur = conn.cursor()
    cur.execute("TRUNCATE comments_processed, comments_raw RESTART IDENTITY CASCADE;")
    conn.commit()
    cur.close()
    log.info("Tabel dikosongkan.")


# ──────────────────────────────────────────────────────────────────────────────
# MAIN INSERT
# ──────────────────────────────────────────────────────────────────────────────

def insert_labelling(csv_path: str):
    """
    Baca CSV berlabel → insert ke comments_raw (1 baris per kalimat_asli)
    dan comments_processed (1 baris per klausa+aspek+sentimen).
    """
    conn = get_connection()
    cur  = conn.cursor()

    # Kelompokkan rows berdasarkan id_kalimat agar 1 insert ke raw per kalimat
    from collections import defaultdict
    grouped = defaultdict(list)

    with open(csv_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            grouped[row['id_kalimat']].append(row)

    inserted_raw   = 0
    inserted_proc  = 0
    skipped        = 0

    for id_kalimat, rows in grouped.items():
        first       = rows[0]
        kalimat_asli = first.get('kalimat_asli', '').strip()
        provider    = normalize_provider(first['provider'])
        timestamp   = parse_timestamp(first['timestamp'])

        if not kalimat_asli:
            skipped += 1
            continue

        # Cek duplikat di comments_raw
        cur.execute("""
            SELECT id FROM comments_raw
            WHERE text_original = %s AND provider = %s
            LIMIT 1
        """, (kalimat_asli, provider))

        existing = cur.fetchone()
        if existing:
            raw_id = existing[0]
            skipped += 1
        else:
            # Insert ke comments_raw
            cur.execute("""
                INSERT INTO comments_raw
                    (username, text_original, text_clean, timestamp, provider, is_processed)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                RETURNING id
            """, ('labelling', kalimat_asli, kalimat_asli, timestamp, provider))
            raw_id = cur.fetchone()[0]
            inserted_raw += 1

        # Insert tiap klausa ke comments_processed
        for row in rows:
            klausa    = row.get('klausa', '').strip()
            aspect    = row.get('aspect', '').strip()
            sentiment = normalize_sentiment(row.get('sentiment', ''))

            if not klausa or not aspect:
                continue

            cur.execute("""
                INSERT INTO comments_processed
                    (raw_id, clause, timestamp, provider, aspect, sentiment,
                     aspect_conf, sentiment_conf)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (raw_id, klausa, timestamp, provider, aspect, sentiment, 1.0, 1.0))
            inserted_proc += 1

        # Checkpoint tiap 100 kalimat
        if inserted_raw % 100 == 0 and inserted_raw > 0:
            conn.commit()
            log.info(f"  Checkpoint — {inserted_raw} kalimat, {inserted_proc} klausa")

    conn.commit()
    cur.close()
    conn.close()

    log.info(f"Selesai!")
    log.info(f"  comments_raw     : {inserted_raw} baru, {skipped} dilewati")
    log.info(f"  comments_processed: {inserted_proc} klausa diinsert")


# ──────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    RESET = '--reset' in sys.argv

    log.info("=" * 60)
    log.info("ISPLens — Insert Labelling Data")
    log.info("=" * 60)

    conn = get_connection()

    log.info("Step 1/3 — Setup tabel...")
    setup_tables(conn)
    conn.close()

    if RESET:
        conn = get_connection()
        log.info("Flag --reset — mengosongkan tabel...")
        reset_tables(conn)
        conn.close()

    log.info(f"Step 2/3 — Baca CSV: {CSV_PATH}")
    log.info("Step 3/3 — Insert ke DB...")
    insert_labelling(CSV_PATH)

    log.info("=" * 60)
    log.info("Done. Buka Overview page untuk cek grafik temporal.")
    log.info("=" * 60)