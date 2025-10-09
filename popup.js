document.addEventListener('DOMContentLoaded', function() {
    const backgroundToggle = document.getElementById('backgroundToggle');
    const colorAdjustToggle = document.getElementById('colorAdjustToggle');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const dividerToggle = document.getElementById('dividerToggle');
    const status = document.getElementById('status');
    
    chrome.storage.sync.get(['backgroundEnabled', 'colorAdjustEnabled', 'fontSize', 'darkModeEnabled', 'dividerEnabled'], (result) => {
        backgroundToggle.classList.remove('active');
        colorAdjustToggle.classList.remove('active');
        darkModeToggle.classList.remove('active');
        dividerToggle.classList.remove('active');
        
        if (result.backgroundEnabled !== false) {
            backgroundToggle.classList.add('active');
        }
        if (result.colorAdjustEnabled === true) {
            colorAdjustToggle.classList.add('active');
        }
        if (result.darkModeEnabled !== false) {
            darkModeToggle.classList.add('active');
        }
        if (result.dividerEnabled === true) {
            dividerToggle.classList.add('active');
        }
        const fontSize = result.fontSize || 14;
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize + 'px';
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
    
    colorAdjustToggle.addEventListener('click', () => {
        const isActive = colorAdjustToggle.classList.toggle('active');
        chrome.storage.sync.set({ colorAdjustEnabled: isActive });
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleColorAdjust',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleColorAdjust',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Ajuste de colores activado' : 'Ajuste de colores desactivado');
    });
    
    fontSizeSlider.addEventListener('input', () => {
        const fontSize = parseInt(fontSizeSlider.value);
        fontSizeValue.textContent = fontSize + 'px';
        chrome.storage.sync.set({ fontSize: fontSize });
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateFontSize',
                    fontSize: fontSize
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateFontSize',
                    fontSize: fontSize
                }).catch(() => {});
            }
        });
        showStatus('Tamaño de fuente: ' + fontSize + 'px');
    });
    
    darkModeToggle.addEventListener('click', () => {
        const isActive = darkModeToggle.classList.toggle('active');
        chrome.storage.sync.set({ darkModeEnabled: isActive });
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleDarkMode',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleDarkMode',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Modo oscuro activado' : 'Modo claro activado');
    });
    
    dividerToggle.addEventListener('click', () => {
        const isActive = dividerToggle.classList.toggle('active');
        chrome.storage.sync.set({ dividerEnabled: isActive });
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleDivider',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleDivider',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Líneas divisorias activadas' : 'Líneas divisorias desactivadas');
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