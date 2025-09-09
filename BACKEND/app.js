import express from "express";
import cors from "cors";

import CourseRoutes from "./routes/courseRoutes.js";
import QuizRoutes from "./routes/quizRoutes.js";
import SRSRoutes from "./routes/srsRoutes.js";
import GeminiRoutes from "./routes/geminiRoutes.js";
import UserRoutes from "./routes/userRoutes.js";

const app = express();

// body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// allow request from other origin (Frontend which is at different port)
app.use(cors());

// use routes
app.use("/users", UserRoutes);
app.use("/users/:userId/courses", CourseRoutes);
app.use("/users/:userId/quizzes", QuizRoutes);
app.use("/users/:userId/srs", SRSRoutes);
app.use("/gemini", GeminiRoutes);

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
