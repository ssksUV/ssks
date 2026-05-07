  import 'dotenv/config';
  import express from 'express';                                                                                                                                                                                                import cors from 'cors';                                  
  import authRoutes from './routes/auth.routes';

  const app = express();
  const PORT = process.env.PORT ?? 3000;

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });