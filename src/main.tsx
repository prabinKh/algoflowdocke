import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ErrorBoundary (in App.tsx) can only catch errors thrown during
// React's render. It CANNOT catch errors in event handlers, timers,
// or rejected promises that nobody awaits/catches. Logging these
// globally means a silent white-page failure at least leaves a
// trace in the console instead of vanishing with no information.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
window.addEventListener('error', (event) => {
  console.error('[Uncaught Error]', event.error || event.message);
});

const container = document.getElementById('root');
console.log("Main.tsx: Root container:", container);
if (container) {
  console.log("Main.tsx: Mounting App...");
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error("Main.tsx: #root element not found in the DOM - cannot mount React app.");
}
