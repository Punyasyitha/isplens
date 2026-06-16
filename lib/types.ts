// ── Prediction API ──────────────────────────────────────────

export interface PredictRequest {
  text: string
}

export interface PredictClause {
  clause: string
  aspect: string
  aspect_confidence: number
  sentiment: string
  sentiment_confidence: number
}

export interface PredictResponse {
  results: PredictClause[]
}

// ── Overview / Stats API ─────────────────────────────────────

export interface OverviewStats {
  total_comments: number
  total_aspects: number
  total_sentiment: number
  total_visitors: number
}

export interface AspectDistribution {
  aspect: string
  count: number
  percentage: number
}

export interface SentimentDistribution {
  sentiment: 'Positif' | 'Negatif' | 'Netral'
  count: number
  percentage: number
}

export interface MonthlyTrend {
  month: string
  count: number
}

export interface OverviewResponse {
  stats: OverviewStats
  aspect_distribution: AspectDistribution[]
  sentiment_distribution: SentimentDistribution[]
  monthly_trend: MonthlyTrend[]
  recent_history: AnalyzeHistoryItem[]
}

// ── Sinkronisasi / Data Table ────────────────────────────────

export interface SyncDataRow {
  id: number
  username: string
  text: string
  timestamp: string
  provider: string
  aspect: string
  sentiment: 'Positif' | 'Negatif' | 'Netral'
}

export interface SyncDataResponse {
  data: SyncDataRow[]
  total: number
  page: number
  page_size: number
}

export interface SyncRequest {
  provider?: string
  limit?: number
}

export interface SyncResponse {
  success: boolean
  synced_count: number
  message: string
}

// ── Analyze History ──────────────────────────────────────────

export interface AnalyzeHistoryItem {
  id: number
  text: string
  aspect: string
  sentiment: string
  created_at: string
  processing_time: string
}
