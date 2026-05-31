import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileSearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Typography, message } from 'antd';
import StatCard from './StatCard';
import { auditService, type AuditListItem } from '../../services/audit.service';

const { Title, Text } = Typography;

export default function AuditorDashboard() {
  const navigate = useNavigate();

  const [audits, setAudits] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAudits = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAudits();
      setAudits(data ?? []);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać audytów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const stats = useMemo(() => {
    const total = audits.length;
    const newCount = audits.filter((audit) => audit.status === 'NEW').length;
    const inProgressCount = audits.filter((audit) => audit.status === 'IN_PROGRESS').length;
    const completedCount = audits.filter((audit) => audit.status === 'COMPLETED').length;

    return {
      total,
      newCount,
      inProgressCount,
      completedCount,
    };
  }, [audits]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 0 }}>
          Panel audytora
        </Title>
        <Text type="secondary">Podgląd Twoich audytów</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Wszystkie audyty"
            value={stats.total}
            prefix={<FileSearchOutlined />}
            valueColor="#1677ff"
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Do wykonania"
            value={stats.newCount}
            prefix={<UnorderedListOutlined />}
            valueColor="#1677ff"
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="W trakcie"
            value={stats.inProgressCount}
            prefix={<ClockCircleOutlined />}
            valueColor="#fa8c16"
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Wykonane"
            value={stats.completedCount}
            prefix={<CheckCircleOutlined />}
            valueColor="#52c41a"
            loading={loading}
          />
        </Col>
      </Row>

      <Card title="Akcje" loading={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Button
              type="primary"
              size="large"
              block
              icon={<UnorderedListOutlined />}
              onClick={() => navigate('/audits?status=todo')}
            >
              Audyty do wykonania
            </Button>
          </Col>

          <Col xs={24} md={12}>
            <Button
              size="large"
              block
              icon={<CheckCircleOutlined />}
              onClick={() => navigate('/audits?status=completed')}
            >
              Audyty wykonane
            </Button>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}