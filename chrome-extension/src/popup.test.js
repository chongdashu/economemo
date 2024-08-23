const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.resolve(__dirname, "./popup.html"), "utf8");

describe("Popup", () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  test("renders main heading", () => {
    const heading = document.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading.textContent).toBe("NewsAnchor.xyz");
  });

  test("renders login and register buttons with correct text", () => {
    const loginButton = document.querySelector("#login-button");
    const registerButton = document.querySelector("#register-button");
    expect(loginButton).not.toBeNull();
    expect(loginButton.textContent.trim()).toBe("Login");
    expect(registerButton).not.toBeNull();
    expect(registerButton.textContent.trim()).toBe("Register");
  });

  test("renders email input field with correct attributes", () => {
    const emailInput = document.querySelector("#email-input");
    expect(emailInput).not.toBeNull();
    expect(emailInput.type).toBe("email");
    expect(emailInput.required).toBe(true);
    expect(emailInput.placeholder).toBe("Enter your email");
  });

  test("logout button is initially hidden", () => {
    const logoutButton = document.querySelector("#logout-button");
    expect(logoutButton).not.toBeNull();
    expect(logoutButton.style.display).toBe("none");
  });

  test("action button is initially hidden", () => {
    const actionButton = document.querySelector("#action-button");
    expect(actionButton).not.toBeNull();
    expect(actionButton.style.display).toBe("none");
  });

  test("renders streak display elements", () => {
    const streakDisplay = document.querySelector("#streak-display");
    const streakCircles = document.querySelector("#streak-circles");
    expect(streakDisplay).not.toBeNull();
    expect(streakCircles).not.toBeNull();
  });

  test("renders error message container", () => {
    const errorMessage = document.querySelector("#error-message");
    expect(errorMessage).not.toBeNull();
  });
});
