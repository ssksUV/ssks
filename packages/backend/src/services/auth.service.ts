 import { PrismaClient } from '@prisma/client';
  import bcrypt from 'bcrypt';                                                                                                                                                                                                  import jwt from 'jsonwebtoken';                           

  const prisma = new PrismaClient();

  export async function login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new Error('Nieprawidłowy email lub hasło');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Nieprawidłowy email lub hasło');

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: 86400 }
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  export async function register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'AUDITOR';
    tenantId?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Użytkownik z tym emailem już istnieje');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        tenantId: data.tenantId ?? null,
      },
    });

    return { id: user.id, email: user.email, role: user.role };
}