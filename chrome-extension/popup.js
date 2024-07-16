document.addEventListener('DOMContentLoaded', async () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('userId', userId);
        await fetch('https://127.0.0.1:8000/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uuid: userId })
        });
    }

    const statusElement = document.getElementById('status');
    const button = document.getElementById('mark-as-read-button');

    const checkReadStatus = async (articleUrl) => {
        const response = await fetch(`https://127.0.0.1:8000/articles/by-url?url=${encodeURIComponent(articleUrl)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Id': userId
            }
        });
        if (!response.ok) {
            console.error('Article not found');
            return null;
        }
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    };

    const updateReadStatus = async (articleUrl, status) => {
        const response = await fetch('https://127.0.0.1:8000/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Id': userId
            },
            body: JSON.stringify({
                url: articleUrl,
                read: status,
                date_read: status ? new Date().toISOString() : null
            })
        });
        return response.json();
    };

    const setButtonState = async (articleUrl) => {
        const readStatus = await checkReadStatus(articleUrl);
        if (readStatus && readStatus.read) {
            statusElement.textContent = `Read on ${new Date(readStatus.date_read).toLocaleDateString()}`;
            button.textContent = 'Mark as Unread';
            button.onclick = () => {
                if (confirm('Do you want to mark this article as unread?')) {
                    updateReadStatus(articleUrl, false).then(() => {
                        setButtonState(articleUrl);
                    });
                }
            };
        } else {
            statusElement.textContent = 'Unread';
            button.textContent = 'Mark as Read';
            button.onclick = () => {
                updateReadStatus(articleUrl, true).then(() => {
                    setButtonState(articleUrl);
                });
            };
        }
    };

    // Check if the current tab URL is an Economist article
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const articleUrl = activeTab.url;
        const articleUrlPattern = /^https:\/\/www\.economist\.com\/[a-z-]+\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

        if (articleUrlPattern.test(articleUrl)) {
            setButtonState(articleUrl);
        } else {
            statusElement.textContent = 'No article detected';
        }
    });
});
