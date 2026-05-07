import { Request, Response, NextFunction } from 'express';
  import jwt from 'jsonwebtoken';                                                                                                                                                                                                                                                         
  export interface AuthRequest extends Request {
    user?: {
      userId: string;
      tenantId: string | null;
      role: 'ADMIN' | 'MANAGER' | 'AUDITOR';
    };
  }

  export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Brak tokenu' });
      return;
    }

    const token = header.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Nieważny token' });
    }
  }

  export function requireRole(...roles: Array<'ADMIN' | 'MANAGER' | 'AUDITOR'>) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Brak uprawnień' });
        return;
      }
      next();
    };
  }