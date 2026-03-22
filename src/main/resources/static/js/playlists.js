function getPlaylistCoverMarkup(playlist, fallbackText, extraClass = "") {
    const coverUrl = playlist && playlist.coverUrl ? playlist.coverUrl : null;
    const safeText = fallbackText || "P";
    const className = `playlist-cover${extraClass ? " " + extraClass : ""}${coverUrl ? " has-image" : ""}`;

    if (coverUrl) {
        return `<div class="${className}"><img src="${coverUrl}" alt="${safeText} kapagi"></div>`;
    }

    return `<div class="${className}">${safeText}</div>`;
}

function refreshPlaylistTargetSelects() {
    const selects = [document.getElementById("uploadPlaylistSelect")].filter(Boolean);

    selects.forEach(select => {
        const previousValue = select.value;
        select.innerHTML = '<option value="">Playlist seçme</option>';
        playlistsCache.forEach(pl => {
            const option = document.createElement("option");
            option.value = pl.id;
            option.textContent = pl.name || `Playlist #${pl.id}`;
            select.appendChild(option);
        });

        if (previousValue && playlistsCache.some(pl => String(pl.id) === String(previousValue))) {
            select.value = previousValue;
        }
    });
}

function renderPlaylistDetailControls(playlist) {
    const renameInput = document.getElementById("playlistRenameInput");
    const renameBtn = document.getElementById("renamePlaylistBtn");
    const deleteBtn = document.getElementById("deletePlaylistBtn");
    const coverInput = document.getElementById("playlistCoverInput");
    const saveCoverBtn = document.getElementById("savePlaylistCoverBtn");
    const currentCoverBtn = document.getElementById("useCurrentSongCoverBtn");
    const clearCoverBtn = document.getElementById("clearPlaylistCoverBtn");
    const titleEl = document.getElementById("playlistDetailTitle");
    const metaEl = document.getElementById("playlistDetailMeta");
    const coverEl = document.getElementById("playlistDetailCover");
    const box = document.getElementById("playlistContent");

    if (!renameInput || !renameBtn || !deleteBtn || !coverInput || !saveCoverBtn || !currentCoverBtn || !clearCoverBtn || !titleEl || !metaEl || !coverEl || !box) {
        return;
    }

    if (!playlist) {
        renameInput.value = "";
        renameInput.disabled = true;
        renameBtn.disabled = true;
        deleteBtn.disabled = true;
        coverInput.value = "";
        coverInput.disabled = true;
        saveCoverBtn.disabled = true;
        currentCoverBtn.disabled = true;
        clearCoverBtn.disabled = true;
        titleEl.textContent = "Seçili playlist yok";
        metaEl.textContent = "Kapak ve içerik burada görünecek.";
        coverEl.className = "playlist-cover large";
        coverEl.innerHTML = "P";
        box.textContent = "Bir playlist seçtiğinde şarkılar burada gözükecek.";
        return;
    }

    const name = playlist.name || "Playlist";
    const songCount = playlist.songCount ?? 0;
    const firstChar = name.trim().charAt(0).toUpperCase() || "P";

    renameInput.disabled = false;
    renameBtn.disabled = false;
    deleteBtn.disabled = false;
    coverInput.disabled = false;
    saveCoverBtn.disabled = false;
    currentCoverBtn.disabled = false;
    clearCoverBtn.disabled = false;
    renameInput.value = name;
    coverInput.value = playlist.coverUrl || "";
    titleEl.textContent = name;
    metaEl.textContent = `${songCount} şarkı · ${playlist.coverUrl ? "Kapak hazır" : "Kapak ilk şarkıdan oluşacak"}`;
    coverEl.className = playlist.coverUrl ? "playlist-cover large has-image" : "playlist-cover large";
    coverEl.innerHTML = playlist.coverUrl
        ? `<img src="${playlist.coverUrl}" alt="${name} kapagi">`
        : firstChar;
}

async function loadPlaylists() {
    const { status, ok, data } = await apiRequest(CONFIG.endpoints.playlists, "GET", null, true);
    setStatus("Playlistler getirildi: HTTP " + status, ok);

    const arr = asArrayMaybe(data);
    playlistsCache = ok ? arr : [];

    if (activePlaylistId != null && !playlistsCache.some(pl => Number(pl.id) === Number(activePlaylistId))) {
        activePlaylistId = null;
    }

    renderPlaylistsList();
    refreshPlaylistTargetSelects();

    if (activePlaylistId != null) {
        const selected = playlistsCache.find(pl => Number(pl.id) === Number(activePlaylistId));
        renderPlaylistDetailControls(selected || null);
    } else {
        renderPlaylistDetailControls(null);
    }
}

