import { useEffect, useMemo, useState } from 'react';
import { Pie } from '@ant-design/plots';
import {
  PlusOutlined,
  ShopOutlined,
  FileTextOutlined,
  UserAddOutlined,
  AppstoreAddOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Col, Progress, Image, Row, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import StatCard from './StatCard';
import { tenantService, type Tenant } from '../../services/tenant.service';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

    const navigate = useNavigate();

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        const data = await tenantService.getTenants();
        setTenants(data);
      } catch (error: any) {
        message.error(error?.response?.data?.error ?? 'Nie udało się pobrać tenantów');
      } finally {
        setLoading(false);
      }
    };

    void loadTenants();
  }, []);

  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((tenant) => tenant.isActive).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
      activityPercent: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }, [tenants]);

  const pieData = useMemo(
    () => [
      { type: 'Aktywni', value: stats.active },
      { type: 'Nieaktywni', value: stats.inactive },
    ],
    [stats.active, stats.inactive],
  );

  const columns: ColumnsType<Tenant> = [
    {
    title: 'Logo',
    dataIndex: 'logo',
    key: 'logo',
    render: (value, record) =>
      value ? (
        <Image
          src={value}
          alt={`${record.name} logo`}
          width={40}
          height={40}
          style={{ objectFit: 'contain', borderRadius: 8 }}
          fallback="https://placehold.co/40x40?text=%E2%80%94"
        />
      ) : (
        '—'
      ),
  },
    {
      title: 'Nazwa',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) =>
        record.isActive ? <Tag color="green">Aktywny</Tag> : <Tag color="red">Nieaktywny</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 0 }}>
          Panel administratora
        </Title>
        <Text type="secondary">Podgląd klientów i ich aktywności</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Liczba klientów"
            value={stats.total}
            prefix={<ApartmentOutlined />}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Aktywni"
            value={stats.active}
            prefix={<CheckCircleOutlined />}
            loading={loading}
            valueColor="#3f8600"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Nieaktywni"
            value={stats.inactive}
            prefix={<CloseCircleOutlined />}
            loading={loading}
            valueColor="#cf1322"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Procent Aktywnych"
            value={stats.activityPercent}
            suffix="%"
            prefix={<TeamOutlined />}
            loading={loading}
            valueColor="#1677ff"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Struktura klientów" loading={loading}>
            <Pie
              data={pieData}
              angleField="value"
              colorField="type"
              radius={0.9}
              innerRadius={0.6}
              height={280}
              legend={{ color: { position: 'bottom' } }}
              label={{
                text: (data) => `${data.type}: ${data.value}`,
                position: 'spider',
              }}
              interactions={[{ type: 'element-active' }]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Ostatni klienci">
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={[...tenants].slice(-5).reverse()}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
      
    </Space>
  );
}