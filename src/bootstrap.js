// Keep the interface styled even when WebGL or its application bundle fails.
const loading = document.querySelector('#loading');
import('./main.js').catch(error => {
  console.error('The wardrobe application could not start:', error);
  loading.hidden = false;
  loading.classList.add('error');
  loading.textContent = 'The 3D showcase could not load. Please reload the page. If this continues, check that the complete production build was deployed.';
});
