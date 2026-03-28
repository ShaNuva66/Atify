async function getArtists() {
    const { status, ok, data } = await apiRequest(CONFIG.endpoints.artists, "GET", null, true);
    setStatus("Sanatçılar getirildi: HTTP " + status, ok);

    const list = document.getElementById("artistsList");
    const arr = asArrayMaybe(data);
    allArtistsCache = ok ? arr : allArtistsCache;

    if (!ok || arr.length === 0) {
        list.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
        return;
    }

    list.innerHTML = "";
    arr.forEach(a => {
        const div = document.createElement("div");
        div.className = "item";
        const id = a.id ?? "";
        const name = a.name || "(isim yok)";
        div.innerHTML = `<b>${name}</b> ${id !== "" ? "(#" + id + ")" : ""}`;
        list.appendChild(div);
    });
}

async function createArtist() {
    if (currentRole !== "ADMIN") {
        setStatus("Sanatçı ekleme sadece admin için.", false);
        return;
    }
    const name = document.getElementById("artistName").value.trim();
    if (!name) {
        setStatus("Sanatçı adı zorunlu", false);
        return;
    }

    const payload = { name };
    const { status, ok, data } = await apiRequest(CONFIG.endpoints.artists, "POST", payload, true);
    setStatus("Sanatçı ekleme sonucu: HTTP " + status, ok);
    console.log("createArtist response:", data);
    if (ok) {
        showPopup("Sanatçı eklendi");
        document.getElementById("artistName").value = "";
        getArtists();
    }
}

async function ensureArtistsCache() {
    if (allArtistsCache.length > 0) return;
    const { ok, data } = await apiRequest(CONFIG.endpoints.artists, "GET", null, true);
    if (ok) allArtistsCache = asArrayMaybe(data);
}

function clearArtistSelection(inputId, hiddenId, suggestionsId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const suggestions = document.getElementById(suggestionsId);

    if (input) input.value = "";
    if (hidden) hidden.value = "";
    if (suggestions) {
        suggestions.style.display = "none";
        suggestions.innerHTML = "";
    }
}

function bindArtistAutocomplete(inputId, hiddenId, boxId, suggestionsId) {
    const input = document.getElementById(inputId);
    const hidden = document.getElementById(hiddenId);
    const box = document.getElementById(boxId);
    const suggestions = document.getElementById(suggestionsId);

    if (!input || !hidden || !box || !suggestions) return;

    input.addEventListener("input", async () => {
        const query = input.value.trim().toLowerCase();
        hidden.value = "";

        if (!query) {
            suggestions.style.display = "none";
            suggestions.innerHTML = "";
            return;
        }

        await ensureArtistsCache();
        const filtered = allArtistsCache.filter(a =>
            a.name && a.name.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            suggestions.style.display = "none";
            suggestions.innerHTML = "";
            return;
        }

        suggestions.innerHTML = "";
        filtered.forEach(a => {
            const div = document.createElement("div");
            div.className = "artist-suggestion-item";
            div.textContent = `${a.name} (id: ${a.id})`;
            div.onclick = () => {
                input.value = a.name;
                hidden.value = a.id;
                suggestions.style.display = "none";
                suggestions.innerHTML = "";
            };
            suggestions.appendChild(div);
        });
        suggestions.style.display = "block";
    });

    document.addEventListener("click", (e) => {
        if (!box.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });
}

bindArtistAutocomplete("songArtistNameInput", "songArtistIdHidden", "artistSuggestBox", "artistSuggestions");
bindArtistAutocomplete("uploadArtistNameInput", "uploadArtistIdHidden", "uploadArtistSuggestBox", "uploadArtistSuggestions");

async function createSong() {
    if (currentRole !== "ADMIN") {
        setStatus("Şarkı ekleme sadece admin için.", false);
        return;
    }

    const title = document.getElementById("songTitle").value.trim();
    const artistIdVal = document.getElementById("songArtistIdHidden").value.trim();
    const durationStr = document.getElementById("songDuration").value.trim();
    const playlistStr = document.getElementById("songPlaylistIds").value.trim();

    if (!title || !artistIdVal) {
        setStatus("Şarkı adı ve sanatçı seçimi zorunlu (önerilerden seç).", false);
        return;
    }

    let duration = 0;
    if (durationStr) {
        const d = Number(durationStr);
        if (!Number.isNaN(d) && d >= 0) duration = d;
    }

    let playlistIdList = [];
    if (playlistStr) {
        playlistIdList = playlistStr
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => Number(s))
            .filter(n => !Number.isNaN(n));
    }

    const payload = {
        name: title,
        artistId: Number(artistIdVal),
        duration
    };
    if (playlistIdList.length > 0) payload.playlistIdList = playlistIdList;

    const { status, ok, data } = await apiRequest(CONFIG.endpoints.songs, "POST", payload, true);
    setStatus("Şarkı ekleme sonucu: HTTP " + status, ok);
    console.log("createSong response:", data);

    if (ok) {
        showPopup("Şarkı eklendi");
        document.getElementById("songTitle").value = "";
        document.getElementById("songDuration").value = "";
        document.getElementById("songPlaylistIds").value = "";
        clearArtistSelection("songArtistNameInput", "songArtistIdHidden", "artistSuggestions");
        getSongs();
    }
}

