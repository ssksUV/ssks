  import { Router } from 'express';
  import { loginHandler, registerHandler, validateHandler } from '../controllers/auth.controller';
  import { authenticate, requireRole } from '../middleware/auth.middleware';

  const router = Router();

  router.post('/login', loginHandler);
  router.post('/register', authenticate, requireRole('ADMIN', 'MANAGER'), registerHandler);

  export default router;