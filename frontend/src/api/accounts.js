import api from './client';

/** List accounts with pagination/search/filter/sort params. */
export async function listAccounts(params = {}) {
  const { data } = await api.get('/api/accounts', { params });
  return data; // { success, data:[], pagination:{} }
}

export async function getAccount(id) {
  const { data } = await api.get(`/api/accounts/${id}`);
  return data.data;
}

export async function createAccount(payload) {
  const { data } = await api.post('/api/accounts', payload);
  return data.data;
}

export async function updateAccount(id, payload) {
  const { data } = await api.put(`/api/accounts/${id}`, payload);
  return data.data;
}

export async function deleteAccount(id) {
  const { data } = await api.delete(`/api/accounts/${id}`);
  return data.data;
}

export async function getDashboardStats() {
  const { data } = await api.get('/api/accounts/stats');
  return data.data;
}

// ---- Group assignments ----
export async function getAccountGroups(id) {
  const { data } = await api.get(`/api/accounts/${id}/groups`);
  return data.data;
}

export async function assignGroup(id, groupId) {
  const { data } = await api.post(`/api/accounts/${id}/groups`, { groups: [groupId] });
  return data.data;
}

export async function removeGroup(id, groupId) {
  const { data } = await api.delete(`/api/accounts/${id}/groups/${groupId}`);
  return data.data;
}
