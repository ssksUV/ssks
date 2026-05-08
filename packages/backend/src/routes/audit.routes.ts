 import { Router } from 'express';                                                                                                                                                                                                                                           import { authenticate, requireRole } from '../middleware/auth.middleware';
  import { requireTenant } from '../middleware/tenant.middleware';
  import * as auditController from '../controllers/audit.controller';

  const router = Router();

  router.use(authenticate, requireTenant);

  router.get('/', requireRole('MANAGER', 'AUDITOR'), auditController.getAudits);
  router.get('/:id', requireRole('MANAGER', 'AUDITOR'), auditController.getAuditById);
  router.post('/', requireRole('MANAGER'), auditController.createAudit);
  router.patch('/:id/start', requireRole('AUDITOR'), auditController.startAudit);
  router.put('/:id/results', requireRole('AUDITOR'), auditController.saveResults);
  router.patch('/:id/complete', requireRole('AUDITOR'), auditController.completeAudit);
  router.get('/:id/pdf', requireRole('MANAGER', 'AUDITOR'), auditController.getAuditPdf);

  export default router;