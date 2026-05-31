import AdminDashboard from '../components/dashboard/AdminDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import AuditorDashboard from '../components/dashboard/AuditorDashboard';

type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AUDITOR';
  tenantId?: string | null;
};

export default function DashboardPage() {
  let user: AppUser | null = null;

  try {
    const rawUser = localStorage.getItem('user');
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  if (!user) {
    return <div>Brak danych użytkownika.</div>;
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'AUDITOR':
      return <AuditorDashboard />;
    default:
      return <div>Brak dashboardu dla tej roli.</div>;
  }
}