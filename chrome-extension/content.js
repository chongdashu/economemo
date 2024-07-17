// Function to check the article's read status
async function checkReadStatus(articleUrl, userId) {
    const response = await fetch(`https://127.0.0.1:8000/articles/by-url?url=${encodeURIComponent(articleUrl)}`, {
        headers: {
            'User-Id': userId
        }
    });
    if (!response.ok) {
        console.error('Article not found');
        return null;
    }
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Function to create a new article
async function createArticle(articleUrl, userId) {
    const response = await fetch('https://127.0.0.1:8000/articles/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Id': userId
        },
        body: JSON.stringify({
            url: articleUrl,
            read: true,
            date_read: new Date().toISOString()
        })
    });
    return response.json();
}

// Function to update the article's read status
async function updateArticle(articleId, readStatus, userId) {
    const response = await fetch(`https://127.0.0.1:8000/articles/${articleId}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'User-Id': userId
        },
        body: JSON.stringify({
            read: readStatus,
            date_read: readStatus ? new Date().toISOString() : null
        })
    });
    return response.json();
}

// Function to create the button and attach it to the page
function createButton(articleUrl, userId) {
    // Check if the button already exists
    if (document.querySelector('#mark-as-read-button')) {
        return;
    }

    const button = document.createElement('button');
    button.id = 'mark-as-read-button'; // Set an ID to ensure uniqueness
    button.style.marginLeft = '10px';
    button.style.padding = '0 12px';
    button.style.border = '1px solid #ccc';
    button.style.backgroundColor = '#fff';
    button.style.color = '#0056b3';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';
    button.style.fontFamily = 'Economist, sans-serif';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.height = '32px';
    button.style.lineHeight = '32px';
    button.style.borderRadius = '4px';
    button.style.textDecoration = 'none';
    button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    button.style.transition = 'background-color 0.3s ease';
    button.textContent = 'Loading...'; // Initial text

    button.onmouseover = function () {
        button.style.backgroundColor = '#f0f0f0';
    };

    button.onmouseout = function () {
        button.style.backgroundColor = '#fff';
    };

    async function setButtonState() {
        const readStatus = await checkReadStatus(articleUrl, userId);
        if (readStatus && readStatus.read) {
            button.textContent = `Read on ${new Date(readStatus.date_read).toLocaleDateString()}`;
            button.onclick = () => {
                if (confirm('Do you want to mark this article as unread?')) {
                    updateArticle(readStatus.id, false, userId).then(() => {
                        setButtonState();
                    });
                }
            };
        } else if (readStatus && !readStatus.read) {
            button.textContent = 'Mark as Read';
            button.onclick = () => {
                updateArticle(readStatus.id, true, userId).then(() => {
                    setButtonState();
                });
            };
        } else {
            button.textContent = 'Mark as Read';
            button.onclick = () => {
                createArticle(articleUrl, userId).then(() => {
                    setButtonState();
                });
            };
        }
    }

    setButtonState();

    // Find the "Save" button and its parent container
    const saveButton = document.querySelector('button[aria-label="Save"]');
    if (saveButton) {
        const buttonContainer = saveButton.parentNode;
        if (buttonContainer) {
            buttonContainer.appendChild(button);
        } else {
            console.error('Button container not found');
        }
    } else {
        console.error('Save button not found');
    }
}

// Function to observe DOM changes and initialize the button
function observeDOM() {
    const observer = new MutationObserver(async (mutations, observer) => {
        const saveButton = document.querySelector('button[aria-label="Save"]');
        const existingButton = document.querySelector('#mark-as-read-button');
        if (saveButton && !existingButton) {
            const articleUrl = window.location.href;
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = crypto.randomUUID();
                localStorage.setItem('userId', userId);
                fetch('https://127.0.0.1:8000/users/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ uuid: userId })
                });
            }
            createButton(articleUrl, userId);
        }
        // Keep observing until the button is found and added
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Run the main function when the content script is loaded
if (document.readyState !== 'loading') {
    observeDOM();
} else {
    document.addEventListener('DOMContentLoaded', observeDOM);
}
