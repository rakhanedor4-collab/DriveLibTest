/**
 * auth.js
 * Google Identity Services (GIS) OAuth2 token yönetimi ve profil verileri.
 */

import { CONFIG } from "./config.js";
import { showStatus, handleApiError } from "./utils.js";

let tokenClient = null;
let accessToken = null;
let userInfo = null;

/**
 * GIS Token Client'ını başlatır.
 * @param {Function} onAuthSuccess - Giriş başarılı olduğunda çağrılacak fonksiyon
 */
export function initAuth(onAuthSuccess) {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: CONFIG.SCOPES,
            callback: async (response) => {
                if (response.error) {
                    handleApiError(new Error(response.error));
                    return;
                }
                accessToken = response.access_token;
                sessionStorage.setItem("drive_access_token", accessToken);
                await fetchUserProfile();
                if (typeof onAuthSuccess === "function") {
                    onAuthSuccess(userInfo, accessToken);
                }
            },
        });

        // Sayfa yenilendiğinde önbellekte token varsa kontrol et
        const savedToken = sessionStorage.getItem("drive_access_token");
        if (savedToken) {
            accessToken = savedToken;
            fetchUserProfile().then(() => {
                if (userInfo && typeof onAuthSuccess === "function") {
                    onAuthSuccess(userInfo, accessToken);
                }
            }).catch(() => {
                signOut();
            });
        }
    } catch (error) {
        handleApiError(error);
    }
}

/**
 * Google giriş penceresini (popup) açar.
 */
export function requestAccessToken() {
    if (!tokenClient) {
        showStatus("Kimlik doğrulama istemcisi henüz hazır değil.", "error");
        return;
    }
    // Token istemek için prompt tetiklenir
    tokenClient.requestAccessToken({ prompt: "consent" });
}

/**
 * Google UserInfo API üzerinden kullanıcı bilgilerini çeker.
 */
async function fetchUserProfile() {
    if (!accessToken) return;
    try {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error(`Profil alınamadı: ${response.status}`);
        userInfo = await response.json();
    } catch (error) {
        handleApiError(error);
        throw error;
    }
}

/**
 * Oturumu kapatır ve token'ı temizler.
 */
export function signOut(onSignOutCallback) {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken, () => {
            console.log("Token iptal edildi.");
        });
    }
    accessToken = null;
    userInfo = null;
    sessionStorage.removeItem("drive_access_token");
    if (typeof onSignOutCallback === "function") {
        onSignOutCallback();
    }
}

export function getAccessToken() {
    return accessToken;
}

export function getUserInfo() {
    return userInfo;
}