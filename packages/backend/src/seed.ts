import { PrismaClient } from '@prisma/client';            
  import bcrypt from 'bcrypt';

  const prisma = new PrismaClient();

  async function main() {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@ssks.pl' } });
    if (existing) {
      console.log('Admin już istnieje');
      return;
    }

    const hashed = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ssks.pl',
        password: hashed,
        firstName: 'Admin',
        lastName: 'SSKS',
        role: 'ADMIN',
        tenantId: null,
      },
    });

    console.log('Admin utworzony:', admin.email);
  }

  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());