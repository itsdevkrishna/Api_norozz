import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import v1Routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ApiError } from './utils/ApiError.js';
import { HTTP_STATUS } from './constants/httpStatus.js';

import { generalApiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { sanitizeInput } from './middleware/sanitize.middleware.js';

const app = express();

// Trust reverse proxy (Nginx, AWS, Cloudflare, Heroku) to correctly track client IP
app.set('trust proxy', 1);

// Security Middlewares & Rate Limiting
app.use(helmet());
app.use(generalApiRateLimiter);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Logging Middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request Parsers & Sanitizer
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(sanitizeInput);
app.use(cookieParser());
app.use(express.static('public'));

// Swagger API Documentation Endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API v1 Master Router
app.use('/api', v1Routes);

// Catch 404 Route Not Found
app.use('*', (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Cannot find ${req.originalUrl} on this server`));
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
