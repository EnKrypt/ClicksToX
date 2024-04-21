import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const mountPoint = document.createElement('div');
mountPoint.classList.add('clicks-to-x');
document.body.appendChild(mountPoint);
ReactDOM.createRoot(mountPoint).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
