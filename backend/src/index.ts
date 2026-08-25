import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabaseClient.js';
import authRoutes from './routes/authRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import animalRoutes from './routes/animalRoutes.js';
import vetRoutes from './routes/vetRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(0);

    if (error) {
      console.error('[Health] Supabase query failed:', error.message);
      res.status(503).json({
        status: 'unhealthy',
        message: 'Database connection failed.',
        detail: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      status: 'healthy',
      message: 'Server and database are operational.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Health] Unexpected error:', err);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Unexpected error during health check.',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farms/:farmId/animals', animalRoutes);
app.use('/api/v1/farms/:farmId/vet-records', vetRoutes);
app.use('/api/v1/farms', farmRoutes);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Farm API] Running on http://0.0.0.0:${PORT}`);
  console.log(`[Farm API] Health check: http://localhost:${PORT}/health`);
});
