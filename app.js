/**
 * app.js
 * Arayüz mantığı, olay yönlendirmeleri ve ana uygulama döngüsü.
 */

import { initAuth, requestAccessToken, signOut, getUserInfo } from "./auth.js";
import { findFileByName, createFile, readFileContent, updateFileContent } from "./drive.js";
import { $, showStatus, handleApiError, CONFIG } from "./utils.js";

let currentFileId = null;

document.addEventListener("DOMContentLoaded", () => {
    // UI Elementleri
    const btnLogin = $("#btnLogin");
    const btnLogout = $("#btnLogout");
    const btnLoad = $("#btnLoad");
    const btnSave = $("#btnSave");
    const btnNew = $("#btnNew");
    const editorArea = $("#editorArea");
    const profileContainer = $("#profileContainer");
    const loginContainer = $("#loginContainer");
    const userNameEl = $("#userName");
    const userEmailEl = $("#userEmail");
    const userAvatarEl = $("#userAvatar");

    // Kimlik doğrulama başlatılır
    initAuth((userInfo) => {
        onLoginSuccess(userInfo);
    });

    // Olay Dinleyicileri
    btnLogin.addEventListener("click", () => {
        requestAccessToken();
    });

    btnLogout.addEventListener("click", () => {
        signOut(() => {
            onSignOutUI();
            showStatus("Oturum kapatıldı.", "info");
        });
    });

    btnLoad.addEventListener("click", async () => {
        await loadOrCreateFile(CONFIG.DEFAULT_FILENAME);
    });

    btnSave.addEventListener("click", async () => {
        await saveCurrentFile();
    });

    btnNew.addEventListener("click", async () => {
        const customName = prompt("Yeni dosya adı girin:", CONFIG.DEFAULT_FILENAME);
        if (customName) {
            await createNewDedicatedFile(customName);
        }
    });

    function onLoginSuccess(user) {
        if (!user) return;
        loginContainer.classList.add("hidden");
        profileContainer.classList.remove("hidden");
        userNameEl.textContent = user.name || "Kullanıcı";
        userEmailEl.textContent = user.email || "";
        if (user.picture) {
            userAvatarEl.src = user.picture;
            userAvatarEl.classList.remove("hidden");
        }
        showStatus("Google ile başarıyla giriş yapıldı. Dosya yükleniyor...", "info");
        loadOrCreateFile(CONFIG.DEFAULT_FILENAME);
    }

    function onSignOutUI() {
        loginContainer.classList.remove("hidden");
        profileContainer.classList.add("hidden");
        userNameEl.textContent = "";
        userEmailEl.textContent = "";
        userAvatarEl.src = "";
        userAvatarEl.classList.add("hidden");
        editorArea.value = "";
        currentFileId = null;
        showStatus("Oturum kapalı.", "info");
    }

    async function loadOrCreateFile(fileName) {
        try {
            showStatus(`"${fileName}" aranıyor...`, "info");
            let file = await findFileByName(fileName);

            if (!file) {
                showStatus(`"${fileName}" bulunamadı, otomatik oluşturuluyor...`, "info");
                file = await createFile(fileName, "// Yeni oluşturuldu\n");
                showStatus(`"${fileName}" başarıyla oluşturuldu ve yüklendi.`, "success");
            } else {
                showStatus(`"${fileName}" bulundu, içerik okunuyor...`, "info");
            }

            currentFileId = file.id;
            const content = await readFileContent(currentFileId);
            editorArea.value = content;
            showStatus(`Dosya başarıyla yüklendi. (ID: ${currentFileId})`, "success");
        } catch (error) {
            handleApiError(error);
        }
    }

    async function createNewDedicatedFile(fileName) {
        try {
            showStatus(`"${fileName}" oluşturuluyor...`, "info");
            const file = await createFile(fileName, "// Yeni dosya içeriği\n");
            currentFileId = file.id;
            editorArea.value = "// Yeni dosya içeriği\n";
            showStatus(`Yeni dosya (${fileName}) oluşturuldu.`, "success");
        } catch (error) {
            handleApiError(error);
        }
    }

    async function saveCurrentFile() {
        if (!currentFileId) {
            showStatus("Kaydedilecek aktif dosya yok. Önce dosyayı yükleyin.", "error");
            return;
        }
        try {
            showStatus("Kaydediliyor (PATCH)...", "info");
            const content = editorArea.value;
            await updateFileContent(currentFileId, content);
            showStatus("Değişiklikler başarıyla kaydedildi (ID korundu).", "success");
        } catch (error) {
            handleApiError(error);
        }
    }
});