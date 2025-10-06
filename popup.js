document.addEventListener('DOMContentLoaded', function() {
    const backgroundToggle = document.getElementById('backgroundToggle');
    const status = document.getElementById('status');
    chrome.storage.sync.get(['backgroundEnabled'], (result) => {
        if (result.backgroundEnabled !== false) {
            backgroundToggle.classList.add('active');
        }
    });
    backgroundToggle.addEventListener('click', () => {
        const isActive = backgroundToggle.classList.toggle('active');
        chrome.storage.sync.set({ backgroundEnabled: isActive });
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleBackground',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleBackground',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Fondo alternado activado' : 'Fondo alternado desactivado');
    });
    function showStatus(message, isError = false) {
        status.textContent = message;
        status.style.color = isError ? '#ff6b6b' : '#4ECDC4';
        setTimeout(() => {
            status.textContent = 'Configuración lista';
            status.style.color = '#888';
        }, 3000);
    }
});