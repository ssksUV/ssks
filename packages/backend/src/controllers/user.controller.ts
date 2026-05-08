import { Response } from 'express';
  import { AuthRequest } from '../middleware/auth.middleware';                                                                                                                                                                  import * as userService from '../services/user.service';

  function resolveTenantId(req: AuthRequest): string | null {
    if (req.user?.role === 'ADMIN') {
      return (req.query.tenantId as string) ?? null;
    }
    return req.user?.tenantId ?? null;
  }

  export async function getUsersHandler(req: AuthRequest, res: Response) {
    try {
      const tenantId = resolveTenantId(req);
      if (!tenantId) {
        res.status(400).json({ error: 'Podaj tenantId jako query param' });
        return;
      }
      const users = await userService.getUsersByTenant(tenantId);
      res.json(users);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(500).json({ error: message });
    }
  }

  export async function updateUserHandler(req: AuthRequest, res: Response) {
    try {
      const tenantId = resolveTenantId(req);
      if (!tenantId) {
        res.status(400).json({ error: 'Podaj tenantId jako query param' });
        return;
      }
      const { firstName, lastName, password, isActive } = req.body;
      const user = await userService.updateUser(String(req.params.id), tenantId, { firstName, lastName, password, isActive });
      res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }

  export async function deactivateUserHandler(req: AuthRequest, res: Response) {
    try {
      const tenantId = resolveTenantId(req);
      if (!tenantId) {
        res.status(400).json({ error: 'Podaj tenantId jako query param' });
        return;
      }
      const user = await userService.deactivateUser(String(req.params.id), tenantId);
      res.json(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }