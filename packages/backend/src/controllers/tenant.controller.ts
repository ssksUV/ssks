import { Response } from 'express';
  import { AuthRequest } from '../middleware/auth.middleware';                                                                                                                                                                  import * as tenantService from '../services/tenant.service';

  export async function getTenantsHandler(req: AuthRequest, res: Response) {
    try {
      const tenants = await tenantService.getTenants();
      res.json(tenants);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(500).json({ error: message });
    }
  }

  export async function getTenantHandler(req: AuthRequest, res: Response) {
    try {
      const tenant = await tenantService.getTenantById(String(req.params.id));
      res.json(tenant);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(404).json({ error: message });
    }
  }

  export async function createTenantHandler(req: AuthRequest, res: Response) {
    try {
      const { name, logoUrl } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Nazwa tenanta jest wymagana' });
        return;
      }
      const tenant = await tenantService.createTenant({ name, logoUrl });
      res.status(201).json(tenant);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }

  export async function updateTenantHandler(req: AuthRequest, res: Response) {
    try {
      const { name, logoUrl, isActive } = req.body;
      const tenant = await tenantService.updateTenant(String(req.params.id), { name, logoUrl, isActive });
      res.json(tenant);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }