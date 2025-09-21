import admin from 'firebase-admin';

let db, auth, firebaseAdmin;

const initializeFirebase = async () => {
    if (admin.apps.length > 0) {
        // Already initialized
        db = admin.firestore();
        auth = admin.auth();
        firebaseAdmin = admin;
        return { db, auth, admin: firebaseAdmin };
    }

    try {
        let serviceAccount;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // For production (Vercel environment variables)
            serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : process.env.FIREBASE_SERVICE_ACCOUNT;
        } else {
            // For local development
            const serviceAccountModule = await import('./serviceAccountKey.json', { 
                assert: { type: 'json' } 
            });
            serviceAccount = serviceAccountModule.default || serviceAccountModule;
        }

        // Initialize with settings for Firestore
        firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        
        db = admin.firestore();
        auth = admin.auth();
        
        // Configure Firestore
        const settings = { timestampsInSnapshots: true };
        db.settings(settings);
        
        console.log('Firebase Admin initialized successfully');
        return { db, auth, admin: firebaseAdmin };
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        // Don't crash in production, allow the app to continue without Firebase
        if (process.env.NODE_ENV !== 'production') {
            throw error;
        }
        return { db: null, auth: null, admin: null };
    }
};

// Initialize immediately if not in a serverless environment
if (process.env.VERCEL !== '1') {
    initializeFirebase().catch(console.error);
}

export { db, auth, admin };
export default db;