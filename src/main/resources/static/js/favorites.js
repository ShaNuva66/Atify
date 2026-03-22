    function buildJamendoPayload(song) {
        return {
            jamendoId: song.jamendoId || song.id,
            name: song.name || song.title || song.songName,
            artistName: song.artistName,
            albumName: song.albumName || null,
            coverUrl: song.coverUrl || null,
            audioUrl: song.audioUrl || null,
            shareUrl: song.externalUrl || null,
            licenseUrl: song.licenseUrl || null,
            duration: song.duration || 0
        };
    }

    function getSongExternalRef(song) {
        if (!song) return null;
        return song.externalRef || song.jamendoId || (((song.source || "LOCAL") === "JAMENDO") ? String(song.id) : null);
    }

    function findFavoriteSongId(song) {
        if (!song) return null;

        const numericId = Number(song.id);
        if (Number.isFinite(numericId) && favoriteSongIds.has(numericId)) {
            return numericId;
        }

        const externalRef = getSongExternalRef(song);
        if (externalRef && favoriteExternalRefs.has(String(externalRef))) {
            return favoriteExternalRefs.get(String(externalRef));
        }

        return null;
    }

    function isSongFavorite(song) {
        return findFavoriteSongId(song) != null;
    }

    function updateFavoriteButton() {
        if (!favoriteToggleBtn) return;
        if (!currentSong) {
            favoriteToggleBtn.textContent = "♡ Favorilere ekle";
            return;
        }

        const isFav = isSongFavorite(currentSong);
        favoriteToggleBtn.textContent = isFav ? "♥ Favoriden çıkar" : "♡ Favorilere ekle";
    }

    function renderHomeDashboard() {
        const statsBox = document.getElementById("homeQuickStats");
        if (statsBox) {
            const favoriteCount = favoritesCache.length;
            const recentCount = recentHistoryCache.length;
            const topSong = topHistoryCache[0];
            const stats = dashboardStatsCache;

            if (stats) {
                statsBox.innerHTML = `
                    <div style="margin-bottom:6px;"><b>${stats.favoriteCount}</b> favori şarkı</div>
                    <div style="margin-bottom:6px;"><b>${stats.totalPlays}</b> toplam dinleme · <b>${stats.uniqueSongs}</b> benzersiz parça</div>
                    <div style="margin-bottom:6px;">Yerel: <b>${stats.localPlayCount}</b> · Jamendo: <b>${stats.jamendoPlayCount}</b></div>
                    <div>${stats.topArtistName ? `<b>${stats.topArtistName}</b> şu an en güçlü sanatçın.` : "Dinleme verin arttıkça burada daha net bir profil oluşacak."}</div>
                `;
            } else {
                statsBox.innerHTML = `
                    <div style="margin-bottom:6px;"><b>${favoriteCount}</b> favori şarkı</div>
                    <div style="margin-bottom:6px;"><b>${recentCount}</b> yakın dinleme kaydı</div>
                    <div>${topSong ? `<b>${topSong.name}</b> şu an en çok dinlediğin parça.` : "Henüz en çok dinlenen şarkı oluşmadı."}</div>
                `;
            }
        }

        renderHistoryList(
            "homeTopHistoryList",
            topHistoryCache.slice(0, 5),
            "Henüz kayıt yok."
        );
        if (typeof renderRecommendationCollection === "function") {
            renderRecommendationCollection(
                "homeRecommendationPreview",
                personalRecommendationsCache.slice(0, 4),
                "Dinleme verin oluştuğunda burada sana özel öneriler gözükecek."
            );
        }
    }

    function renderFavorites() {
        const box = document.getElementById("favoritesList");
        if (!box) return;

        if (!favoritesCache || favoritesCache.length === 0) {
            box.textContent = "Henüz favori şarkın yok.";
            return;
        }

        box.innerHTML = "";
        favoritesCache.forEach(item => {
            const div = document.createElement("div");
            div.className = "item";
            div.style.cursor = "pointer";
            div.innerHTML = `<b>${item.name || "(isim yok)"}</b> <span style="color:#9ca3af;font-size:11px;">– ${item.artistName || "Bilinmeyen Şarkıcı"}</span>`;
            div.onclick = () => playSong({
                id: item.songId,
                name: item.name,
                artistName: item.artistName,
                coverUrl: item.coverUrl,
                audioUrl: item.audioUrl,
                source: item.source,
                duration: item.duration
            });
            box.appendChild(div);
        });
    }

    async function loadFavorites() {
        const { status, ok, data } = await apiRequest(CONFIG.endpoints.favorites, "GET", null, true);
        setStatus("Favoriler getirildi: HTTP " + status, ok);

        favoritesCache = ok && Array.isArray(data) ? data : [];
        favoriteSongIds = new Set(favoritesCache.map(item => Number(item.songId)));
        favoriteExternalRefs = new Map(
            favoritesCache
                .filter(item => item.source === "JAMENDO" && item.externalRef)
                .map(item => [String(item.externalRef), Number(item.songId)])
        );
        renderFavorites();
        renderHomeDashboard();
        if (currentCatalogItems.length > 0) {
            renderSongsTable(currentCatalogItems, currentSongsSource, currentCatalogEmptyMessage);
        }
        updateFavoriteButton();
    }

    async function toggleFavoriteSong(song) {
        if (!song) return;
        let path;
        let method;
        let body = null;

        const favoriteSongId = findFavoriteSongId(song);
        const isFav = favoriteSongId != null;

        if (isFav) {
            path = `${CONFIG.endpoints.favorites}/${favoriteSongId}`;
            method = "DELETE";
        } else if ((song.source || "LOCAL") === "JAMENDO") {
            path = `${CONFIG.endpoints.favorites}/jamendo`;
            method = "POST";
            body = buildJamendoPayload(song);
        } else {
            path = `${CONFIG.endpoints.favorites}/${song.id}`;
            method = "POST";
        }

        const { status, ok, data } = await apiRequest(path, method, body, true);
        setStatus(`Favori işlemi sonucu: HTTP ${status}`, ok);

        if (!ok) {
            const message = data && data.message ? data.message : "Favori işlemi başarısız oldu.";
            showCenterModal("Favori işlemi başarısız", message);
            return;
        }

        if (!isFav && (song.source || "LOCAL") === "JAMENDO" && data && data.songId) {
            song.id = data.songId;
            song.externalRef = data.externalRef || getSongExternalRef(song);
        }

        await loadFavorites();
        if (typeof loadInsights === "function") {
            await loadInsights();
        }
        showPopup(isFav ? "Favoriden çıkarıldı" : "Favorilere eklendi");
    }

    async function toggleFavoriteCurrentSong() {
        if (!currentSong) {
            setStatus("Önce bir şarkı seçip çal.", false);
            return;
        }
        await toggleFavoriteSong(currentSong);
    }

    function renderHistoryList(elementId, items, emptyText) {
        const box = document.getElementById(elementId);
        if (!box) return;

        if (!items || items.length === 0) {
            box.textContent = emptyText;
            return;
        }

        box.innerHTML = "";
        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "item";
            div.style.cursor = "pointer";
            const meta = item.playCount != null
                ? `${item.artistName || "Bilinmeyen Şarkıcı"} · ${item.playCount} dinleme`
                : (item.artistName || "Bilinmeyen Şarkıcı");
            div.innerHTML = `<b>${item.name || "(isim yok)"}</b> <span style="color:#9ca3af;font-size:11px;">– ${meta}</span>`;
            div.onclick = () => playSong({
                id: item.songId,
                name: item.name,
                artistName: item.artistName,
                coverUrl: item.coverUrl,
                audioUrl: item.audioUrl,
                source: item.source,
                duration: item.duration
            });
            box.appendChild(div);
        });
    }

    async function loadHistory() {
        const [recentRes, topRes] = await Promise.all([
            apiRequest(`${CONFIG.endpoints.history}/recent?limit=10`, "GET", null, true),
            apiRequest(`${CONFIG.endpoints.history}/top?limit=10`, "GET", null, true)
        ]);

        recentHistoryCache = recentRes.ok && Array.isArray(recentRes.data) ? recentRes.data : [];
        topHistoryCache = topRes.ok && Array.isArray(topRes.data) ? topRes.data : [];

        renderHistoryList(
            "recentHistoryList",
            recentHistoryCache,
            "Henüz kayıt yok."
        );
        renderHistoryList(
            "topHistoryList",
            topHistoryCache,
            "Henüz kayıt yok."
        );
        renderHomeDashboard();
    }

    async function recordListening(song) {
        if (!authToken || !song) return;

        let path;
        let body = null;

        if ((song.source || "LOCAL") === "JAMENDO") {
            path = `${CONFIG.endpoints.history}/jamendo`;
            body = buildJamendoPayload(song);
        } else {
            path = `${CONFIG.endpoints.history}/${song.id}`;
        }

        const { ok } = await apiRequest(path, "POST", body, true);
        if (ok) {
            loadHistory();
            if (typeof loadInsights === "function") {
                loadInsights();
            }
        }
    }

