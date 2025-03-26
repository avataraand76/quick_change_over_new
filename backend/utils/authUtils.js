// backend/utils/authUtils.js

const { google } = require("googleapis");

// Global variable for the OAuth2 client
let oauth2Client = null;
let drive = null;

/**
 * Initialize the OAuth2 client
 * @returns {Object} The initialized OAuth2 client
 */
const initOAuth2Client = () => {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // Set up token refresh handler
    oauth2Client.on("tokens", (tokens) => {
      if (tokens.refresh_token) {
        console.log(
          "New refresh token received, you should store it securely."
        );
      }
      console.log("Token refreshed automatically by OAuth2Client");
    });
  }
  return oauth2Client;
};

/**
 * Get the Google Drive client
 * @returns {Object} The Google Drive client
 */
const getDriveClient = () => {
  if (!drive) {
    const auth = initOAuth2Client();
    drive = google.drive({ version: "v3", auth });
  }
  return drive;
};

/**
 * Refresh the access token
 * @returns {Promise<string>} The new access token
 */
const refreshTokens = async () => {
  try {
    const auth = initOAuth2Client();

    // Refresh the access token
    const { credentials } = await auth.refreshAccessToken();
    console.log("Access token refreshed successfully");

    // Update the client with new credentials
    auth.setCredentials(credentials);

    // Re-initialize drive with the updated credentials
    drive = google.drive({ version: "v3", auth });

    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
};

/**
 * Execute a Google Drive operation with automatic token refresh on auth errors
 * @param {Function} operation - The Drive API operation to execute
 * @param {Number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Promise} - Result of the operation
 */
const executeWithTokenRefresh = async (operation, maxRetries = 2) => {
  let retries = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      // Check if this is an auth error (401 Unauthorized)
      const isAuthError =
        error.status === 401 ||
        (error.errors && error.errors.some((e) => e.reason === "authError"));

      // If max retries reached or not an auth error, throw
      if (retries >= maxRetries || !isAuthError) {
        throw error;
      }

      console.log(
        `Auth error detected, refreshing token (attempt ${
          retries + 1
        }/${maxRetries})...`
      );

      // Refresh token and retry
      try {
        await refreshTokens();
        retries++;
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        throw error; // Throw original error
      }
    }
  }
};

module.exports = {
  initOAuth2Client,
  getDriveClient,
  refreshTokens,
  executeWithTokenRefresh,
};
