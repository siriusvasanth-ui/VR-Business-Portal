import api from './client';

export async function listGroups(params = {}) {
  const { data } = await api.get('/api/groups', { params });
  return data.data;
}

export async function getGroup(id) {
  const { data } = await api.get(`/api/groups/${id}`);
  return data.data;
}

export async function createGroup(payload) {
  const { data } = await api.post('/api/groups', payload);
  return data.data;
}

export async function updateGroup(id, payload) {
  const { data } = await api.put(`/api/groups/${id}`, payload);
  return data.data;
}

export async function deleteGroup(id) {
  const { data } = await api.delete(`/api/groups/${id}`);
  return data.data;
}