function renderPlaylistsList() {
    const listEl = document.getElementById("playlistsList");
    listEl.innerHTML = "";

    if (!playlistsCache || playlistsCache.length === 0) {
        listEl.textContent = "Henüz playlist yok. Üstten bir playlist adı girip oluşturabilirsin.";
        return;
    }

    playlistsCache.forEach(pl => {
        const div = document.createElement("div");
        div.className = "playlist-item";
        if (pl.id === activePlaylistId) div.classList.add("active");

        const name = pl.name || "(isim yok)";
        const songCount = pl.songCount ?? 0;
        const firstChar = name ? name.trim().charAt(0).toUpperCase() : "P";

        div.innerHTML = `
            ${getPlaylistCoverMarkup(pl, firstChar)}
            <div class="playlist-texts">
                <span class="playlist-name">${name}</span>
                <span class="playlist-meta">${songCount} şarkı</span>
            </div>
        `;

        div.onclick = () => selectPlaylist(pl.id);
        listEl.appendChild(div);
    });
}

async function selectPlaylist(id) {
    activePlaylistId = id;
    renderPlaylistsList();
    const selected = playlistsCache.find(pl => Number(pl.id) === Number(id));
    renderPlaylistDetailControls(selected || null);
    await loadPlaylistContent(id);
}

