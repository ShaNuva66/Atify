    const CONFIG = {
        baseUrl: window.location.origin,
        endpoints: {
            register: "/auth/register",
            login: "/auth/login",
            songs: "/songs",
            artists: "/artists",
            playlists: "/playlists",
            users: "/users",
            auditLogs: "/audit-logs",
            favorites: "/favorites",
            history: "/history",
            jamendoPreloadAdmin: "/admin/jamendo/preload"
        }
    };

    let authToken = null;
    let loggedUsername = null;
    let currentRole = null;
    let currentSong = null;
    let isPlaying = false;

    let playlistsCache = [];
    let activePlaylistId = null;
    let pendingPlaylistSong = null;

    let songsCache = [];
    let jamendoCache = [];
    let allArtistsCache = [];
    let currentSongsSource = "LOCAL";
    let currentCatalogItems = [];
    let currentCatalogEmptyMessage = "Hiç şarkı bulunamadı.";
    let favoritesCache = [];
    let favoriteSongIds = new Set();
    let favoriteExternalRefs = new Map();
    let recentHistoryCache = [];
    let topHistoryCache = [];
    let dashboardStatsCache = null;
    let topArtistsInsightsCache = [];
    let personalRecommendationsCache = [];
    let suppressUnauthorizedStatusUntil = 0;

    const audio = document.getElementById("audioPlayer");
    const playerTitleEl = document.getElementById("playerTitle");
    const playerArtistEl = document.getElementById("playerArtist");
    const playerCoverEl = document.getElementById("playerCover");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const currentTimeLabel = document.getElementById("currentTimeLabel");
    const durationLabel = document.getElementById("durationLabel");
    const progressBarFill = document.getElementById("progressBarFill");
    const volumeSlider = document.getElementById("volumeSlider");
    const playerBar = document.getElementById("playerBar");
    const favoriteToggleBtn = document.getElementById("favoriteToggleBtn");

    const playlistModalOverlay = document.getElementById("playlistModalOverlay");
    const playlistModalList = document.getElementById("playlistModalList");

    const centerModalOverlay = document.getElementById("centerModalOverlay");
    const centerModalTitle = document.getElementById("centerModalTitle");
    const centerModalText = document.getElementById("centerModalText");

    const artistSuggestionsBox = document.getElementById("artistSuggestions");
    const artistNameInput = document.getElementById("songArtistNameInput");
    const artistIdHidden = document.getElementById("songArtistIdHidden");

    function formatTime(sec) {
        if (!isFinite(sec)) return "0:00";
        sec = Math.floor(sec);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m + ":" + (s < 10 ? "0" + s : s);
    }

    audio.volume = 1;

    audio.addEventListener("timeupdate", () => {
        currentTimeLabel.textContent = formatTime(audio.currentTime);
        durationLabel.textContent = formatTime(audio.duration || 0);
        const ratio = audio.duration ? (audio.currentTime / audio.duration) : 0;
        progressBarFill.style.width = (ratio * 100).toFixed(1) + "%";
    });

    audio.addEventListener("ended", () => {
        isPlaying = false;
        playPauseBtn.textContent = "▶";
    });

    function togglePlay() {
        if (!currentSong || !audio.src) return;

        if (audio.paused) {
            audio.play().then(() => {
                isPlaying = true;
                playPauseBtn.textContent = "⏸";
            }).catch(err => {
                console.error(err);
                setStatus("Şarkı çalınırken hata: " + err.message, false);
            });
        } else {
            audio.pause();
            isPlaying = false;
            playPauseBtn.textContent = "▶";
        }
    }

    function seekRelative(deltaSec) {
        if (!audio.duration) return;
        let t = audio.currentTime + deltaSec;
        if (t < 0) t = 0;
        if (t > audio.duration) t = audio.duration;
        audio.currentTime = t;
    }

    function clickProgress(ev) {
        const bar = ev.currentTarget;
        const rect = bar.getBoundingClientRect();
        const ratio = (ev.clientX - rect.left) / rect.width;
        if (!audio.duration) return;
        audio.currentTime = ratio * audio.duration;
    }

    function jumpToMiddle() {
        if (!audio.duration) return;
        audio.currentTime = audio.duration / 2;
    }

    function changeVolume(delta) {
        let v = audio.volume + delta;
        if (v < 0) v = 0;
        if (v > 1) v = 1;
        audio.volume = v;
        volumeSlider.value = v.toFixed(2);
    }

    function onVolumeSliderChange(v) {
        const val = Number(v);
        if (Number.isFinite(val)) {
            audio.volume = val;
        }
    }

    function setStatus(msg, ok = true) {
        const text = typeof msg === "string" ? msg : String(msg ?? "");
        if (Date.now() < suppressUnauthorizedStatusUntil && /HTTP\s+(401|403)\b/i.test(text)) {
            return;
        }
        const el = document.getElementById("status");
        el.innerHTML = `Durum: ${ok ? '<span class="ok">'+msg+'</span>' : '<span class="err">'+msg+'</span>'}`;
    }

    function suppressUnauthorizedStatus(durationMs = 1500) {
        suppressUnauthorizedStatusUntil = Date.now() + durationMs;
    }

    function extractUnexpectedErrorMessage(raw) {
        if (!raw) return "Bilinmeyen hata";
        if (typeof raw === "string") return raw;
        if (raw instanceof Error) return raw.message || raw.toString();
        if (raw.reason) return extractUnexpectedErrorMessage(raw.reason);
        if (raw.message) return raw.message;
        return String(raw);
    }

    window.addEventListener("error", (event) => {
        const message = extractUnexpectedErrorMessage(event.error || event.message);
        if (!message) return;
        console.error("Unhandled UI error:", event.error || event.message);
        setStatus("Beklenmeyen arayüz hatası: " + message, false);
    });

    window.addEventListener("unhandledrejection", (event) => {
        const message = extractUnexpectedErrorMessage(event.reason);
        if (!message) return;
        console.error("Unhandled promise rejection:", event.reason);
        setStatus("İşlem sırasında beklenmeyen hata: " + message, false);
    });

    function showPopup(message) {
        const p = document.getElementById("popup");
        p.textContent = message;
        p.style.display = "block";
        setTimeout(() => { p.style.display = "none"; }, 2000);
    }

    function showCenterModal(title, text) {
        centerModalTitle.textContent = title || "Bilgi";
        centerModalText.textContent = text || "";
        centerModalOverlay.style.display = "flex";
        setTimeout(() => {
            centerModalOverlay.style.display = "none";
        }, 1500);
    }

    function renderPlayerCover(song) {
        if (!playerCoverEl) return;

        const coverUrl = song && song.coverUrl ? song.coverUrl : null;
        const title = song && (song.name || song.title || song.songName)
            ? (song.name || song.title || song.songName)
            : "Atify";

        if (coverUrl) {
            playerCoverEl.innerHTML = `<img src="${coverUrl}" alt="${title} kapağı">`;
            playerCoverEl.classList.add("has-image");
        } else {
            playerCoverEl.textContent = "♪";
            playerCoverEl.classList.remove("has-image");
        }
    }

    function openPlaylistModalForSong(song) {
        if (!song || !song.id) {
            setStatus("Önce bir şarkı seçip çal.", false);
            return;
        }
        if (!playlistsCache || playlistsCache.length === 0) {
            setStatus("Önce bir playlist oluştur.", false);
            showCenterModal("Playlist yok", "Şarkıyı eklemek için önce en az bir playlist oluştur.");
            return;
        }
        pendingPlaylistSong = song;
        playlistModalList.innerHTML = "";

        playlistsCache.forEach(pl => {
            const div = document.createElement("div");
            div.className = "playlist-modal-item";
            const name = pl.name || "(isim yok)";
            const count = pl.songCount ?? (Array.isArray(pl.songs) ? pl.songs.length : null);
            div.innerHTML = `
                <div>${name}</div>
                <div style="font-size:11px;color:#9ca3af;">${count != null ? count + ' şarkı' : ''}</div>
            `;
            div.onclick = () => addSongToPlaylistFromModal(pl.id);
            playlistModalList.appendChild(div);
        });

        playlistModalOverlay.style.display = "flex";
    }

    function openPlaylistModalForCurrentSong() {
        openPlaylistModalForSong(currentSong);
    }

    function closePlaylistModal() {
        playlistModalOverlay.style.display = "none";
        pendingPlaylistSong = null;
    }

    async function addSongToPlaylistFromModal(playlistId) {
        if (!pendingPlaylistSong || !pendingPlaylistSong.id) return;

        let path;
        let body = null;

        if (pendingPlaylistSong.source === "JAMENDO") {
            path = `${CONFIG.endpoints.playlists}/${playlistId}/jamendo`;
            body = {
                jamendoId: pendingPlaylistSong.jamendoId || pendingPlaylistSong.id,
                name: pendingPlaylistSong.name || pendingPlaylistSong.title || pendingPlaylistSong.songName,
                artistName: pendingPlaylistSong.artistName,
                albumName: pendingPlaylistSong.albumName || null,
                coverUrl: pendingPlaylistSong.coverUrl || null,
                audioUrl: pendingPlaylistSong.audioUrl || null,
                shareUrl: pendingPlaylistSong.externalUrl || null,
                licenseUrl: pendingPlaylistSong.licenseUrl || null,
                duration: pendingPlaylistSong.duration || 0
            };
        } else {
            path = `${CONFIG.endpoints.playlists}/${playlistId}/songs/${pendingPlaylistSong.id}`;
        }

        const { status, ok, data } = await apiRequest(path, "POST", body, true);
        setStatus("Playlist'e şarkı ekleme sonucu: HTTP " + status, ok);
        console.log("addSongToPlaylistFromModal response:", data);

        if (ok) {
            const title =
                pendingPlaylistSong.name ||
                pendingPlaylistSong.title ||
                pendingPlaylistSong.songName ||
                "Şarkı";
            if (pendingPlaylistSong.source === "JAMENDO" && data && data.id) {
                pendingPlaylistSong.id = data.id;
                pendingPlaylistSong.source = data.source || "JAMENDO";
            }
            closePlaylistModal();
            showPopup("Şarkı playlistine eklendi");
            showCenterModal("Başarılı", `"${title}" playlistine eklendi.`);
            if (Number(playlistId) === Number(activePlaylistId)) {
                loadPlaylistContent(playlistId);
            }
            loadPlaylists();
        } else {
            const errorText = data && data.message
                ? data.message
                : (typeof data === "string" ? data : "Şarkı playlist'e eklenemedi.");
            showCenterModal("Ekleme başarısız", errorText);
        }
    }

    function updateUserInfo() {
        const el = document.getElementById("userInfo");
        const logoutBtn = document.getElementById("headerLogoutBtn");
        if (!currentRole) {
            el.textContent = "Rol seçilmedi";
            if (logoutBtn) logoutBtn.style.display = "none";
            return;
        }
        const roleText = currentRole === "ADMIN" ? "Admin" : "Kullanıcı";
        if (authToken && loggedUsername) {
            el.innerHTML = `Rol: <b>${roleText}</b> | Giriş yapan: <b>${loggedUsername}</b>`;
            if (logoutBtn) logoutBtn.style.display = "inline-block";
        } else {
            el.innerHTML = `Rol: <b>${roleText}</b> | Giriş yapılmamış`;
            if (logoutBtn) logoutBtn.style.display = "none";
        }
    }

