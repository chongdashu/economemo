// Function to check the article's read status
async function checkReadStatus(articleUrl) {
    const response = await fetch(`http://localhost:8000/articles?url=${encodeURIComponent(articleUrl)}`);
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
}

// Function to update the article's read status
async function updateReadStatus(articleUrl, status) {
    const response = await fetch('http://localhost:8000/articles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: articleUrl,
            read: status,
            date_read: status ? new Date().toISOString() : null
        })
    });
    return response.json();
}

// Function to create the button and attach it to the page
function createButton(articleUrl, readStatus) {
    const button = document.createElement('button');
    button.style.marginLeft = '10px';
    button.style.padding = '5px 10px';
    button.style.border = 'none';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';

    button.textContent = "Loading...";

    function setButtonState() {
        if (readStatus && readStatus.read) {
            button.textContent = `Read on ${new Date(readStatus.date_read).toLocaleDateString()}`;
            button.onclick = () => {
                if (confirm('Do you want to mark this article as unread?')) {
                    updateReadStatus(articleUrl, false).then(() => {
                        readStatus.read = false;
                        setButtonState();
                    });
                }
            };
        } else {
            button.textContent = 'Mark as Read';
            button.onclick = () => {
                updateReadStatus(articleUrl, true).then(() => {
                    readStatus.read = true;
                    readStatus.date_read = new Date().toISOString();
                    setButtonState();
                });
            };
        }
    }

    // setButtonState();

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
        if (saveButton) {
            const articleUrl = window.location.href;
            // const readStatus = await checkReadStatus(articleUrl);
            createButton(articleUrl, {});
            observer.disconnect(); // Stop observing once the button is added
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Run the main function when the content script is loaded
observeDOM();