let jamendoPreloadSettingsCache = null;

function getJamendoPreloadFormValues() {
    const enabled = Boolean(document.getElementById("jamendoPreloadEnabled")?.checked);
    const limitRaw = Number(document.getElementById("jamendoPreloadLimit")?.value || 4);
    const queriesRaw = document.getElementById("jamendoPreloadQueries")?.value || "";

    const queries = queriesRaw
        .split(/\r?\n|,/)
        .map(value => value.trim())
        .filter(Boolean);

    return {
        enabled,
        limit: Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 20)) : 4,
        queries
    };
}

function renderJamendoPreloadStatus(message, isOk = true) {
    const box = document.getElementById("jamendoPreloadStatus");
    if (!box) return;
    box.innerHTML = isOk
        ? `<span class="ok">${message}</span>`
        : `<span class="err">${message}</span>`;
}

function applyJamendoPreloadSettingsToForm(settings) {
    if (!settings) return;

    const enabledEl = document.getElementById("jamendoPreloadEnabled");
    const limitEl = document.getElementById("jamendoPreloadLimit");
    const queriesEl = document.getElementById("jamendoPreloadQueries");

    if (enabledEl) enabledEl.checked = Boolean(settings.enabled);
    if (limitEl) limitEl.value = settings.limit || 4;
    if (queriesEl) queriesEl.value = Array.isArray(settings.queries) ? settings.queries.join("\n") : "";

    jamendoPreloadSettingsCache = settings;
    renderJamendoPreloadStatus(
        `Preload ${settings.enabled ? "acik" : "kapali"} · Limit ${settings.limit} · ${settings.queries.length} sorgu`
    );
}

async function loadJamendoPreloadSettings() {
    if (currentRole !== "ADMIN" || !authToken) {
        return;
    }

    const { status, ok, data } = await apiRequest(CONFIG.endpoints.jamendoPreloadAdmin, "GET", null, true);
    setStatus("Jamendo preload ayarları getirildi: HTTP " + status, ok);

    if (!ok || !data) {
        renderJamendoPreloadStatus("Jamendo preload ayarları alınamadı.", false);
        return;
    }

    applyJamendoPreloadSettingsToForm(data);
}

async function saveJamendoPreloadSettings() {
    if (currentRole !== "ADMIN") {
        setStatus("Jamendo preload ayarları sadece admin için.", false);
        return;
    }

    const payload = getJamendoPreloadFormValues();
    const { status, ok, data } = await apiRequest(CONFIG.endpoints.jamendoPreloadAdmin, "PUT", payload, true);
    setStatus("Jamendo preload ayarları kaydedildi: HTTP " + status, ok);

    if (!ok || !data) {
        renderJamendoPreloadStatus("Jamendo preload ayarları kaydedilemedi.", false);
        return;
    }

    applyJamendoPreloadSettingsToForm(data);
    showPopup("Jamendo preload ayarları kaydedildi");
}

async function runJamendoPreloadNow() {
    if (currentRole !== "ADMIN") {
        setStatus("Jamendo preload sadece admin için.", false);
        return;
    }

    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.jamendoPreloadAdmin}/run`, "POST", {}, true);
    setStatus("Jamendo preload çalıştırıldı: HTTP " + status, ok);

    if (!ok || !data) {
        renderJamendoPreloadStatus("Jamendo preload çalıştırılamadı.", false);
        return;
    }

    const queries = Array.isArray(data.queries) ? data.queries.join(", ") : "-";
    renderJamendoPreloadStatus(
        `Çalıştı · imported=${data.imported || 0} · skipped=${data.skipped || 0} · sorgular: ${queries}`
    );
    await getSongs();
    showPopup("Jamendo preload çalıştırıldı");
}
