import { isWhitelistedArticlePage } from './constants.js';

document.addEventListener("DOMContentLoaded", () => {
  const statusElement = document.getElementById("status");
  const emailForm = document.getElementById("email-form");
  const emailInput = document.getElementById("email-input");
  const registerButton = document.getElementById("register-button");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const articleStatusElement = document.getElementById("article-status");
  const actionButton = document.getElementById("action-button");
  const errorMessageElement = document.getElementById("error-message");

  function setLoggedInState(userEmail) {
    statusElement.textContent = `Logged in as ${userEmail}`;
    emailForm.style.display = "none";
    logoutButton.style.display = "block";
  }

  function setLoggedOutState() {
    statusElement.textContent =
      "Not logged in. Create an account or log in to sync your read articles across devices.";
    emailForm.style.display = "block";
    logoutButton.style.display = "none";
    articleStatusElement.textContent = "";
    actionButton.style.display = "none";
  }

  // Function to update login status
  function updateLoginStatus(userId, userEmail) {
    chrome.storage.local.set({ userId, userEmail }, () => {
      console.log("Credentials stored in chrome.storage.local");

      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "loginStatusChanged" });
        }
      });

      // Update popup UI
      setLoggedInState(userEmail);
      // Check article status after login
      getCurrentTabUrl();
    });
  }

  // Get current tab URL and check article status
  function getCurrentTabUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const articleUrl = activeTab.url;

      if (isWhitelistedArticlePage(articleUrl)) {
        checkReadStatus(articleUrl);
      } else {
        articleStatusElement.textContent = "No supported article detected";
        actionButton.style.display = "none";
      }
    });
  }

  // Check article read status
  async function checkReadStatus(articleUrl) {
    chrome.storage.local.get(["userId"], async (result) => {
      const userId = result.userId;
      if (!userId) {
        articleStatusElement.textContent = "Log in to track article status";
        actionButton.style.display = "none";
        return;
      }

      try {
        const response = await fetch(
          `${config.apiUrl}/articles/by-url?url=${encodeURIComponent(
            articleUrl
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "User-Id": userId,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0 && data[0].date_read) {
            articleStatusElement.textContent = `Read on ${new Date(
              data[0].date_read
            ).toLocaleDateString()}`;
            actionButton.textContent = "Mark as Unread";
            actionButton.onclick = () => {
              if (confirm("Do you want to mark this article as unread?")) {
                updateReadStatus(data[0].id, null, articleUrl);
              }
            };
          } else {
            articleStatusElement.textContent = "Unread";
            actionButton.textContent = "Mark as Read";
            actionButton.onclick = () => {
              createOrUpdateReadStatus(articleUrl, new Date().toISOString());
            };
          }
          actionButton.style.display = "block";
        } else {
          articleStatusElement.textContent = "Error checking article status";
          actionButton.style.display = "none";
        }
      } catch (error) {
        console.error("Error checking article status:", error);
        articleStatusElement.textContent = "Error checking article status";
        actionButton.style.display = "none";
      }
    });
  }

  // Create or update read status
  async function createOrUpdateReadStatus(articleUrl, dateRead) {
    chrome.storage.local.get(["userId"], async (result) => {
      const userId = result.userId;
      if (!userId) return;

      try {
        const response = await fetch(`${config.apiUrl}/articles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Id": userId,
          },
          body: JSON.stringify({
            url: articleUrl,
            date_read: dateRead,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          checkReadStatus(articleUrl);
          // Notify content script to update button
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "updateReadStatus",
                  status: !!dateRead,
                  date: dateRead,
                  articleId: data.id,
                });
              }
            }
          );
        } else {
          const errorText = await response.text();
          errorMessageElement.textContent = `Error: ${errorText}`;
          errorMessageElement.style.color = "red";
          console.error("Failed to update read status:", errorText);
        }
      } catch (error) {
        console.error("Error creating/updating read status:", error);
        errorMessageElement.textContent = `Error: ${error.message}`;
        errorMessageElement.style.color = "red";
      }
    });
  }

  // Update read status
  async function updateReadStatus(articleId, dateRead, articleUrl) {
    chrome.storage.local.get(["userId"], async (result) => {
      const userId = result.userId;
      if (!userId) return;

      try {
        const response = await fetch(
          `${config.apiUrl}/articles/${articleId}/read`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "User-Id": userId,
            },
            body: JSON.stringify({
              date_read: dateRead,
            }),
          }
        );

        if (response.ok) {
          checkReadStatus(articleUrl);
          // Notify content script to update button
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "updateReadStatus",
                  status: !!dateRead,
                  date: dateRead,
                  articleId: articleId,
                });
              }
            }
          );
        } else {
          const errorText = await response.text();
          errorMessageElement.textContent = `Error: ${errorText}`;
          errorMessageElement.style.color = "red";
          console.error("Failed to update read status:", errorText);
        }
      } catch (error) {
        console.error("Error updating read status:", error);
        errorMessageElement.textContent = `Error: ${error.message}`;
        errorMessageElement.style.color = "red";
      }
    });
  }

  // Handle register
  registerButton.onclick = async (e) => {
    e.preventDefault();
    errorMessageElement.textContent = ""; // Clear any previous error messages
    const email = emailInput.value;

    try {
      const response = await fetch(`${config.apiUrl}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      updateLoginStatus(data.id, data.email);
    } catch (error) {
      errorMessageElement.textContent = `Error: ${error.message}`;
      errorMessageElement.style.color = "red";
    }
  };

  // Handle login
  loginButton.onclick = async (e) => {
    e.preventDefault();
    errorMessageElement.textContent = ""; // Clear any previous error messages
    const email = emailInput.value;

    try {
      const response = await fetch(`${config.apiUrl}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      updateLoginStatus(data.id, data.email);
    } catch (error) {
      errorMessageElement.textContent = `Error: ${error.message}`;
      errorMessageElement.style.color = "red";
    }
  };

  // Log out user
  logoutButton.onclick = () => {
    chrome.storage.local.remove(["userId", "userEmail"], () => {
      console.log("Credentials removed from chrome.storage.local");

      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "loginStatusChanged" });
        }
      });

      // Update popup UI
      setLoggedOutState();
    });
  };

  // Check initial login status and article status
  chrome.storage.local.get(["userId", "userEmail"], (result) => {
    if (result.userId && result.userEmail) {
      setLoggedInState(result.userEmail);
      getCurrentTabUrl();
    } else {
      setLoggedOutState();
    }
  });
});
