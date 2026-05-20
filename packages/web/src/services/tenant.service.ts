import { http } from './http';

export type Tenant = {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantDto = {
  name: string;
  logoUrl?: string;
};

export type UpdateTenantDto = {
  name?: string;
  logoUrl?: string;
  isActive?: boolean;
};

export const tenantService = {
  getTenants: async () => {
    const res = await http.get<Tenant[]>('/tenants');
    return res.data;
  },

  getTenantById: async (id: string) => {
    const res = await http.get<Tenant>(`/tenants/${id}`);
    return res.data;
  },

  createTenant: async (payload: CreateTenantDto) => {
    const res = await http.post<Tenant>('/tenants', payload);
    return res.data;
  },

  updateTenant: async (id: string, payload: UpdateTenantDto) => {
    const res = await http.put<Tenant>(`/tenants/${id}`, payload);
    return res.data;
  },
};