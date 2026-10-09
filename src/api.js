const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const fileUrl = path => `${API}${path}`;
export async function api(path, options = {}) {
  const token = localStorage.getItem('nn_token');
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
