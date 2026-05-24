import multer from 'multer';                                                                                                                                                                                                                                                import path from 'path';
  import fs from 'fs';

  const uploadsDir = process.env.UPLOADS_DIR ?? './uploads';

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  });

  const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Dozwolone tylko pliki graficzne'));
    }
  };

  export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });