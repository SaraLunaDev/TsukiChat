(function() {
    'use strict';
    const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
    if (!(window.location.href.includes('live_chat') || window !== window.top || document.querySelector('yt-live-chat-app'))) return;
    let backgroundEnabled = true;
    let colorAdjustEnabled = false;
    let fontSize = 14;
    let darkModeEnabled = true;
    let dividerEnabled = false;
    
    browserAPI.storage.sync.get(['backgroundEnabled', 'colorAdjustEnabled', 'fontSize', 'darkModeEnabled', 'dividerEnabled'], (result) => {
        backgroundEnabled = result.backgroundEnabled !== false;
        colorAdjustEnabled = result.colorAdjustEnabled === true;
        fontSize = result.fontSize || 14;
        darkModeEnabled = result.darkModeEnabled !== false;
        dividerEnabled = result.dividerEnabled === true;
        updateBackgroundStyles();
        updateFontSize();
        updateChatTheme();
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
        }
        return true;
    });
    
    const adjustColor = (hexColor) => {
        if (!colorAdjustEnabled) return hexColor;
        
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        if (darkModeEnabled) {
            if (luminance < 0.25) {
                const factor = 1.5;
                const newR = Math.min(255, Math.round(r * factor));
                const newG = Math.min(255, Math.round(g * factor));
                const newB = Math.min(255, Math.round(b * factor));
                
                const toHex = (val) => val.toString(16).padStart(2, '0');
                return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
            }
            return hexColor;
        } else {
            if (luminance > 0.8) {
                const factor = 0.4 / Math.max(luminance, 0.1);
                const newR = Math.round(r * factor);
                const newG = Math.round(g * factor);
                const newB = Math.round(b * factor);
                
                const toHex = (val) => val.toString(16).padStart(2, '0');
                return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
            } else if (luminance > 0.6) {
                const newR = Math.round(r * 0.85);
                const newG = Math.round(g * 0.85);
                const newB = Math.round(b * 0.85);
                
                const toHex = (val) => val.toString(16).padStart(2, '0');
                return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
            }
            return hexColor;
        }
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
            
            messageElement.innerHTML = '';
            messageElement.appendChild(eventContainer);
            
            const iconUrl = browserAPI.runtime.getURL(`events/${eventType}.svg`);
            const iconElement = document.createElement('div');
            iconElement.className = 'tsuki-event-icon';
            
            const img = document.createElement('img');
            img.src = iconUrl;
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
        
        const match = messageText.match(/^#([A-Fa-f0-9]{6})\[([^\]]+)\](.*)$/);
        
        if (!match) return;
        
        const [, colorHex, extractedUsername, cleanMessage] = match;
        const originalColor = '#' + colorHex;
        
        message.dataset.tsukiProcessed = 'true';
        message.dataset.originalColor = originalColor;
        
        applyColorToMessage(message, originalColor);
        
        const authorNameElement = message.querySelector('#author-name');
        if (authorNameElement) {
            authorNameElement.textContent = extractedUsername + ':';
        }
        
        const nameSpan = message.querySelector('yt-live-chat-author-chip span[dir="auto"]');
        if (nameSpan) {
            nameSpan.textContent = extractedUsername + ':';
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