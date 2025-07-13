import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Define global variables for the Canvas environment if needed
  // For Netlify, process.env variables are used instead.
  define: {
    // These are for the Canvas environment only.
    // When deploying to Netlify, process.env will be used.
    '__app_id': JSON.stringify(process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id'),
    '__firebase_config': JSON.stringify({
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    }),
    '__initial_auth_token': JSON.stringify(null) // Keep null for Netlify
  }
});
