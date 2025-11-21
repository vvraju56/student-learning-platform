// This will use real Firebase when deployed to Vercel, and localStorage in preview mode

export const isFirebaseConfigValid = () => {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return requiredFields.every(
    (field) => firebaseConfig[field as keyof typeof firebaseConfig]
  );
};

export const auth = null;
export const db = null;
