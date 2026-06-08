import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

// Apply the saved theme before the app mounts so we don't flash the default.
try {
  const prefs = JSON.parse(localStorage.getItem('vox.prefs') || '{}');
  if (prefs.darkMode) {
    document.documentElement.dataset.theme = 'dark';
  }
} catch {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
