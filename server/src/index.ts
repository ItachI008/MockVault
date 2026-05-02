import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db';
import mockRouter from './routes/mock.routes';
import schemaRouter from './routes/schema.routes';
import dashboardRouter from './routes/dashboard.routes';
import contractRouter from './routes/contract.routes';
import authRouter from './routes/auth.routes';
import workspaceRouter from './routes/workspace.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Apply rate limiter to all API routes except live mocks (so simulated traffic doesn't get blocked)
app.use('/api/auth', limiter);
app.use('/api/dashboard', limiter);
app.use('/api/contracts', limiter);
app.use('/api/schemas', limiter);
app.use('/api/workspaces', limiter);

// Socket.IO for real-time traffic logs
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Pass io to request handlers that emit live traffic events.
app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

app.get('/', (_req, res) => {
  res.send('<h1>🚀 MockVault API is running</h1><p>The API is available at <a href="/api/health">/api/health</a></p>');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mockvault-api' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/contracts', contractRouter);
app.use('/api/mocks', mockRouter);
app.use('/api/schemas', schemaRouter);
app.use('/api/workspaces', workspaceRouter);

// Global Error Handler (Must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`MockVault Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
