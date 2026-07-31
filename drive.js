* drive.js
 * Google Drive REST API v3 operasyonları (Arama, Oluşturma, Okuma, Güncelleme).
 */

import { getAccessToken } from "./auth.js";
import { CONFIG } from "./utils.js";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";

/**
 * Belirtilen ada sahip dosyayı Google Drive'da arar.
 * @param {string} fileName 
 * @returns {Object|null} Dosya meta verisi veya null
 */
export async function findFileByName(fileName = CONFIG.DEFAULT_FILENAME) {
    const token = getAccessToken();
    if (!token) throw new Error("Oturum açılmadı (401 Unauthorized).");

    const query = encodeURIComponent(`name = '${fileName}' and trashed = false`);
    const url = `${DRIVE_API_BASE}/files?q=${query}&spaces=drive&fields=files(id, name, mimeType)`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const err = new Error(errData.error?.message || `Drive arama hatası: ${response.status}`);
        err.status = response.status;
        throw err;
    }

    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
}

/**
 * Google Drive üzerinde yeni bir dosya oluşturur.
 * @param {string} fileName 
 * @param {string} content 
 * @returns {Object} Oluşturulan dosya bilgisi
 */
export async function createFile(fileName = CONFIG.DEFAULT_FILENAME, content = "") {
    const token = getAccessToken();
    if (!token) throw new Error("Oturum açılmadı.");

    const metadata = {
        name: fileName,
        mimeType: "text/plain",
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob([content], { type: "text/plain" }));

    const response = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const err = new Error(errData.error?.message || `Dosya oluşturma hatası: ${response.status}`);
        err.status = response.status;
        throw err;
    }

    return await response.json();
}

/**
 * Dosya içeriğini Google Drive'dan okur.
 * @param {string} fileId 
 * @returns {string} Dosya içeriği
 */
export async function readFileContent(fileId) {
    const token = getAccessToken();
    if (!token) throw new Error("Oturum açılmadı.");

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const err = new Error(`Dosya içeriği okunamadı: ${response.status}`);
        err.status = response.status;
        throw err;
    }

    return await response.text();
}

/**
 * Mevcut dosyanın üzerine PATCH metodu ile ID'sini koruyarak yazar.
 * @param {string} fileId 
 * @param {string} content 
 */
export async function updateFileContent(fileId, content) {
    const token = getAccessToken();
    if (!token) throw new Error("Oturum açılmadı.");

    const response = await fetch(`${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain"
        },
        body: content
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const err = new Error(errData.error?.message || `Dosya güncelleme hatası: ${response.status}`);
        err.status = response.status;
        throw err;
    }

    return await response.json();
}