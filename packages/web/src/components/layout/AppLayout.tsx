import { Button, Layout, Menu } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" trigger={null} collapsible collapsed={collapsed} collapsedWidth={0}>
        <div style={{ color: '#fff', padding: 16, fontWeight: 700, fontSize: 34 }}>SSKS</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            { key: '/', label: <Link to="/">Dashboard</Link> },
            { key: '/tenants', label: <Link to="/tenants">Tenants</Link> },
            { key: '/store', label: <Link to="/store">Store</Link> },
            { key: '/users', label: <Link to="/users">Users</Link> },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', paddingInline: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
        </Header>
        <Content style={{ margin: 16, padding: 25 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}