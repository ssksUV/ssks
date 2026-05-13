  import { Router } from 'express';
  import { loginHandler, registerHandler } from '../controllers/auth.controller';
  import { authenticate, requireRole } from '../middleware/auth.middleware';

  const router = Router();

  router.post('/login', loginHandler);
  router.get('/validate', authenticate, (req, res) => res.json({ valid: true }));
  router.post('/register', authenticate, requireRole('ADMIN', 'MANAGER'), registerHandler);

  export default router;