/**
 * utils.js
 * DOM seçim kısayolları, durum güncellemeleri ve hata yönetimi yardımcıları.
 */

export const $ = (selector) => document.querySelector(selector);

/**
 * Kullanıcıya bilgi veya hata mesajı gösterir.
 * @param {string} message - Gösterilecek mesaj
 * @param {string} type - 'info', 'success', 'error'
 */
export function showStatus(message, type = "info") {
    const statusEl = $("#fileStatus");
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-badge ${type}`;
    console.println ? console.log(`[${type.toUpperCase()}] ${message}`) : null;
}

/**
 * Hata kodlarına göre kullanıcı dostu mesajlar üretir.
 * @param {Error|Object} error 
 */
export function handleApiError(error) {
    console.error("API Error:", error);
    let message = error.message || "Bilinmeyen bir hata oluştu.";
    
    if (error.status === 401 || message.includes("401")) {
        message = "Oturum süresi doldu veya yetkisiz erişim (401). Lütfen tekrar giriş yapın.";
    } else if (error.status === 403 || message.includes("403")) {
        message = "Bu işlem için yetkiniz yok veya kota aşıldı (403 / Permission Denied).";
    } else if (error.status === 404 || message.includes("404")) {
        message = "İstenen kaynak veya dosya bulunamadı (404).";
    } else if (!navigator.onLine) {
        message = "Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.";
    }

    showStatus(message, "error");
}