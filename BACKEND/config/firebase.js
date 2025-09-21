import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let auth = null;

const initializeFirebase = async () => {
    if (admin.apps.length > 0) {
        db = admin.firestore();
        auth = admin.auth();
        return { db, auth, admin };
    }

    try {
        let serviceAccount;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : process.env.FIREBASE_SERVICE_ACCOUNT;
        } else {
            // For local development - read file directly
            const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
            const fileContent = await readFile(serviceAccountPath, 'utf8');
            serviceAccount = JSON.parse(fileContent);
        }

        // Initialize Firebase Admin with Firestore
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        // Initialize Firestore
        db = admin.firestore();
        auth = admin.auth();
        
        // Configure Firestore settings
        const firestoreSettings = {
            ignoreUndefinedProperties: true,
            experimentalForceLongPolling: process.env.VERCEL === '1',
            preferRest: false // Use gRPC if possible for better performance
        };
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('Initializing Firestore with settings:', firestoreSettings);
        }
        
        db.settings(firestoreSettings);
        
        console.log('Firebase Admin initialized with Firestore');
        return { db, auth, admin };
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
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

export { db, auth, admin, initializeFirebase };
export default db;