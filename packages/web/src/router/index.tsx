import { createBrowserRouter, redirect } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AppLayout } from '../components/layout/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import TenantsPage from '../pages/TenantsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import UsersPage from '../pages/UsersPage';
import StorePage from '../pages/StorePage';

async function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    return redirect('/login');
  }

  try {
    await authService.validateToken();
    return null;
  } catch {
    localStorage.removeItem('token');
    return redirect('/login');
  }
}

export const router = createBrowserRouter([
  
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    loader: requireAuth,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tenants', element: <TenantsPage /> },
      { path: 'store', element: <StorePage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);