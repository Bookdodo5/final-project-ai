import "dotenv/config";
import app from "./app.js";
import "./config/firebase.js";

// This is for maintaining the server.
process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.log(err.name, err.message);
    console.log(err.stack);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(`${err}`);
    server.close(() => {
        process.exit(1);
    });
});

const PORT = 3222;
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend Server ready at http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
    console.error(err.stack); // Log the stack trace
    res.status(500).send('Something broke!');
});