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

CREATE INDEX IF NOT EXISTS idx_raw_processed  ON comments_raw(is_processed);
CREATE INDEX IF NOT EXISTS idx_raw_provider   ON comments_raw(provider);
CREATE INDEX IF NOT EXISTS idx_proc_provider  ON comments_processed(provider);
CREATE INDEX IF NOT EXISTS idx_proc_timestamp ON comments_processed(timestamp);
CREATE INDEX IF NOT EXISTS idx_proc_aspect    ON comments_processed(aspect);
CREATE INDEX IF NOT EXISTS idx_proc_sentiment ON comments_processed(sentiment);
