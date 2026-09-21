// Single place where the Flask backend lives, so the whole UI points at one host.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

/** GET /api/insights — dataset KPIs, sample rows and chart series. */
export const fetchInsights = () => request('/api/insights');

/** GET /api/metrics — trained model accuracy, F1 and feature importance. */
export const fetchMetrics = () => request('/api/metrics');

/** GET /api/history — every prediction logged so far, newest first. */
export const fetchHistory = () => request('/api/history');

/** GET /api/evaluation — multi-model comparison from Week_5 notebook. */
export const fetchEvaluation = () => request('/api/evaluation');

/** POST /api/predict — send applicant fields, receive risk + confidence. */
export const postPrediction = (payload) =>
  request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

/** Lightweight liveness probe used by the navbar status pill. */
export async function pingBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/metrics`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
