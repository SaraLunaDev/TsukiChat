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
                yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:nth-child(odd) {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                yt-live-chat-text-message-renderer[data-tsuki-processed="true"]:nth-child(even) {
                    background-color: transparent !important;
                }
            `;
            document.head.appendChild(styleElement);
        } else {
            styleElement = document.createElement('style');
            styleElement.id = 'tsuki-background-styles';
            styleElement.textContent = `
                yt-live-chat-text-message-renderer[data-tsuki-processed="true"] {
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