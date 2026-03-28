let auditLogsCache = [];
let selectedAuditActor = null;

function getAuditFilterValues() {
    return {
        search: (document.getElementById("auditSearchInput")?.value || "").trim(),
        actor: (document.getElementById("auditActorInput")?.value || "").trim(),
        action: document.getElementById("auditActionFilter")?.value || "",
        target: document.getElementById("auditTargetFilter")?.value || ""
    };
}

function buildAuditQueryString() {
    const filters = getAuditFilterValues();
    const params = new URLSearchParams({ limit: "100" });

    if (filters.search) params.set("q", filters.search);
    if (filters.actor) params.set("actor", filters.actor);
    if (filters.action) params.set("action", filters.action);
    if (filters.target) params.set("target", filters.target);

    return params.toString();
}

function populateAuditSelect(selectId, values, placeholder, currentValue) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const uniqueValues = [...new Set((values || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
    select.innerHTML = `<option value="">${placeholder}</option>`;

    uniqueValues.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });

    if (currentValue && uniqueValues.includes(currentValue)) {
        select.value = currentValue;
    }
}

function renderAuditActorSummary(items) {
    const box = document.getElementById("auditActorSummaryList");
    if (!box) return;

    if (!items || items.length === 0) {
        box.textContent = "Henüz kullanıcı bazlı audit verisi yok.";
        return;
    }

    const grouped = new Map();
    items.forEach(item => {
        const actor = item.actorUsername || "system";
        if (!grouped.has(actor)) {
            grouped.set(actor, {
                actor,
                count: 0,
                lastActionAt: item.createdAt || null
            });
        }
        const group = grouped.get(actor);
        group.count += 1;
        if (item.createdAt && (!group.lastActionAt || item.createdAt > group.lastActionAt)) {
            group.lastActionAt = item.createdAt;
        }
    });

    const summary = [...grouped.values()]
        .sort((a, b) => b.count - a.count || a.actor.localeCompare(b.actor, "tr"))
        .slice(0, 8);

    box.innerHTML = "";

    summary.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = selectedAuditActor === item.actor ? "audit-actor-chip active" : "audit-actor-chip";

        const timeText = item.lastActionAt
            ? new Date(item.lastActionAt).toLocaleString("tr-TR")
            : "-";

        button.innerHTML = `
            <span class="audit-actor-name">${item.actor}</span>
            <span class="audit-actor-count">${item.count} işlem</span>
            <span class="audit-actor-time">${timeText}</span>
        `;

        button.onclick = () => {
            selectedAuditActor = item.actor;
            const actorInput = document.getElementById("auditActorInput");
            if (actorInput) actorInput.value = item.actor;
            renderAuditActorSummary(auditLogsCache);
            renderAuditActorDetail(auditLogsCache);
        };

        box.appendChild(button);
    });
}

function renderAuditActorDetail(items) {
    const detailTitle = document.getElementById("auditActorDetailTitle");
    const detailMeta = document.getElementById("auditActorDetailMeta");
    const detailList = document.getElementById("auditActorDetailList");

    if (!detailTitle || !detailMeta || !detailList) return;

    const actor = selectedAuditActor || (items[0]?.actorUsername ?? null);
    if (!actor) {
        detailTitle.textContent = "Kullanıcı seçilmedi";
        detailMeta.textContent = "Soldaki özetten bir kullanıcı seç.";
        detailList.textContent = "Henüz detay gösterilecek kayıt yok.";
        return;
    }

    const actorItems = items.filter(item => (item.actorUsername || "system") === actor);
    if (actorItems.length === 0) {
        detailTitle.textContent = actor;
        detailMeta.textContent = "Bu kullanıcı için seçili filtrelerde kayıt yok.";
        detailList.textContent = "Detay bulunamadı.";
        return;
    }

    selectedAuditActor = actor;
    const distinctActions = new Set(actorItems.map(item => item.actionType).filter(Boolean)).size;
    const lastActionAt = actorItems[0]?.createdAt
        ? new Date(actorItems[0].createdAt).toLocaleString("tr-TR")
        : "-";

    detailTitle.textContent = actor;
    detailMeta.textContent = `${actorItems.length} kayıt · ${distinctActions} farklı aksiyon · Son işlem: ${lastActionAt}`;
    detailList.innerHTML = "";

    actorItems.slice(0, 6).forEach(item => {
        const row = document.createElement("div");
        row.className = "audit-detail-item";
        row.innerHTML = `
            <div class="audit-detail-top">
                <span class="audit-log-action">${item.actionType || "ACTION"}</span>
                <span class="audit-log-target">${item.targetType || "TARGET"}${item.targetId ? " #" + item.targetId : ""}</span>
            </div>
            <div class="audit-log-detail">${item.detail || "-"}</div>
        `;
        detailList.appendChild(row);
    });
}

