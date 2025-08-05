/**
 * Minimal API client for calling the Rust HTTP server on port 8477.
 * Uses fetch with JSON/text helpers and supports callbacks for success/error.
 */
const DEFAULT_BASE = typeof window !== 'undefined' ? (window.FILEDIME_API_BASE || 'http://localhost:8477') : 'http://localhost:8477';

function makeUrl(path, params) {
  const url = new URL(path, DEFAULT_BASE);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function handleResponse(res, expect = 'json') {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (expect === 'text') return res.text();
  return res.json().catch(async () => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  });
}

export function ping({ onSuccess, onError } = {}) {
  const url = makeUrl('/api/ping');
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then((res) => handleResponse(res, 'json'))
    .then((data) => {
      if (onSuccess) onSuccess(data);
      return data;
    })
    .catch((err) => {
      if (onError) onError(err);
      throw err;
    });
}

export function markdown(path, { onSuccess, onError } = {}) {
  const url = makeUrl('/api/markdown', { path });
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then((res) => handleResponse(res, 'text'))
    .then((html) => {
      if (onSuccess) onSuccess(html);
      return html;
    })
    .catch((err) => {
      if (onError) onError(err);
      throw err;
    });
}

/**
 * Generic GET helper
 */
export function get(path, params, { onSuccess, onError, expect = 'json' } = {}) {
  const url = makeUrl(path, params);
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then((res) => handleResponse(res, expect))
    .then((data) => {
      if (onSuccess) onSuccess(data);
      return data;
    })
    .catch((err) => {
      if (onError) onError(err);
      throw err;
    });
}

/**
 * Generic POST JSON helper
 */
export function post(path, body, { onSuccess, onError, expect = 'json' } = {}) {
  const url = makeUrl(path);
  return fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
    .then((res) => handleResponse(res, expect))
    .then((data) => {
      if (onSuccess) onSuccess(data);
      return data;
    })
    .catch((err) => {
      if (onError) onError(err);
      throw err;
    });
}

export default { ping, markdown, get, post };