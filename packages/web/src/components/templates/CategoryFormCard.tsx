import { Button, Form, Input, InputNumber, Space, Card } from 'antd';
import { useEffect } from 'react';

export type CategoryFormValues = {
  name: string;
  order?: number;
};

type Props = {
  title: string;
  loading?: boolean;
  initialValues?: Partial<CategoryFormValues>;
  submitText: string;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export default function CategoryFormCard({
  title,
  loading,
  initialValues,
  submitText,
  onSubmit,
  onCancel,
}: Props) {
  const [form] = Form.useForm<CategoryFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      name: initialValues?.name,
      order: initialValues?.order,
    });
  }, [form, initialValues]);

  return (
    <Card size="small" title={title}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Nazwa kategorii"
          name="name"
          rules={[{ required: true, message: 'Podaj nazwę kategorii' }]}
        >
          <Input placeholder="Np. Higiena" />
        </Form.Item>

        <Form.Item label="Kolejność" name="order">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Space>
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              const values = await form.validateFields();
              await onSubmit(values);
              form.resetFields();
            }}
          >
            {submitText}
          </Button>

          {onCancel && <Button onClick={onCancel}>Anuluj</Button>}
        </Space>
      </Form>
    </Card>
  );
}