function renderAuditLogs(items) {
    const box = document.getElementById("auditLogList");
    if (!box) return;

    if (!items || items.length === 0) {
        box.textContent = "Seçili filtrelerle audit kaydı bulunamadı.";
        return;
    }

    box.innerHTML = "";

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "audit-log-row";

        const createdAt = item.createdAt
            ? new Date(item.createdAt).toLocaleString("tr-TR")
            : "-";

        row.innerHTML = `
            <div class="audit-log-top">
                <span class="audit-log-action">${item.actionType || "ACTION"}</span>
                <span class="audit-log-target">${item.targetType || "TARGET"}${item.targetId ? " #" + item.targetId : ""}</span>
            </div>
            <div class="audit-log-detail">${item.detail || "-"}</div>
            <div class="audit-log-meta">
                <button type="button" class="audit-actor-link">${item.actorUsername || "system"}</button>
                <span>${createdAt}</span>
            </div>
        `;

        const actorLink = row.querySelector(".audit-actor-link");
        if (actorLink) {
            actorLink.onclick = () => {
                selectedAuditActor = item.actorUsername || "system";
                const actorInput = document.getElementById("auditActorInput");
                if (actorInput) actorInput.value = selectedAuditActor;
                loadAuditLogs();
            };
        }

        box.appendChild(row);
    });
}

async function loadAuditLogs() {
    if (currentRole !== "ADMIN") {
        setStatus("Audit log sadece admin için.", false);
        return;
    }

    const actionFilter = document.getElementById("auditActionFilter")?.value || "";
    const targetFilter = document.getElementById("auditTargetFilter")?.value || "";

    const queryString = buildAuditQueryString();
    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.auditLogs}?${queryString}`, "GET", null, true);
    setStatus("Audit log sonucu: HTTP " + status, ok);

    const items = Array.isArray(data) ? data : [];
    auditLogsCache = ok ? items : [];

    populateAuditSelect(
        "auditActionFilter",
        auditLogsCache.map(item => item.actionType),
        "Tüm aksiyonlar",
        actionFilter
    );
    populateAuditSelect(
        "auditTargetFilter",
        auditLogsCache.map(item => item.targetType),
        "Tüm hedefler",
        targetFilter
    );

    if (!ok) {
        const box = document.getElementById("auditLogList");
        if (box) {
            box.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
        }
        return;
    }

    renderAuditLogs(auditLogsCache);
    renderAuditActorSummary(auditLogsCache);
    renderAuditActorDetail(auditLogsCache);
}

function resetAuditFilters() {
    const searchInput = document.getElementById("auditSearchInput");
    const actorInput = document.getElementById("auditActorInput");
    const actionFilter = document.getElementById("auditActionFilter");
    const targetFilter = document.getElementById("auditTargetFilter");

    if (searchInput) searchInput.value = "";
    if (actorInput) actorInput.value = "";
    if (actionFilter) actionFilter.value = "";
    if (targetFilter) targetFilter.value = "";

    selectedAuditActor = null;
    loadAuditLogs();
}

async function exportAuditLogsCsv() {
    if (currentRole !== "ADMIN") {
        setStatus("Audit export sadece admin için.", false);
        return;
    }

    const queryString = buildAuditQueryString();
    const response = await fetch(`${CONFIG.baseUrl}${CONFIG.endpoints.auditLogs}/export?${queryString}`, {
        method: "GET",
        headers: {
            Authorization: "Bearer " + authToken
        }
    });

    if (!response.ok) {
        let errorData = null;
        try {
            const text = await response.text();
            try {
                errorData = text ? JSON.parse(text) : null;
            } catch {
                errorData = text;
            }
        } catch {
            errorData = null;
        }

        if (maybeHandleAuthFailure(response.status, errorData, `${CONFIG.endpoints.auditLogs}/export`, "GET")) {
            return;
        }

        setStatus(`Audit export sonucu: HTTP ${response.status}`, false);
        showCenterModal("Export başarısız", "Audit log CSV indirilemedi.");
        return;
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "atify-audit-log.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(`Audit export sonucu: HTTP ${response.status}`, true);
    showPopup("Audit log CSV indirildi");
}
