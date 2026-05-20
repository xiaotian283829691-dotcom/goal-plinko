import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initTelegramApp } from './config/telegram';

// Initialize Telegram SDK before rendering.
// Safe to call outside Telegram — will silently skip.
initTelegramApp();

// Note: not using StrictMode because it double-mounts effects,
// which causes issues with Matter.js engine initialization.
createRoot(document.getElementById('root')!).render(<App />);
