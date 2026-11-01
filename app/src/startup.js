export function showFailure(message) {
  const loading = document.querySelector('#loading');
  loading.hidden = false;
  loading.classList.add('error');
  loading.replaceChildren();
  const text = document.createElement('p');
  text.textContent = message;
  const retry = document.createElement('button');
  retry.className = 'primary';
  retry.textContent = 'Retry showcase';
  retry.onclick = () => window.location.reload();
  loading.append(text, retry);
  document.querySelector('#viewer').setAttribute('aria-busy', 'false');
}
export function showReady() {
  document.querySelector('#loading').hidden = true;
  document.querySelector('#viewer').setAttribute('aria-busy', 'false');
}
