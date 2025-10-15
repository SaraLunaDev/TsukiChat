document.addEventListener('DOMContentLoaded', function() {
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
    const backgroundToggle = document.getElementById('backgroundToggle');
    const colorAdjustToggle = document.getElementById('colorAdjustToggle');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const dividerToggle = document.getElementById('dividerToggle');
    const status = document.getElementById('status');
    
    function getStorageData(keys) {
        return new Promise((resolve) => {
            if (typeof browser !== 'undefined' && browser.storage) {
                browser.storage.sync.get(keys).then(resolve).catch(() => resolve({}));
            } else {
                chrome.storage.sync.get(keys, resolve);
            }
        });
    }
    
    function setStorageData(data) {
        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.sync.set(data).catch(() => {});
        } else {
            chrome.storage.sync.set(data);
        }
    }
    
    function sendMessageToTab(tabId, message) {
        if (typeof browser !== 'undefined' && browser.tabs) {
            browser.tabs.sendMessage(tabId, message).catch(() => {});
        } else {
            chrome.tabs.sendMessage(tabId, message, () => {
                if (chrome.runtime.lastError) {
                    // Ignorar errores silenciosamente
                }
            });
        }
    }
    
    function queryTabs(query) {
        return new Promise((resolve) => {
            if (typeof browser !== 'undefined' && browser.tabs) {
                browser.tabs.query(query).then(resolve).catch(() => resolve([]));
            } else {
                chrome.tabs.query(query, resolve);
            }
        });
    }
    
    getStorageData(['backgroundEnabled', 'colorAdjustEnabled', 'fontSize', 'darkModeEnabled', 'dividerEnabled']).then((result) => {
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
    
    async function sendMessageToAllTabs(message) {
        try {
            const chatTabs = await queryTabs({ url: "*://www.youtube.com/live_chat*" });
            const activeTabs = await queryTabs({ active: true, currentWindow: true });
            
            chatTabs.forEach(tab => sendMessageToTab(tab.id, message));
            activeTabs.forEach(tab => sendMessageToTab(tab.id, message));
        } catch (error) {
            console.error('Error sending message to tabs:', error);
        }
    }
    
    backgroundToggle.addEventListener('click', () => {
        const isActive = backgroundToggle.classList.toggle('active');
        setStorageData({ backgroundEnabled: isActive });
        sendMessageToAllTabs({
            action: 'toggleBackground',
            enabled: isActive
        });
        showStatus(isActive ? 'Fondo alternado activado' : 'Fondo alternado desactivado');
    });
    
    colorAdjustToggle.addEventListener('click', () => {
        const isActive = colorAdjustToggle.classList.toggle('active');
        setStorageData({ colorAdjustEnabled: isActive });
        sendMessageToAllTabs({
            action: 'toggleColorAdjust',
            enabled: isActive
        });
        showStatus(isActive ? 'Ajuste de colores activado' : 'Ajuste de colores desactivado');
    });
    
    fontSizeSlider.addEventListener('input', () => {
        const fontSize = parseInt(fontSizeSlider.value);
        fontSizeValue.textContent = fontSize + 'px';
        setStorageData({ fontSize: fontSize });
        sendMessageToAllTabs({
            action: 'updateFontSize',
            fontSize: fontSize
        });
        showStatus('Tamaño de fuente: ' + fontSize + 'px');
    });
    
    darkModeToggle.addEventListener('click', () => {
        const isActive = darkModeToggle.classList.toggle('active');
        setStorageData({ darkModeEnabled: isActive });
        sendMessageToAllTabs({
            action: 'toggleDarkMode',
            enabled: isActive
        });
        showStatus(isActive ? 'Modo oscuro activado' : 'Modo claro activado');
    });
    
    dividerToggle.addEventListener('click', () => {
        const isActive = dividerToggle.classList.toggle('active');
        setStorageData({ dividerEnabled: isActive });
        sendMessageToAllTabs({
            action: 'toggleDivider',
            enabled: isActive
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