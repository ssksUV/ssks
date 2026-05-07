import { Response, NextFunction } from 'express';
  import { AuthRequest } from './auth.middleware';

  export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user?.tenantId) {
      res.status(403).json({ error: 'Brak przypisanego tenanta' });
      return;
    }
    next();
  }