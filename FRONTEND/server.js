import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3221;

// Serve static assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from frontend server!' });
});

// All other GET requests not handled before will return the React app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend Server ready at http://localhost:${PORT}`);
});

export default app;