async function loadPlaylistContent(id) {
    if (!id && id !== 0) return;

    const path = `${CONFIG.endpoints.playlists}/${id}/songs`;
    const { status, ok, data } = await apiRequest(path, "GET", null, true);
    setStatus("Playlist içeriği getirildi: HTTP " + status, ok);

    const box = document.getElementById("playlistContent");
    const plObj = playlistsCache.find(pl => Number(pl.id) === Number(id));
    renderPlaylistDetailControls(plObj || null);

    if (!ok || !data) {
        box.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
        return;
    }

    const songsArr = asArrayMaybe(data);
    if (songsArr.length === 0) {
        box.textContent = "Bu playlistte henüz şarkı yok.";
        return;
    }

    box.innerHTML = "";
    songsArr.forEach((s, index) => {
        const div = document.createElement("div");
        div.className = "playlist-song-row";
        const title = s.name || s.title || s.songName || "(isim yok)";
        const artist = s.artistName || "Bilinmeyen Şarkıcı";

        const info = document.createElement("div");
        info.className = "playlist-song-info";
        info.innerHTML = `
            <div class="playlist-song-order">#${index + 1}</div>
            <div class="playlist-song-name">${title}</div>
            <div class="playlist-song-meta">${artist}</div>
        `;
        info.onclick = () => playSong({
            id: s.id,
            name: title,
            artistName: artist,
            coverUrl: s.coverUrl,
            audioUrl: s.audioUrl,
            source: s.source,
            duration: s.duration
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "playlist-song-remove";
        removeBtn.textContent = "Playlistten çıkar";
        removeBtn.onclick = async (ev) => {
            ev.stopPropagation();
            await removeSongFromActivePlaylist(s.id, title);
        };

        const orderActions = document.createElement("div");
        orderActions.className = "playlist-song-actions";

        const upBtn = document.createElement("button");
        upBtn.type = "button";
        upBtn.className = "playlist-song-move";
        upBtn.textContent = "^";
        upBtn.title = "Yukarı taşı";
        upBtn.disabled = index === 0;
        upBtn.onclick = async (ev) => {
            ev.stopPropagation();
            await moveSongInActivePlaylist(s.id, index - 1);
        };

        const downBtn = document.createElement("button");
        downBtn.type = "button";
        downBtn.className = "playlist-song-move";
        downBtn.textContent = "v";
        downBtn.title = "Aşağı taşı";
        downBtn.disabled = index === songsArr.length - 1;
        downBtn.onclick = async (ev) => {
            ev.stopPropagation();
            await moveSongInActivePlaylist(s.id, index + 1);
        };

        orderActions.appendChild(upBtn);
        orderActions.appendChild(downBtn);
        orderActions.appendChild(removeBtn);

        div.appendChild(info);
        div.appendChild(orderActions);
        box.appendChild(div);
    });
}

async function moveSongInActivePlaylist(songId, targetIndex) {
    if (!activePlaylistId || !songId) {
        setStatus("Önce playlist ve şarkı seçimi gerekli.", false);
        return;
    }

    const path = `${CONFIG.endpoints.playlists}/${activePlaylistId}/songs/reorder`;
    const payload = { songId, targetIndex };
    const { status, ok, data } = await apiRequest(path, "PUT", payload, true);
    setStatus("Playlist sıralama sonucu: HTTP " + status, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Şarkı sırası güncellenemedi.";
        showCenterModal("Playlist işlemi başarısız", message);
        return;
    }

    await loadPlaylistContent(activePlaylistId);
    await loadPlaylists();
}

async function removeSongFromActivePlaylist(songId, title) {
    if (!activePlaylistId || !songId) {
        setStatus("Önce playlist ve şarkı seçimi gerekli.", false);
        return;
    }

    const confirmRemove = confirm(`"${title || "Bu şarkı"}" seçili playlistten çıkarılsın mı?`);
    if (!confirmRemove) return;

    const path = `${CONFIG.endpoints.playlists}/${activePlaylistId}/songs/${songId}`;
    const { status, ok, data } = await apiRequest(path, "DELETE", null, true);
    setStatus("Playlistten çıkarma sonucu: HTTP " + status, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Şarkı playlistten çıkarılamadı.";
        showCenterModal("Playlist işlemi başarısız", message);
        return;
    }

    showPopup("Şarkı playlistten çıkarıldı");
    await loadPlaylistContent(activePlaylistId);
    await loadPlaylists();
}

async function renameActivePlaylist() {
    if (!activePlaylistId) {
        setStatus("Önce bir playlist seç.", false);
        return;
    }

    const renameInput = document.getElementById("playlistRenameInput");
    const coverInput = document.getElementById("playlistCoverInput");
    const newName = renameInput ? renameInput.value.trim() : "";
    if (!newName) {
        setStatus("Playlist adı boş olamaz.", false);
        return;
    }

    const path = `${CONFIG.endpoints.playlists}/${activePlaylistId}`;
    const { status, ok, data } = await apiRequest(path, "PUT", {
        name: newName,
        coverUrl: coverInput ? coverInput.value.trim() : ""
    }, true);
    setStatus("Playlist güncelleme sonucu: HTTP " + status, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Playlist güncellenemedi.";
        showCenterModal("Playlist işlemi başarısız", message);
        return;
    }

    showPopup("Playlist adı güncellendi");
    await loadPlaylists();
    const selected = playlistsCache.find(pl => Number(pl.id) === Number(activePlaylistId));
    renderPlaylistDetailControls(selected || null);
}

async function savePlaylistCover() {
    if (!activePlaylistId) {
        setStatus("Önce bir playlist seç.", false);
        return;
    }

    const selected = playlistsCache.find(pl => Number(pl.id) === Number(activePlaylistId));
    const renameInput = document.getElementById("playlistRenameInput");
    const coverInput = document.getElementById("playlistCoverInput");

    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.playlists}/${activePlaylistId}`, "PUT", {
        name: renameInput ? renameInput.value.trim() || (selected ? selected.name : "Playlist") : (selected ? selected.name : "Playlist"),
        coverUrl: coverInput ? coverInput.value.trim() : ""
    }, true);
    setStatus("Playlist kapak kaydetme sonucu: HTTP " + status, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Playlist kapağı kaydedilemedi.";
        showCenterModal("Playlist işlemi başarısız", message);
        return;
    }

    showPopup("Playlist kapağı güncellendi");
    await loadPlaylists();
    const refreshed = playlistsCache.find(pl => Number(pl.id) === Number(activePlaylistId));
    renderPlaylistDetailControls(refreshed || null);
}

async function useCurrentSongCoverForPlaylist() {
    const coverInput = document.getElementById("playlistCoverInput");
    if (!coverInput) return;

    if (!currentSong || !currentSong.coverUrl) {
        setStatus("Şu an çalan şarkının kullanılabilir kapağı yok.", false);
        return;
    }

    coverInput.value = currentSong.coverUrl;
    await savePlaylistCover();
}

async function clearPlaylistCover() {
    const coverInput = document.getElementById("playlistCoverInput");
    if (!coverInput) return;
    coverInput.value = "";
    await savePlaylistCover();
}

async function deleteActivePlaylist() {
    if (!activePlaylistId) {
        setStatus("Önce bir playlist seç.", false);
        return;
    }

    const selected = playlistsCache.find(pl => Number(pl.id) === Number(activePlaylistId));
    const playlistName = selected && selected.name ? selected.name : "Bu playlist";
    const confirmDelete = confirm(`"${playlistName}" kalıcı olarak silinsin mi?`);
    if (!confirmDelete) return;

    const path = `${CONFIG.endpoints.playlists}/${activePlaylistId}`;
    const { status, ok, data } = await apiRequest(path, "DELETE", null, true);
    setStatus("Playlist silme sonucu: HTTP " + status, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Playlist silinemedi.";
        showCenterModal("Playlist işlemi başarısız", message);
        return;
    }

    activePlaylistId = null;
    showPopup("Playlist silindi");
    await loadPlaylists();
    renderPlaylistDetailControls(null);
}

async function createPlaylist() {
    const name = document.getElementById("playlistName").value.trim();
    if (!name) {
        setStatus("Playlist adı zorunlu", false);
        return;
    }

    const payload = { name };
    const { status, ok, data } = await apiRequest(CONFIG.endpoints.playlists, "POST", payload, true);
    setStatus("Playlist oluşturma sonucu: HTTP " + status, ok);
    console.log("createPlaylist response:", data);

    if (ok) {
        showPopup("Playlist oluşturuldu");
        document.getElementById("playlistName").value = "";
        await loadPlaylists();
        if (data && data.id) {
            await selectPlaylist(data.id);
        }
    }
}
