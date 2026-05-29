import { Button, Card, Popconfirm, Space, Typography } from 'antd';
import type { ChecklistItem, TemplateCategory } from '../../services/template.service';

const { Text } = Typography;

type Props = {
  category: TemplateCategory;
  onEditCategory: (category: TemplateCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: TemplateCategory) => void;
  onEditItem: (category: TemplateCategory, item: ChecklistItem) => void;
  onDeleteItem: (itemId: string) => void;
  formSlot?: React.ReactNode;
};

export default function TemplateCategoryCard({
  category,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  formSlot,
}: Props) {
  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{category.name}</Text>
          <Text type="secondary">Kolejność: {category.order}</Text>
        </Space>
      }
      extra={
        <Space wrap>
          <Button size="small" onClick={() => onEditCategory(category)}>
            Edytuj
          </Button>

          <Button size="small" onClick={() => onAddItem(category)}>
            Dodaj punkt
          </Button>

          <Popconfirm
            title="Usunąć kategorię?"
            okText="Tak"
            cancelText="Nie"
            onConfirm={() => onDeleteCategory(category.id)}
          >
            <Button size="small" danger>
              Usuń
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {category.items
          ?.slice()
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <Card
              key={item.id}
              size="small"
              type="inner"
              title={item.description}
              extra={
                <Space wrap>
                  <Text type="secondary">Kolejność: {item.order}</Text>

                  <Button size="small" onClick={() => onEditItem(category, item)}>
                    Edytuj
                  </Button>

                  <Popconfirm
                    title="Usunąć punkt?"
                    okText="Tak"
                    cancelText="Nie"
                    onConfirm={() => onDeleteItem(item.id)}
                  >
                    <Button size="small" danger>
                      Usuń
                    </Button>
                  </Popconfirm>
                </Space>
              }
            />
          ))}

        {formSlot}
      </Space>
    </Card>
  );
}