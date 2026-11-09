import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabaseClient.js';
import authRoutes from './routes/authRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import animalRoutes from './routes/animalRoutes.js';
import vetRoutes from './routes/vetRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import importRoutes from './routes/importRoutes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['*'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, cURL, Postman)
    if (!origin) return callback(null, true);

    // Allow in non-production or if wildcard '*' is explicitly set
    if (allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Allow any Vercel domain (*.vercel.app) or configured origins
    const isAllowed =
      allowedOrigins.some((allowed) => {
        if (allowed === origin) return true;
        if (allowed.includes('*')) {
          const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return false;
      }) || /\.vercel\.app$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    callback(new Error(`CORS policy error: Origin ${origin} not allowed.`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
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
app.use('/api/v1/farms/:farmId/feed', feedRoutes);
app.use('/api/v1/farms/:farmId/import', importRoutes);
app.use('/api/v1/farms', farmRoutes);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[Farm API] Running on http://0.0.0.0:${PORT}`);
  console.log(`[Farm API] Health check: http://localhost:${PORT}/health`);
});
