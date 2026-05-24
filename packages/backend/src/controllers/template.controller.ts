
  import { Response } from 'express';
  import { AuthRequest } from '../middleware/auth.middleware';
  import * as templateService from '../services/template.service';

  // --- Szablony ---

  export async function getTemplates(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const templates = await templateService.getTemplates(tenantId);
    res.json(templates);
  }

  export async function getTemplateById(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const template = await templateService.getTemplateById(tenantId, String(req.params.id));
    if (!template) return res.status(404).json({ error: 'Szablon nie istnieje' });
    res.json(template);
  }

  export async function createTemplate(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Pole name jest wymagane' });
    const template = await templateService.createTemplate(tenantId, name, description);
    res.status(201).json(template);
  }

  export async function updateTemplate(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const { name, description, isActive } = req.body;
    const template = await templateService.updateTemplate(tenantId, String(req.params.id), {
      name,
      description,
      isActive,
    });
    if (!template) return res.status(404).json({ error: 'Szablon nie istnieje' });
    res.json(template);
  }

  export async function deleteTemplate(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const template = await templateService.deleteTemplate(tenantId, String(req.params.id));
    if (!template) return res.status(404).json({ error: 'Szablon nie istnieje' });
    res.json(template);
  }

  // --- Kategorie ---

  export async function createCategory(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const { name, order } = req.body;
    if (!name) return res.status(400).json({ error: 'Pole name jest wymagane' });
    const category = await templateService.createCategory(
      tenantId,
      String(req.params.id),
      name,
      order
    );
    if (!category) return res.status(404).json({ error: 'Szablon nie istnieje' });
    res.status(201).json(category);
  }

  export async function updateCategory(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const { name, order } = req.body;
    const category = await templateService.updateCategory(tenantId, String(req.params.id), {
      name,
      order,
    });
    if (!category) return res.status(404).json({ error: 'Kategoria nie istnieje' });
    res.json(category);
  }

  export async function deleteCategory(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const category = await templateService.deleteCategory(tenantId, String(req.params.id));
    if (!category) return res.status(404).json({ error: 'Kategoria nie istnieje' });
    res.json({ message: 'Kategoria usunięta' });
  }

  // --- Punkty kontrolne ---

  export async function createItem(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const { description, order } = req.body;
    if (!description) return res.status(400).json({ error: 'Pole description jest wymagane' });
    const item = await templateService.createItem(
      tenantId,
      String(req.params.id),
      description,
      order
    );
    if (!item) return res.status(404).json({ error: 'Kategoria nie istnieje' });
    res.status(201).json(item);
  }

  export async function updateItem(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const { description, order } = req.body;
    const item = await templateService.updateItem(tenantId, String(req.params.id), {
      description,
      order,
    });
    if (!item) return res.status(404).json({ error: 'Punkt kontrolny nie istnieje' });
    res.json(item);
  }

  export async function deleteItem(req: AuthRequest, res: Response) {
    const tenantId = req.user!.tenantId!;
    const item = await templateService.deleteItem(tenantId, String(req.params.id));
    if (!item) return res.status(404).json({ error: 'Punkt kontrolny nie istnieje' });
    res.json({ message: 'Punkt kontrolny usunięty' });
  }