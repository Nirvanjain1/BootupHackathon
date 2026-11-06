const status = document.getElementById('setupStatus');
const button = document.getElementById('allowCamera');
const token = location.hash.slice(1);

async function requestCamera() {
  button.disabled = true;
  status.textContent = 'Choose Allow in the browser camera prompt.';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach(track => track.stop());
    status.textContent = 'Camera allowed. Returning to HandWave…';
    const result = await chrome.runtime.sendMessage({ type: 'cameraSetupGranted', token });
    if (!result?.ok) throw new Error('HandWave side panel is closed. Close this tab and reopen HandWave.');
  } catch (error) {
    status.textContent = error.name === 'NotAllowedError'
      ? 'Camera access is required. Check the camera permission near the address bar, then try again.'
      : error.message;
    button.disabled = false;
  }
}

button.addEventListener('click', requestCamera);
if (token) requestCamera();
