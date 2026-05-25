import { http } from './http';

export type LoginPayload = {
  email: string;
  password: string;
};

export const authService = {
  login: (payload: LoginPayload) => http.post('/auth/login', payload),
  validateToken: () => localStorage.getItem('token'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

};