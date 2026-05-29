import { Avatar, Button, Dropdown, Layout, Menu, Tooltip } from 'antd';
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { authService } from '../../services/auth.service';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';


const { Header, Sider, Content } = Layout;

type Role = 'ADMIN' | 'MANAGER' | 'AUDITOR';

type MenuItem = {
  key: string;
  label: React.ReactNode;
  roles: Role[];
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const avatarLetter =
  user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || 'U';
   const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const profileMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: <Link to="/profile">Profil</Link>,
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Wyloguj się',
    danger: true,
    onClick: handleLogout,
  },
];



  const role = user?.role as Role | undefined;

  const items: MenuItem[] = useMemo(() => [
    {
      key: '/',
      label: <Link to="/">Panel</Link>,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      key: '/tenants',
      label: <Link to="/tenants">Klienci</Link>,
      roles: ['ADMIN'],
    },
    {
      key: '/store',
      label: <Link to="/store">Sklepy</Link>,
      roles: ['MANAGER'],
    },
    {
      key: '/templates',
      label: <Link to="/templates">Szablony</Link>,
      roles: ['MANAGER'],
    },
    {
      key: '/audits',
      label: <Link to="/audits">Audyty</Link>,
      roles: ['AUDITOR','MANAGER'],
    },
    {
      key: '/users',
      label: <Link to="/users">Użytkownicy</Link>,
      roles: ['ADMIN','MANAGER'],
    },
  ], []);

  const visibleItems = useMemo(() => {
    if (!role) return [];
    return items.filter((item) => item.roles.includes(role));
  }, [items, role]);


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" trigger={null} collapsible collapsed={collapsed} collapsedWidth={0}>
        <div style={{ color: '#fff', padding: 16, fontWeight: 700, fontSize: 34 }}>SSKS</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleItems}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', paddingInline: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown
            menu={{ items: profileMenuItems }}
            trigger={['hover']}
            placement="bottomRight"
          >
            <Avatar
              style={{ cursor: 'pointer', backgroundColor: '#1677ff',  }}
            >
              {String(avatarLetter).toUpperCase()}
            </Avatar>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 25 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}