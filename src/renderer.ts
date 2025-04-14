/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// TypeScript interface for global window API
declare global {
  interface Window {
    api: any;
  }
}

// Create a root element for the React app
const rootElement = document.getElementById('app');
if (!rootElement) {
  // If the root element doesn't exist, create and append it to the body
  const appDiv = document.createElement('div');
  appDiv.id = 'app';
  document.body.appendChild(appDiv);
}

// Create the React root
const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(React.createElement(App));