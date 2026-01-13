
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Wait for the DOM to be ready
const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("MedFlow: App Rendered Successfully");
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
