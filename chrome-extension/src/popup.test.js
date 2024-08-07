const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.resolve(__dirname, "./popup.html"), "utf8");

describe("Popup", () => {
  beforeEach(() => {
    document.body.innerHTML = html;
  });

  test("login button exists and has correct text", () => {
    const loginButton = document.querySelector("#login-button");
    expect(loginButton).not.toBeNull();
    expect(loginButton.textContent).toBe("Login");
  });

  test("register button exists and has correct text", () => {
    const registerButton = document.querySelector("#register-button");
    expect(registerButton).not.toBeNull();
    expect(registerButton.textContent).toBe("Register");
  });

  test("email input field exists", () => {
    const emailInput = document.querySelector("#email-input");
    expect(emailInput).not.toBeNull();
    expect(emailInput.type).toBe("email");
    expect(emailInput.placeholder).toBe("Enter your email");
    expect(emailInput.required).toBe(true);
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

  // Add more tests as needed
});
