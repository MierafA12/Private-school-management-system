const BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const saveTokens = ({ access_token, refresh_token }) => {
  if (access_token)  localStorage.setItem('access_token',  access_token);
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
export const safeJson = async (res) => {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 120);
    const isHtml  = preview.trimStart().startsWith('<');
    throw Object.assign(
      new Error(
        isHtml
          ? 'Backend not reachable. Check that the server is running on port 5001.'
          : `Invalid JSON from server: ${preview}`
      ),
      { status: res.status }
    );
  }
};

// ─── Core fetch wrapper with auto-refresh ─────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
};

export async function request(path, options = {}, retry = true) {
  const token = getAccessToken();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw Object.assign(
      new Error('Cannot reach the server. Is the backend running on port 5001?'),
      { status: 0 }
    );
  }

  if (res.status === 401 && retry) {
    const refreshTok = getRefreshToken();
    if (!refreshTok) {
      clearTokens();
      throw Object.assign(new Error('Session expired.'), { status: 401 });
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) =>
        request(
          path,
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          },
          false
        )
      );
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshTok }),
      });
      const refreshBody = await safeJson(refreshRes);
      if (!refreshRes.ok) throw new Error(refreshBody.message || 'Refresh failed.');
      const data = refreshBody.data;

      saveTokens({ access_token: data.access_token });
      processQueue(null, data.access_token);
      return request(path, options, false);
    } catch (err) {
      processQueue(err);
      clearTokens();
      throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 });
    } finally {
      isRefreshing = false;
    }
  }

  const body = await safeJson(res);
  if (!res.ok) {
    const err = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = body;
    throw err;
  }
  return body.data ?? body;
}

export { BASE };
