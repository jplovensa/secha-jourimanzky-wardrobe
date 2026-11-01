import './film.js';
import { showFailure } from './startup.js';
const viewer = document.querySelector('#viewer');
viewer.setAttribute('aria-busy', 'true');
const timeout = setTimeout(() => {
  showFailure('Loading is taking longer than expected. Check your connection, then retry.');
}, 20000);
window.addEventListener('showcase-ready', () => clearTimeout(timeout), { once: true });
window.addEventListener('showcase-failed', () => clearTimeout(timeout), { once: true });
// Let the browser paint the loading state before constructing the scene.
requestAnimationFrame(() => import('./main.js').catch(error => {
  clearTimeout(timeout);
  console.error('The wardrobe application could not start:', error);
  showFailure('The 3D files could not load. Reload to get the latest version, or check that the complete production build was deployed.');
}));
