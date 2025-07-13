<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Little Shop</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; }
        /* Keyframes for slide-in-right animation */
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
            }
            to {
                transform: translateX(0);
            }
        }
        .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out forwards;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module">
        import React from 'https://esm.sh/react@18.2.0';
        import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
        import App from './App.js'; // Your App.js file

        // Define global variables expected by the App.js
        // Replace with your actual Firebase config JSON string
        // Make sure this is a string, not an object.
        // Example:
        // const __firebase_config = JSON.stringify({
        //   apiKey: "YOUR_API_KEY",
        //   authDomain: "YOUR_AUTH_DOMAIN",
        //   projectId: "YOUR_PROJECT_ID",
        //   storageBucket: "YOUR_STORAGE_BUCKET",
        //   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        //   appId: "YOUR_APP_ID"
        // });
        // const __app_id = "YOUR_PROJECT_ID"; // Use your Firebase projectId here
        // const __initial_auth_token = null; // Leave as null for anonymous sign-in initially

        // IMPORTANT: In a real deployment, you would typically use environment variables
        // to inject these values during the build process, rather than hardcoding them.
        // For this simple example, we're hardcoding for demonstration.
        // When deploying to Netlify/Vercel, you'd set these as environment variables.
        // For Canvas environment, these are automatically provided.
        const __firebase_config = JSON.stringify({
            apiKey: "YOUR_FIREBASE_API_KEY", // Replace with your actual API Key
            authDomain: "YOUR_FIREBASE_AUTH_DOMAIN", // Replace with your actual Auth Domain
            projectId: "YOUR_FIREBASE_PROJECT_ID", // Replace with your actual Project ID
            storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET", // Replace with your actual Storage Bucket
            messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID", // Replace with your actual Messaging Sender ID
            appId: "YOUR_FIREBASE_APP_ID" // Replace with your actual App ID
        });
        const __app_id = "YOUR_FIREBASE_PROJECT_ID"; // Replace with your actual Project ID
        const __initial_auth_token = null; // This is for Canvas environment, keep null for external deployment

        // Make them globally available
        window.__firebase_config = __firebase_config;
        window.__app_id = __app_id;
        window.__initial_auth_token = __initial_auth_token;

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
    </script>
</body>
</html>
