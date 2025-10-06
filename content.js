(function() {
    'use strict';
    if (!(window.location.href.includes('live_chat') || window !== window.top || document.querySelector('yt-live-chat-app'))) return;
    let backgroundEnabled = true;
    chrome.storage.sync.get(['backgroundEnabled'], (result) => {
        backgroundEnabled = result.backgroundEnabled !== false;
        updateBackgroundStyles();
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggleBackground') {
            backgroundEnabled = message.enabled;
            updateBackgroundStyles();
            sendResponse({ success: true });
        }
        return true;
    });
    
    const updateBackgroundStyles = () => {
        let styleElement = document.getElementById('tsuki-background-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        if (backgroundEnabled) {
            styleElement = document.createElement('style');
            styleElement.id = 'tsuki-background-styles';
            styleElement.textContent = `
                yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):nth-child(odd) {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):nth-child(even) {
                    background-color: transparent !important;
                }
            `;
            document.head.appendChild(styleElement);
        } else {
            styleElement = document.createElement('style');
            styleElement.id = 'tsuki-background-styles';
            styleElement.textContent = `
                yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]) {
                    background-color: transparent !important;
                }
            `;
            document.head.appendChild(styleElement);
        }
    };
    
    const processMessage = message => {
        if (message.dataset.tsukiProcessed) return;
        
        const messageElement = message.querySelector('#message');
        if (!messageElement) return;
        
        const messageText = messageElement.textContent.trim();
        
        // Verificar formato de evento: bit_[usuario][mensaje x## datos] o sub_[usuario][mensaje x## datos]
        const eventMatch = messageText.match(/^(\w+)_\[([^\]]+)\]\[(.+)\]$/);
        if (eventMatch) {
            const [, eventType, username, eventData] = eventMatch;
            
            // Buscar multiplicador en el mensaje
            const multiplierMatch = eventData.match(/(.+?)\s(x\d+)\s(.+)/);
            let eventText, multiplier, additionalText;
            
            if (multiplierMatch) {
                [, eventText, multiplier, additionalText] = multiplierMatch;
            } else {
                eventText = eventData;
                multiplier = '';
                additionalText = '';
            }
            
            message.dataset.tsukiProcessed = 'true';
            message.dataset.tsukiEvent = 'true';
            
            // Crear contenedor del evento
            const eventContainer = document.createElement('div');
            eventContainer.className = 'tsuki-event-container';
            
            // Crear elemento del nombre de usuario
            const usernameElement = document.createElement('div');
            usernameElement.className = 'tsuki-event-username';
            usernameElement.textContent = username + ':';
            
            // Crear elemento de datos del evento
            const dataElement = document.createElement('div');
            dataElement.className = 'tsuki-event-data';
            
            // Separar el multiplicador del resto de los datos
            const multiplierElement = document.createElement('span');
            multiplierElement.className = 'tsuki-event-multiplier';
            multiplierElement.textContent = multiplier;
            
            if (multiplier) {
                dataElement.textContent = eventText + ' ';
                dataElement.appendChild(multiplierElement);
                if (additionalText) {
                    dataElement.appendChild(document.createTextNode(' ' + additionalText));
                }
                multiplierElement.textContent = multiplier;
            } else {
                dataElement.textContent = eventData;
            }
            
            eventContainer.appendChild(usernameElement);
            eventContainer.appendChild(dataElement);
            
            // Reemplazar contenido del mensaje
            messageElement.innerHTML = '';
            messageElement.appendChild(eventContainer);
            
            // Intentar cargar icono del evento
            const iconUrl = chrome.runtime.getURL(`events/${eventType}.svg`);
            const iconElement = document.createElement('div');
            iconElement.className = 'tsuki-event-icon';
            
            const img = document.createElement('img');
            img.src = iconUrl;
            img.onerror = function() {
                // Si no existe el icono, mantener el timestamp original
                iconElement.style.display = 'none';
                const timestampElement = message.querySelector('#timestamp');
                if (timestampElement) {
                    timestampElement.style.display = 'block';
                }
            };
            img.onload = function() {
                // Si el icono existe, ocultar el timestamp
                const timestampElement = message.querySelector('#timestamp');
                if (timestampElement) {
                    timestampElement.style.display = 'none';
                }
            };
            
            iconElement.appendChild(img);
            
            // Insertar el icono antes del contenedor del evento
            const contentElement = message.querySelector('#content');
            if (contentElement) {
                contentElement.insertBefore(iconElement, messageElement);
            }
            
            // Ocultar elementos no necesarios
            const authorNameElement = message.querySelector('#author-name');
            if (authorNameElement) authorNameElement.style.display = 'none';
            
            const authorChip = message.querySelector('yt-live-chat-author-chip');
            if (authorChip) authorChip.style.display = 'none';
            
            const authorPhoto = message.querySelector('#author-photo');
            if (authorPhoto) authorPhoto.style.display = 'none';
            
            return;
        }
        
        // Formato normal: #HEX[username]message
        const match = messageText.match(/^#([A-Fa-f0-9]{6})\[([^\]]+)\](.*)$/);
        
        if (!match) return;
        
        const [, colorHex, extractedUsername, cleanMessage] = match;
        const userColor = '#' + colorHex;
        
        message.dataset.tsukiProcessed = 'true';
        
        const authorNameElement = message.querySelector('#author-name');
        if (authorNameElement) {
            authorNameElement.textContent = extractedUsername + ':';
            authorNameElement.style.setProperty('color', userColor, 'important');
        }
        
        const nameSpan = message.querySelector('yt-live-chat-author-chip span[dir="auto"]');
        const authorChip = message.querySelector('yt-live-chat-author-chip');
        if (nameSpan) {
            nameSpan.textContent = extractedUsername + ':';
            nameSpan.style.setProperty('color', userColor, 'important');
            
            if (authorChip) {
                authorChip.style.setProperty('color', userColor, 'important');
            }
        }
        
        messageElement.textContent = cleanMessage.trim();
        
        const authorPhoto = message.querySelector('#author-photo');
        if (authorPhoto) authorPhoto.style.display = 'none';
    };
    
    const processAllMessages = () => {
        document.querySelectorAll('yt-live-chat-text-message-renderer:not([data-tsuki-processed])').forEach(processMessage);
    };
    
    processAllMessages();
    
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                            processMessage(node);
                        } else if (node.querySelector) {
                            node.querySelectorAll('yt-live-chat-text-message-renderer:not([data-tsuki-processed])').forEach(processMessage);
                        }
                    }
                }
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
})();