  import { Response } from 'express';                                                                                                                                                                                                                                         import { AuthRequest } from '../middleware/auth.middleware';
  import * as auditService from '../services/audit.service';
  import { generateAuditPdf } from '../services/pdf.service';     

  export async function getAudits(req: AuthRequest, res: Response) {
    const { userId, tenantId, role } = req.user!;
    const { status, storeId, auditorId, dateFrom, dateTo } = req.query as Record<string, string>;
    const audits = await auditService.getAudits(tenantId!, userId, role, {
      status, storeId, auditorId, dateFrom, dateTo,
    });
    res.json(audits);
  }

  export async function getAuditById(req: AuthRequest, res: Response) {
    const { userId, tenantId, role } = req.user!;
    const audit = await auditService.getAuditById(tenantId!, String(req.params.id), userId, role);
    if (!audit) return res.status(404).json({ error: 'Audyt nie istnieje' });
    res.json(audit);
  }

  export async function createAudit(req: AuthRequest, res: Response) {
    const { userId, tenantId } = req.user!;
    const { templateId, storeId, auditorId, deadline } = req.body;

    if (!templateId || !storeId || !auditorId || !deadline) {
      return res.status(400).json({ error: 'Pola templateId, storeId, auditorId, deadline są wymagane' });
    }

    const result = await auditService.createAudit(tenantId!, userId, {
      templateId,
      storeId,
      auditorId,
      deadline,
    });

    if ('error' in result) return res.status(400).json({ error: result.error });
    res.status(201).json(result);
  }

  export async function startAudit(req: AuthRequest, res: Response) {
    const { userId, tenantId } = req.user!;
    const { gpsLat, gpsLng, resolvedAddress } = req.body;
    const audit = await auditService.startAudit(tenantId!, String(req.params.id), userId, {
      gpsLat,
      gpsLng,
      resolvedAddress,
    });
    if (!audit) return res.status(404).json({ error: 'Audyt nie istnieje lub nie można go rozpocząć' });
    res.json(audit);
  }

  export async function saveResults(req: AuthRequest, res: Response) {
    const { userId, tenantId } = req.user!;
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Pole results musi być niepustą tablicą' });
    }

    const saved = await auditService.saveResults(tenantId!, String(req.params.id), userId, results);
    if (!saved) return res.status(404).json({ error: 'Audyt nie istnieje lub nie jest w toku' });
    res.json(saved);
  }

  export async function completeAudit(req: AuthRequest, res: Response) {
    const { userId, tenantId } = req.user!;
    const audit = await auditService.completeAudit(tenantId!, String(req.params.id), userId);
    if (!audit) return res.status(404).json({ error: 'Audyt nie istnieje lub nie jest w toku' });
    res.json(audit);
  }
  
  export async function getAuditPdf(req: AuthRequest, res: Response) {
    const { userId, tenantId, role } = req.user!;
    const audit = await auditService.getAuditById(tenantId!, String(req.params.id), userId, role);
    if (!audit) return res.status(404).json({ error: 'Audyt nie istnieje' });
    if (audit.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'PDF dostępny tylko dla zakończonych audytów' });
    }
    generateAuditPdf(audit as any, res);
  }