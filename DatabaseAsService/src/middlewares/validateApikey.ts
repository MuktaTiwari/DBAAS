// src/middlewares/validateApiKey.middleware.ts
import { NextFunction, Response } from 'express';
import { databaseCollectionModel } from '@/models/databaseCollection.model';
import { RequestWithDatabase } from '@interfaces/auth.interface';

const validateApiKey = async (req: RequestWithDatabase, res: Response, next: NextFunction) => {
  const apiKey = req.headers['api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key missing' });
  }

  try {
    const database = await databaseCollectionModel.findOne({
      where: { apiKey: apiKey as string }
    });

    if (!database) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    req.user = database;
    next();
    
  } catch (err) {
    console.error('Error validating API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default validateApiKey;