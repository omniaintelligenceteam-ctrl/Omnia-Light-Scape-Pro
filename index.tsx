import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// This checks if the app root exists to prevent crashes
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
