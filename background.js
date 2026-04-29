// background.js - Configures cookie access for Twitch embed when extension is installed/updated

function allowTwitchCookies() {
    if (!chrome.contentSettings || !chrome.contentSettings.cookies) return;

    // Allow twitch.tv to use cookies when embedded in youtube.com
    chrome.contentSettings.cookies.set({
        primaryPattern: 'https://www.twitch.tv/*',
        secondaryPattern: 'https://www.youtube.com/*',
        setting: 'allow'
    }, function () {
        if (chrome.runtime.lastError) {
            console.warn('TsukiChat: Could not set cookie setting for Twitch:', chrome.runtime.lastError.message);
        }
    });

    // Also allow twitch.tv in general (for storage access)
    chrome.contentSettings.cookies.set({
        primaryPattern: 'https://www.twitch.tv/*',
        secondaryPattern: '<all_urls>',
        setting: 'allow'
    }, function () {
        if (chrome.runtime.lastError) {
            console.warn('TsukiChat: Could not set general cookie setting for Twitch:', chrome.runtime.lastError.message);
        }
    });
}

chrome.runtime.onInstalled.addListener(allowTwitchCookies);
chrome.runtime.onStartup.addListener(allowTwitchCookies);
