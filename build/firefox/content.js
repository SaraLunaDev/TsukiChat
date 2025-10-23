(function() {
    'use strict';
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
    if (!(window.location.href.includes('live_chat') || window !== window.top || document.querySelector('yt-live-chat-app'))) return;
    
    try {
        browserAPI.runtime.getURL('');
    } catch (error) {
        if (error.message.includes('Extension context invalidated')) {
            console.log('Extension context invalidated, stopping execution');
            return;
        }
    }
    
    let backgroundEnabled = true;
    let colorAdjustEnabled = false;
    let fontSize = 14;
    let darkModeEnabled = true;
    let dividerEnabled = false;
    let timestampsEnabled = true;
    let badgesEnabled = true;
    let badgeVisibility = { 0: true, 1: true, 2: true, 3: true };
    let emotesEnabled = true; // Activado por defecto
    let emoteSetId = '01J7B66AR800095HSJ1PN3Z3JB';
    let emotesData = new Map(); // Store emote names -> emote data
    
    browserAPI.storage.sync.get(['backgroundEnabled', 'colorAdjustEnabled', 'fontSize', 'darkModeEnabled', 'dividerEnabled', 'timestampsEnabled', 'badgesEnabled', 'badgeVisibility', 'emotesEnabled', 'emoteSetId'], (result) => {
        if (browserAPI.runtime.lastError) {
            console.error('Storage error:', browserAPI.runtime.lastError);
            return;
        }
        backgroundEnabled = result.backgroundEnabled !== false;
        colorAdjustEnabled = result.colorAdjustEnabled === true;
        fontSize = result.fontSize || 14;
        darkModeEnabled = result.darkModeEnabled !== false;
        dividerEnabled = result.dividerEnabled === true;
        timestampsEnabled = result.timestampsEnabled !== false;
        badgesEnabled = result.badgesEnabled !== false;
        badgeVisibility = result.badgeVisibility || { 0: true, 1: true, 2: true, 3: true };
        emotesEnabled = result.emotesEnabled !== false; // Activado por defecto
        emoteSetId = result.emoteSetId || '01J7B66AR800095HSJ1PN3Z3JB';
        
        updateBackgroundStyles();
        updateFontSize();
        updateChatTheme();
        updateTimestampsVisibility();
        
        processAllMessages();
        
        if (colorAdjustEnabled) {
            reapplyColorAdjustment();
        }
        
        if (emotesEnabled) {
            loadEmotesFromAPI(emoteSetId);
        }
    });
    
    browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggleBackground') {
            backgroundEnabled = message.enabled;
            updateBackgroundStyles();
            sendResponse({ success: true });
        } else if (message.action === 'toggleColorAdjust') {
            colorAdjustEnabled = message.enabled;
            reapplyColorAdjustment();
            sendResponse({ success: true });
        } else if (message.action === 'updateFontSize') {
            fontSize = message.fontSize;
            updateFontSize();
            updateBadgesVisibility();
            sendResponse({ success: true });
        } else if (message.action === 'toggleDarkMode') {
            darkModeEnabled = message.enabled;
            updateChatTheme();
            updateBackgroundStyles();
            reapplyColorAdjustment();
            sendResponse({ success: true });
        } else if (message.action === 'toggleDivider') {
            dividerEnabled = message.enabled;
            updateBackgroundStyles();
            sendResponse({ success: true });
        } else if (message.action === 'toggleTimestamps') {
            timestampsEnabled = message.enabled;
            updateTimestampsVisibility();
            sendResponse({ success: true });
        } else if (message.action === 'toggleBadges') {
            badgesEnabled = message.enabled;
            updateBadgesVisibility();
            sendResponse({ success: true });
        } else if (message.action === 'toggleBadgeVisibility') {
            badgeVisibility[message.badgeId] = message.enabled;
            updateBadgesVisibility();
            sendResponse({ success: true });
        } else if (message.action === 'toggleEmotes') {
            emotesEnabled = message.enabled;
            if (emotesEnabled && emotesData.size === 0) {
                loadEmotesFromAPI(emoteSetId);
            } else {
                // Reprocesar todos los mensajes para mostrar/ocultar emotes dinámicamente
                reprocessAllMessagesForEmotes();
            }
            sendResponse({ success: true });
        } else if (message.action === 'updateEmoteSetId') {
            emoteSetId = message.emoteSetId;
            if (emotesEnabled) {
                loadEmotesFromAPI(emoteSetId).then(result => {
                    sendResponse(result);
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true; // Keep message channel open for async response
            } else {
                sendResponse({ success: true, message: 'ID actualizado (emotes desactivados)' });
            }
        } else if (message.action === 'loadEmotes') {
            emoteSetId = message.emoteSetId;
            loadEmotesFromAPI(emoteSetId).then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
        }
        return true;
    });
    
    const adjustColor = (hexColor) => {
        if (!colorAdjustEnabled) return hexColor;

        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const toHex = (v) => v.toString(16).padStart(2, '0');

        const luminance = (r, g, b) => {
            const s = [r, g, b].map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
        };

        const bgLum = darkModeEnabled ? 0.1 : 0.9;
        const lum = luminance(r, g, b);
        const contrast = (Math.max(lum, bgLum) + 0.05) / (Math.min(lum, bgLum) + 0.05);

        // ✅ Si ya tiene suficiente contraste, no cambiar nada
        if (contrast >= 4.5) return hexColor;

        // 🔧 Si el color es muy oscuro en modo oscuro → aclarar
        if (darkModeEnabled && lum < 0.2) {
            const factor = 1.6;
            const gray = (r + g + b) / 3;
            const desat = 0.25;
            const newR = Math.min(255, Math.round((r * (1 - desat) + gray * desat) * factor));
            const newG = Math.min(255, Math.round((g * (1 - desat) + gray * desat) * factor));
            const newB = Math.min(255, Math.round((b * (1 - desat) + gray * desat) * factor));
            return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
        }

        // 🔧 Si el color es muy claro en modo claro → oscurecer
        if (!darkModeEnabled && lum > 0.7) {
            const factor = 0.7;
            const gray = (r + g + b) / 3;
            const desat = 0.2;
            const newR = Math.round((r * (1 - desat) + gray * desat) * factor);
            const newG = Math.round((g * (1 - desat) + gray * desat) * factor);
            const newB = Math.round((b * (1 - desat) + gray * desat) * factor);
            return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
        }

        return hexColor;
    };

    const updateFontSize = () => {
        let fontStyleElement = document.getElementById('tsuki-font-styles');
        if (fontStyleElement) {
            fontStyleElement.remove();
        }
        
        fontStyleElement = document.createElement('style');
        fontStyleElement.id = 'tsuki-font-styles';
        fontStyleElement.textContent = `
            yt-live-chat-text-message-renderer[data-tsuki-processed="true"] #message,
            yt-live-chat-text-message-renderer[data-tsuki-processed="true"] #author-name,
            yt-live-chat-text-message-renderer[data-tsuki-processed="true"] yt-live-chat-author-chip span,
            yt-live-chat-text-message-renderer[data-tsuki-event="true"] .tsuki-event-username,
            yt-live-chat-text-message-renderer[data-tsuki-event="true"] .tsuki-event-data,
            yt-live-chat-text-message-renderer:not([data-tsuki-processed]) #message,
            yt-live-chat-text-message-renderer:not([data-tsuki-processed]) #author-name,
            yt-live-chat-text-message-renderer:not([data-tsuki-processed]) yt-live-chat-author-chip span {
                font-size: ${fontSize}px !important;
            }
        `;
        document.head.appendChild(fontStyleElement);
    };
    
    const updateChatTheme = () => {
        let themeStyleElement = document.getElementById('tsuki-theme-styles');
        if (themeStyleElement) {
            themeStyleElement.remove();
        }
        
        themeStyleElement = document.createElement('style');
        themeStyleElement.id = 'tsuki-theme-styles';
        
        if (darkModeEnabled) {
            themeStyleElement.textContent = `
                yt-live-chat-app {
                    background-color: #0f0f0f !important;
                }
                yt-live-chat-renderer {
                    background-color: #0f0f0f !important;
                }
                #items {
                    background-color: #0f0f0f !important;
                }
                #chat-messages {
                    background-color: #0f0f0f !important;
                }
                yt-live-chat-item-list-renderer {
                    background-color: #0f0f0f !important;
                }
                yt-live-chat-banner-renderer {
                    background-color: #0f0f0f !important;
                    --yt-spec-inverted-background: #0f0f0f !important;
                }
                yt-live-chat-text-message-renderer #message {
                    color: #ffffff !important;
                }
                yt-live-chat-text-message-renderer #timestamp {
                    color: #ffffff !important;
                }
            `;
        } else {
            themeStyleElement.textContent = `
                yt-live-chat-app {
                    background-color: #ffffff !important;
                }
                yt-live-chat-renderer {
                    background-color: #ffffff !important;
                }
                #items {
                    background-color: #ffffff !important;
                }
                #chat-messages {
                    background-color: #ffffff !important;
                }
                yt-live-chat-item-list-renderer {
                    background-color: #ffffff !important;
                }
                yt-live-chat-banner-renderer {
                    background-color: #ffffff !important;
                    --yt-spec-inverted-background: #ffffff !important;
                }
                yt-live-chat-text-message-renderer #message {
                    color: #000000 !important;
                }
                yt-live-chat-text-message-renderer #timestamp {
                    color: #000000 !important;
                }
            `;
        }
        
        document.head.appendChild(themeStyleElement);
    };
    
    const reapplyColorAdjustment = () => {
        document.querySelectorAll('yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event])').forEach(message => {
            const messageElement = message.querySelector('#message');
            if (!messageElement) return;
            
            const originalColor = message.dataset.originalColor;
            if (!originalColor) return;
            
            const adjustedColor = adjustColor(originalColor);
            
            const authorNameElement = message.querySelector('#author-name');
            if (authorNameElement) {
                authorNameElement.style.setProperty('color', adjustedColor, 'important');
            }
            
            const nameSpan = message.querySelector('yt-live-chat-author-chip span[dir="auto"]');
            const authorChip = message.querySelector('yt-live-chat-author-chip');
            if (nameSpan) {
                nameSpan.style.setProperty('color', adjustedColor, 'important');
                if (authorChip) {
                    authorChip.style.setProperty('color', adjustedColor, 'important');
                }
            }
        });
    };
    
    const applyColorToMessage = (message, originalColor) => {
        const adjustedColor = adjustColor(originalColor);
        
        const authorNameElement = message.querySelector('#author-name');
        if (authorNameElement) {
            authorNameElement.style.setProperty('color', adjustedColor, 'important');
        }
        
        const nameSpan = message.querySelector('yt-live-chat-author-chip span[dir="auto"]');
        const authorChip = message.querySelector('yt-live-chat-author-chip');
        if (nameSpan) {
            nameSpan.style.setProperty('color', adjustedColor, 'important');
            if (authorChip) {
                authorChip.style.setProperty('color', adjustedColor, 'important');
            }
        }
    };
    
    const updateBackgroundStyles = () => {
        let styleElement = document.getElementById('tsuki-background-styles');
        if (styleElement) styleElement.remove();
        
        styleElement = document.createElement('style');
        styleElement.id = 'tsuki-background-styles';
        
        let css = `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]), 
                   yt-live-chat-text-message-renderer:not([data-tsuki-processed]) {
            margin: 0 !important;
            padding-top: 4px !important;
            padding-bottom: 4px !important;
        }`;
        
        if (backgroundEnabled) {
            if (darkModeEnabled) {
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):nth-child(odd),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]):nth-child(odd) {
                    background-color: #1a1a1a !important;
                }`;
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):nth-child(even),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]):nth-child(even) {
                    background-color: #0f0f0f !important;
                }`;
            } else {
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):nth-child(odd),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]):nth-child(odd) {
                    background-color: #f0f0f0 !important;
                }`;
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):nth-child(even),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]):nth-child(even) {
                    background-color: #ffffff !important;
                }`;
            }
        } else {
            if (darkModeEnabled) {
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]) {
                    background-color: #0f0f0f !important;
                }`;
            } else {
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]) {
                    background-color: #ffffff !important;
                }`;
            }
        }
        
        if (dividerEnabled) {
            if (darkModeEnabled) {
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):not(:first-child),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]):not(:first-child) {
                    box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
                }`;
            } else {
                css += `yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event]):not(:first-child),
                        yt-live-chat-text-message-renderer:not([data-tsuki-processed]):not(:first-child) {
                    box-shadow: inset 0 1px 0 0 rgba(0, 0, 0, 0.08) !important;
                }`;
            }
        }
        
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    };
    
    const updateBadgesVisibility = () => {
        document.querySelectorAll('yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event])').forEach(message => {
            const messageElement = message.querySelector('#message');
            if (!messageElement) return;
            
            const originalColor = message.dataset.originalColor;
            if (!originalColor) return;
            
            // Get the original emblem data
            const originalText = messageElement.dataset.originalText;
            if (!originalText) return;
            
            const match = originalText.match(/^([0-3]*)?#([A-Fa-f0-9]{6})\[([^\]]+)\](.*)$/);
            if (!match) return;
            
            const [, emblems, colorHex, extractedUsername, cleanMessage] = match;
            const emblemNumbers = emblems ? emblems.split('').map(num => parseInt(num)) : [];
            
            // Update author name element
            const authorNameElement = message.querySelector('#author-name');
            if (authorNameElement) {
                updateAuthorElementBadges(authorNameElement, emblemNumbers, extractedUsername);
            }
            
            // Update name span element
            const nameSpan = message.querySelector('yt-live-chat-author-chip span[dir="auto"]');
            if (nameSpan) {
                updateNameSpanElementBadges(nameSpan, emblemNumbers, extractedUsername);
            }
        });
    };
    
    const updateAuthorElementBadges = (authorNameElement, emblemNumbers, extractedUsername) => {
        if (emblemNumbers.length > 0 && badgesEnabled) {
            const badgeSize = fontSize;
            authorNameElement.style.fontSize = fontSize + 'px';
            
            const badgesContainer = document.createElement('span');
            badgesContainer.style.cssText = `display: inline-flex; align-items: center; gap: 2px; margin-right: 4px;`;
            
            emblemNumbers.forEach(num => {
                if (num >= 0 && num <= 3 && badgeVisibility[num]) {
                    const badgeImg = document.createElement('img');
                    try {
                        badgeImg.src = browserAPI.runtime.getURL(`badges/${num}.svg`);
                    } catch (error) {
                        if (error.message.includes('Extension context invalidated')) {
                            return;
                        }
                        console.error('Error loading badge:', error);
                    }
                    badgeImg.style.cssText = `width: ${badgeSize}px; height: ${badgeSize}px; vertical-align: middle; transform: translateY(2px);`;
                    badgeImg.onerror = function() {
                        this.style.display = 'none';
                    };
                    badgesContainer.appendChild(badgeImg);
                }
            });
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = extractedUsername + ':';
            nameSpan.style.cssText = `font-size: ${fontSize}px !important;`;
            
            authorNameElement.innerHTML = '';
            if (badgesContainer.children.length > 0) {
                authorNameElement.appendChild(badgesContainer);
            }
            authorNameElement.appendChild(nameSpan);
        } else {
            authorNameElement.textContent = extractedUsername + ':';
            authorNameElement.style.cssText = `font-size: ${fontSize}px !important;`;
        }
    };
    
    const updateNameSpanElementBadges = (nameSpan, emblemNumbers, extractedUsername) => {
        if (emblemNumbers.length > 0 && badgesEnabled) {
            const badgeSize = fontSize;
            nameSpan.style.fontSize = fontSize + 'px';
            
            const badgesContainer = document.createElement('span');
            badgesContainer.style.cssText = `display: inline-flex; align-items: center; gap: 2px; margin-right: 4px;`;
            
            emblemNumbers.forEach(num => {
                if (num >= 0 && num <= 3 && badgeVisibility[num]) {
                    const badgeImg = document.createElement('img');
                    try {
                        badgeImg.src = browserAPI.runtime.getURL(`badges/${num}.svg`);
                    } catch (error) {
                        if (error.message.includes('Extension context invalidated')) {
                            return;
                        }
                        console.error('Error loading badge:', error);
                    }
                    badgeImg.style.cssText = `width: ${badgeSize}px; height: ${badgeSize}px; vertical-align: middle; transform: translateY(2px);`;
                    badgeImg.onerror = function() {
                        this.style.display = 'none';
                    };
                    badgesContainer.appendChild(badgeImg);
                }
            });
            
            const textSpan = document.createElement('span');
            textSpan.textContent = extractedUsername + ':';
            textSpan.style.cssText = `font-size: ${fontSize}px !important;`;
            
            nameSpan.innerHTML = '';
            if (badgesContainer.children.length > 0) {
                nameSpan.appendChild(badgesContainer);
            }
            nameSpan.appendChild(textSpan);
        } else {
            nameSpan.textContent = extractedUsername + ':';
            nameSpan.style.cssText = `font-size: ${fontSize}px !important;`;
        }
    };
    
    const updateTimestampsVisibility = () => {
        const timestampElements = document.querySelectorAll('yt-live-chat-text-message-renderer #timestamp');
        timestampElements.forEach(timestamp => {
            if (timestampsEnabled) {
                timestamp.style.display = '';
            } else {
                timestamp.style.display = 'none';
            }
        });
    };
    
    const loadEmotesFromAPI = async (setId) => {
        try {
            const response = await fetch(`https://7tv.io/v3/emote-sets/${setId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            emotesData.clear();
            
            if (data.emotes && Array.isArray(data.emotes)) {
                data.emotes.forEach(emote => {
                    if (emote.name && emote.id) {
                        // Almacenar con el nombre exacto (case-sensitive) - usar datos fuera de 'data'
                        emotesData.set(emote.name, {
                            id: emote.id,
                            name: emote.name,
                            animated: emote.data?.animated || false
                        });
                    }
                });
            }
            
            // Reprocesar automáticamente todos los mensajes cuando se cargan nuevos emotes
            if (emotesEnabled) {
                reprocessAllMessagesForEmotes();
            }
            
            return { 
                success: true, 
                count: emotesData.size,
                message: `Cargados ${emotesData.size} emotes correctamente`
            };
        } catch (error) {
            console.error('Error loading emotes:', error);
            return { 
                success: false, 
                error: `Error cargando emotes: ${error.message}`,
                count: 0
            };
        }
    };
    
    const reprocessAllMessagesForEmotes = () => {
        // Reprocesar solo la parte de emotes de los mensajes ya procesados
        document.querySelectorAll('yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:not([data-tsuki-event])').forEach(message => {
            const messageElement = message.querySelector('#message');
            if (!messageElement || !messageElement.dataset.originalText) return;
            
            // Obtener el mensaje limpio original
            const originalText = messageElement.dataset.originalText;
            const match = originalText.match(/^([0-3]*)?#([A-Fa-f0-9]{6})\[([^\]]+)\](.*)$/);
            if (!match) return;
            
            const cleanMessage = match[4];
            
            // Procesar emotes en el mensaje limpio
            if (emotesEnabled && emotesData.size > 0) {
                const processedMessage = processEmotesInText(cleanMessage.trim());
                if (processedMessage !== cleanMessage.trim()) {
                    messageElement.innerHTML = processedMessage;
                } else {
                    messageElement.textContent = cleanMessage.trim();
                }
            } else {
                // Si emotes están desactivados, mostrar solo texto
                messageElement.textContent = cleanMessage.trim();
            }
        });
        
        // También reprocesar eventos
        document.querySelectorAll('yt-live-chat-text-message-renderer[data-tsuki-event="true"]').forEach(message => {
            const messageElement = message.querySelector('#message');
            if (!messageElement) return;
            
            const eventContainer = messageElement.querySelector('.tsuki-event-container');
            if (!eventContainer) return;
            
            const dataElement = eventContainer.querySelector('.tsuki-event-data');
            if (!dataElement || !dataElement.dataset.originalEventText) return;
            
            const originalEventText = dataElement.dataset.originalEventText;
            
            // Procesar emotes en el texto del evento
            if (emotesEnabled && emotesData.size > 0) {
                const processedEventText = processEmotesInText(originalEventText);
                if (processedEventText !== originalEventText) {
                    dataElement.innerHTML = processedEventText;
                } else {
                    dataElement.textContent = originalEventText;
                }
            } else {
                dataElement.textContent = originalEventText;
            }
        });
    };
    
    const processEmotesInText = (text) => {
        if (!emotesEnabled || emotesData.size === 0) {
            return text;
        }
        
        const words = text.split(/(\s+)/);
        const processedWords = words.map(word => {
            const trimmedWord = word.trim();
            // Buscar emote con nombre exacto (case-sensitive)
            if (trimmedWord && emotesData.has(trimmedWord)) {
                const emoteData = emotesData.get(trimmedWord);
                const emoteUrl = `https://cdn.7tv.app/emote/${emoteData.id}/1x.avif`;
                return `<img src="${emoteUrl}" alt="${emoteData.name}" title="${emoteData.name}" style="height: ${fontSize + 4}px; vertical-align: middle; margin: 0 1px;" onerror="this.style.display='none';">`;
            }
            return word;
        });
        
        return processedWords.join('');
    };
    
    const processMessage = message => {
        if (message.dataset.tsukiProcessed) return;
        
        const messageElement = message.querySelector('#message');
        if (!messageElement) return;
        
        const messageText = messageElement.textContent.trim();
        
        const eventMatch = messageText.match(/^(\w+)_\[([^\]]+)\]\[(.+)\]$/);
        if (eventMatch) {
            const [, eventType, username, eventData] = eventMatch;
            
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
            
            const eventContainer = document.createElement('div');
            eventContainer.className = 'tsuki-event-container';
            
            const usernameElement = document.createElement('div');
            usernameElement.className = 'tsuki-event-username';
            usernameElement.textContent = username + ':';
            
            const dataElement = document.createElement('div');
            dataElement.className = 'tsuki-event-data';
            
            // Guardar el texto original del evento para reprocesamiento dinámico
            dataElement.dataset.originalEventText = eventText;
            
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
            
            if (emotesEnabled && emotesData.size > 0) {
                const processedEventText = processEmotesInText(eventText);
                if (processedEventText !== eventText) {
                    if (multiplier) {
                        dataElement.innerHTML = processedEventText + ' ';
                        dataElement.appendChild(multiplierElement);
                        if (additionalText) {
                            dataElement.appendChild(document.createTextNode(' ' + additionalText));
                        }
                        multiplierElement.textContent = multiplier;
                    } else {
                        const processedEventData = processEmotesInText(eventData);
                        if (processedEventData !== eventData) {
                            dataElement.innerHTML = processedEventData;
                        }
                    }
                }
            }
            
            eventContainer.appendChild(usernameElement);
            eventContainer.appendChild(dataElement);
            
            messageElement.innerHTML = '';
            messageElement.appendChild(eventContainer);
            
            const iconUrl = browserAPI.runtime.getURL(`events/${eventType}.svg`);
            const iconElement = document.createElement('div');
            iconElement.className = 'tsuki-event-icon';
            
            const img = document.createElement('img');
            try {
                img.src = iconUrl;
            } catch (error) {
                if (error.message.includes('Extension context invalidated')) {
                    return;
                }
                console.error('Error loading icon:', error);
            }
            img.onerror = function() {
                iconElement.style.display = 'none';
                const timestampElement = message.querySelector('#timestamp');
                if (timestampElement) {
                    timestampElement.style.display = 'block';
                }
            };
            img.onload = function() {
                const timestampElement = message.querySelector('#timestamp');
                if (timestampElement) {
                    timestampElement.style.display = 'none';
                }
            };
            
            iconElement.appendChild(img);

            const contentElement = message.querySelector('#content');
            if (contentElement) {
                contentElement.insertBefore(iconElement, messageElement);
            }
            
            const authorNameElement = message.querySelector('#author-name');
            if (authorNameElement) authorNameElement.style.display = 'none';
            
            const authorChip = message.querySelector('yt-live-chat-author-chip');
            if (authorChip) authorChip.style.display = 'none';
            
            const authorPhoto = message.querySelector('#author-photo');
            if (authorPhoto) authorPhoto.style.display = 'none';
            
            return;
        }
        
        const match = messageText.match(/^([0-3]*)?#([A-Fa-f0-9]{6})\[([^\]]+)\](.*)$/);
        
        if (!match) return;
        
        const [, emblems, colorHex, extractedUsername, cleanMessage] = match;
        const originalColor = '#' + colorHex;
        const emblemNumbers = emblems ? emblems.split('').map(num => parseInt(num)) : [];
        
        message.dataset.tsukiProcessed = 'true';
        message.dataset.originalColor = originalColor;
        messageElement.dataset.originalText = messageText;
        
        applyColorToMessage(message, originalColor);
        
        const authorNameElement = message.querySelector('#author-name');
        if (authorNameElement) {
            let authorText = extractedUsername + ':';
            
            if (emblemNumbers.length > 0 && badgesEnabled) {
                const badgeSize = fontSize;
                authorNameElement.style.fontSize = fontSize + 'px';
                
                const badgesContainer = document.createElement('span');
                badgesContainer.style.cssText = `display: inline-flex; align-items: center; gap: 2px; margin-right: 4px;`;
                
                emblemNumbers.forEach(num => {
                    if (num >= 0 && num <= 3 && badgeVisibility[num]) {
                        const badgeImg = document.createElement('img');
                        try {
                            badgeImg.src = browserAPI.runtime.getURL(`badges/${num}.svg`);
                        } catch (error) {
                            if (error.message.includes('Extension context invalidated')) {
                                return;
                            }
                            console.error('Error loading badge:', error);
                        }
                        badgeImg.style.cssText = `width: ${badgeSize}px; height: ${badgeSize}px; vertical-align: middle; transform: translateY(2px);`;
                        badgeImg.onerror = function() {
                            this.style.display = 'none';
                        };
                        badgesContainer.appendChild(badgeImg);
                    }
                });
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = extractedUsername + ':';
                nameSpan.style.cssText = `font-size: ${fontSize}px !important;`;
                
                authorNameElement.innerHTML = '';
                if (badgesContainer.children.length > 0) {
                    authorNameElement.appendChild(badgesContainer);
                }
                authorNameElement.appendChild(nameSpan);
            } else {
                authorNameElement.textContent = authorText;
                authorNameElement.style.cssText = `font-size: ${fontSize}px !important;`;
            }
        }
        
        const nameSpan = message.querySelector('yt-live-chat-author-chip span[dir="auto"]');
        if (nameSpan) {
            let nameText = extractedUsername + ':';
            
            if (emblemNumbers.length > 0 && badgesEnabled) {
                const badgeSize = fontSize;
                nameSpan.style.fontSize = fontSize + 'px';
                
                const badgesContainer = document.createElement('span');
                badgesContainer.style.cssText = `display: inline-flex; align-items: center; gap: 2px; margin-right: 4px;`;
                
                emblemNumbers.forEach(num => {
                    if (num >= 0 && num <= 3 && badgeVisibility[num]) {
                        const badgeImg = document.createElement('img');
                        try {
                            badgeImg.src = browserAPI.runtime.getURL(`badges/${num}.svg`);
                        } catch (error) {
                            if (error.message.includes('Extension context invalidated')) {
                                return;
                            }
                            console.error('Error loading badge:', error);
                        }
                        badgeImg.style.cssText = `width: ${badgeSize}px; height: ${badgeSize}px; vertical-align: middle; transform: translateY(2px);`;
                        badgeImg.onerror = function() {
                            this.style.display = 'none';
                        };
                        badgesContainer.appendChild(badgeImg);
                    }
                });
                
                const textSpan = document.createElement('span');
                textSpan.textContent = extractedUsername + ':';
                textSpan.style.cssText = `font-size: ${fontSize}px !important;`;
                
                nameSpan.innerHTML = '';
                if (badgesContainer.children.length > 0) {
                    nameSpan.appendChild(badgesContainer);
                }
                nameSpan.appendChild(textSpan);
            } else {
                nameSpan.textContent = nameText;
                nameSpan.style.cssText = `font-size: ${fontSize}px !important;`;
            }
        }
        
        messageElement.textContent = cleanMessage.trim();
        
        if (emotesEnabled && emotesData.size > 0) {
            const processedMessage = processEmotesInText(cleanMessage.trim());
            if (processedMessage !== cleanMessage.trim()) {
                messageElement.innerHTML = processedMessage;
            }
        }
        
        const authorPhoto = message.querySelector('#author-photo');
        if (authorPhoto) authorPhoto.style.display = 'none';
    };
    
    const processAllMessages = () => {
        document.querySelectorAll('yt-live-chat-text-message-renderer:not([data-tsuki-processed])').forEach(processMessage);
    };
    
    processAllMessages();
    
    setTimeout(() => {
        processAllMessages();
        updateTimestampsVisibility();
        if (colorAdjustEnabled) {
            reapplyColorAdjustment();
        }
    }, 500);
    setTimeout(() => {
        processAllMessages();
        updateTimestampsVisibility();
    }, 2000);
    
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                            processMessage(node);
                            const timestamp = node.querySelector('#timestamp');
                            if (timestamp) {
                                timestamp.style.display = timestampsEnabled ? '' : 'none';
                            }
                        } else if (node.querySelector) {
                            node.querySelectorAll('yt-live-chat-text-message-renderer:not([data-tsuki-processed])').forEach(msg => {
                                processMessage(msg);
                                const timestamp = msg.querySelector('#timestamp');
                                if (timestamp) {
                                    timestamp.style.display = timestampsEnabled ? '' : 'none';
                                }
                            });
                        }
                    }
                }
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
})();
