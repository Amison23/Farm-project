import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Dedicated public auth client for sign-up and login (prevents mutating admin client state)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL || 'https://klxjrsxbieprsolllibf.supabase.co',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/v1/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Email, password, and full_name are required.' }
      });
      return;
    }

    // 1. SignUp user in Supabase Auth via anon client
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      res.status(400).json({ error: { code: 'SIGNUP_FAILED', message: error.message } });
      return;
    }

    res.status(201).json({
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (err: any) {
    console.error('[Auth.signup] Error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to complete signup.' } });
  }
});

/**
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' }
      });
      return;
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: error.message } });
      return;
    }

    res.status(200).json({
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (err: any) {
    console.error('[Auth.login] Error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to authenticate.' } });
  }
});

/**
 * GET /api/v1/auth/me (Get current user profile)
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId as string;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      res.status(404).json({ error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' } });
      return;
    }

    res.status(200).json({ data: profile });
  } catch (err: any) {
    console.error('[Auth.me] Error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user profile.' } });
  }
});

export default router;
