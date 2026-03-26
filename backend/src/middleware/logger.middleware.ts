import { Request, Response, NextFunction } from 'express';

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request received`);
  
  // Log headers in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

export default loggerMiddleware;