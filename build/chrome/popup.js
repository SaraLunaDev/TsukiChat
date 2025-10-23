document.addEventListener('DOMContentLoaded', function() {
    const backgroundToggle = document.getElementById('backgroundToggle');
    const colorAdjustToggle = document.getElementById('colorAdjustToggle');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const dividerToggle = document.getElementById('dividerToggle');
    const timestampsToggle = document.getElementById('timestampsToggle');
    const badgesToggle = document.getElementById('badgesToggle');
    const badgeOptions = document.getElementById('badgeOptions');
    const badge0Toggle = document.getElementById('badge0Toggle');
    const badge1Toggle = document.getElementById('badge1Toggle');
    const badge2Toggle = document.getElementById('badge2Toggle');
    const badge3Toggle = document.getElementById('badge3Toggle');
    const emotesToggle = document.getElementById('emotesToggle');
    const emoteOptions = document.getElementById('emoteOptions');
    const emoteSetId = document.getElementById('emoteSetId');
    const status = document.getElementById('status');
    
    chrome.storage.sync.get(['backgroundEnabled', 'colorAdjustEnabled', 'fontSize', 'darkModeEnabled', 'dividerEnabled', 'timestampsEnabled', 'badgesEnabled', 'badgeVisibility', 'emotesEnabled', 'emoteSetId'], (result) => {
        backgroundToggle.classList.remove('active');
        colorAdjustToggle.classList.remove('active');
        darkModeToggle.classList.remove('active');
        dividerToggle.classList.remove('active');
        timestampsToggle.classList.remove('active');
        badgesToggle.classList.remove('active');
        badge0Toggle.classList.remove('active');
        badge1Toggle.classList.remove('active');
        badge2Toggle.classList.remove('active');
        badge3Toggle.classList.remove('active');
        emotesToggle.classList.remove('active');
        
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
        if (result.timestampsEnabled !== false) {
            timestampsToggle.classList.add('active');
        }
        if (result.badgesEnabled !== false) {
            badgesToggle.classList.add('active');
            badgeOptions.style.display = 'block';
        }
        if (result.emotesEnabled !== false) {
            emotesToggle.classList.add('active');
            emoteOptions.style.display = 'block';
        }
        
        const badgeVisibility = result.badgeVisibility || { 0: true, 1: true, 2: true, 3: true };
        if (badgeVisibility[0]) badge0Toggle.classList.add('active');
        if (badgeVisibility[1]) badge1Toggle.classList.add('active');
        if (badgeVisibility[2]) badge2Toggle.classList.add('active');
        if (badgeVisibility[3]) badge3Toggle.classList.add('active');
        
        const fontSize = result.fontSize || 14;
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize + 'px';
        
        emoteSetId.value = result.emoteSetId || '01J7B66AR800095HSJ1PN3Z3JB';
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
    
    timestampsToggle.addEventListener('click', () => {
        const isActive = timestampsToggle.classList.toggle('active');
        chrome.storage.sync.set({ timestampsEnabled: isActive });
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleTimestamps',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleTimestamps',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Tiempo activado' : 'Tiempo desactivado');
    });
    
    badgesToggle.addEventListener('click', () => {
        const isActive = badgesToggle.classList.toggle('active');
        chrome.storage.sync.set({ badgesEnabled: isActive });
        
        if (isActive) {
            badgeOptions.style.display = 'block';
        } else {
            badgeOptions.style.display = 'none';
        }
        
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleBadges',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleBadges',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Badges activados' : 'Badges desactivados');
    });
    
    function createBadgeToggleListener(badgeId, badgeToggle) {
        return () => {
            const isActive = badgeToggle.classList.toggle('active');
            
            chrome.storage.sync.get(['badgeVisibility'], (result) => {
                const badgeVisibility = result.badgeVisibility || { 0: true, 1: true, 2: true, 3: true };
                badgeVisibility[badgeId] = isActive;
                chrome.storage.sync.set({ badgeVisibility: badgeVisibility });
                
                chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'toggleBadgeVisibility',
                            badgeId: badgeId,
                            enabled: isActive
                        }).catch(() => {});
                    });
                });
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'toggleBadgeVisibility',
                            badgeId: badgeId,
                            enabled: isActive
                        }).catch(() => {});
                    }
                });
                showStatus(`Badge ${badgeId} ${isActive ? 'activado' : 'desactivado'}`);
            });
        };
    }
    
    badge0Toggle.addEventListener('click', createBadgeToggleListener(0, badge0Toggle));
    badge1Toggle.addEventListener('click', createBadgeToggleListener(1, badge1Toggle));
    badge2Toggle.addEventListener('click', createBadgeToggleListener(2, badge2Toggle));
    badge3Toggle.addEventListener('click', createBadgeToggleListener(3, badge3Toggle));
    
    // Emotes functionality
    emotesToggle.addEventListener('click', () => {
        const isActive = emotesToggle.classList.toggle('active');
        chrome.storage.sync.set({ emotesEnabled: isActive });
        
        if (isActive) {
            emoteOptions.style.display = 'block';
        } else {
            emoteOptions.style.display = 'none';
        }
        
        chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleEmotes',
                    enabled: isActive
                }).catch(() => {});
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleEmotes',
                    enabled: isActive
                }).catch(() => {});
            }
        });
        showStatus(isActive ? 'Emotes activados' : 'Emotes desactivados');
    });
    
    // Save emote set ID when changed and load emotes automatically
    emoteSetId.addEventListener('input', () => {
        const setId = emoteSetId.value.trim();
        chrome.storage.sync.set({ emoteSetId: setId });
        
        // Auto-load emotes if emotes are enabled and ID is valid
        if (setId && emotesToggle.classList.contains('active')) {
            chrome.tabs.query({ url: "*://www.youtube.com/live_chat*" }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'updateEmoteSetId',
                        emoteSetId: setId
                    }).catch(() => {});
                });
            });
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateEmoteSetId',
                        emoteSetId: setId
                    }).catch(() => {});
                }
            });
        }
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