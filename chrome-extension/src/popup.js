import api from "./api.js";
import { getAuthHeaders } from "./auth.js";
import { isWhitelistedArticlePage } from "./constants.js";

document.addEventListener("DOMContentLoaded", async () => {
  const statusElement = document.getElementById("status");
  const emailForm = document.getElementById("email-form");
  const emailInput = document.getElementById("email-input");
  const registerButton = document.getElementById("register-button");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const articleStatusElement = document.getElementById("article-status");
  const actionButton = document.getElementById("action-button");
  const errorMessageElement = document.getElementById("error-message");

  // ---------------------------------------------------------------------------------
  // User Login/Logout Status
  // ---------------------------------------------------------------------------------

  function setLoggedInState(userEmail) {
    statusElement.textContent = `Logged in as ${userEmail}`;
    emailForm.style.display = "none";
    logoutButton.style.display = "block";
    // Show streak
    const streakDisplayElement = document.getElementById("streak-display");
    const streakCirclesElement = document.getElementById("streak-circles");
    if (streakDisplayElement) streakDisplayElement.style.display = "block";
    if (streakCirclesElement) streakCirclesElement.style.display = "flex";
  }

  function setLoggedOutState() {
    statusElement.textContent =
      "Not logged in. Create an account or log in to sync your read articles across devices.";
    emailForm.style.display = "block";
    logoutButton.style.display = "none";
    articleStatusElement.textContent = "";
    actionButton.style.display = "none";
    // Hide streak
    const streakDisplayElement = document.getElementById("streak-display");
    const streakCirclesElement = document.getElementById("streak-circles");
    if (streakDisplayElement) streakDisplayElement.style.display = "none";
    if (streakCirclesElement) streakCirclesElement.style.display = "none";
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
      checkCurrentTabArticleStatus();
      // Update streak display after login
      updateStreakDisplay();
    });
  }

  // ---------------------------------------------------------------------------------
  // Article URL and Read Status
  // ---------------------------------------------------------------------------------

  // Get current tab URL and check article status
  function checkCurrentTabArticleStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const activeUrl = activeTab.url;

      if (isWhitelistedArticlePage(activeUrl)) {
        // checkReadStatus(activeUrl);
        postArticleAccess(activeUrl);
      } else {
        articleStatusElement.textContent = "No supported article detected";
        actionButton.style.display = "none";
      }
    });
  }

  // Post article access
  async function postArticleAccess(articleUrl) {
    try {
      const article = await api.postArticleAccessed(articleUrl);
      if (article.date_read) {
        articleStatusElement.textContent = `Read on ${new Date(
          article.date_read
        ).toLocaleDateString()}`;
        actionButton.textContent = "Mark as Unread";
        actionButton.onclick = () => {
          if (confirm("Do you want to mark this article as unread?")) {
            updateReadStatus(article.id, false);
          }
        };
      } else {
        articleStatusElement.textContent = "Unread";
        actionButton.textContent = "Mark as Read";
        actionButton.onclick = () => {
          updateReadStatus(article.id, true);
        };
      }
      actionButton.style.display = "block";
    } catch (error) {
      console.error("Error accessing article: ", error);
      articleStatusElement.textContent = "Error accessing article";
      actionButton.style.display = "none";
      errorMessageElement.textContent = `Error: ${error.message}`;
      errorMessageElement.style.color = "red";
    }
  }

  /**
   * Updates the read status of an article.
   * @param {number} articleId - The ID of the article to update.
   * @param {boolean} isRead - The new read status of the article.
   * @returns {Promise<void>} - A promise that resolves when the status has been updated.
   */
  async function updateReadStatus(articleId, isRead) {
    try {
      console.log("Updating read status...");
      const response = await api.updateArticleReadStatus(articleId, isRead);
      checkCurrentTabArticleStatus();
      console.log("response=%o", response);

      // Notify content script to update button
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "updateReadStatus",
            status: !!response.date_read,
            date: response.date_read,
            articleId: response.id,
          });
        }
      });
      updateStreakDisplay();
    } catch (error) {
      console.error("Error updating read status:", error);
      errorMessageElement.textContent = `Error: ${error.message}`;
      errorMessageElement.style.color = "red";
    }
  }

  // ---------------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------------

  // Handle register
  registerButton.onclick = async (e) => {
    e.preventDefault();
    errorMessageElement.textContent = ""; // Clear any previous error messages
    const email = emailInput.value;

    try {
      const data = await api.registerUser({ email });
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

  // ---------------------------------------------------------------------------------
  // Streaks
  // ---------------------------------------------------------------------------------
  async function updateStreakDisplay() {
    try {
      const response = await fetch(`${config.apiUrl}/streak`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch streak data");
      }

      const data = await response.json();
      console.log("Streak data:", data);
      const { current_streak, streaks } = data;

      const streakDisplayElement = document.getElementById("streak-display");
      const streakCirclesElement = document.getElementById("streak-circles");

      // Update current streak
      streakDisplayElement.textContent = `${current_streak} day${
        current_streak !== 1 ? "s" : ""
      }`;

      // Clear existing streak display
      streakCirclesElement.innerHTML = "";

      // Create streak circles
      streaks.forEach((streak) => {
        const streakDay = document.createElement("div");
        streakDay.className = "streak-day";

        const circle = document.createElement("div");
        circle.className = "streak-circle";
        circle.style.backgroundColor =
          streak.read_count > 0 ? "#10B981" : "#D1D5DB"; // green-500 or gray-300
        circle.title = `${streak.date}: ${streak.read_count} article${
          streak.read_count !== 1 ? "s" : ""
        } read`;

        const dayLabel = document.createElement("div");
        dayLabel.className = "day-label";
        dayLabel.textContent = streak.day;

        streakDay.appendChild(circle);
        streakDay.appendChild(dayLabel);
        streakCirclesElement.appendChild(streakDay);
      });
    } catch (error) {
      console.error("Error updating streak display:", error);
      const streakDisplayElement = document.getElementById("streak-display");
      streakDisplayElement.textContent = "Unable to load streak data";
    }
  }

  // ---------------------------------------------------------------------------------
  // Entry Point
  // ---------------------------------------------------------------------------------

  /**
   * On popup load, check if user is logged in and get current tab
   */
  const headers = await getAuthHeaders();
  if (headers["User-Id"] && headers["User-Email"]) {
    setLoggedInState(headers["User-Email"]);
    checkCurrentTabArticleStatus();
    updateStreakDisplay();
  } else {
    setLoggedOutState();
  }
});
