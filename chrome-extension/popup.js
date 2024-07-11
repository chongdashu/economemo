document.getElementById('markUnread').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const articleUrl = window.location.href;
                fetch('http://localhost:8000/articles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: articleUrl,
                        read: false,
                        date_read: null
                    })
                });
            }
        });
    });
});

document.getElementById('markRead').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const articleUrl = window.location.href;
                fetch('http://localhost:8000/articles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: articleUrl,
                        read: true,
                        date_read: new Date().toISOString()
                    })
                });
            }
        });
    });
});
