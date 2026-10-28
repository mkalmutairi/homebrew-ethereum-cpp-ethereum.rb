// Link to the wells sheet the app reads on every launch. Leave empty to show
// sample data until a link is set from the app's settings screen.
// A Google Sheet works directly: share it as "Anyone with the link can view"
// (or File > Share > Publish to web > CSV) and paste its link here.
export const DEFAULT_DATA_URL = '';

// Re-check the sheet when the app comes back to the foreground after this long.
export const REFRESH_AFTER_MS = 30 * 60 * 1000;
