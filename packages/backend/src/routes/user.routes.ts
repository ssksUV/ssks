  import { Router } from 'express';
  import { authenticate, requireRole } from '../middleware/auth.middleware';
  import {
    getUsersHandler,
    updateUserHandler,
    deactivateUserHandler,
  } from '../controllers/user.controller';

  const router = Router();

  router.use(authenticate, requireRole('ADMIN', 'MANAGER'));

  router.get('/', getUsersHandler);
  router.put('/:id', updateUserHandler);
  router.delete('/:id', deactivateUserHandler);

  export default router;