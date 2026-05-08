import { Router } from 'express';                                                                                                                                                                                                                                           import { authenticate, requireRole } from '../middleware/auth.middleware';
  import { requireTenant } from '../middleware/tenant.middleware';
  import * as templateController from '../controllers/template.controller';

  const router = Router();

  router.use(authenticate, requireRole('MANAGER'), requireTenant);

  router.get('/', templateController.getTemplates);
  router.get('/:id', templateController.getTemplateById);
  router.post('/', templateController.createTemplate);
  router.put('/:id', templateController.updateTemplate);
  router.delete('/:id', templateController.deleteTemplate);

  router.post('/:id/categories', templateController.createCategory);
  router.put('/categories/:id', templateController.updateCategory);
  router.delete('/categories/:id', templateController.deleteCategory);

  router.post('/categories/:id/items', templateController.createItem);
  router.put('/items/:id', templateController.updateItem);
  router.delete('/items/:id', templateController.deleteItem);

  export default router;