import { Request, Response } from 'express';
  import * as authService from '../services/auth.service';                                                                                                                                                                                                                                
  export async function loginHandler(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email i hasło są wymagane' });
        return;
      }
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(401).json({ error: message });
    }
  }

  export async function registerHandler(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role, tenantId } = req.body;
      if (!email || !password || !firstName || !lastName || !role) {
        res.status(400).json({ error: 'Wszystkie pola są wymagane' });
        return;
      }
      const result = await authService.register({ email, password, firstName, lastName, role, tenantId });
      res.status(201).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }