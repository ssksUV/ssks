
  import 'dotenv/config';
  import express from 'express';
  import cors from 'cors';
  import authRoutes from './routes/auth.routes';
  import tenantRoutes from './routes/tenant.routes';
  import userRoutes from './routes/user.routes';
  import storeRoutes from './routes/store.routes';
  import templateRoutes from './routes/template.routes';

  const app = express();
  const PORT = process.env.PORT ?? 3000;

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/stores', storeRoutes);
  app.use('/api/templates', templateRoutes);

  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));