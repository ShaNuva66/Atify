function formatFingerprintCatalogStats(data) {
    if (!data) {
        return "";
    }

    const parts = [
        `Kaynak: ${data.fingerprintableSongCount || 0}`,
        `Fingerprint hazir: ${data.fingerprintedSongCount || 0}`,
        `Recognizer katalog: ${data.recognizerCatalogSize || 0}`,
        `Eksik: ${data.missingFingerprintCount || 0}`
    ];

    if (data.syncInProgress) {
        parts.push("sync calisiyor");
    }

    return parts.join(" · ");
}

function renderFingerprintCatalogStatus(data, isOk = true) {
    const summaryEl = document.getElementById("fingerprintCatalogSummary");
    const statsEl = document.getElementById("fingerprintCatalogStats");
    if (!summaryEl || !statsEl) return;

    const message = data && data.message ? data.message : "Fingerprint durumu alinamadi.";
    summaryEl.innerHTML = isOk
        ? `<span class="ok">${message}</span>`
        : `<span class="err">${message}</span>`;
    statsEl.textContent = data ? formatFingerprintCatalogStats(data) : "";
}

async function loadFingerprintCatalogStatus() {
    if (currentRole !== "ADMIN" || !authToken) {
        return;
    }

    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.fingerprintAdmin}/status`, "GET", null, true);
    setStatus("Fingerprint katalog durumu getirildi: HTTP " + status, ok);

    if (!ok || !data) {
        renderFingerprintCatalogStatus({ message: "Fingerprint katalog durumu alinamadi." }, false);
        return;
    }

    renderFingerprintCatalogStatus(data, data.recognizerReachable !== false);
}

async function reindexFingerprintCatalog() {
    if (currentRole !== "ADMIN") {
        setStatus("Fingerprint reindex sadece admin icin.", false);
        return;
    }

    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.fingerprintAdmin}/reindex`, "POST", {}, true);
    setStatus("Fingerprint katalog reindex sonucu: HTTP " + status, ok);

    if (!ok || !data) {
        renderFingerprintCatalogStatus({ message: "Fingerprint katalog reindex basarisiz." }, false);
        return;
    }

    renderFingerprintCatalogStatus(data, data.recognizerReachable !== false);
    showPopup("Fingerprint katalog senkronize edildi");
    await getSongs();
}
