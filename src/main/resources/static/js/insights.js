function formatInsightDate(value) {
    if (!value) return "Henüz dinleme yok";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Henüz dinleme yok";
    return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderRecommendationCollection(elementId, items, emptyText) {
    const box = document.getElementById(elementId);
    if (!box) return;

    if (!items || items.length === 0) {
        box.innerHTML = `<div class="muted">${emptyText}</div>`;
        return;
    }

    box.innerHTML = "";
    items.forEach(item => {
        if (typeof createRecommendationItemElement === "function") {
            box.appendChild(createRecommendationItemElement(item));
        }
    });
}

function renderInsightStats() {
    const grid = document.getElementById("insightStatsGrid");
    if (!grid) return;

    const stats = dashboardStatsCache || {
        totalPlays: 0,
        uniqueSongs: 0,
        favoriteCount: favoritesCache.length,
        topArtistName: null,
        topArtistPlayCount: 0,
        localPlayCount: 0,
        jamendoPlayCount: 0,
        lastListenedAt: null
    };

    grid.innerHTML = `
        <div class="insight-stat-card">
            <div class="insight-stat-label">Toplam Dinleme</div>
            <div class="insight-stat-value">${stats.totalPlays || 0}</div>
            <div class="insight-stat-subtitle">Tüm oynatma kayıtların</div>
        </div>
        <div class="insight-stat-card">
            <div class="insight-stat-label">Benzersiz Şarkı</div>
            <div class="insight-stat-value">${stats.uniqueSongs || 0}</div>
            <div class="insight-stat-subtitle">En az bir kez açtığın parça</div>
        </div>
        <div class="insight-stat-card">
            <div class="insight-stat-label">Favoriler</div>
            <div class="insight-stat-value">${stats.favoriteCount || 0}</div>
            <div class="insight-stat-subtitle">Beğenip sakladığın şarkılar</div>
        </div>
        <div class="insight-stat-card">
            <div class="insight-stat-label">En Güçlü Sanatçı</div>
            <div class="insight-stat-value">${stats.topArtistName || "-"}</div>
            <div class="insight-stat-subtitle">${stats.topArtistPlayCount || 0} dinleme · Son kayıt ${formatInsightDate(stats.lastListenedAt)}</div>
        </div>
    `;
}

function renderTopArtistsInsights() {
    const box = document.getElementById("topArtistsList");
    if (!box) return;

    if (!topArtistsInsightsCache || topArtistsInsightsCache.length === 0) {
        box.textContent = "Henüz yeterli veri yok.";
        return;
    }

    box.innerHTML = "";
    topArtistsInsightsCache.forEach(item => {
        const row = document.createElement("div");
        row.className = "artist-insight-row";
        row.innerHTML = `
            <div class="artist-insight-name">${item.artistName || "Bilinmeyen sanatçı"}</div>
            <div class="artist-insight-count">${item.playCount || 0} dinleme</div>
        `;
        box.appendChild(row);
    });
}

function renderInsights() {
    renderInsightStats();
    renderTopArtistsInsights();
    renderRecommendationCollection(
        "personalRecommendationList",
        personalRecommendationsCache,
        "Dinleme verin oluştukça burada daha güçlü öneriler göreceksin."
    );
    renderRecommendationCollection(
        "homeRecommendationPreview",
        personalRecommendationsCache.slice(0, 4),
        "Dinleme verin oluştuğunda burada sana özel öneriler gözükecek."
    );
}

async function loadInsights() {
    if (!authToken) return;

    const [statsRes, artistsRes, recsRes] = await Promise.all([
        apiRequest(`${CONFIG.endpoints.history}/stats`, "GET", null, true),
        apiRequest(`${CONFIG.endpoints.history}/artists/top?limit=6`, "GET", null, true),
        apiRequest(`${CONFIG.endpoints.history}/recommendations?limit=6`, "GET", null, true)
    ]);

    dashboardStatsCache = statsRes.ok && statsRes.data ? statsRes.data : null;
    topArtistsInsightsCache = artistsRes.ok && Array.isArray(artistsRes.data) ? artistsRes.data : [];
    personalRecommendationsCache = recsRes.ok && Array.isArray(recsRes.data) ? recsRes.data : [];

    renderInsights();
    renderHomeDashboard();
}
