import { Button, Card, Space, Spin, Typography, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  templateService,
  type ChecklistItem,
  type Template,
  type TemplateCategory,
} from '../services/template.service';
import CategoryFormCard, {
  type CategoryFormValues,
} from '../components/templates/CategoryFormCard';
import ItemFormCard, {
  type ItemFormValues,
} from '../components/templates/ItemFormCard';
import TemplateCategoryCard from '../components/templates/TemplateCategoryCard';
import TemplateFormModal, {
  type TemplateFormValues,
} from '../components/templates/TemplateFormModal';
import SortableCategoryList from '../components/templates/SortableCategoryList';

const { Title } = Typography;

export default function TemplateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const [template, setTemplate] = useState<Template | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);

  const loadTemplate = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await templateService.getTemplateById(id);
      setTemplate(data);
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się pobrać szablonu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  const handleSaveTemplate = async (values: TemplateFormValues) => {
    if (!id) return;

    try {
      setSavingTemplate(true);
      await templateService.updateTemplate(id, {
        name: values.name,
        description: values.description,
      });
      message.success('Szablon został zapisany');
      setTemplateModalOpen(false);
      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać szablonu');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleAddCategory = async (values: CategoryFormValues) => {
    if (!id) return;

    try {
      setSavingCategory(true);
      await templateService.createCategory(id, {
        name: values.name,
        order: values.order,
      });
      message.success('Kategoria została dodana');
      setEditingCategory(null);
      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się dodać kategorii');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleUpdateCategory = async (values: CategoryFormValues) => {
    if (!editingCategory) return;

    try {
      setSavingCategory(true);
      await templateService.updateCategory(editingCategory.id, {
        name: values.name,
        order: values.order,
      });
      message.success('Kategoria została zapisana');
      setEditingCategory(null);
      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać kategorii');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await templateService.deleteCategory(categoryId);
      message.success('Kategoria została usunięta');

      if (selectedCategory?.id === categoryId) {
        setSelectedCategory(null);
        setEditingItem(null);
      }

      if (editingCategory?.id === categoryId) {
        setEditingCategory(null);
      }

      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się usunąć kategorii');
    }
  };

  const handleAddItem = async (values: ItemFormValues) => {
    if (!selectedCategory) return;

    try {
      setSavingItem(true);
      await templateService.createItem(selectedCategory.id, {
        description: values.description,
        order: values.order,
      });
      message.success('Punkt został dodany');
      setEditingItem(null);
      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się dodać punktu');
    } finally {
      setSavingItem(false);
    }
  };

  const handleUpdateItem = async (values: ItemFormValues) => {
    if (!editingItem) return;

    try {
      setSavingItem(true);
      await templateService.updateItem(editingItem.id, {
        description: values.description,
        order: values.order,
      });
      message.success('Punkt został zapisany');
      setEditingItem(null);
      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się zapisać punktu');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await templateService.deleteItem(itemId);
      message.success('Punkt został usunięty');

      if (editingItem?.id === itemId) {
        setEditingItem(null);
      }

      await loadTemplate();
    } catch (error: any) {
      message.error(error?.response?.data?.error ?? 'Nie udało się usunąć punktu');
    }
  };

  const startAddItem = (category: TemplateCategory) => {
    setSelectedCategory(category);
    setEditingItem(null);
  };

  const startEditItem = (category: TemplateCategory, item: ChecklistItem) => {
    setSelectedCategory(category);
    setEditingItem(item);
  };

  const cancelItemForm = () => {
    setSelectedCategory(null);
    setEditingItem(null);
  };

  const cancelCategoryEdit = () => {
    setEditingCategory(null);
  };

    const handleReorderCategories = async (categories: TemplateCategory[]) => {
  try {
    setSavingCategory(true);

    for (const category of categories) {
      await templateService.updateCategory(category.id, {
        name: category.name,
        order: category.order,
      });
    }

    message.success('Zmieniono kolejność kategorii');
    await loadTemplate();
  } catch (error: any) {
    message.error(error?.response?.data?.error ?? 'Nie udało się zmienić kolejności kategorii');
  } finally {
    setSavingCategory(false);
  }
};

const handleReorderItems = async (
  category: TemplateCategory,
  items: ChecklistItem[],
) => {
  try {
    setSavingItem(true);

    for (const item of items) {
      await templateService.updateItem(item.id, {
        description: item.description,
        order: item.order,
      });
    }

    message.success(`Zmieniono kolejność punktów w kategorii: ${category.name}`);
    await loadTemplate();
  } catch (error: any) {
    message.error(error?.response?.data?.error ?? 'Nie udało się zmienić kolejności punktów');
  } finally {
    setSavingItem(false);
  }
};

  if (loading && !template) {
    return (
      <Space style={{ padding: 24, width: '100%', justifyContent: 'center' }}>
        <Spin />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ padding: 24, width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%', display: 'flex' }}>
        <Title level={2} style={{ margin: 0 }}>
          Edycja szablonu
        </Title>

        <Space>
          <Button onClick={() => setTemplateModalOpen(true)}>Edytuj dane szablonu</Button>
          <Button onClick={() => navigate('/templates')}>Powrót</Button>
        </Space>
      </Space>

      <Card title="Dane szablonu">
        <Space direction="vertical" size="small">
          <div>
            <strong>Nazwa:</strong> {template?.name}
          </div>
          <div>
            <strong>Opis:</strong> {template?.description || '—'}
          </div>
          <div>
            <strong>Liczba kategorii:</strong> {template?.categories?.length ?? 0}
          </div>
        </Space>
      </Card>

      <Card title="Kategorie i punkty">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <CategoryFormCard
            title={editingCategory ? 'Edytuj kategorię' : 'Dodaj kategorię'}
            loading={savingCategory}
            submitText={editingCategory ? 'Zapisz kategorię' : 'Dodaj kategorię'}
            initialValues={
              editingCategory
                ? {
                    name: editingCategory.name,
                    order: editingCategory.order,
                  }
                : undefined
            }
            onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
            onCancel={editingCategory ? cancelCategoryEdit : undefined}
          />

          {template?.categories && (
  <SortableCategoryList
    categories={template.categories}
    onEditCategory={setEditingCategory}
    onDeleteCategory={handleDeleteCategory}
    onAddItem={startAddItem}
    onEditItem={startEditItem}
    onDeleteItem={handleDeleteItem}
    onReorderCategories={handleReorderCategories}
    onReorderItems={handleReorderItems}
    formSlot={(category) =>
      selectedCategory?.id === category.id ? (
        <ItemFormCard
          title={editingItem ? 'Edytuj punkt' : 'Dodaj punkt'}
          loading={savingItem}
          submitText={editingItem ? 'Zapisz punkt' : 'Dodaj punkt'}
          initialValues={
            editingItem
              ? {
                  description: editingItem.description,
                  order: editingItem.order,
                }
              : undefined
          }
          onSubmit={editingItem ? handleUpdateItem : handleAddItem}
          onCancel={cancelItemForm}
        />
      ) : null
    }
  />
)}
        </Space>
      </Card>

      <TemplateFormModal
        open={templateModalOpen}
        title="Edytuj szablon"
        confirmLoading={savingTemplate}
        okText="Zapisz"
        initialValues={{
          name: template?.name ?? '',
          description: template?.description ?? '',
        }}
        onCancel={() => setTemplateModalOpen(false)}
        onSubmit={handleSaveTemplate}
      />
    </Space>
  );
}