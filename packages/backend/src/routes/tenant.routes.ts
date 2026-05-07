  import { Router } from 'express';
  import { authenticate, requireRole } from '../middleware/auth.middleware';                                                                                                                                                    import {        
    getTenantsHandler,
    getTenantHandler,
    createTenantHandler,
    updateTenantHandler,
  } from '../controllers/tenant.controller';

  const router = Router();

  router.use(authenticate, requireRole('ADMIN'));

  router.get('/', getTenantsHandler);
  router.get('/:id', getTenantHandler);
  router.post('/', createTenantHandler);
  router.put('/:id', updateTenantHandler);

  export default router;