async function uploadSongFile() {
    if (currentRole !== "ADMIN") {
        setStatus("MP3 yükleme sadece admin için.", false);
        return;
    }

    const name = document.getElementById("uploadSongName").value.trim();
    const artistIdVal = document.getElementById("uploadArtistIdHidden").value.trim();
    const albumIdVal = document.getElementById("uploadAlbumId").value.trim();
    const playlistIdVal = document.getElementById("uploadPlaylistSelect").value.trim();
    const fileInput = document.getElementById("uploadSongFile");
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (!name || !artistIdVal || !file) {
        setStatus("Şarkı adı, sanatçı ve mp3 dosyası zorunlu.", false);
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("artistId", artistIdVal);
    if (albumIdVal) {
        formData.append("albumId", albumIdVal);
    }

    try {
        const response = await fetch(`${CONFIG.baseUrl}/songs/upload`, {
            method: "POST",
            headers: authToken ? { Authorization: "Bearer " + authToken } : {},
            body: formData
        });

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        if (maybeHandleAuthFailure(response.status, data, "/songs/upload", "POST")) {
            return;
        }

        setStatus("MP3 yükleme sonucu: HTTP " + response.status, response.ok);

        if (!response.ok) {
            const message = data && data.message ? data.message : (typeof data === "string" ? data : "Yükleme başarısız oldu.");
            showCenterModal("Yükleme başarısız", message);
            return;
        }

        if (playlistIdVal && data && data.id) {
            const addRes = await apiRequest(`${CONFIG.endpoints.playlists}/${playlistIdVal}/songs/${data.id}`, "POST", null, true);
            if (!addRes.ok) {
                const message = addRes.data && addRes.data.message ? addRes.data.message : "Şarkı yüklendi ama playlist'e eklenemedi.";
                showCenterModal("Kısmi başarı", message);
            } else {
                showPopup("MP3 yüklendi ve playliste eklendi");
            }
        } else {
            showPopup("MP3 yüklendi");
        }

        document.getElementById("uploadSongName").value = "";
        document.getElementById("uploadAlbumId").value = "";
        document.getElementById("uploadPlaylistSelect").value = "";
        if (fileInput) {
            fileInput.value = "";
        }
        clearArtistSelection("uploadArtistNameInput", "uploadArtistIdHidden", "uploadArtistSuggestions");
        await getSongs();
    } catch (err) {
        console.error(err);
        setStatus("MP3 yüklenirken hata: " + err.message, false);
    }
}
