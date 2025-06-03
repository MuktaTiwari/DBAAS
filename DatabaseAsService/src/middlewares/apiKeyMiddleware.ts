import { Request, Response, NextFunction } from 'express';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false,
      message: 'API key is required' 
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid API key' 
    });
  }

  next();
};