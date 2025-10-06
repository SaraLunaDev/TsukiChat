document.addEventListener('DOMContentLoaded', function() {
    // Compatibilidad entre Chrome y Firefox
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
    
    const backgroundToggle = document.getElementById('backgroundToggle');
    const status = document.getElementById('status');
    
    browserAPI.storage.sync.get(['backgroundEnabled'], (result) => {
        if (result.backgroundEnabled !== false) {
            backgroundToggle.classList.add('active');
        }
    });
    
    backgroundToggle.addEventListener('click', () => {
        const isActive = backgroundToggle.classList.toggle('active');
        
        browserAPI.storage.sync.set({ backgroundEnabled: isActive });
        
        // Firefox maneja las promesas de manera diferente
        const sendMessageToTabs = (tabs) => {
            tabs.forEach(tab => {
                browserAPI.tabs.sendMessage(tab.id, {
                    action: 'toggleBackground',
                    enabled: isActive
                }).catch(() => {
                    // Silenciar errores si la pestaña no puede recibir mensajes
                });
            });
        };
        
        browserAPI.tabs.query({ url: "*://www.youtube.com/live_chat*" }, sendMessageToTabs);
        
        browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                browserAPI.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleBackground',
                    enabled: isActive
                }).catch(() => {
                    // Silenciar errores si la pestaña no puede recibir mensajes
                });
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