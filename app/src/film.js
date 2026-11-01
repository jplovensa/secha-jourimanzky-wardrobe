// The film remains available even if WebGL is unavailable.
const dialog = document.querySelector('#film-dialog');
const video = document.querySelector('#closet-film');
const trigger = document.querySelector('#watch-film');
trigger.addEventListener('click', () => {
  window.dispatchEvent(new Event('showcase-pause-walkthrough'));
  dialog.showModal();
  video.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
});
function closeFilm(){video.pause();dialog.close();}
document.querySelector('#close-film').addEventListener('click', closeFilm);
dialog.addEventListener('cancel', () => video.pause());
dialog.addEventListener('click', event => { if (event.target === dialog) {
  const r = dialog.getBoundingClientRect();
  if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeFilm();
} });
dialog.addEventListener('close', () => { video.pause(); trigger.focus(); });
video.addEventListener('error', () => { document.querySelector('#film-error').hidden = false; });
video.querySelector('source').addEventListener('error', () => { document.querySelector('#film-error').hidden = false; });
