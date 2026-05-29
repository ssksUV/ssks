import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { templateService, type Template } from '../services/template.service';
import TemplateFormModal, {
  type TemplateFormValues,
} from '../components/templates/TemplateFormModal';

const { Title } = Typography;

type UserRole = 'ADMIN' | 'MANAGER' | 'AUDITOR';

type LocalUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string | null;
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const userRaw = localStorage.getItem('user');
  const currentUser: LocalUser | null = userRaw ? JSON.parse(userRaw) : null;
  const isManager = currentUser?.role === 'MANAGER';

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const templates = await templateService.getTemplates();
      setData(templates);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać szablonów');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = async (values: TemplateFormValues) => {
    try {
      setSaving(true);

      await templateService.createTemplate({
        name: values.name,
        description: values.description,
      });

      message.success('Szablon został utworzony');
      setCreateOpen(false);
      await loadTemplates();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się utworzyć szablonu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await templateService.deleteTemplate(templateId);
      message.success('Szablon został dezaktywowany');
      await loadTemplates();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się usunąć szablonu');
    }
  };

  const columns: ColumnsType<Template> = useMemo(
    () => [
      {
        title: 'Nazwa',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Opis',
        dataIndex: 'description',
        key: 'description',
        render: (value?: string | null) => value || '—',
      },
      {
        title: 'Kategorie',
        key: 'categoriesCount',
        render: (_, record) => record.categories.length,
      },
      {
        title: 'Punkty',
        key: 'itemsCount',
        render: (_, record) =>
          record.categories.reduce((sum, category) => sum + category.items.length, 0),
      },
      {
        title: 'Status',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (value: boolean) =>
          value ? <Tag color="green">AKTYWNY</Tag> : <Tag>NIEAKTYWNY</Tag>,
      },
      {
        title: 'Akcje',
        key: 'actions',
        render: (_, record) => (
          <Space wrap>
            <Button type="link" onClick={() => navigate(`/templates/${record.id}/edit`)}>
              Szczegóły
            </Button>

            <Popconfirm
              title="Dezaktywować szablon?"
              okText="Tak"
              cancelText="Nie"
              onConfirm={() => handleDeleteTemplate(record.id)}
            >
              <Button type="link" danger>
                Usuń
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate],
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
          Szablony audytów
        </Title>

        {isManager && (
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Dodaj szablon
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

      <TemplateFormModal
        open={createOpen}
        title="Dodaj szablon"
        confirmLoading={saving}
        okText="Utwórz"
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreateTemplate}
      />
    </Space>
  );
}