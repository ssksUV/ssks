  import { Router } from 'express';
  import { authenticate, requireRole } from '../middleware/auth.middleware';                                                                                                                                                    import { requireTenant } from '../middleware/tenant.middleware';
  import {
    getStoresHandler,
    getStoreHandler,
    createStoreHandler,
    updateStoreHandler,
    deleteStoreHandler,
  } from '../controllers/store.controller';

  const router = Router();

  router.use(authenticate, requireRole('ADMIN', 'MANAGER'), requireTenant);

  router.get('/', getStoresHandler);
  router.get('/:id', getStoreHandler);
  router.post('/', createStoreHandler);
  router.put('/:id', updateStoreHandler);
  router.delete('/:id', deleteStoreHandler);

  export default router;