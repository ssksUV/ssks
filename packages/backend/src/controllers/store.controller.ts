 import { Response } from 'express';
  import { AuthRequest } from '../middleware/auth.middleware';                                                                                                                                                                  import * as storeService from '../services/store.service';

  export async function getStoresHandler(req: AuthRequest, res: Response) {
    try {
      const stores = await storeService.getStores(req.user!.tenantId!);
      res.json(stores);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(500).json({ error: message });
    }
  }

  export async function getStoreHandler(req: AuthRequest, res: Response) {
    try {
      const store = await storeService.getStoreById(String(req.params.id), req.user!.tenantId!);
      res.json(store);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(404).json({ error: message });
    }
  }

  export async function createStoreHandler(req: AuthRequest, res: Response) {
    try {
      const { name, address, city, region } = req.body;
      if (!name || !address || !city) {
        res.status(400).json({ error: 'Nazwa, adres i miasto są wymagane' });
        return;
      }
      const store = await storeService.createStore(req.user!.tenantId!, { name, address, city, region });
      res.status(201).json(store);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }

  export async function updateStoreHandler(req: AuthRequest, res: Response) {
    try {
      const { name, address, city, region, isActive } = req.body;
      const store = await storeService.updateStore(String(req.params.id), req.user!.tenantId!, { name, address, city, region, isActive });
      res.json(store);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }

  export async function deleteStoreHandler(req: AuthRequest, res: Response) {
    try {
      const store = await storeService.deleteStore(String(req.params.id), req.user!.tenantId!);
      res.json(store);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd serwera';
      res.status(400).json({ error: message });
    }
  }