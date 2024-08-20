import { getAuthHeaders } from "./auth.js";

/**
 * @typedef {Object} UserRegisterRequest
 * @property {string} email - The email address of the user to register
 */

/**
 * @typedef {Object} UserRegisterResponse
 * @property {string} id - The unique identifier for the registered user
 * @property {string} email - The email address of the registered user
 */

/**
 * @typedef {Object} ArticleAccessRequest
 * @property {string} url - The email address of the user to register
 * @property {boolean} create_if_not_exist - Wheter to create the article in the db if it doesn't exist
 */

/**
 * @typedef {Object} ArticleReadRequest
 * @property {boolean} read - Wheter the article is read or not
 */

/**
 * @typedef {Object} ArticleResponse
 * @property {number} id - The unique identifier for the article
 * @property {string} url - The URL of the article
 * @property {string|null} date_read - The date the article was read, or null if unread
 * @property {string} date_first_accessed - The date the article was first accessed
 * @property {string} date_last_accessed - The date the article was last accessed
 */

/**
 * Registers a new user
 * @param {UserRegisterRequest} request -
 * @returns {Promise<UserRegisterResponse>}
 */
export async function registerUser(request) {
  const response = await fetch(`${config.apiUrl}/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

/**
 * Checks the read status of an article
 * @param {string} articleUrl - The URL of the article to check
 * @returns {Promise<ArticleResponse>}
 */
export async function postArticleAccessed(articleUrl) {
  const headers = await getAuthHeaders();
  if (!headers["User-Id"]) {
    throw new Error("User not logged in");
  }

  const response = await fetch(`${config.apiUrl}/articles/access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      url: articleUrl,
      create_if_not_exist: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

/**
 * Checks the read status of an article
 * @param {string} articleUrl - The URL of the article to check
 * @returns {Promise<ArticleResponse[]>}
 */
export async function checkArticleReadStatus(articleUrl) {
  const headers = await getAuthHeaders();
  if (!headers["User-Id"]) {
    throw new Error("User not logged in");
  }

  const response = await fetch(
    `${config.apiUrl}/articles/by-url?url=${encodeURIComponent(articleUrl)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

/**
 * Creates or updates the read status of an article
 * @param {string} articleUrl - The URL of the article
 * @param {string|null} dateRead - The date the article was read, or null to mark as unread
 * @returns {Promise<ArticleResponse>}
 */
export async function createOrUpdateArticleReadStatus(articleUrl, dateRead) {
  const headers = await getAuthHeaders();
  if (!headers["User-Id"]) {
    throw new Error("User not logged in");
  }

  const response = await fetch(`${config.apiUrl}/articles/create/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      url: articleUrl,
      date_read: dateRead,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

/**
 * Updates the read status of an existing article
 * @param {number} articleId - The ID of the article to update
 * @param {bool} isRead - Is the article read or not
 * @returns {Promise<ArticleResponse>}
 */
export async function updateArticleReadStatus(articleId, isRead) {
  const headers = await getAuthHeaders();
  if (!headers["User-Id"]) {
    throw new Error("User not logged in");
  }

  const response = await fetch(`${config.apiUrl}/articles/${articleId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      read: isRead,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}
