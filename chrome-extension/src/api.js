import { getAuthHeaders } from "./auth.js";

const api = {
  /**
   * Registers a new user
   * @param {UserRegisterRequest} request -
   * @returns {Promise<UserRegisterResponse>}
   */
  async registerUser(request) {
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
  },

  /**
   * Checks the read status of an article
   * @param {string} articleUrl - The URL of the article to check
   * @returns {Promise<ArticleResponse>}
   */
  async postArticleAccessed(articleUrl) {
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
  },

  /**
   * Retrieve article information by url
   * @param {string} articleUrl - The URL of the article to check
   * @returns {Promise<ArticleResponse[]>}
   */
  async getArticleByUrl(articleUrl) {
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
  },

  /**
   * Updates the read status of an existing article
   * @param {number} articleId - The ID of the article to update
   * @param {boolean} isRead - Is the article read or not
   * @returns {Promise<ArticleResponse>}
   */
  async updateArticleReadStatus(articleId, isRead) {
    const headers = await getAuthHeaders();
    if (!headers["User-Id"]) {
      throw new Error("User not logged in");
    }

    const response = await fetch(
      `${config.apiUrl}/articles/${articleId}/read`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          read: isRead,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    return response.json();
  },
};

export default api;
