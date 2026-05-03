// Backend Server Entry Point
// Facial Recognition System - TypeScript Node.js MVC
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './db/index.js';
import { runMigrations } from './migrations/index.js';
import { runSeeds } from './seeds/index.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import shsUserRoutes from './routes/shsUserRoutes.js';
import facultyUserRoutes from './routes/facultyUserRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import moderatorRoutes from './routes/moderatorRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import faceImageRoutes from './routes/faceImageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '3002');
const HOST = process.env.HOST || 'localhost';

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased limit for face image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Facial Recognition Backend API is running!',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

/**
 * BOOTSTRAP FUNCTION
 */
const startServer = async () => {
  try {
    console.log('--- FACIAL RECOGNITION BACKEND INITIALIZATION ---');

    // 1. Initialize Database
    await db.initialize();
    console.log('✅ Database initialized');

    // 2. Run Migrations
    await runMigrations();
    console.log('✅ Migrations completed');

    // 3. Run Seeds (Conditional)
    if (process.env.DB_SEED === 'true') {
      await runSeeds();
      console.log('✅ Seeds completed');
    } else {
      console.log('⏩ Skipping seeds (DB_SEED not set to true)');
    }

    // 4. Initialize Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/shs-users', shsUserRoutes);
    app.use('/api/faculty-users', facultyUserRoutes);
    app.use('/api/guests', guestRoutes);
    app.use('/api/moderators', moderatorRoutes);
    app.use('/api/metadata', metadataRoutes);
    app.use('/api/face-images', faceImageRoutes);
    app.use('/api/notifications', notificationRoutes);
    
    console.log('✅ Routes initialized');

    // 5. Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        status: 500,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });

    // 6. Start Listening
    app.listen(PORT, HOST, () => {
      console.log('=================================');
      console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('=================================');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app };
