import express from "express";
import cors from "cors";

import CourseRoutes from "./routes/courseRoutes.js";
import QuizRoutes from "./routes/quizRoutes.js";
import SRSRoutes from "./routes/srsRoutes.js";
import GeminiRoutes from "./routes/geminiRoutes.js";

const app = express();

// body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// allow request from other origin (Frontend which is at different port)
app.use(cors());

// use routes
app.use("/courses", CourseRoutes);
app.use("/quizzes", QuizRoutes);
app.use("/srs", SRSRoutes);
app.use("/gemini", GeminiRoutes);

export default app;
