require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const serviceRoutes = require('./routes/service.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportsRoutes = require('./routes/reports.routes');
const uploadRoutes = require('./routes/upload.routes');
const publicRoutes = require('./routes/public.routes');
const partsRoutes = require('./routes/parts.routes');

const app = express();

// Security Middleware (Helmet)
app.use(helmet());

// Cross-Origin Resource Sharing (CORS) Configuration
const allowedOrigins = [
  "https://inventory-management-six-taupe.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith(".vercel.app"))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Body parsing
app.use(express.json());

// Rate Limiting
// Limits each IP to 100 requests per 15 minutes window
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to all routes
app.use(limiter);

app.use('/api/public', publicRoutes);   // No auth
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/parts', partsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ message: "Server is running" });
});

// Centralized error handling wrapper
app.use((err, req, res, next) => {
    console.error("Express Error:", err.stack);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ success: false, message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
