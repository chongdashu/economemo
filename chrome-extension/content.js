console.log("Content script loaded");

// Define the SVG icons as constants
const BOOKMARK_ICON = `<svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="bookmark" class="svg-inline--fa fa-bookmark fa-w-12" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14"><path fill="currentColor" d="M336 0H48C21.49 0 0 21.49 0 48v464l192-112 192 112V48c0-26.51-21.49-48-48-48zm0 428.43l-144-84-144 84V54a6 6 0 0 1 6-6h276c3.314 0 6 2.683 6 5.996V428.43z"></path></svg>`;
const CHECK_ICON = `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="check" class="svg-inline--fa fa-check fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14"><path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>`;

let currentArticleId = null;

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
  if (data.length > 0) {
    currentArticleId = data[0].id; // Store the article ID
    return data[0];
  }
  return null;
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
  button.dataset.status = "unread"; // Set initial status

  // Apply styles directly to the button
  Object.assign(button.style, {
    marginLeft: "10px",
    padding: "6px 12px",
    border: "2px solid #1d4f91",
    backgroundColor: "white",
    color: "#1d4f91",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "32px",
    borderRadius: "16px",
    textDecoration: "none",
    transition: "all 0.2s ease",
  });

  // Add hover effect
  button.onmouseover = () => {
    button.style.backgroundColor = "#f0f7ff";
  };
  button.onmouseout = () => {
    button.style.backgroundColor = "white";
  };

  // Add icon and text
  button.innerHTML = `<span style="margin-right: 6px; display: inline-flex;">${BOOKMARK_ICON}</span> Mark as Read`;

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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);
  if (message.action === "loginStatusChanged") {
    console.log("Login status changed, updating button state");
    setButtonState();
  } else if (message.action === "updateReadStatus") {
    console.log("Read status changed, updating button");
    currentArticleId = message.articleId; // Store the article ID from the message
    updateButtonForReadStatus(message.status, message.date);
  }
});

function resetButtonToLoginState() {
  console.log("Resetting button to login state");
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
}

function updateButtonForReadStatus(status, date) {
  if (status) {
    button.innerHTML = `<span style="margin-right: 6px; display: inline-flex;">${CHECK_ICON}</span> Read on ${new Date(
      date
    ).toLocaleDateString()}`;
    button.dataset.status = "read";
    button.style.backgroundColor = "#e1eeff";
  } else {
    button.innerHTML = `<span style="margin-right: 6px; display: inline-flex;">${BOOKMARK_ICON}</span> Mark as Read`;
    button.dataset.status = "unread";
    button.style.backgroundColor = "white";
  }

  button.onclick = () => {
    chrome.storage.local.get(["userId"], (result) => {
      if (status) {
        if (confirm("Do you want to mark this article as unread?")) {
          updateArticle(currentArticleId, false, result.userId).then(() => {
            setButtonState();
          });
        }
      } else {
        createOrUpdateReadStatus(
          window.location.href,
          true,
          result.userId
        ).then(() => {
          setButtonState();
        });
      }
    });
  };
}

// Update the setButtonState function to use updateButtonForReadStatus
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
      button.onclick = () => {
        // Handle login action
        console.log("Login action needed");
      };
    } else {
      console.log("User logged in");
      const readStatus = await checkReadStatus(articleUrl, userId);
      updateButtonForReadStatus(
        readStatus ? readStatus.read : false,
        readStatus ? readStatus.date_read : null
      );
    }
  });
}

console.log("Content script setup complete");
