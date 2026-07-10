import api from './client';

/** POST /api/auth/login → { success, token, user } */
export async function login(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password });
  return data;
}
