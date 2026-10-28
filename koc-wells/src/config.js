// Wells are normally added by importing the daily Excel file in the app.
// Optionally, a link to a shared sheet the app reads on every launch instead;
// leave empty for imports. A Google Sheet works directly: share it as
// "Anyone with the link can view" and paste its link here.
export const DEFAULT_DATA_URL = '';

// Re-check the linked sheet when the app comes back to the foreground after this long.
export const REFRESH_AFTER_MS = 30 * 60 * 1000;
