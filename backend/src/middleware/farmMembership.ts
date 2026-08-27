import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseClient.js';
import { UserRole } from '../types/farm.js';

/**
 * Middleware factory that enforces farm membership and optional role requirements.
 *
 * Checks if res.locals.userId is an accepted member of the farm specified in:
 * 1. req.params.farmId or req.params.id
 * 2. req.query.farm_id
 * 3. req.body.farm_id
 *
 * @param allowedRoles Optional array of required roles e.g. ['owner']
 */
export function requireFarmMembership(allowedRoles?: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = res.locals.userId as string;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const farmId = (req.params.farmId || req.params.id || req.query.farm_id || req.body?.farm_id) as string;

    if (!farmId) {
      res.status(400).json({ error: { code: 'MISSING_FARM_ID', message: 'Farm ID is required in path, query, or body.' } });
      return;
    }

    try {
      const { data: member, error } = await supabase
        .from('farm_members')
        .select('*')
        .eq('farm_id', farmId)
        .eq('user_id', userId)
        .not('accepted_at', 'is', null)
        .single();

      if (error || !member) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN_FARM_ACCESS',
            message: 'You do not have access to this farm.'
          }
        });
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(member.role as UserRole)) {
        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_FARM_PERMISSIONS',
            message: `Action requires one of the following roles: ${allowedRoles.join(', ')}.`
          }
        });
        return;
      }

      res.locals.farmMember = member;
      res.locals.farmId = farmId;
      next();
    } catch (err: any) {
      console.error('[requireFarmMembership] Error:', err);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to verify farm membership.' } });
    }
  };
}
