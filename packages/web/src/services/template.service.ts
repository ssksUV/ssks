import { http } from './http';

export type ChecklistItem = {
  id: string;
  description: string;
  order: number;
};

export type TemplateCategory = {
  id: string;
  name: string;
  order: number;
  items: ChecklistItem[];
};

export type Template = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  categories: TemplateCategory[];
};

export type CreateTemplateDto = {
  name: string;
  description?: string;
};

export type UpdateTemplateDto = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

export type CreateCategoryDto = {
  name: string;
  order?: number;
};

export type UpdateCategoryDto = {
  name?: string;
  order?: number;
};

export type CreateChecklistItemDto = {
  description: string;
  order?: number;
};

export type UpdateChecklistItemDto = {
  description?: string;
  order?: number;
};

export const templateService = {
  getTemplates: async () => {
    const res = await http.get('/templates');
    return res.data;
  },

  getTemplateById: async (id: string) => {
    const res = await http.get(`/templates/${id}`);
    return res.data;
  },

  createTemplate: async (payload: CreateTemplateDto) => {
    const res = await http.post('/templates', payload);
    return res.data;
  },

  updateTemplate: async (id: string, payload: UpdateTemplateDto) => {
    const res = await http.put(`/templates/${id}`, payload);
    return res.data;
  },

  deleteTemplate: async (id: string) => {
    const res = await http.delete(`/templates/${id}`);
    return res.data;
  },

  createCategory: async (templateId: string, payload: CreateCategoryDto) => {
    const res = await http.post(`/templates/${templateId}/categories`, payload);
    return res.data;
  },

  updateCategory: async (id: string, payload: UpdateCategoryDto) => {
    const res = await http.put(`/templates/categories/${id}`, payload);
    return res.data;
  },

  deleteCategory: async (id: string) => {
    const res = await http.delete(`/templates/categories/${id}`);
    return res.data;
  },

  createItem: async (categoryId: string, payload: CreateChecklistItemDto) => {
    const res = await http.post(`/templates/categories/${categoryId}/items`, payload);
    return res.data;
  },

  updateItem: async (id: string, payload: UpdateChecklistItemDto) => {
    const res = await http.put(`/templates/items/${id}`, payload);
    return res.data;
  },

  deleteItem: async (id: string) => {
    const res = await http.delete(`/templates/items/${id}`);
    return res.data;
  },
};