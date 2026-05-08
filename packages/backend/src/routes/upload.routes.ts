import { Router, Request, Response } from 'express';
  import { authenticate } from '../middleware/auth.middleware';
  import { upload } from '../middleware/upload.middleware';

  const router = Router();

  router.post('/', authenticate, upload.single('photo'), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });

  export default router;