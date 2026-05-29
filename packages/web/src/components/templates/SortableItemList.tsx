import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Card, Popconfirm, Space, Typography } from 'antd';
import type { ChecklistItem, TemplateCategory } from '../../services/template.service';
import SortableRow from './SortableRow';

const { Text } = Typography;

type Props = {
  category: TemplateCategory;
  onEditItem: (category: TemplateCategory, item: ChecklistItem) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderItems: (category: TemplateCategory, items: ChecklistItem[]) => Promise<void> | void;
};

export default function SortableItemList({
  category,
  onEditItem,
  onDeleteItem,
  onReorderItems,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedItems = [...category.items].sort((a, b) => a.order - b.order);

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
    const newIndex = sortedItems.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedItems, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    await onReorderItems(category, reordered);
  };

  if (sortedItems.length === 0) {
    return <Text type="secondary">Brak punktów kontrolnych</Text>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortedItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {sortedItems.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              <Card
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
            </SortableRow>
          ))}
        </Space>
      </SortableContext>
    </DndContext>
  );
}