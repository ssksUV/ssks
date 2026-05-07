import { Router } from 'express';
  import { loginHandler, registerHandler } from '../controllers/auth.controller';                                                                                                                                               import { authenticate, requireRole } from '../middleware/auth.middleware';

  const router = Router();

  router.post('/login', loginHandler);
  router.post('/register', authenticate, requireRole('ADMIN'), registerHandler);

  export default router;