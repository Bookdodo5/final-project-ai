import express from "express";
import cors from "cors";

import CourseRoutes from "./routes/courseRoutes.js";
import QuestionRoutes from "./routes/questionRoutes.js";
import GeminiRoutes from "./routes/geminiRoutes.js";
import UserRoutes from "./routes/userRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

const app = express();

// body-parser with increased limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS with specific allowed origins
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // List of allowed domains
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://54.221.178.70/',
            'http://mastery-path.cloud-ip.cc/',
            'http://www.mastery-path.cloud-ip.cc/',
            'https://mastery-path.cloud-ip.cc/',
            'https://www.mastery-path.cloud-ip.cc/',
        ];
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

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
