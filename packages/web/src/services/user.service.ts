import { http } from './http';

export type UserRole = 'ADMIN' | 'MANAGER' | 'AUDITOR';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type CreateUserDto = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string;
};

export type UpdateUserDto = {
  firstName?: string;
  lastName?: string;
  password?: string;
  isActive?: boolean;
};

export const userService = {
  getUsers: async (tenantId?: string) => {
    const res = await http.get('/users', {
      params: tenantId ? { tenantId } : undefined,
    });
    return res.data;
  },

  createUser: async (payload: CreateUserDto) => {
    const res = await http.post('/auth/register', payload);
    return res.data;
  },

  updateUser: async (id: string, payload: UpdateUserDto, tenantId?: string) => {
    const res = await http.put(`/users/${id}`, payload, {
      params: tenantId ? { tenantId } : undefined,
    });
    return res.data;
  },

  deleteUser: async (id: string, tenantId?: string) => {
    const res = await http.delete(`/users/${id}`, {
      params: tenantId ? { tenantId } : undefined,
    });
    return res.data;
  },
};