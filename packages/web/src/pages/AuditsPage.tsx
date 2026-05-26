import {
  Button,
  DatePicker,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { auditService, type AuditListItem } from '../services/audit.service';
import { storeService } from '../services/store.service';
import { templateService } from '../services/template.service';
import { userService, type User, type UserRole } from '../services/user.service';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;


type LocalUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string | null;
};

type AuditFormValues = {
  templateId: string;
  storeId: string;
  auditorId: string;
  deadline: dayjs.Dayjs;
};

export default function AuditsPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<AuditFormValues>();
  const [data, setData] = useState<AuditListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const [stores, setStores] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [auditors, setAuditors] = useState<User[]>([]);

  const userRaw = localStorage.getItem('user');
  const currentUser: LocalUser | null = userRaw ? JSON.parse(userRaw) : null;
  const isManager = currentUser?.role === 'MANAGER';
  const isAuditor = currentUser?.role === 'AUDITOR';

  const loadAudits = async () => {
    try {
      setLoading(true);
      const audits = await auditService.getAudits();
      setData(audits);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać audytów');
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    if (!isManager) return;

    try {
      const [storesResult, templatesResult, usersResult] = await Promise.all([
        storeService.getStores(),
        templateService.getTemplates(),
        userService.getUsers(),
      ]);

      setStores(storesResult.filter((store: any) => store.isActive));
      setTemplates(templatesResult.filter((template: any) => template.isActive));
      setAuditors(
        usersResult.filter(
          (user: User) => user.role === 'AUDITOR' && user.isActive,
        ),
      );
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać danych formularza');
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  useEffect(() => {
    if (isManager) {
      loadFormData();
    }
  }, [isManager]);

  const openCreateModal = () => {
    form.resetFields();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      await auditService.createAudit({
        templateId: values.templateId,
        storeId: values.storeId,
        auditorId: values.auditorId,
        deadline: values.deadline.toISOString(),
      });

      message.success('Audyt został utworzony');
      closeModal();
      await loadAudits();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error ?? 'Nie udało się utworzyć audytu');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: AuditListItem['status']) => {
    if (status === 'NEW') return 'blue';
    if (status === 'IN_PROGRESS') return 'orange';
    if (status === 'COMPLETED') return 'green';
    return 'default';
  };

  const columns: ColumnsType<AuditListItem> = useMemo(
    () => [
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: AuditListItem['status']) => (
          <Tag color={getStatusColor(value)}>{value}</Tag>
        ),
      },
      {
        title: 'Termin',
        dataIndex: 'deadline',
        key: 'deadline',
        render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
      },
      {
        title: 'Sklep',
        dataIndex: 'store',
        key: 'store',
        render: (store: AuditListItem['store']) => `${store.name} (${store.city})`,
      },
      {
        title: 'Szablon',
        dataIndex: 'template',
        key: 'template',
        render: (template: AuditListItem['template']) => template.name,
      },
      {
        title: 'Audytor',
        dataIndex: 'auditor',
        key: 'auditor',
        render: (auditor: AuditListItem['auditor']) =>
          `${auditor.firstName} ${auditor.lastName}`,
      },
      {
  title: 'Akcje',
  key: 'actions',
  render: (_, record) => (
    <Space wrap>
      <Button
        type="link"
        onClick={() => navigate(`/audits/${record.id}`)}
      >
        Szczegóły
      </Button>

      {isAuditor && record.status === 'NEW' && (
        <Button
          type="link"
          onClick={async () => {
            try {
              await auditService.startAudit(record.id);
              message.success('Audyt został rozpoczęty');
              await loadAudits();
            } catch (error: any) {
              message.error(
                error?.response?.data?.error ?? 'Nie udało się rozpocząć audytu'
              );
            }
          }}
        >
          Rozpocznij
        </Button>
      )}

      {isAuditor && record.status === 'IN_PROGRESS' && (
        <Button
          type="link"
          onClick={async () => {
            try {
              await auditService.completeAudit(record.id);
              message.success('Audyt został zakończony');
              await loadAudits();
            } catch (error: any) {
              message.error(
                error?.response?.data?.error ?? 'Nie udało się zakończyć audytu'
              );
            }
          }}
        >
          Zakończ
        </Button>
      )}

      {record.status === 'COMPLETED' && (
        <Button
          type="link"
          href={auditService.getAuditPdfUrl(record.id)}
          target="_blank"
        >
          PDF
        </Button>
      )}
    </Space>
  ),
}
    ],
    [isAuditor],
  );

  return (
    <Space style={{ padding: 24, width: '100%' }} direction="vertical" size="large">
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          display: 'flex',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Audyty
        </Title>

        {isManager && (
          <Button type="primary" onClick={openCreateModal}>
            Dodaj audyt
          </Button>
        )}
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      {isManager && (
        <Modal
          title="Dodaj audyt"
          open={open}
          onCancel={closeModal}
          onOk={handleSubmit}
          confirmLoading={saving}
          okText="Utwórz"
          cancelText="Anuluj"
          destroyOnHidden
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="Sklep"
              name="storeId"
              rules={[{ required: true, message: 'Wybierz sklep' }]}
            >
              <Select
                showSearch
                placeholder="Wybierz sklep"
                optionFilterProp="label"
                options={stores.map((store) => ({
                  value: store.id,
                  label: `${store.name} (${store.city})`,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Szablon"
              name="templateId"
              rules={[{ required: true, message: 'Wybierz szablon' }]}
            >
              <Select
                showSearch
                placeholder="Wybierz szablon"
                optionFilterProp="label"
                options={templates.map((template) => ({
                  value: template.id,
                  label: template.name,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Audytor"
              name="auditorId"
              rules={[{ required: true, message: 'Wybierz audytora' }]}
            >
              <Select
                showSearch
                placeholder="Wybierz audytora"
                optionFilterProp="label"
                options={auditors.map((auditor) => ({
                  value: auditor.id,
                  label: `${auditor.firstName} ${auditor.lastName} (${auditor.email})`,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Termin"
              name="deadline"
              rules={[{ required: true, message: 'Wybierz termin' }]}
            >
              <DatePicker
                showTime
                format="DD.MM.YYYY HH:mm"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Space>
  );
}