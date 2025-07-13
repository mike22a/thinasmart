// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js'; // Your main App component
import './index.css'; // Import global CSS (for Tailwind)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
