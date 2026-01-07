// Background service worker for Quick Form Filler

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Initialize storage with empty projects array
        chrome.storage.local.set({ projects: [] });
        console.log('Quick Form Filler installed successfully');
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Forward elementMarked message to popup if it's open
    if (message.action === 'elementMarked') {
        // Just forward the message
        sendResponse({ received: true });
    }
    return true;
});
