import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import errorHandler from './middlewares/errorHandler.js';

// Load env vars
dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser
app.use(express.json());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import propertyRoutes from './modules/properties/property.routes.js';
import roomRoutes from './modules/rooms/room.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import orderRoutes from './modules/orders/order.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', orderRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Hospitality SaaS API API v1' });
});

// Error Handler (must be last)
app.use(errorHandler);

export default app;
