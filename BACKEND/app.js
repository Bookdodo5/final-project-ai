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

// Enable CORS for all routes
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
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
