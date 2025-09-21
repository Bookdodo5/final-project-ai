import 'dotenv/config';
import app from './app.js';
import './config/firebase.js';

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

const PORT = process.env.PORT || 3001;

// Only start the server if this file is run directly (not when imported as a module)
if (process.env.NODE_ENV !== 'production') {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend Server ready at http://localhost:${PORT}`);
    });
}

export default app;