import express from "express";
import cors from "cors";

import CourseRoutes from "./routes/courseRoutes.js";
import QuestionRoutes from "./routes/questionRoutes.js";
import GeminiRoutes from "./routes/geminiRoutes.js";
import UserRoutes from "./routes/userRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

const app = express();

// body-parser with increased limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3222',
    'http://localhost:8080',
    'http://34.207.210.0',
    'http://34.207.210.0:3221',
    'http://34.207.210.0:3222',
    'http://mastery-path.cloud-ip.cc',
    'http://www.mastery-path.cloud-ip.cc',
    'http://mastery-path.cloud-ip.cc:3221',
    'http://www.mastery-path.cloud-ip.cc:3221',
    'https://mastery-path.cloud-ip.cc',
    'https://www.mastery-path.cloud-ip.cc',
    // Add Vercel preview URLs
    /^\.vercel\.app$/,  // Matches *.vercel.app
    /^vercel\.app$/,
    /^[a-zA-Z0-9-]+\.vercel\.app$/
];

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check against allowed origins
        if (allowedOrigins.some(regex => {
            if (typeof regex === 'string') {
                return origin === regex;
            } else if (regex instanceof RegExp) {
                return regex.test(origin);
            }
            return false;
        })) {
            return callback(null, true);
        }
        
        // If origin doesn't match any allowed pattern
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('/*', (req, res) => {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '/*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(204).send();
});

// use routes
app.use("/users", UserRoutes);
app.use("/users/:userId/courses", CourseRoutes);
app.use("/users/:userId/questions", QuestionRoutes);
app.use("/gemini", GeminiRoutes);
app.use("/pdf", pdfRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});

// Handle 404 - Not Found
app.use((req, res) => {
    res.status(404).json({
        status: 'Error',
        statusCode: 404,
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            status: 'error',
            message: 'Not allowed by CORS',
            origin: req.headers.origin
        });
    }
    
    // Handle other errors
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Catch-all route for 404 errors - compatible with Express 5+
app.use((req, res) => {
    res.status(404).json({
        status: 'Error',
        statusCode: 404,
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

export default app;
