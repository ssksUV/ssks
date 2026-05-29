import { Form, Input, Modal } from 'antd';

const { TextArea } = Input;

export type TemplateFormValues = {
  name: string;
  description?: string;
};

type Props = {
  open: boolean;
  title: string;
  confirmLoading?: boolean;
  initialValues?: Partial<TemplateFormValues>;
  okText?: string;
  onCancel: () => void;
  onSubmit: (values: TemplateFormValues) => Promise<void> | void;
};

export default function TemplateFormModal({
  open,
  title,
  confirmLoading,
  initialValues,
  okText = 'Zapisz',
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<TemplateFormValues>();

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
        form.resetFields();
      }}
      confirmLoading={confirmLoading}
      okText={okText}
      cancelText="Anuluj"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        key={open ? JSON.stringify(initialValues ?? {}) : 'closed'}
      >
        <Form.Item
          label="Nazwa"
          name="name"
          rules={[{ required: true, message: 'Podaj nazwę szablonu' }]}
        >
          <Input placeholder="Np. Szablon otwarcia sklepu" />
        </Form.Item>

        <Form.Item label="Opis" name="description">
          <TextArea rows={4} placeholder="Opis opcjonalny" />
        </Form.Item>
      </Form>
    </Modal>
  );
}