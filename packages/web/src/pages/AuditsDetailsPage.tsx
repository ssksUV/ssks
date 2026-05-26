import {
  Button,
  Card,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auditService } from '../services/audit.service';
import { uploadService } from '../services/upload.service';

const { Title, Text } = Typography;
const { TextArea } = Input;

type UserRole = 'ADMIN' | 'MANAGER' | 'AUDITOR';
type ResultStatus = 'OK' | 'FAIL' | 'NA';

type LocalUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId?: string | null;
};

type AuditResult = {
  checklistItemId: string;
  status: ResultStatus;
  score?: number;
  note?: string;
  photoUrl?: string;
};

type AuditItem = {
  id: string;
  description: string;
  order: number;
};

type AuditCategory = {
  id: string;
  name: string;
  order: number;
  items: AuditItem[];
};

type AuditDetails = {
  id: string;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED';
  deadline: string;
  store: {
    id: string;
    name: string;
    city?: string;
    address?: string;
  };
  template: {
    id: string;
    name: string;
    description?: string;
    categories: AuditCategory[];
  };
  auditor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  results?: AuditResult[];
};

export default function AuditDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [audit, setAudit] = useState<AuditDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});

  const userRaw = localStorage.getItem('user');
  const currentUser: LocalUser | null = userRaw ? JSON.parse(userRaw) : null;
  const isAuditor = currentUser?.role === 'AUDITOR';

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  };

  const loadAudit = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const result = await auditService.getAuditById(id);
      setAudit(result);

      const formValues: Record<string, any> = {};

      result?.template?.categories?.forEach((category: AuditCategory) => {
        category.items.forEach((item: AuditItem) => {
          const existingResult = result?.results?.find(
            (r: AuditResult) => r.checklistItemId === item.id,
          );

          formValues[`status_${item.id}`] = existingResult?.status;
          formValues[`score_${item.id}`] = existingResult?.score;
          formValues[`note_${item.id}`] = existingResult?.note;
          formValues[`photoUrl_${item.id}`] = existingResult?.photoUrl;
        });
      });

      form.setFieldsValue(formValues);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać audytu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [id]);

  const getStatusColor = (status: string) => {
    if (status === 'NEW') return 'blue';
    if (status === 'IN_PROGRESS') return 'orange';
    if (status === 'COMPLETED') return 'green';
    return 'default';
  };

  const canEditResults = isAuditor && audit?.status === 'IN_PROGRESS';

  const orderedCategories = useMemo(() => {
    return [...(audit?.template?.categories ?? [])].sort((a, b) => a.order - b.order);
  }, [audit]);

  const handleSaveResults = async () => {
    if (!id || !audit) return;

    try {
      const values = await form.validateFields();
      setSaving(true);

      const results = audit.template.categories
        .flatMap((category: AuditCategory) =>
          category.items.map((item: AuditItem) => ({
            checklistItemId: item.id,
            status: values[`status_${item.id}`],
            score: values[`score_${item.id}`],
            note: values[`note_${item.id}`],
            photoUrl: values[`photoUrl_${item.id}`],
          })),
        )
        .filter((result) => result.status);

      await auditService.saveAuditResults(id, { results });
      message.success('Wyniki audytu zostały zapisane');
      await loadAudit();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać wyników');
    } finally {
      setSaving(false);
    }
  };


  const handleUploadPhoto = async (itemId: string, file: File) => {
    try {
      setUploadingMap((prev) => ({ ...prev, [itemId]: true }));

      const result = await uploadService.uploadPhoto(file);
      form.setFieldValue(`photoUrl_${itemId}`, result.url);

      message.success('Zdjęcie zostało przesłane');
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się przesłać zdjęcia');
    } finally {
      setUploadingMap((prev) => ({ ...prev, [itemId]: false }));
    }

    return false;
  };

  if (loading) {
    return (
      <Space style={{ width: '100%', padding: 24, justifyContent: 'center' }}>
        <Spin size="large" />
      </Space>
    );
  }

  if (!audit) {
    return (
      <Space direction="vertical" style={{ width: '100%', padding: 24 }}>
        <Title level={3}>Nie znaleziono audytu</Title>
        <Button onClick={() => navigate('/audits')}>Wróć</Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: 24 }}>
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Szczegóły audytu
          </Title>
          <Text type="secondary">ID: {audit.id}</Text>
        </div>

        <Space wrap>
          <Tag color={getStatusColor(audit.status)}>{audit.status}</Tag>
            {audit.status === 'COMPLETED' && (
            <Space>
                <Button
  onClick={async () => {
    try {
      await auditService.openAuditPdf(audit.id);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się otworzyć PDF');
    }
  }}
>
  Otwórz PDF
</Button>
            </Space>
            )}

          <Button onClick={() => navigate('/audits')}>Wróć</Button>
        </Space>
      </Space>

      <Card title="Informacje o audycie">
        <Space direction="vertical">
          <Text>
            <strong>Sklep:</strong> {audit.store.name}
            {audit.store.city ? `, ${audit.store.city}` : ''}
          </Text>
          <Text>
            <strong>Audytor:</strong> {audit.auditor.firstName} {audit.auditor.lastName}
          </Text>
          <Text>
            <strong>Szablon:</strong> {audit.template.name}
          </Text>
          {audit.template.description && (
            <Text>
              <strong>Opis:</strong> {audit.template.description}
            </Text>
          )}
          <Text>
            <strong>Termin:</strong> {new Date(audit.deadline).toLocaleString('pl-PL')}
          </Text>
        </Space>
      </Card>

      <Form form={form} layout="vertical">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {orderedCategories.map((category) => (
            <Card key={category.id} title={category.name}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {[...category.items]
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <Card
                      key={item.id}
                      size="small"
                      title={item.description}
                      styles={{ body: { paddingBottom: 8 } }}
                    >
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Form.Item
                          label="Status"
                          name={`status_${item.id}`}
                          rules={
                            canEditResults
                              ? [{ required: true, message: 'Wybierz status' }]
                              : []
                          }
                        >
                          <Select
                            disabled={!canEditResults}
                            placeholder="Wybierz wynik"
                            options={[
                              { value: 'OK', label: 'OK' },
                              { value: 'FAIL', label: 'FAIL' },
                              { value: 'NA', label: 'NA' },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item label="Ocena" name={`score_${item.id}`}>
                          <InputNumber
                            disabled={!canEditResults}
                            min={1}
                            max={5}
                            style={{ width: '100%' }}
                            placeholder="Np. 5"
                          />
                        </Form.Item>

                        <Form.Item label="Notatka" name={`note_${item.id}`}>
                          <TextArea
                            disabled={!canEditResults}
                            rows={3}
                            placeholder="Dodaj notatkę"
                          />
                        </Form.Item>

                        <Form.Item name={`photoUrl_${item.id}`} hidden>
                          <Input />
                        </Form.Item>

                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Upload
                            accept="image/*"
                            maxCount={1}
                            showUploadList={false}
                            disabled={!canEditResults || uploadingMap[item.id]}
                            beforeUpload={(file) => handleUploadPhoto(item.id, file)}
                          >
                            <Button
                              disabled={!canEditResults}
                              loading={uploadingMap[item.id]}
                            >
                              Dodaj zdjęcie
                            </Button>
                          </Upload>

                          <Form.Item shouldUpdate noStyle>
                            {() => {
                              const photoUrl = form.getFieldValue(`photoUrl_${item.id}`);

                              return photoUrl ? (
                                <div style={{ marginTop: 8 }}>
                                  <Image
  src={getImageUrl(photoUrl)}
  alt="Zdjęcie punktu kontrolnego"
  width={220}
  style={{
    maxWidth: '100%',
    borderRadius: 8,
    objectFit: 'cover',
  }}
  preview={{
    mask: 'Powiększ',
  }}
/>
                                </div>
                              ) : null;
                            }}
                          </Form.Item>
                        </Space>
                      </Space>
                    </Card>
                  ))}
              </Space>
            </Card>
          ))}
        </Space>

        {canEditResults && (
          <Space style={{ marginTop: 24 }}>
            <Button type="primary" loading={saving} onClick={handleSaveResults}>
              Zapisz wyniki
            </Button>
          </Space>
        )}
      </Form>
    </Space>
  );
}