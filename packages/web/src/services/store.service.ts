import { http } from './http';

export type Store = {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  region?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateStoreDto = {
  name: string;
  address: string;
  city: string;
  region?: string;
};

export type UpdateStoreDto = {
  name?: string;
  address?: string;
  city?: string;
  region?: string | null;
  isActive?: boolean;
};

export const storeService = {
  getStores: async () => {
    const res = await http.get('/stores');
    return res.data;
  },

  getStoreById: async (id: string) => {
    const res = await http.get(`/stores/${id}`);
    return res.data;
  },

  createStore: async (payload: CreateStoreDto) => {
    const res = await http.post('/stores', payload);
    return res.data;
  },

  updateStore: async (id: string, payload: UpdateStoreDto) => {
    const res = await http.put(`/stores/${id}`, payload);
    return res.data;
  },

  deleteStore: async (id: string) => {
    const res = await http.delete(`/stores/${id}`);
    return res.data;
  },
};