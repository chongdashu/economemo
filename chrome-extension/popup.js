document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const toggleButton = document.getElementById('toggleReadStatus');

    // Get the current tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Regex pattern to match Economist article URLs
    const articleUrlPattern = /^https:\/\/www\.economist\.com\/[a-z-]+\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

    // Check if the current tab URL is an Economist article
    if (!articleUrlPattern.test(tab.url)) {
        statusDiv.textContent = 'No article detected';
        return;
    }

    // Fetch the read status of the article
    const articleUrl = tab.url;
    try {
        const response = await fetch(`https://127.0.0.1:8000/articles?url=${encodeURIComponent(articleUrl)}`);
        const data = await response.json();

        if (data.length > 0 && data[0].read) {
            const readDate = new Date(data[0].date_read).toLocaleDateString();
            statusDiv.textContent = `Read on ${readDate}`;
            toggleButton.textContent = 'Mark as Unread';
        } else {
            statusDiv.textContent = 'Article not read';
            toggleButton.textContent = 'Mark as Read';
        }
        toggleButton.style.display = 'block';

        toggleButton.onclick = async () => {
            const newStatus = data.length === 0 || !data[0].read;
            if (newStatus) {
                await fetch(`https://127.0.0.1:8000/articles`, {
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
                statusDiv.textContent = `Read on ${new Date().toLocaleDateString()}`;
                toggleButton.textContent = 'Mark as Unread';
            } else {
                if (confirm('Do you want to mark this article as unread?')) {
                    await fetch(`https://127.0.0.1:8000/articles`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            url: articleUrl,
                            read: false
                        })
                    });
                    statusDiv.textContent = 'Article not read';
                    toggleButton.textContent = 'Mark as Read';
                }
            }
        };

    } catch (error) {
        console.error('Error fetching article status:', error);
        statusDiv.textContent = 'Error fetching article status';
    }
});
