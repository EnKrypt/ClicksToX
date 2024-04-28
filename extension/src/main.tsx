import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import styles from './index.css?inline';

if (document.location.origin === 'https://en.wikipedia.org') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  const mountPoint = document.createElement('div');
  mountPoint.classList.add('clicks-to-x');
  document.body.appendChild(mountPoint);
  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
