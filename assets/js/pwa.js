let deferredPrompt;
const installBtn = document.getElementById('installBtn');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn?.classList.remove('hidden');
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});
