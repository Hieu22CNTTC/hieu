# Plan 02: Backend Infrastructure & Auth

## Mục tiêu
Setup Express server, middleware stack, authentication với JWT, và error handling.

## Tech Stack
- Express.js
- TypeScript
- JWT (jsonwebtoken)
- bcrypt
- Zod validation
- Winston logger
- CORS, helmet, express-rate-limit

---

## 1. Project Structure

```
backend/
├── src/
│   ├── server.ts                 # Entry point
│   ├── app.ts                    # Express app config
│   ├── config/
│   │   ├── database.ts           # Prisma client
│   │   ├── logger.ts             # Winston config
│   │   └── swagger.ts            # Swagger setup
│   ├── middlewares/
│   │   ├── auth.ts               # JWT verification
│   │   ├── roleCheck.ts          # Role-based access
│   │   ├── validate.ts           # Zod validation
│   │   ├── errorHandler.ts       # Centralized error handler
│   │   └── rateLimiter.ts        # Rate limiting
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   └── auth.routes.ts        # Auth endpoints
│   ├── controllers/
│   │   └── authController.ts     # Auth logic
│   ├── services/
│   │   └── authService.ts        # Auth business logic
│   ├── utils/
│   │   ├── jwt.ts                # JWT helpers
│   │   ├── errors.ts             # Custom error classes
│   │   └── constants.ts          # Constants
│   ├── validations/
│   │   └── authSchema.ts         # Zod schemas
│   └── types/
│       └── index.ts              # TypeScript types
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 2. Dependencies

### package.json
```json
{
  "name": "flight-booking-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.9.0",
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.4.1",
    "cookie-parser": "^1.4.6",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.6",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/node-cron": "^3.0.11",
    "prisma": "^5.9.0",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

---

## 3. Configuration Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .env.example
```env
# Database
DATABASE_URL="mysql://flight_user:flight_password@localhost:3306/flight_booking"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-too
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# MoMo Payment (will use in next plan)
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_IPN_URL=http://localhost:3000/api/payments/momo/ipn
MOMO_RETURN_URL=http://localhost:5173/payment/status

# CORS
FRONTEND_URL=http://localhost:5173
```

---

## 4. Core Infrastructure

### src/config/database.ts
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

### src/config/logger.ts
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'flight-booking-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
```

### src/app.ts
```typescript
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import logger from './config/logger';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

### src/server.ts
```typescript
import app from './app';
import logger from './config/logger';
import prisma from './config/database';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
```

---

## 5. Middleware Implementation

### src/middlewares/errorHandler.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};
```

### src/middlewares/auth.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};
```

### src/middlewares/roleCheck.ts
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from '../utils/errors';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};
```

### src/middlewares/validate.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### src/middlewares/rateLimiter.ts
```typescript
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
});
```

---

## 6. Utilities

### src/utils/errors.ts
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### src/utils/jwt.ts
```typescript
import jwt from 'jsonwebtoken';
import { AppError } from './errors';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new AppError('Invalid access token', 401);
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};
```

---

## 7. Auth Implementation

### src/validations/authSchema.ts
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
```

### src/services/authService.ts
```typescript
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
```

### src/controllers/authController.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const decoded = verifyRefreshToken(refreshToken);
      
      const accessToken = generateAccessToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });
      
      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### src/routes/auth.routes.ts
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validations/authSchema';

const router = Router();
const authController = new AuthController();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.get('/me', authenticate, authController.getMe);

export default router;
```

### src/routes/index.ts
```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);

export default router;
```

---

## 8. Implementation Steps

1. **Setup project**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

2. **Configure TypeScript**
   - Create tsconfig.json

3. **Implement infrastructure**
   - database.ts, logger.ts, app.ts, server.ts

4. **Implement middleware**
   - errorHandler, auth, roleCheck, validate, rateLimiter

5. **Implement auth**
   - authService, authController, authRoutes

6. **Test**
   ```bash
   npm run dev
   # Test endpoints with Postman/Thunder Client
   ```

---

## 9. Testing Endpoints

### Register
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User",
  "phone": "0123456789"
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Get Current User
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <access_token>
```

---

## Next Steps
→ Proceed to **Plan 03: Booking & Payment**
