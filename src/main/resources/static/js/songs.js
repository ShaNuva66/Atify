function asArrayMaybe(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && Array.isArray(data.songs)) return data.songs;
    return [];
}

function normalizeSongSource(song, fallbackSource = "LOCAL") {
    return {
        ...song,
        source: song && song.source ? song.source : fallbackSource
    };
}

function getCatalogSourceFilterValue() {
    const el = document.getElementById("catalogSourceFilter");
    return el ? el.value : "LOCAL";
}

function setCatalogSourceFilterValue(value) {
    const el = document.getElementById("catalogSourceFilter");
    if (el) {
        el.value = value;
    }
}

function getCatalogBaseItemsBySource(source) {
    const localItems = songsCache.map(song => normalizeSongSource(song, "LOCAL"));
    const jamendoItems = jamendoCache.map(song => normalizeSongSource(song, "JAMENDO"));

    if (source === "JAMENDO") return jamendoItems;
    if (source === "ALL") return [...localItems, ...jamendoItems];
    return localItems;
}

function updateCatalogArtistOptions(items) {
    const select = document.getElementById("catalogArtistFilter");
    if (!select) return;

    const previousValue = select.value;
    const artists = [...new Set(
        (items || [])
            .map(item => (item.artistName || "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "tr"));

    select.innerHTML = '<option value="">Tüm sanatçılar</option>';
    artists.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    if (artists.includes(previousValue)) {
        select.value = previousValue;
    }
}

function buildCatalogEmptyMessage(source, query, artist) {
    if (source === "JAMENDO" && jamendoCache.length === 0) {
        return "Jamendo için önce arama yap.";
    }
    if (query || artist) {
        return "Seçtiğin filtrelerle eşleşen şarkı bulunamadı.";
    }
    if (source === "ALL") {
        return "Henüz gösterilecek şarkı bulunamadı.";
    }
    return source === "LOCAL"
        ? "Yerel kütüphanede şarkı bulunamadı."
        : "Jamendo tarafında sonuç bulunamadı.";
}

function updateCatalogSummary(filteredCount, totalCount, source, query, artist) {
    const summary = document.getElementById("catalogSummary");
    if (!summary) return;

    const sourceText = source === "ALL"
        ? "Tüm kaynaklar"
        : (source === "JAMENDO" ? "Sadece Jamendo" : "Sadece yerel");

    const parts = [`${sourceText}: ${filteredCount}/${totalCount} şarkı`];
    if (query) parts.push(`Arama: "${query}"`);
    if (artist) parts.push(`Sanatçı: ${artist}`);
    if (source === "JAMENDO" && jamendoCache.length === 0) {
        parts.push("Jamendo sonuçları için arama yapman gerekiyor.");
    }

    summary.textContent = parts.join(" · ");
}

function applyCatalogFilters() {
    const query = (document.getElementById("catalogSearchInput")?.value || "").trim().toLowerCase();
    const source = getCatalogSourceFilterValue();
    const baseItems = getCatalogBaseItemsBySource(source);

    updateCatalogArtistOptions(baseItems);
    const artist = document.getElementById("catalogArtistFilter")?.value || "";

    const filteredItems = baseItems.filter(song => {
        const title = (song.name || song.title || song.songName || "").toLowerCase();
        const artistName = (song.artistName || "").toLowerCase();
        const matchesQuery = !query || title.includes(query) || artistName.includes(query);
        const matchesArtist = !artist || (song.artistName || "") === artist;
        return matchesQuery && matchesArtist;
    });

    currentSongsSource = source;
    renderSongsTable(
        filteredItems,
        source,
        buildCatalogEmptyMessage(source, query, artist)
    );
    updateCatalogSummary(filteredItems.length, baseItems.length, source, query, artist);
}

function resetCatalogFilters() {
    const queryInput = document.getElementById("catalogSearchInput");
    const artistSelect = document.getElementById("catalogArtistFilter");
    if (queryInput) queryInput.value = "";
    if (artistSelect) artistSelect.value = "";
    setCatalogSourceFilterValue("LOCAL");
    applyCatalogFilters();
}

function renderSongsTable(arr, source = "LOCAL", emptyMessage = "Hiç şarkı bulunamadı.") {
    const tbody = document.getElementById("songsTableBody");
    currentCatalogItems = Array.isArray(arr) ? arr.map(song => normalizeSongSource(song, source)) : [];
    currentCatalogEmptyMessage = emptyMessage;
    tbody.innerHTML = "";

    if (!arr || arr.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.style.padding = "10px";
        td.style.fontSize = "12px";
        td.style.color = "#9ca3af";
        td.textContent = emptyMessage;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    arr.forEach((song, index) => {
        const normalizedSong = normalizeSongSource(song, source);
        const songSource = normalizedSong.source || source || "LOCAL";
        const tr = document.createElement("tr");
        tr.className = "songs-body-row";

        const title = normalizedSong.name || normalizedSong.title || normalizedSong.songName || "(isim yok)";
        const artistName = normalizedSong.artistName || "Bilinmeyen Şarkıcı";
        const duration = normalizedSong.duration ?? 0;
        let sourceBadge = "";
        if (songSource === "JAMENDO") {
            if (normalizedSong.libraryAdded) {
                sourceBadge = '<span class="song-source-badge imported">Atify\'de</span>';
            } else if (source === "LOCAL" || source === "ALL") {
                sourceBadge = '<span class="song-source-badge imported">Jamendo import</span>';
            } else {
                sourceBadge = '<span class="song-source-badge jamendo">Jamendo</span>';
            }
        }

        const tdPlay = document.createElement("td");
        tdPlay.className = "play-icon-cell";
        tdPlay.textContent = "▶";

        const tdTitle = document.createElement("td");
        tdTitle.innerHTML = `
            <div class="song-title-cell">
                <div class="song-cover">${index + 1}</div>
                <div class="song-texts">
                    <span class="song-name">${title}</span>
                    ${sourceBadge ? `<div class="song-badge-row">${sourceBadge}</div>` : ""}
                    <span class="song-artist">${artistName}</span>
                </div>
            </div>
        `;

        const tdArtist = document.createElement("td");
        tdArtist.textContent = artistName;

        const tdDuration = document.createElement("td");
        tdDuration.style.textAlign = "right";
        tdDuration.textContent = duration ? formatTime(duration) : "";

        tr.appendChild(tdPlay);
        tr.appendChild(tdTitle);
        tr.appendChild(tdArtist);
        tr.appendChild(tdDuration);

        const tdActions = document.createElement("td");
        tdActions.style.textAlign = "center";
        const wrapper = document.createElement("div");
        wrapper.className = "song-actions";

        if (authToken) {
            const favoriteBtn = document.createElement("button");
            const favorited = isSongFavorite(normalizedSong);
            favoriteBtn.type = "button";
            favoriteBtn.className = favorited ? "favorite-inline-btn active" : "favorite-inline-btn";
            favoriteBtn.textContent = favorited ? "♥" : "♡";
            favoriteBtn.title = favorited ? "Favoriden çıkar" : "Favorilere ekle";
            favoriteBtn.onclick = async (ev) => {
                ev.stopPropagation();
                await toggleFavoriteSong(normalizedSong);
            };
            wrapper.appendChild(favoriteBtn);
        }

        if (currentRole === "ADMIN" && songSource === "JAMENDO") {
            const importBtn = document.createElement("button");
            importBtn.type = "button";
            importBtn.className = normalizedSong.libraryAdded ? "favorite-inline-btn active" : "favorite-inline-btn";
            importBtn.textContent = normalizedSong.libraryAdded ? "✓" : "↓";
            importBtn.title = normalizedSong.libraryAdded ? "Atify kütüphanesine eklendi" : "Atify kütüphanesine ekle";
            importBtn.onclick = async (ev) => {
                ev.stopPropagation();
                await importJamendoSongToCatalog(normalizedSong, importBtn);
            };
            wrapper.appendChild(importBtn);
        }

        if (currentRole === "ADMIN" && songSource === "LOCAL") {
            const menuBtn = document.createElement("button");
            menuBtn.type = "button";
            menuBtn.innerHTML = "⋯";
            menuBtn.title = "Diğer işlemler";

            const menu = document.createElement("div");
            menu.className = "song-actions-menu";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.textContent = "Düzenle";
            editBtn.onclick = (ev) => {
                ev.stopPropagation();
                menu.style.display = "none";
                openSongEdit(normalizedSong);
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.textContent = "Şarkıyı sil";
            deleteBtn.className = "danger";
            deleteBtn.onclick = (ev) => {
                ev.stopPropagation();
                menu.style.display = "none";
                deleteSongById(normalizedSong.id, title);
            };

            menu.appendChild(editBtn);
            menu.appendChild(deleteBtn);

            menuBtn.onclick = (ev) => {
                ev.stopPropagation();
                const isVisible = menu.style.display === "block";
                document.querySelectorAll(".song-actions-menu").forEach(m => m.style.display = "none");
                menu.style.display = isVisible ? "none" : "block";
            };

            wrapper.appendChild(menuBtn);
            wrapper.appendChild(menu);
        }

        if (wrapper.children.length > 0) {
            tdActions.appendChild(wrapper);
        }
        tr.appendChild(tdActions);

        tr.onclick = () => playSong(normalizedSong);
        tbody.appendChild(tr);
    });
}

async function importJamendoSongToCatalog(song, triggerBtn = null) {
    if (!song || (song.source || "LOCAL") !== "JAMENDO") {
        setStatus("Yalnızca Jamendo sonucu kalıcı olarak eklenebilir.", false);
        return;
    }
    if (currentRole !== "ADMIN") {
        setStatus("Kataloğa ekleme sadece admin için.", false);
        return;
    }

    if (triggerBtn) {
        triggerBtn.disabled = true;
    }

    const { status, ok, data } = await apiRequest(
        `${CONFIG.endpoints.songs}/import/jamendo`,
        "POST",
        buildJamendoPayload(song),
        true
    );
    setStatus("Jamendo import sonucu: HTTP " + status, ok);

    if (triggerBtn) {
        triggerBtn.disabled = false;
    }

    if (!ok) {
        const message = data && data.message ? data.message : "Jamendo şarkısı kütüphaneye eklenemedi.";
        showCenterModal("Import başarısız", message);
        return;
    }

    song.libraryAdded = true;
    song.importedSongId = data && data.id ? data.id : song.importedSongId;

    if (triggerBtn) {
        triggerBtn.className = "favorite-inline-btn active";
        triggerBtn.textContent = "✓";
        triggerBtn.title = "Atify kütüphanesine eklendi";
    }

    await getSongs();
    showPopup("Jamendo şarkısı kütüphaneye eklendi");
}

async function getSongs() {
    const { status, ok, data } = await apiRequest(CONFIG.endpoints.songs, "GET", null, true);
    setStatus("Şarkılar getirildi: HTTP " + status, ok);

    const arr = asArrayMaybe(data).map(song => normalizeSongSource(song, "LOCAL"));
    songsCache = ok ? arr : [];
    applyCatalogFilters();
}

function showLocalSongs() {
    setCatalogSourceFilterValue("LOCAL");
    applyCatalogFilters();
}

async function searchJamendoTracks() {
    const query = document.getElementById("catalogSearchInput").value.trim();
    if (!query) {
        setStatus("Jamendo araması için bir kelime yaz.", false);
        return;
    }

    const { status, ok, data } = await apiRequest(
        "/jamendo/search?q=" + encodeURIComponent(query) + "&limit=12",
        "GET",
        null,
        false
    );
    setStatus("Jamendo arama sonucu: HTTP " + status, ok);

    if (!ok || !data || !Array.isArray(data.tracks)) {
        jamendoCache = [];
        setCatalogSourceFilterValue("JAMENDO");
        applyCatalogFilters();
        return;
    }

    jamendoCache = data.tracks.map(track => ({
        id: track.jamendoId,
        jamendoId: track.jamendoId,
        name: track.name,
        artistName: track.artistName,
        duration: track.duration,
        coverUrl: track.coverUrl,
        albumName: track.albumName,
        audioUrl: track.audioUrl,
        externalUrl: track.shareUrl,
        licenseUrl: track.licenseUrl,
        source: "JAMENDO"
    }));

    setCatalogSourceFilterValue("JAMENDO");
    applyCatalogFilters();
}

async function openSongEdit(song) {
    if (currentRole !== "ADMIN") {
        setStatus("Şarkı düzenleme sadece admin için.", false);
        return;
    }

    const id = song.id ?? "";
    const currentName = song.name || song.title || song.songName || "";
    const currentDuration = song.duration ?? 0;

    const newName = prompt("Yeni şarkı adı:", currentName);
    if (newName === null) return;

    const newDurationRaw = prompt("Yeni süre (saniye):", String(currentDuration));
    if (newDurationRaw === null) return;

    const name = newName.trim();
    if (!id || !name) {
        setStatus("ID ve isim zorunlu.", false);
        return;
    }

    const durationParsed = Number(newDurationRaw);
    const duration = Number.isFinite(durationParsed) && durationParsed >= 0
        ? Math.floor(durationParsed)
        : currentDuration;

    const payload = { name, duration };
    const path = `${CONFIG.endpoints.songs}/${id}`;

    const { status, ok, data } = await apiRequest(path, "PUT", payload, true);
    setStatus("Şarkı güncelleme sonucu: HTTP " + status, ok);
    console.log("updateSong from menu response:", data);

    if (ok) {
        showPopup("Şarkı güncellendi");
        getSongs();
    }
}

async function deleteSongById(id, title) {
    if (!id) {
        setStatus("Silinecek şarkının id'si yok.", false);
        return;
    }
    if (currentRole !== "ADMIN") {
        setStatus("Şarkı silme sadece admin için.", false);
        return;
    }
    const okConfirm = confirm(`Bu şarkıyı silmek istediğine emin misin?\n\n${title || ("ID: " + id)}`);
    if (!okConfirm) return;

    const path = `${CONFIG.endpoints.songs}/${id}`;
    const { status, ok, data } = await apiRequest(path, "DELETE", null, true);
    setStatus("Şarkı silme sonucu: HTTP " + status, ok);
    console.log("deleteSong response:", data);
    if (ok) {
        showPopup("Şarkı silindi");
        songsCache = songsCache.filter(song => Number(song.id) !== Number(id));
        applyCatalogFilters();
    }
}

function buildRecommendationSong(item) {
    return {
        id: item.songId,
        name: item.songName,
        artistName: item.artistName,
        coverUrl: item.coverUrl,
        duration: item.duration || 0,
        audioUrl: item.audioUrl || null,
        source: item.source || "LOCAL"
    };
}

function createRecommendationItemElement(item) {
    const song = buildRecommendationSong(item);
    const div = document.createElement("div");
    div.className = "recommendation-item";

    const reasons = Array.isArray(item.reasons) && item.reasons.length > 0
        ? item.reasons.join(" · ")
        : "Benzer şarkı";
    const sourceText = item.source === "JAMENDO" ? "Jamendo" : "Yerel";
    const coverMarkup = item.coverUrl
        ? `<div class="recommendation-cover"><img src="${item.coverUrl}" alt="${item.songName || "Şarkı"} kapağı"></div>`
        : `<div class="recommendation-cover">♪</div>`;

    div.innerHTML = `
        <div class="recommendation-main">
            ${coverMarkup}
            <div class="recommendation-copy">
                <div class="recommendation-name">${item.songName || "(isim yok)"}</div>
                <div class="recommendation-meta">${item.artistName || "Bilinmeyen şarkıcı"} · ${sourceText}</div>
                <div class="recommendation-meta">${reasons}</div>
            </div>
        </div>
        <div class="recommendation-actions"></div>
    `;

    const actions = div.querySelector(".recommendation-actions");
    if (actions) {
        if (authToken) {
            const favoriteBtn = document.createElement("button");
            const isFav = isSongFavorite(song);
            favoriteBtn.type = "button";
            favoriteBtn.className = isFav ? "recommendation-action favorite active" : "recommendation-action favorite";
            favoriteBtn.textContent = isFav ? "♥" : "♡";
            favoriteBtn.title = isFav ? "Favoriden çıkar" : "Favorilere ekle";
            favoriteBtn.onclick = async (ev) => {
                ev.stopPropagation();
                await toggleFavoriteSong(song);
                const nowFav = isSongFavorite(song);
                favoriteBtn.className = nowFav ? "recommendation-action favorite active" : "recommendation-action favorite";
                favoriteBtn.textContent = nowFav ? "♥" : "♡";
                favoriteBtn.title = nowFav ? "Favoriden çıkar" : "Favorilere ekle";
            };
            actions.appendChild(favoriteBtn);

            const addBtn = document.createElement("button");
            addBtn.type = "button";
            addBtn.className = "recommendation-action";
            addBtn.textContent = "+ Playlist";
            addBtn.title = "Playlist'e ekle";
            addBtn.onclick = async (ev) => {
                ev.stopPropagation();
                if (typeof loadPlaylists === "function") {
                    await loadPlaylists();
                }
                openPlaylistModalForSong(song);
            };
            actions.appendChild(addBtn);
        }
    }

    div.onclick = () => playSong(song);
    return div;
}

async function loadRecommendations(songId) {
    const box = document.getElementById("recommendationList");
    if (!box || !songId) return;

    box.innerHTML = '<div class="muted">Öneriler yükleniyor...</div>';
    const path = `${CONFIG.endpoints.songs}/${songId}/recommendations?limit=5`;
    const { ok, data } = await apiRequest(path, "GET", null, true);
    const items = Array.isArray(data) ? data : [];

    if (!ok || items.length === 0) {
        box.innerHTML = '<div class="muted">Bu şarkı için henüz öneri bulunamadı.</div>';
        return;
    }

    box.innerHTML = "";
    items.forEach(item => {
        box.appendChild(createRecommendationItemElement(item));
    });
}

function playSong(song) {
    currentSong = song;
    const title = song.name || song.title || song.songName || "(isim yok)";
    const artist = song.artistName || "Bilinmeyen Şarkıcı";
    const id = song.id ?? null;
    const source = song.source || "LOCAL";

    if (!id && !song.audioUrl) {
        setStatus("Şarkının oynatılabilir kaynağı yok.", false);
        return;
    }

    const url = song.audioUrl ? song.audioUrl : (CONFIG.baseUrl + "/songs/" + id + "/stream");

    playerTitleEl.textContent = title;
    playerArtistEl.textContent = artist;
    if (typeof renderPlayerCover === "function") {
        renderPlayerCover(song);
    }
    updateFavoriteButton();
    if (source === "LOCAL") {
        loadRecommendations(id);
    } else {
        const box = document.getElementById("recommendationList");
        if (box) {
            box.innerHTML = '<div class="muted">Öneriler şu an yerel kütüphane şarkıları için çalışıyor.</div>';
        }
    }

    if (currentRole === "ADMIN" && source === "LOCAL") {
        const editId = document.getElementById("editSongId");
        const editName = document.getElementById("editSongName");
        const editDur = document.getElementById("editSongDuration");
        if (editId && editName && editDur) {
            editId.value = id;
            editName.value = title;
            editDur.value = song.duration ?? 0;
        }
    }

    audio.pause();
    audio.src = url;
    audio.load();

    audio.play()
        .then(() => {
            isPlaying = true;
            playPauseBtn.textContent = "⏸";
            setStatus("Şarkı çalıyor: " + title, true);
            playerBar.classList.remove("hidden");
            recordListening(song);
        })
        .catch(err => {
            console.error(err);
            setStatus("Şarkı çalınırken hata: " + err.message, false);
        });
}

async function updateSong() {
    if (currentRole !== "ADMIN") {
        setStatus("Şarkı düzenleme sadece admin için.", false);
        return;
    }
    const id = document.getElementById("editSongId").value.trim();
    const name = document.getElementById("editSongName").value.trim();
    const durStr = document.getElementById("editSongDuration").value.trim();

    if (!id || !name) {
        setStatus("ID ve isim zorunlu.", false);
        return;
    }

    let duration = 0;
    if (durStr) {
        const d = Number(durStr);
        if (!Number.isNaN(d) && d >= 0) duration = d;
    }

    const payload = { name: name, duration: duration };
    const path = `${CONFIG.endpoints.songs}/${id}`;

    const { status, ok, data } = await apiRequest(path, "PUT", payload, true);
    setStatus("Şarkı güncelleme sonucu: HTTP " + status, ok);
    console.log("updateSong response:", data);

    if (ok) {
        showPopup("Şarkı güncellendi");
        await getSongs();
    } else {
        showCenterModal(
            "Backend güncelleme yok",
            "Frontend PUT /songs/" + id + " çağırdı ama backend bu endpoint'i tanımıyorsa 404/405 döner."
        );
    }
}
