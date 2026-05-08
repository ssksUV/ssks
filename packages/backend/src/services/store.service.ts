 import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  export async function getStores(tenantId: string) {
    return prisma.store.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  export async function getStoreById(id: string, tenantId: string) {
    const store = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) throw new Error('Sklep nie istnieje');
    return store;
  }

  export async function createStore(tenantId: string, data: {
    name: string;
    address: string;
    city: string;
    region?: string;
  }) {
    return prisma.store.create({ data: { ...data, tenantId } });
  }

  export async function updateStore(id: string, tenantId: string, data: {
    name?: string;
    address?: string;
    city?: string;
    region?: string;
    isActive?: boolean;
  }) {
    const store = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) throw new Error('Sklep nie istnieje');
    return prisma.store.update({ where: { id }, data });
  }

  export async function deleteStore(id: string, tenantId: string) {
    const store = await prisma.store.findFirst({ where: { id, tenantId } });
    if (!store) throw new Error('Sklep nie istnieje');
    return prisma.store.update({ where: { id }, data: { isActive: false } });
  }