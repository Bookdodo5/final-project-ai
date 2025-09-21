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

// CORS middleware
app.use(cors({
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
}));

// Handle preflight requests
app.options('*', cors());

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
app.use((req, res, next) => {
    res.status(404).json({
        status: 'Error',
        statusCode: 404,
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        status: 'Error',
        statusCode: err.statusCode || 500,
        message: err.message || 'Internal Server Error'
    });
});

export default app;
