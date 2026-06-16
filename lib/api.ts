import type {
  PredictRequest,
  PredictResponse,
  OverviewResponse,
  SyncDataResponse,
  SyncRequest,
  SyncResponse,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API Error ${res.status}: ${error}`)
  }

  return res.json() as Promise<T>
}

// ── Analisis ─────────────────────────────────────────────────

export async function predict(body: PredictRequest): Promise<PredictResponse> {
  return fetchAPI<PredictResponse>('/predict', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// ── Overview ─────────────────────────────────────────────────

export async function getOverview(provider?: string): Promise<OverviewResponse> {
  const query = provider && provider !== 'Semua Provider' ? `?provider=${encodeURIComponent(provider)}` : ''
  return fetchAPI<OverviewResponse>(`/overview${query}`)
}

// ── Statistik Data ───────────────────────────────────────────

export async function getStatistik(provider?: string) {
  const query = provider && provider !== 'Semua Provider' ? `?provider=${encodeURIComponent(provider)}` : ''
  return fetchAPI(`/statistik${query}`)
}

// ── Sinkronisasi ─────────────────────────────────────────────

export async function getSyncData(
  page = 1,
  pageSize = 8,
  provider?: string,
  search?: string
): Promise<SyncDataResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  if (provider && provider !== 'Semua') params.set('provider', provider)
  if (search) params.set('search', search)

  return fetchAPI<SyncDataResponse>(`/data?${params.toString()}`)
}

export async function syncData(body: SyncRequest): Promise<SyncResponse> {
  return fetchAPI<SyncResponse>('/sync', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
