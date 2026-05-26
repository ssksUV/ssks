 import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ssks-app/1.0' } });
      if (!res.ok) return null;
      const data = await res.json() as { display_name?: string };
      return data.display_name ?? null;
    } catch {
      return null;
    }
  }

   export async function getAudits(                                                                                                                                                                                                                                              tenantId: string,
    userId: string,
    role: string,
    filters: {
      status?: string;
      storeId?: string;
      auditorId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    const where: any = role === 'AUDITOR'
      ? { tenantId, auditorId: userId }
      : { tenantId };

    if (filters.status)   where.status   = filters.status;
    if (filters.storeId)  where.storeId  = filters.storeId;
    if (filters.auditorId) where.auditorId = filters.auditorId;
    if (filters.dateFrom || filters.dateTo) {
      where.deadline = {};
      if (filters.dateFrom) where.deadline.gte = new Date(filters.dateFrom);
      if (filters.dateTo)   where.deadline.lte = new Date(filters.dateTo);
    }

    return prisma.audit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        store:    { select: { id: true, name: true, city: true } },
        template: { select: { id: true, name: true } },
        auditor:  { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  export async function getAuditById(tenantId: string, auditId: string, userId: string, role: string) {
    const where =
      role === 'AUDITOR'
        ? { id: auditId, tenantId, auditorId: userId }
        : { id: auditId, tenantId };

    return prisma.audit.findFirst({
      where,
      include: {
        store: true,
        template: {
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: {
                items: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
        auditor: { select: { id: true, firstName: true, lastName: true } },
        results: true,
      },
    });
  }

  export async function createAudit(
    tenantId: string,
    assignedById: string,
    data: {
      templateId: string;
      storeId: string;
      auditorId: string;
      deadline: string;
    }
  ) {
    const [template, store, auditor] = await Promise.all([
      prisma.checklistTemplate.findFirst({ where: { id: data.templateId, tenantId, isActive: true } }),
      prisma.store.findFirst({ where: { id: data.storeId, tenantId, isActive: true } }),
      prisma.user.findFirst({ where: { id: data.auditorId, tenantId, role: 'AUDITOR', isActive: true } }),
    ]);

    if (!template) return { error: 'Szablon nie istnieje' };
    if (!store) return { error: 'Sklep nie istnieje' };
    if (!auditor) return { error: 'Audytor nie istnieje' };

    return prisma.audit.create({
      data: {
        tenantId,
        assignedById,
        templateId: data.templateId,
        storeId: data.storeId,
        auditorId: data.auditorId,
        deadline: new Date(data.deadline),
      },
    });
  }

  export async function startAudit(
    tenantId: string,
    auditId: string,
    auditorId: string,
    gps?: { gpsLat?: number; gpsLng?: number; resolvedAddress?: string }
  ) {
    const audit = await prisma.audit.findFirst({
      where: { id: auditId, tenantId, auditorId, status: 'NEW' },
    });
    if (!audit) return null;

    let resolvedAddress = gps?.resolvedAddress ?? null;
    if (!resolvedAddress && gps?.gpsLat != null && gps?.gpsLng != null) {
      resolvedAddress = await reverseGeocode(gps.gpsLat, gps.gpsLng);
    }

    return prisma.audit.update({
      where: { id: auditId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        gpsLat: gps?.gpsLat,
        gpsLng: gps?.gpsLng,
        resolvedAddress,
      },
    });
  }


  export async function saveResults(
    tenantId: string,
    auditId: string,
    auditorId: string,
    results: {
      checklistItemId: string;
      status: 'OK' | 'FAIL' | 'NA';
      score?: number;
      note?: string;
      photoUrl?: string;
    }[]
  ) {
    const audit = await prisma.audit.findFirst({
      where: { id: auditId, tenantId, auditorId, status: 'IN_PROGRESS' },
    });
    if (!audit) return null;

    const upserts = results.map((r) =>
      prisma.auditResult.upsert({
        where: { auditId_checklistItemId: { auditId, checklistItemId: r.checklistItemId } },
        update: { status: r.status, score: r.score, note: r.note, photoUrl: r.photoUrl },
        create: {
          auditId,
          checklistItemId: r.checklistItemId,
          status: r.status,
          score: r.score,
          note: r.note,
          photoUrl: r.photoUrl,
        },
      })
    );

    return prisma.$transaction(upserts);
  }

  export async function completeAudit(tenantId: string, auditId: string, auditorId: string) {
    const audit = await prisma.audit.findFirst({
      where: { id: auditId, tenantId, auditorId, status: 'IN_PROGRESS' },
    });
    if (!audit) return null;

    return prisma.audit.update({
      where: { id: auditId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  export async function reopenAudit(tenantId: string, auditId: string) {
    const audit = await prisma.audit.findFirst({
      where: { id: auditId, tenantId },
    });
    if (!audit) return null;
    if (audit.status !== 'COMPLETED') return { conflict: true };

    return prisma.audit.update({
      where: { id: auditId },
      data: { status: 'NEW', completedAt: null },
    });
  }
