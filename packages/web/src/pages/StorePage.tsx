import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import {
  storeService,
  type CreateStoreDto,
  type Store,
  type UpdateStoreDto,
} from '../services/store.service';

const { Title } = Typography;

type StoreFormValues = {
  name: string;
  address: string;
  city: string;
  region?: string;
  isActive?: boolean;
};

export default function StorePage() {
  const [form] = Form.useForm<StoreFormValues>();
  const [data, setData] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [saving, setSaving] = useState(false);

  const loadStores = async () => {
    try {
      setLoading(true);
      const stores = await storeService.getStores();
      setData(stores);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać sklepów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const openCreateModal = () => {
    setEditingStore(null);
    form.resetFields();
    form.setFieldsValue({
      name: '',
      address: '',
      city: '',
      region: '',
    });
    setOpen(true);
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    form.setFieldsValue({
      name: store.name,
      address: store.address,
      city: store.city,
      region: store.region ?? '',
      isActive: store.isActive,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingStore(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingStore) {
        const payload: UpdateStoreDto = {
          name: values.name,
          address: values.address,
          city: values.city,
          region: values.region || undefined,
          isActive: values.isActive,
        };

        await storeService.updateStore(editingStore.id, payload);
        message.success('Sklep został zaktualizowany');
      } else {
        const payload: CreateStoreDto = {
          name: values.name,
          address: values.address,
          city: values.city,
          region: values.region || undefined,
        };

        await storeService.createStore(payload);
        message.success('Sklep został utworzony');
      }

      closeModal();
      await loadStores();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać sklepu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (store: Store) => {
    try {
      await storeService.deleteStore(store.id);
      message.success('Sklep został dezaktywowany');
      await loadStores();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się dezaktywować sklepu');
    }
  };

  const columns: ColumnsType<Store> = useMemo(
    () => [
      {
        title: 'Nazwa',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Adres',
        dataIndex: 'address',
        key: 'address',
      },
      {
        title: 'Miasto',
        dataIndex: 'city',
        key: 'city',
      },
      {
        title: 'Region',
        dataIndex: 'region',
        key: 'region',
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
          <Space>
            <Button type="link" onClick={() => openEditModal(record)}>
              Edytuj
            </Button>

            {record.isActive && (
              <Popconfirm
                title="Dezaktywować sklep?"
                description="Ta operacja ustawi sklep jako nieaktywny."
                okText="Tak"
                cancelText="Nie"
                onConfirm={() => handleDeactivate(record)}
              >
                <Button type="link" danger>
                  Dezaktywuj
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [],
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
          Sklepy
        </Title>

        <Button type="primary" onClick={openCreateModal}>
          Dodaj sklep
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editingStore ? 'Edytuj sklep' : 'Dodaj sklep'}
        open={open}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText={editingStore ? 'Zapisz zmiany' : 'Utwórz'}
        cancelText="Anuluj"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nazwa sklepu"
            name="name"
            rules={[{ required: true, message: 'Podaj nazwę sklepu' }]}
          >
            <Input placeholder="Np. Sklep nr 1" />
          </Form.Item>

          <Form.Item
            label="Adres"
            name="address"
            rules={[{ required: true, message: 'Podaj adres' }]}
          >
            <Input placeholder="Np. ul. Testowa 1" />
          </Form.Item>

          <Form.Item
            label="Miasto"
            name="city"
            rules={[{ required: true, message: 'Podaj miasto' }]}
          >
            <Input placeholder="Np. Warszawa" />
          </Form.Item>

          <Form.Item label="Region / województwo" name="region">
            <Input placeholder="Np. Mazowieckie" />
          </Form.Item>

          {editingStore && (
            <Form.Item label="Aktywny" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  );
}