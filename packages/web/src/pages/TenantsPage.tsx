import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { tenantService } from '../services/tenant.service';

const { Title } = Typography;

type Tenant = {
  id: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type TenantFormValues = {
  name: string;
  logoUrl?: string;
  isActive?: boolean;
};

export default function TenantPage() {
  const [form] = Form.useForm<TenantFormValues>();
  const [data, setData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const tenants = await tenantService.getTenants();
      setData(tenants);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać tenantów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const openCreateModal = () => {
    setEditingTenant(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      logoUrl: '',
      isActive: true,
    });
    setOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    form.setFieldsValue({
      name: tenant.name,
      logoUrl: tenant.logoUrl ?? '',
      isActive: tenant.isActive,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingTenant(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingTenant) {
        await tenantService.updateTenant(editingTenant.id, {
          name: values.name,
          logoUrl: values.logoUrl || undefined,
          isActive: values.isActive,
        });
        message.success('Tenant został zaktualizowany');
      } else {
        await tenantService.createTenant({
          name: values.name,
          logoUrl: values.logoUrl || undefined,
        });
        message.success('Tenant został utworzony');
      }

      closeModal();
      await loadTenants();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać tenanta');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Tenant> = useMemo(
    () => [
      {
        title: 'Nazwa',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Logo URL',
        dataIndex: 'logoUrl',
        key: 'logoUrl',
        render: (value: string | null | undefined) => value || '—',
      },
      {
        title: 'Status',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (value: boolean) =>
          value ? <Tag color="green">Aktywny</Tag> : <Tag color="red">Nieaktywny</Tag>,
      },
      {
        title: 'Akcje',
        key: 'actions',
        render: (_, record) => (
          <Button type="link" onClick={() => openEditModal(record)}>
            Edytuj
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={2} style={{ margin: 0 }}>
          Tenants
        </Title>

        <Button type="primary" onClick={openCreateModal}>
          Dodaj tenant
        </Button>
      </Space>

      <Table<Tenant>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editingTenant ? 'Edytuj tenant' : 'Dodaj tenant'}
        open={open}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText={editingTenant ? 'Zapisz' : 'Dodaj'}
        cancelText="Anuluj"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nazwa"
            name="name"
            rules={[{ required: true, message: 'Podaj nazwę tenanta' }]}
          >
            <Input placeholder="Np. Lidl Polska" />
          </Form.Item>

          <Form.Item label="Logo URL" name="logoUrl">
            <Input placeholder="https://example.com/logo.png" />
          </Form.Item>

          {editingTenant && (
            <Form.Item
              label="Aktywny"
              name="isActive"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  );
}