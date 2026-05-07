 import { PrismaClient } from '@prisma/client';
                                                                                                                                                                                                                                const prisma = new PrismaClient();

  export async function getTenants() {
    return prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  export async function getTenantById(id: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new Error('Tenant nie istnieje');
    return tenant;
  }

  export async function createTenant(data: { name: string; logoUrl?: string }) {
    return prisma.tenant.create({ data });
  }

  export async function updateTenant(id: string, data: { name?: string; logoUrl?: string; isActive?: boolean }) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new Error('Tenant nie istnieje');
    return prisma.tenant.update({ where: { id }, data });
  }