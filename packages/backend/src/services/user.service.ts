  import { PrismaClient } from '@prisma/client';
  import bcrypt from 'bcrypt';

  const prisma = new PrismaClient();

  export async function getUsersByTenant(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  export async function updateUser(id: string, tenantId: string, data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    isActive?: boolean;
  }) {
    const user = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new Error('Użytkownik nie istnieje');

    const updateData: Record<string, unknown> = {
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
  }

  export async function deactivateUser(id: string, tenantId: string) {
    const user = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new Error('Użytkownik nie istnieje');
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }