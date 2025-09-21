import admin from 'firebase-admin';

let db = null;
let auth = null;

const initializeFirebase = async () => {
    // Return if already initialized
    if (admin.apps.length > 0) {
        db = admin.firestore();
        auth = admin.auth();
        return { db, auth, admin };
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

        // Initialize Firebase Admin with Firestore
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // Explicitly disable Realtime Database if not needed
            databaseURL: ''
        });
        
        // Initialize Firestore with settings
        db = admin.firestore();
        
        // Initialize Auth
        auth = admin.auth();
        
        // Configure Firestore settings for better error handling
        const firestoreSettings = {
            ignoreUndefinedProperties: true,
            // Disable offline persistence in serverless environment
            experimentalForceLongPolling: process.env.VERCEL === '1',
            // Increase timeout for Vercel
            timeout: 10000
        };
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('Initializing Firestore with settings:', firestoreSettings);
        }
        
        db.settings(firestoreSettings);
        
        console.log('Firebase Admin initialized with Firestore');
        return { db, auth, admin };
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        // Don't crash in production
        if (process.env.NODE_ENV !== 'production') {
            throw error;
        }
        return { db: null, auth: null, admin: null };
    }
};

// Initialize immediately if not in a serverless environment
if (process.env.VERCEL !== '1') {
    initializeFirebase().catch(console.error);
} else {
    // In serverless environment, we'll initialize on first request
    initializeFirebase().catch(console.error);
}

export { db, auth, admin };
export default db;