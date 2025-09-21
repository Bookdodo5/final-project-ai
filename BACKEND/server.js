import 'dotenv/config';
import app from './app.js';

// Initialize Firebase only in production or if not in Vercel's serverless environment
if (process.env.VERCEL !== '1') {
    import('./config/firebase.js').catch(err => {
        console.error('Failed to initialize Firebase:', err);
    });
}

// Error handling middleware
app.use(/(.*)/, (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Handle uncaught exceptions - log but don't crash in production
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION!', err);
    if (process.env.NODE_ENV !== 'production') process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV !== 'production') process.exit(1);
});

// For Vercel serverless functions
export default async (req, res) => {
    try {
        return app(req, res);
    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend Server ready at http://localhost:${PORT}`);
    });
}