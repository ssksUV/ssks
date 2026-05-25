import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
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
  userService,
  type CreateUserDto,
  type UpdateUserDto,
  type User,
  type UserRole,
} from '../services/user.service';
import { tenantService } from '../services/tenant.service';

const { Title } = Typography;

type UserFormValues = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
  tenantId?: string;
};

type LocalUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string | null;
};

type TenantOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export default function UsersPage() {
  const [form] = Form.useForm<UserFormValues>();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>();

  const userRaw = localStorage.getItem('user');
  const currentUser: LocalUser | null = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER';

  const loadTenants = async () => {
    if (!isAdmin) return;

    try {
      const result = await tenantService.getTenants();
      setTenants(result.filter((tenant: any) => tenant.isActive));
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać tenantów');
    }
  };

  const loadUsers = async (tenantId?: string) => {
    try {
      setLoading(true);
      const users = await userService.getUsers(isAdmin ? tenantId : undefined);
      setData(users);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać użytkowników');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTenants();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      if (selectedTenantId) {
        loadUsers(selectedTenantId);
      } else {
        setData([]);
      }
    } else {
      loadUsers();
    }
  }, [isAdmin, selectedTenantId]);

  const openCreateModal = () => {
    if (isAdmin && !selectedTenantId) {
      message.warning('Najpierw wybierz tenant');
      return;
    }

    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: isManager ? 'AUDITOR' : 'MANAGER',
      isActive: true,
      tenantId: isAdmin ? selectedTenantId : currentUser?.tenantId ?? undefined,
    });
    setOpen(true);
  };

  const openEditModal = (user: User) => {
    if (isAdmin && !selectedTenantId) {
      message.warning('Najpierw wybierz tenant');
      return;
    }

    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingUser) {
        const payload: UpdateUserDto = {
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password || undefined,
          isActive: values.isActive,
        };

        await userService.updateUser(
          editingUser.id,
          payload,
          isAdmin ? selectedTenantId : undefined,
        );

        message.success('Użytkownik został zaktualizowany');
      } else {
        const payload: CreateUserDto = {
          email: values.email,
          password: values.password!,
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          tenantId: isAdmin ? selectedTenantId : undefined,
        };

        await userService.createUser(payload);
        message.success('Użytkownik został utworzony');
      }

      closeModal();
      await loadUsers(isAdmin ? selectedTenantId : undefined);
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać użytkownika');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User, checked: boolean) => {
  try {
    await userService.updateUser(
      user.id,
      {
        isActive: checked,
      },
      isAdmin ? selectedTenantId : undefined,
    );

    message.success(
      `Użytkownik został ${checked ? 'aktywowany' : 'dezaktywowany'}`
    );

    await loadUsers(isAdmin ? selectedTenantId : undefined);
  } catch (error: any) {
    message.error(
      error?.response?.data?.error ?? 'Nie udało się zmienić statusu użytkownika'
    );
  }
};


  const handleDeactivate = async (user: User) => {
    try {
      await userService.deleteUser(
        user.id,
        isAdmin ? selectedTenantId : undefined,
      );
      message.success('Użytkownik został dezaktywowany');
      await loadUsers(isAdmin ? selectedTenantId : undefined);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się dezaktywować użytkownika');
    }
  };

  const getRoleColor = (role: UserRole) => {
    if (role === 'ADMIN') return 'red';
    if (role === 'MANAGER') return 'blue';
    if (role === 'AUDITOR') return 'gold';
    return 'default';
  };

  const roleOptions = isManager
    ? [
        { value: 'MANAGER', label: 'MANAGER' },
        { value: 'AUDITOR', label: 'AUDITOR' },
      ]
    : [
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'MANAGER', label: 'MANAGER' },
        { value: 'AUDITOR', label: 'AUDITOR' },
      ];

  const columns: ColumnsType<User> = useMemo(
    () => [
      {
        title: 'Imię',
        dataIndex: 'firstName',
        key: 'firstName',
      },
      {
        title: 'Nazwisko',
        dataIndex: 'lastName',
        key: 'lastName',
      },
      {
        title: 'E-mail',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Rola',
        dataIndex: 'role',
        key: 'role',
        render: (value: UserRole) => <Tag color={getRoleColor(value)}>{value}</Tag>,
      },
      {
        title: 'Status',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (value: boolean, record: User) => (
             <Space>
              <Switch
                checked={value}
                onChange={(checked) => handleToggleStatus(record, checked)}
              />
              <Tag color={value ? 'green' : 'red'}>
                {value ? 'Aktywny' : 'Nieaktywny'}
              </Tag>
            </Space>
          ),
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
                title="Dezaktywować użytkownika?"
                description="Ta operacja zablokuje dostęp do konta."
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
    [selectedTenantId],
  );

  return (
    <Space style={{ padding: 24, width: '100%' }} direction="vertical" size="large">
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Użytkownicy
        </Title>

        <Space wrap>
          {isAdmin && (
           <Select
              showSearch
              placeholder="Wyszukaj tenant"
              style={{ width: 260 }}
              value={selectedTenantId}
              onChange={(value) => setSelectedTenantId(value)}
              allowClear
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={tenants
                .filter((tenant: any) => tenant.isActive)
                .map((tenant: any) => ({
                  value: tenant.id,
                  label: tenant.name,
                }))}
            />
          )}

          <Button
            type="primary"
            onClick={openCreateModal}
            disabled={isAdmin && !selectedTenantId}
          >
            Dodaj użytkownika
          </Button>
        </Space>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title={editingUser ? 'Edytuj użytkownika' : 'Dodaj użytkownika'}
        open={open}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={saving}
        okText={editingUser ? 'Zapisz zmiany' : 'Utwórz'}
        cancelText="Anuluj"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Imię"
            name="firstName"
            rules={[{ required: true, message: 'Podaj imię' }]}
          >
            <Input placeholder="Np. Jan" />
          </Form.Item>

          <Form.Item
            label="Nazwisko"
            name="lastName"
            rules={[{ required: true, message: 'Podaj nazwisko' }]}
          >
            <Input placeholder="Np. Kowalski" />
          </Form.Item>

          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Podaj adres e-mail' },
              { type: 'email', message: 'Wprowadź poprawny adres e-mail' },
            ]}
          >
            <Input placeholder="Np. jan@ssks.pl" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Hasło"
              name="password"
              rules={[{ required: true, message: 'Podaj hasło' }]}
            >
              <Input.Password placeholder="Podaj hasło" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item label="Nowe hasło" name="password">
              <Input.Password placeholder="Opcjonalnie nowe hasło" />
            </Form.Item>
          )}

          {!editingUser && (
            <Form.Item
              label="Rola"
              name="role"
              rules={[{ required: true, message: 'Wybierz rolę' }]}
            >
              <Select options={roleOptions} />
            </Form.Item>
          )}

          {editingUser && (
            <>
              <Form.Item label="Rola">
                <Input value={editingUser.role} disabled />
              </Form.Item>

              <Form.Item label="Aktywny" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Space>
  );
}