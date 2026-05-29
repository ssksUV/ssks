import { Button, Card, Form, Input, InputNumber, Space } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;

export type ItemFormValues = {
  description: string;
  order?: number;
};

type Props = {
  title: string;
  loading?: boolean;
  initialValues?: Partial<ItemFormValues>;
  submitText: string;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export default function ItemFormCard({
  title,
  loading,
  initialValues,
  submitText,
  onSubmit,
  onCancel,
}: Props) {
  const [form] = Form.useForm<ItemFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      description: initialValues?.description,
      order: initialValues?.order,
    });
  }, [form, initialValues]);

  return (
    <Card size="small" type="inner" title={title}>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Treść punktu"
          name="description"
          rules={[{ required: true, message: 'Podaj treść punktu' }]}
        >
          <TextArea rows={3} placeholder="Np. Czy podłogi są czyste?" />
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

          <Button onClick={onCancel}>Anuluj</Button>
        </Space>
      </Form>
    </Card>
  );
}