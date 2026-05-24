 import { PrismaClient } from '@prisma/client';                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                            
  const prisma = new PrismaClient();                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                            
  // --- Szablony ---                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                            
  export async function getTemplates(tenantId: string) {                                                                                                                                                                                                                    
    return prisma.checklistTemplate.findMany({                                                                                                                                                                                                                              
      where: { tenantId, isActive: true },                                                                                                                                                                                                                                  
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  }

  export async function getTemplateById(tenantId: string, templateId: string) {
    return prisma.checklistTemplate.findFirst({
      where: { id: templateId, tenantId, isActive: true },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  }

  export async function createTemplate(tenantId: string, name: string, description?: string) {
    return prisma.checklistTemplate.create({
      data: { tenantId, name, description },
    });
  }

  export async function updateTemplate(
    tenantId: string,
    templateId: string,
    data: { name?: string; description?: string; isActive?: boolean }
  ) {
    const template = await prisma.checklistTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) return null;
    return prisma.checklistTemplate.update({ where: { id: templateId }, data });
  }

  export async function deleteTemplate(tenantId: string, templateId: string) {
    const template = await prisma.checklistTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) return null;
    return prisma.checklistTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
  }

  // --- Kategorie ---

  export async function createCategory(
    tenantId: string,
    templateId: string,
    name: string,
    order?: number
  ) {
    const template = await prisma.checklistTemplate.findFirst({
      where: { id: templateId, tenantId, isActive: true },
    });
    if (!template) return null;

    const maxOrder = await prisma.category.aggregate({
      where: { templateId },
      _max: { order: true },
    });
    const nextOrder = order ?? (maxOrder._max.order ?? 0) + 1;

    return prisma.category.create({ data: { templateId, name, order: nextOrder } });
  }

  export async function updateCategory(
    tenantId: string,
    categoryId: string,
    data: { name?: string; order?: number }
  ) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, template: { tenantId } },
    });
    if (!category) return null;
    return prisma.category.update({ where: { id: categoryId }, data });
  }

  export async function deleteCategory(tenantId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, template: { tenantId } },
    });
    if (!category) return null;
    return prisma.category.delete({ where: { id: categoryId } });
  }

  // --- Punkty kontrolne ---

  export async function createItem(
    tenantId: string,
    categoryId: string,
    description: string,
    order?: number
  ) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, template: { tenantId } },
    });
    if (!category) return null;

    const maxOrder = await prisma.checklistItem.aggregate({
      where: { categoryId },
      _max: { order: true },
    });
    const nextOrder = order ?? (maxOrder._max.order ?? 0) + 1;

    return prisma.checklistItem.create({ data: { categoryId, description, order: nextOrder } });
  }

  export async function updateItem(
    tenantId: string,
    itemId: string,
    data: { description?: string; order?: number }
  ) {
    const item = await prisma.checklistItem.findFirst({
      where: { id: itemId, category: { template: { tenantId } } },
    });
    if (!item) return null;
    return prisma.checklistItem.update({ where: { id: itemId }, data });
  }

  export async function deleteItem(tenantId: string, itemId: string) {
    const item = await prisma.checklistItem.findFirst({
      where: { id: itemId, category: { template: { tenantId } } },
    });
    if (!item) return null;
    return prisma.checklistItem.delete({ where: { id: itemId } });
  }