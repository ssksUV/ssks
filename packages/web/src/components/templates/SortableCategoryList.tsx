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
import type { ReactNode } from 'react';
import { Button, Card, Popconfirm, Space, Typography } from 'antd';
import type { ChecklistItem, TemplateCategory } from '../../services/template.service';
import SortableItemList from './SortableItemList';
import SortableRow from './SortableRow';

const { Text } = Typography;

type Props = {
  categories: TemplateCategory[];
  selectedCategoryId?: string | null;
  editingItem?: ChecklistItem | null;
  formSlot?: (category: TemplateCategory) => ReactNode;
  onEditCategory: (category: TemplateCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddItem: (category: TemplateCategory) => void;
  onEditItem: (category: TemplateCategory, item: ChecklistItem) => void;
  onDeleteItem: (itemId: string) => void;
  onReorderCategories: (categories: TemplateCategory[]) => Promise<void> | void;
  onReorderItems: (category: TemplateCategory, items: ChecklistItem[]) => Promise<void> | void;
};

export default function SortableCategoryList({
  categories,
  formSlot,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderCategories,
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

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = sortedCategories.findIndex((category) => category.id === active.id);
    const newIndex = sortedCategories.findIndex((category) => category.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sortedCategories, oldIndex, newIndex).map((category, index) => ({
      ...category,
      order: index + 1,
    }));

    await onReorderCategories(reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortedCategories.map((category) => category.id)}
        strategy={verticalListSortingStrategy}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {sortedCategories.map((category) => (
            <SortableRow key={category.id} id={category.id}>
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
                  <SortableItemList
                    category={category}
                    onEditItem={onEditItem}
                    onDeleteItem={onDeleteItem}
                    onReorderItems={onReorderItems}
                  />

                  {formSlot?.(category)}
                </Space>
              </Card>
            </SortableRow>
          ))}
        </Space>
      </SortableContext>
    </DndContext>
  );
}