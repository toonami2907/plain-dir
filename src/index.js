import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import timeout from 'express-timeout-handler';
import winston from 'winston';
import dotenv from 'dotenv';
import authRoutes from './route/auth.routes.js';
import projectRoutes from './route/projects.routes.js';
import userRoutes from './route/users.routes.js';
import {ErrorHandler} from './middleware/errorHandler.mid.js';

dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"]
    }
  }
}));
app.use(cors({
  origin: [process.env.FRONTEND_URL,process.env.FRONTEND_URL2],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request timeout
app.use(timeout.handler({
  timeout: 10000,
  onTimeout: (req, res) => {
    logger.warn(`Request timed out: ${req.method} ${req.url}`);
    res.status(408).json({ error: 'Request timeout' });
  }
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    console.log(`[${timestamp}] ${method} ${url}`);
    next(); // Proceed to the next middleware/route
  });
// Routes
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/users', userRoutes);

// Error handling
app.use(ErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));