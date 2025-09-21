import admin from 'firebase-admin';

let serviceAccount;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = (await import('./serviceAccountKey.json', { assert: { type: 'json' } })).default;
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase:', error);
    if (process.env.NODE_ENV !== 'production') process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
export default db;