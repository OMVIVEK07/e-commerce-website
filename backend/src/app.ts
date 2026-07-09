import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import apiRouter from './routes';
import { xssProtection, csrfProtection } from './middleware/security';
import { errorHandler } from './middleware/errorMiddleware';

const app: Application = express();

// Simple Request Logger
app.use((req, res, next) => {
  console.log(`[HTTP Request] ${req.method} ${req.url}`);
  next();
});

// Set secure HTTP headers via Helmet
app.use(helmet());

// Enable CORS with configurations
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

// Body Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Sanitize MongoDB Queries (prevents NoSQL injection attacks)
app.use(mongoSanitize());

// Apply XSS input sanitization middleware
app.use(xssProtection);

// Apply CSRF protection check
app.use(csrfProtection);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// Mount main API Router
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
