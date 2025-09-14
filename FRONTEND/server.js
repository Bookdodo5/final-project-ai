import express from "express";
import path from "path";

const app = express();
const PORT = 3221;
const __dirname = path.resolve();

// Serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, "FRONTEND/public")));

// Only fallback to index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "FRONTEND/public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend Server ready at http://localhost:${PORT}`);
});