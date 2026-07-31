/**
 * config.js
 * Uygulama genelinde kullanılan yapılandırma ve sabitler.
 */

export const CONFIG = {
    CLIENT_ID: "66253281254-h7m60vpn2hq8e3m4rl9117rn22e89fh3.apps.googleusercontent.com",
    // auth.js içinde dinamik olarak belirlenir (localhost veya GitHub Pages)
    REDIRECT_URI: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/'),
    SCOPES: "https://www.googleapis.com/auth/drive.file",
    DEFAULT_FILENAME: "libx.dat"
};