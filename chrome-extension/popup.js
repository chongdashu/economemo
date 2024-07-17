document.addEventListener('DOMContentLoaded', () => {
    let userId = localStorage.getItem('userId');
    let userEmail = localStorage.getItem('userEmail');
    const statusElement = document.getElementById('status');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const articleStatusElement = document.getElementById('article-status');
    const actionButton = document.getElementById('action-button');
    const logoutButton = document.getElementById('logout-button');

    // Check login status
    if (userEmail) {
        statusElement.textContent = `Logged in as ${userEmail}`;
        registerForm.style.display = 'none';
        loginForm.style.display = 'none';
        logoutButton.style.display = 'block';
    } else {
        statusElement.textContent = "Not logged in. Create an account or log in to sync your read articles across devices.";
        registerForm.style.display = 'block';
        loginForm.style.display = 'block';
        logoutButton.style.display = 'none';
    }

    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const articleUrl = activeTab.url;
        const articleUrlPattern = /^https:\/\/www\.economist\.com\/[a-z-]+\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

        if (articleUrlPattern.test(articleUrl)) {
            checkReadStatus(articleUrl);
        } else {
            articleStatusElement.textContent = "No article detected";
        }
    });

    // Check article read status
    async function checkReadStatus(articleUrl) {
        const response = await fetch(`https://127.0.0.1:8000/articles/by-url?url=${encodeURIComponent(articleUrl)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Id': userId || ''
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length > 0 && data[0].read) {
                articleStatusElement.textContent = `Read on ${new Date(data[0].date_read).toLocaleDateString()}`;
                actionButton.textContent = 'Mark as Unread';
                actionButton.onclick = () => {
                    if (confirm('Do you want to mark this article as unread?')) {
                        updateReadStatus(articleUrl, false);
                    }
                };
            } else {
                articleStatusElement.textContent = 'Unread';
                actionButton.textContent = 'Mark as Read';
                actionButton.onclick = () => {
                    updateReadStatus(articleUrl, true);
                };
            }
        } else {
            articleStatusElement.textContent = 'Unread';
            actionButton.textContent = 'Mark as Read';
            actionButton.onclick = () => {
                updateReadStatus(articleUrl, true);
            };
        }
        actionButton.style.display = 'block';
    }

    // Update read status
    async function updateReadStatus(articleUrl, status) {
        const response = await fetch('https://127.0.0.1:8000/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Id': userId || ''
            },
            body: JSON.stringify({
                url: articleUrl,
                read: status,
                date_read: status ? new Date().toISOString() : null
            })
        });

        if (response.ok) {
            checkReadStatus(articleUrl);
        } else {
            console.error('Failed to update read status');
        }
    }

    // Register a new user
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const response = await fetch('https://127.0.0.1:8000/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            const data = await response.json();
            userId = data.id;
            userEmail = data.email;
            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', userEmail);
            statusElement.textContent = `Logged in as ${userEmail}`;
            registerForm.style.display = 'none';
            loginForm.style.display = 'none';
            logoutButton.style.display = 'block';
            checkReadStatus(window.location.href); // Refresh the read status after logging in
        } else {
            console.error('Failed to register');
        }
    };

    // Log in an existing user
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const response = await fetch('https://127.0.0.1:8000/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            const data = await response.json();
            userId = data.id;
            userEmail = data.email;
            localStorage.setItem('userId', userId);
            localStorage.setItem('userEmail', userEmail);
            statusElement.textContent = `Logged in as ${userEmail}`;
            registerForm.style.display = 'none';
            loginForm.style.display = 'none';
            logoutButton.style.display = 'block';
            checkReadStatus(window.location.href); // Refresh the read status after logging in
        } else {
            console.error('Failed to log in');
        }
    };

    // Log out user
    logoutButton.onclick = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        statusElement.textContent = "Not logged in. Create an account or log in to sync your read articles across devices.";
        registerForm.style.display = 'block';
        loginForm.style.display = 'block';
        logoutButton.style.display = 'none';
        userId = null;
        userEmail = null;
        checkReadStatus(window.location.href); // Refresh the read status after logging out
    };
});
