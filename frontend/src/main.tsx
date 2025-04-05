import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { NavigationProvider } from './contexts/NavigationContext';
import './index.css';

// Create a data router to support useBlocker
const router = createBrowserRouter([
  {
    path: "/*",
    element: (
      <NavigationProvider>
        <App />
      </NavigationProvider>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
