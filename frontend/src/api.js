const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      let message = text || `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed.detail && Array.isArray(parsed.detail)) {
          message = parsed.detail.map((d) => d.msg).join('; ');
        } else if (parsed.detail) {
          message = String(parsed.detail);
        }
      } catch {
        // keep raw text
      }
      throw new Error(message);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return null;
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function createExpense(payload) {
  return request('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listExpenses({ category, sort } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (sort) params.set('sort', sort);
  const qs = params.toString();
  return request(`/expenses${qs ? '?' + qs : ''}`);
}

export async function getSummary() {
  return request('/expenses/summary');
}

export async function updateExpense(id, payload) {
  return request(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id) {
  return request(`/expenses/${id}`, {
    method: 'DELETE',
  });
}

