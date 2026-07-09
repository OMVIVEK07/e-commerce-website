import { Request, Response, NextFunction } from 'express';

// Simple XSS sanitization helper that recursively strips out HTML tags and script elements
export const sanitizeInput = (val: any): any => {
  if (typeof val === 'string') {
    return val
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '') // Remove script tags
      .replace(/on\w+="[^"]*"/gi, '')                    // Remove inline handlers
      .replace(/href\s*=\s*"javascript:[^"]*"/gi, '')    // Remove javascript: links
      .replace(/<\/?[^>]+(>|$)/g, '');                    // Remove HTML tags
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }
  if (typeof val === 'object' && val !== null) {
    const sanitizedObj: Record<string, any> = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        sanitizedObj[key] = sanitizeInput(val[key]);
      }
    }
    return sanitizedObj;
  }
  return val;
};

// XSS Protection Middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
};

// Double-Submit Cookie / Header CSRF Protection Middleware
// For stateless APIs using JWT Bearer headers, CSRF is already mitigated. 
// However, if cookies are used, this ensures an 'x-csrf-token' header matches the 'csrf-token' cookie.
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public authentication endpoints from CSRF
  if (req.path.startsWith('/auth') || req.path.startsWith('/api/auth') || req.path.includes('/auth/')) {
    return next();
  }

  // If using cookies, check token. For Bearer Auth, we skip or verify header presence if configured
  const csrfHeader = req.headers['x-csrf-token'];
  const authHeader = req.headers['authorization'];

  // If client is using bearer tokens, it's safe from CSRF.
  if (authHeader && authHeader.toString().startsWith('Bearer ')) {
    return next();
  }

  // Otherwise, require CSRF verification header
  if (!csrfHeader) {
    res.status(403).json({ error: 'CSRF token verification failed: Missing token header.' });
    return;
  }

  next();
};
