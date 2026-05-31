import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ShopOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Modal, Progress, Row, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import StatCard from './StatCard';
import { storeService, type Store } from '../../services/store.service';
import { userService, type User } from '../../services/user.service';
import { auditService, type AuditListItem } from '../../services/audit.service';
import { templateService, type Template } from '../../services/template.service';

const { Title, Text } = Typography;

export default function ManagerDashboard() {
    const navigate = useNavigate();

    const [stores, setStores] = useState<Store[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [audits, setAudits] = useState<AuditListItem[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);

    const loadDashboard = async () => {
        try {
        setLoading(true);

        const [storesData, usersData, auditsData, templatesData] = await Promise.all([
            storeService.getStores(),
            userService.getUsers(),
            auditService.getAudits(),
            templateService.getTemplates(),
        ]);

        setStores(storesData ?? []);
        setUsers(usersData ?? []);
        setAudits(auditsData ?? []);
        setTemplates(templatesData ?? []);
        } catch (error: any) {
        message.error(error?.response?.data?.error ?? 'Nie udało się pobrać danych dashboardu');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const stats = useMemo(() => {
        const activeStores = stores.filter((store) => store.isActive).length;
        const activeUsers = users.filter((user) => user.isActive).length;

        const newAudits = audits.filter((audit) => audit.status === 'NEW').length;
        const inProgressAudits = audits.filter((audit) => audit.status === 'IN_PROGRESS').length;
        const completedAudits = audits.filter((audit) => audit.status === 'COMPLETED').length;

        const activeTemplates = templates.filter((template) => template.isActive).length;

        const totalAudits = audits.length;
        const completionPercent =
        totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

        return {
        activeStores,
        activeUsers,
        newAudits,
        inProgressAudits,
        completedAudits,
        activeTemplates,
        totalAudits,
        completionPercent,
        };
    }, [stores, users, audits, templates]);

    const recentAudits = useMemo(() => {
    return [...audits]
        .sort(
        (a, b) =>
            new Date(b.createdAt ?? b.deadline).getTime() -
            new Date(a.createdAt ?? a.deadline).getTime(),
        )
        .slice(0, 3);
    }, [audits]);

    const [selectedAudit, setSelectedAudit] = useState<AuditListItem | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [auditDetails, setAuditDetails] = useState<any | null>(null);

    const openAuditDetails = async (audit: AuditListItem) => {
        try {
            setSelectedAudit(audit);
            setDetailsOpen(true);
            setDetailsLoading(true);

            const details = await auditService.getAuditById(audit.id);
            setAuditDetails(details);
        } catch (error: any) {
            message.error(error?.response?.data?.error ?? 'Nie udało się pobrać szczegółów audytu');
        } finally {
            setDetailsLoading(false);
        }
        };

    const closeAuditDetails = () => {
        setDetailsOpen(false);
        setSelectedAudit(null);
        setAuditDetails(null);
        };

  const columns: ColumnsType<AuditListItem> = [
    {
      title: 'Sklep',
      key: 'store',
      render: (_, record) => record.store?.name ?? '—',
    },
    
    {
      title: 'Termin',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (value: string) => new Date(value).toLocaleDateString('pl-PL'),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (record.status === 'NEW') return <Tag color="blue">Nowy</Tag>;
        if (record.status === 'IN_PROGRESS') return <Tag color="orange">W trakcie</Tag>;
        if (record.status === 'COMPLETED') return <Tag color="green">Zakończony</Tag>;
        return <Tag>{record.status}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2} style={{ marginBottom: 0 }}>
          Panel kierownika
        </Title>
        <Text type="secondary">Podgląd sklepów, użytkowników, audytów i szablonów</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Aktywne sklepy"
            value={stats.activeStores}
            prefix={<ShopOutlined />}
            valueColor="#1677ff"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Aktywni użytkownicy"
            value={stats.activeUsers}
            prefix={<TeamOutlined />}
            valueColor="#722ed1"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Audyty w toku"
            value={stats.inProgressAudits}
            prefix={<AuditOutlined />}
            valueColor="#fa8c16"
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Aktywne szablony"
            value={stats.activeTemplates}
            prefix={<FileTextOutlined />}
            valueColor="#3f8600"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Status audytów" loading={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text>Nowe</Text>
                <Progress
                  percent={
                    stats.totalAudits
                      ? Math.round((stats.newAudits / stats.totalAudits) * 100)
                      : 0
                  }
                  strokeColor="#1677ff"
                />
              </div>

              <div>
                <Text>W trakcie</Text>
                <Progress
                  percent={
                    stats.totalAudits
                      ? Math.round((stats.inProgressAudits / stats.totalAudits) * 100)
                      : 0
                  }
                  strokeColor="#fa8c16"
                />
              </div>

              <div>
                <Text>Zakończone</Text>
                <Progress
                  percent={
                    stats.totalAudits
                      ? Math.round((stats.completedAudits / stats.totalAudits) * 100)
                      : 0
                  }
                  strokeColor="#52c41a"
                />
              </div>

              <div>
                <Text type="secondary">Poziom realizacji</Text>
                <div style={{ marginTop: 8 }}>
                  <Progress type="circle" percent={stats.completionPercent} />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Ostatnie audyty" loading={loading}>
            <Table
                rowKey="id"
                columns={columns}
                dataSource={recentAudits}
                pagination={false}
                onRow={(record) => ({
                    onClick: () => openAuditDetails(record),
                    style: { cursor: 'pointer' },
                })}
            />
          </Card>
        </Col>
      </Row>
    <Modal
    title="Szczegóły audytu"
    open={detailsOpen}
    onCancel={closeAuditDetails}
    footer={[
        <Button key="close" onClick={closeAuditDetails}>
        Zamknij
        </Button>,
        <Button
      key="details"
      type="primary"
      disabled={!selectedAudit}
      onClick={() => {
        if (!selectedAudit) return;
        closeAuditDetails();
        navigate(`/audits/${selectedAudit.id}`);
      }}
    >
      Przejdź do szczegółów audytu
    </Button>,
    ]}
    >
    {selectedAudit && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
            <Text strong>Sklep: </Text>
            <Text>{selectedAudit.store?.name ?? '—'}</Text>
        </div>

        <div>
            <Text strong>Szablon: </Text>
            <Text>{selectedAudit.template?.name ?? '—'}</Text>
        </div>

        <div>
            <Text strong>Audytor: </Text>
            <Text>
            {selectedAudit.auditor
                ? `${selectedAudit.auditor.firstName} ${selectedAudit.auditor.lastName}`
                : '—'}
            </Text>
        </div>

        <div>
            <Text strong>Termin: </Text>
            <Text>{new Date(selectedAudit.deadline).toLocaleDateString('pl-PL')}</Text>
        </div>

        <div>
            <Text strong>Status: </Text>
            {selectedAudit.status === 'NEW' && <Tag color="blue">Nowy</Tag>}
            {selectedAudit.status === 'IN_PROGRESS' && <Tag color="orange">W trakcie</Tag>}
            {selectedAudit.status === 'COMPLETED' && <Tag color="green">Zakończony</Tag>}
        </div>
        <div>
            <text></text>
        </div>
        </Space>
    )}
    </Modal>
      <Card title="Szybkie akcje">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              block
              icon={<ShopOutlined />}
              onClick={() => navigate('/store')}
            >
              Przejdź do sklepów
            </Button>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Button
              block
              icon={<UserAddOutlined />}
              onClick={() => navigate('/users')}
            >
              Przejdź do użytkowników
            </Button>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Button
              block
              icon={<AuditOutlined />}
              onClick={() => navigate('/audits')}
            >
              Przejdź do audytów
            </Button>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Button
              block
              icon={<PlusOutlined />}
              onClick={() => navigate('/templates')}
            >
              Przejdź do szablonów
            </Button>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}