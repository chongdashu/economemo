console.log("Content script loaded");

// Function to check the article's read status
async function checkReadStatus(articleUrl, userId) {
  console.log("Checking read status for:", articleUrl);
  const response = await fetch(
    `https://127.0.0.1:8000/articles/by-url?url=${encodeURIComponent(
      articleUrl
    )}`,
    {
      headers: {
        "User-Id": userId,
      },
    }
  );
  if (!response.ok) {
    console.error("Article not found");
    return null;
  }
  const data = await response.json();
  console.log("Read status data:", data);
  return data.length > 0 ? data[0] : null;
}

// Function to create a new article or update existing one
async function createOrUpdateReadStatus(articleUrl, status, userId) {
  console.log("Creating/Updating read status for:", articleUrl);
  const response = await fetch("https://127.0.0.1:8000/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Id": userId,
    },
    body: JSON.stringify({
      url: articleUrl,
      read: status,
      date_read: status ? new Date().toISOString() : null,
    }),
  });
  if (!response.ok) {
    console.error("Failed to create/update article");
    return null;
  }
  return response.json();
}

// Function to update an existing article
async function updateArticle(articleId, readStatus, userId) {
  console.log("Updating article:", articleId);
  const response = await fetch(`https://127.0.0.1:8000/articles/${articleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "User-Id": userId,
    },
    body: JSON.stringify({
      read: readStatus,
      date_read: readStatus ? new Date().toISOString() : null,
    }),
  });
  if (!response.ok) {
    console.error("Failed to update article");
    return null;
  }
  return response.json();
}

function createTooltip() {
  console.log("Creating tooltip");
  const tooltip = document.createElement("div");
  tooltip.id = "login-tooltip";
  tooltip.style.cssText = `
        position: fixed;
        background-color: #f9f9f9;
        color: #333;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        font-size: 14px;
        max-width: 250px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        display: none;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;
  tooltip.innerHTML = `
        To track read articles, please log in:
        <br>1. Click the extension icon in the toolbar
        <br>2. Enter your email and click 'Login' or 'Register'
    `;
  console.log("Tooltip created:", tooltip);
  return tooltip;
}

function toggleTooltip(button, tooltip) {
  console.log("Toggling tooltip");
  const isCurrentlyVisible = tooltip.style.display !== "none";
  tooltip.style.display = isCurrentlyVisible ? "none" : "block";
  console.log("Tooltip visibility set to:", tooltip.style.display);

  if (!isCurrentlyVisible) {
    // Force repaint
    tooltip.offsetHeight;
  }
}

let button;

async function setButtonState() {
  console.log("Setting button state");

  chrome.storage.local.get(["userId", "userEmail"], async (result) => {
    const userId = result.userId;
    const userEmail = result.userEmail;
    const articleUrl = window.location.href;

    if (!userId || !userEmail) {
      console.log("User not logged in");
      button.textContent = "Login to Track";
      button.style.backgroundColor = "#f0f0f0";
      button.style.color = "#333";
      button.style.cursor = "pointer";

      let tooltip = document.getElementById("login-tooltip");
      if (!tooltip) {
        console.log("Creating new tooltip");
        tooltip = createTooltip();
        document.body.appendChild(tooltip);
        console.log("Tooltip appended to body");
      }

      button.onclick = (event) => {
        console.log("Button clicked");
        event.stopPropagation();
        toggleTooltip(button, tooltip);
      };

      // Close tooltip when clicking outside
      document.addEventListener("click", () => {
        console.log("Document clicked, hiding tooltip");
        tooltip.style.display = "none";
      });
    } else {
      console.log("User logged in");
      // Remove tooltip if it exists
      const existingTooltip = document.getElementById("login-tooltip");
      if (existingTooltip) {
        console.log("Removing existing tooltip");
        existingTooltip.remove();
      }

      // Existing logged-in state logic
      const readStatus = await checkReadStatus(articleUrl, userId);
      if (readStatus && readStatus.read) {
        button.textContent = `Read on ${new Date(
          readStatus.date_read
        ).toLocaleDateString()}`;
        button.onclick = () => {
          if (confirm("Do you want to mark this article as unread?")) {
            updateArticle(readStatus.id, false, userId).then(() => {
              setButtonState();
            });
          }
        };
      } else {
        button.textContent = "Mark as Read";
        button.onclick = () => {
          createOrUpdateReadStatus(articleUrl, true, userId).then(() => {
            setButtonState();
          });
        };
      }

      // Reset button styles
      button.style.backgroundColor = "";
      button.style.color = "";
      button.style.cursor = "";
    }
  });
}

// Function to create the button and attach it to the page
function createButton() {
  console.log("Creating button");
  // Check if the button already exists
  if (document.querySelector("#mark-as-read-button")) {
    console.log("Button already exists");
    return;
  }

  button = document.createElement("button");
  button.id = "mark-as-read-button";
  button.style.cssText = `
        margin-left: 10px;
        padding: 0 12px;
        border: 1px solid #ccc;
        background-color: #fff;
        color: #0056b3;
        cursor: pointer;
        font-size: 16px;
        font-family: Economist, sans-serif;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        line-height: 32px;
        border-radius: 4px;
        text-decoration: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: background-color 0.3s ease;
    `;

  // Find the "Save" button and its parent container
  const saveButton = document.querySelector('button[aria-label="Save"]');
  if (saveButton) {
    const buttonContainer = saveButton.parentNode;
    if (buttonContainer) {
      buttonContainer.appendChild(button);
      console.log("Button appended to container");
    } else {
      console.error("Button container not found");
    }
  } else {
    console.error("Save button not found");
  }

  setButtonState();
}

// Function to observe DOM changes and initialize the button
function observeDOM() {
  console.log("Observing DOM");
  const observer = new MutationObserver((mutations, observer) => {
    const saveButton = document.querySelector('button[aria-label="Save"]');
    const existingButton = document.querySelector("#mark-as-read-button");
    if (saveButton && !existingButton) {
      console.log("Save button found, creating our button");
      createButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Inject a style tag to ensure the tooltip is visible
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
        #login-tooltip {
            position: fixed !important;
            z-index: 10000 !important;
        }
    `;
  document.head.appendChild(style);
  console.log("Styles injected");
}

// Run the main function when the content script is loaded
if (document.readyState !== "loading") {
  console.log("Document already loaded");
  observeDOM();
  injectStyles();
} else {
  console.log("Waiting for document to load");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded event fired");
    observeDOM();
    injectStyles();
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  if (message.action === "loginStatusChanged") {
    console.log("Login status changed, updating button state");
    setButtonState();
  }
});

console.log("Content script setup complete");
