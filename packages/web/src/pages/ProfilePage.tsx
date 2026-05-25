import { Avatar, Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const { Title, Text } = Typography;

type User = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  role?: 'ADMIN' | 'MANAGER' | 'AUDITOR' | string;
};

export default function ProfilePage() {
  const userRaw = localStorage.getItem('user');

  let user: User | null = null;

  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Brak danych użytkownika';

  const roleColor =
    user?.role === 'ADMIN'
      ? 'red'
      : user?.role === 'MANAGER'
      ? 'blue'
      : user?.role === 'AUDITOR'
      ? 'gold'
      : 'default';

      const navigate = useNavigate();

const handleLogout = () => {
  authService.logout();
  navigate('/login');
};

  return (
    <Space style={{ padding: 24, width: '100%' }} direction="vertical">
       
      <Card
        style={{
            minWidth: 300,
          margin: '0 auto',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <Avatar size={72} icon={<UserOutlined />} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {fullName}
            </Title>
            <Text type="secondary">{user?.email || 'Brak adresu e-mail'}</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color={roleColor}>{user?.role || 'Brak roli'}</Tag>
            </div>
          </div>
        </div>

        <Descriptions
          title="Informacje o użytkowniku"
          bordered
          column={1}
          size="middle"
        >

          <Descriptions.Item label="Imię">
            {user?.firstName || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Nazwisko">
            {user?.lastName || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="E-mail">
            {user?.email || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Rola">
            {user?.role || '-'}
          </Descriptions.Item>
        </Descriptions>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button danger onClick={handleLogout}>Wyloguj się </Button>
        </div>
      </Card>
    </Space>
  );
}