import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setSocketIO } from './utils/socket';
import { verifyToken } from './utils/jwt';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './utils/database';
import { createDefaultBadges } from './utils/createDefaultBadges';
import apiRoutes from './routes/api';
import { errorHandler } from './middleware/errorHandler';

function sanitizeObject(obj: any, path = ''): void {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`Sanitized suspicious key: ${path}${key}`);
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key], `${path}${key}.`);
    }
  }
}

function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
}



// Process-level handlers to prevent crash-induced state loss
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const app: Application = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Initialize application
const initializeApp = async () => {
  // Connect to database
  await connectDB();

  // Create default badges if they don't exist
  await createDefaultBadges();

  console.log('Application initialized successfully');
};

// Middleware
app.use(helmet());
const defaultAllowedOrigins = [
  'https://medinternia.vercel.app',
  'https://med-internia.vercel.app',
  'http://localhost:3005',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173'
];

const normalizeOrigin = (value: string): string => {
  const trimmed = value.trim();
  try {
    return new URL(trimmed).origin.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, '').toLowerCase();
  }
};

const allowedOrigins = new Set(
  [
    ...defaultAllowedOrigins,
    ...(process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
      : [])
  ].map(normalizeOrigin)
);

const isAllowedOrigin = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);
  return allowedOrigins.has(normalizedOrigin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-KEY'
  ],
  optionsSuccessStatus: 204
}));

// Ensure preflight OPTIONS requests are handled for all routes
app.options(/.*/, cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  optionsSuccessStatus: 204
}));
app.use(morgan('combined'));

// Serve uploads folder for profile images
import path from 'path';
// Serve uploads with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize request data to prevent NoSQL injection attacks
// Removes prohibited characters from keys and values (e.g., $ and .)
app.use(mongoSanitizeMiddleware);

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Doctor-Intern Collaboration Platform is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0.0',
    features: [
      'Medical case discussions',
      'Peer review system', 
      'Badge & certification system',
      'Job opportunities board',
      'Webinars & AMAs',
      'AI-powered case suggestions',
      'Live video conferencing'
    ]
  });
});

app.use('/api', apiRoutes);
app.use(errorHandler);

// Create HTTP server (required for Socket.io)
const httpServer = http.createServer(app);

// Initialize Socket.io with CORS matching existing config
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register io instance globally so controllers can emit events
setSocketIO(io);

// Socket.io JWT Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }

    // Attach userId to socket for later use
    (socket as any).userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Socket authentication failed'));
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  const userId = (socket as any).userId;

  // Each user joins their own private room
  // This lets us emit to a specific user from any controller
  socket.join(`user:${userId}`);
  console.log(`Socket connected: user ${userId} joined room user:${userId}`);

  socket.on('join_webinar', (webinarId: string) => {
    socket.join(`webinar:${webinarId}`);
    console.log(`User ${userId} joined webinar room: webinar:${webinarId}`);
  });

  socket.on('leave_webinar', (webinarId: string) => {
    socket.leave(`webinar:${webinarId}`);
    console.log(`User ${userId} left webinar room: webinar:${webinarId}`);
  });

  socket.on('typing', ({ conversationId, receiverId, isTyping }: { conversationId: string; receiverId: string; isTyping: boolean }) => {
    io.to(`user:${receiverId}`).emit('typing_status', {
      conversationId,
      senderId: userId,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: user ${userId}`);
  });
});

const startServer = async () => {
  try {
    await initializeApp();

    httpServer.listen(PORT, () => {
      console.log(`Doctor-Intern Collaboration Platform running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API docs: http://localhost:${PORT}/api`);
      console.log(`Socket.io ready`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

void startServer();

export { io };
export default app;
