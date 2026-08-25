import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseAuth = createClient(
  process.env.SUPABASE_URL || 'https://klxjrsxbieprsolllibf.supabase.co',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Auth middleware — verifies the Supabase JWT from the Authorization header.
 *
 * On success: attaches `res.locals.userId` (string UUID) for downstream use.
 * On failure: returns 401 immediately.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'MISSING_TOKEN', message: 'Authorization header is required.' } });
    return;
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' } });
    return;
  }

  res.locals.userId = user.id;
  next();
}
