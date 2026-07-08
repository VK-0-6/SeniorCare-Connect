// main.js — application entry point.
// Imports styles, initializes settings + auth, registers routes, starts the router.

import './styles/styles.css';
import './styles/components.css';
import './styles/layout.css';

import { initSettings } from './utils/settings.js';
import { initRouter, registerRoute, setNotFound, beforeEach, currentRoute, render } from './router.js';
import { onAuthChange } from './services/authService.js';

// Pages
import { landingPage } from './pages/landing.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { dashboardPage } from './pages/dashboard.js';
import { medicinesPage, reminderHistoryPage } from './pages/medicines.js';
import { sosPage } from './pages/sos.js';
import { healthPage } from './pages/health.js';
import { qrPage } from './pages/qr.js';
import { aiReaderPage } from './pages/aiReader.js';
import { settingsPage } from './pages/settings.js';
import { aboutPage } from './pages/about.js';
import { contactPage } from './pages/contact.js';
import { notFoundPage } from './pages/notFound.js';

// Guards
import { withAuth } from './components/pageLayout.js';

// Public routes
registerRoute('/', landingPage);
registerRoute('/login', loginPage);
registerRoute('/register', registerPage);
registerRoute('/about', aboutPage);
registerRoute('/contact', contactPage);

// Protected routes (require a session)
registerRoute('/dashboard', withAuth(dashboardPage));
registerRoute('/medicines', withAuth(medicinesPage));
registerRoute('/medicines/history', withAuth(reminderHistoryPage));
registerRoute('/sos', withAuth(sosPage));
registerRoute('/health', withAuth(healthPage));
registerRoute('/qr', withAuth(qrPage));
registerRoute('/ai-reader', withAuth(aiReaderPage));
registerRoute('/settings', withAuth(settingsPage));

setNotFound(notFoundPage);

// Keep navbar/sidebar active states fresh after navigation.
beforeEach(() => true);

// Re-render on auth state changes so protected pages react immediately.
onAuthChange(() => {
  const path = currentRoute();
  if (path !== '/login' && path !== '/register') {
    render();
  }
});

initSettings();
initRouter();
