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
            jamendoPreloadAdmin: "/admin/jamendo/preload",
            fingerprintAdmin: "/admin/fingerprints"
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
        playPauseBtn.classList.remove("is-playing");
    });

    function togglePlay() {
        if (!currentSong || !audio.src) return;

        if (audio.paused) {
            audio.play().then(() => {
                isPlaying = true;
                playPauseBtn.textContent = "⏸";
                playPauseBtn.classList.add("is-playing");
            }).catch(err => {
                console.error(err);
                setStatus("Şarkı çalınırken hata: " + err.message, false);
            });
        } else {
            audio.pause();
            isPlaying = false;
            playPauseBtn.textContent = "▶";
            playPauseBtn.classList.remove("is-playing");
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
        el.textContent = "";
        el.appendChild(document.createTextNode("Durum: "));
        const span = document.createElement("span");
        span.className = ok ? "ok" : "err";
        span.textContent = text;
        el.appendChild(span);
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
        clearTimeout(p._hideTimer);
        clearTimeout(p._fadeTimer);
        p.textContent = message;
        p.classList.remove("fading");
        p.style.display = "block";
        // Force reflow to restart animation
        void p.offsetWidth;
        p.classList.add("show");
        p._hideTimer = setTimeout(() => {
            p.classList.remove("show");
            p.classList.add("fading");
            p._fadeTimer = setTimeout(() => {
                p.style.display = "none";
                p.classList.remove("fading");
            }, 280);
        }, 1800);
    }

    function showConfirmModal(title, text, opts) {
        const options = opts || {};
        const overlay = document.getElementById("confirmModalOverlay");
        const titleEl = document.getElementById("confirmModalTitle");
        const textEl = document.getElementById("confirmModalText");
        const iconEl = document.getElementById("confirmModalIcon");
        const cancelBtn = document.getElementById("confirmModalCancelBtn");
        const confirmBtn = document.getElementById("confirmModalConfirmBtn");

        if (!overlay || !titleEl || !textEl || !cancelBtn || !confirmBtn) {
            return Promise.resolve(false);
        }

        titleEl.textContent = title || "Emin misin?";
        textEl.textContent = text || "Bu işlemi gerçekleştirmek istediğine emin misin?";
        if (iconEl) iconEl.textContent = options.icon || "🔐";
        confirmBtn.textContent = options.confirmLabel || "Onayla";
        cancelBtn.textContent = options.cancelLabel || "Vazgeç";

        confirmBtn.classList.remove("danger", "primary", "secondary");
        confirmBtn.classList.add(options.confirmVariant || "primary");

        return new Promise((resolve) => {
            let closed = false;

            const close = (result) => {
                if (closed) return;
                closed = true;
                overlay.classList.add("closing");
                cancelBtn.removeEventListener("click", onCancel);
                confirmBtn.removeEventListener("click", onConfirm);
                overlay.removeEventListener("click", onOverlay);
                document.removeEventListener("keydown", onKey);
                setTimeout(() => {
                    overlay.classList.remove("open", "closing");
                    overlay.style.display = "none";
                    resolve(result);
                }, 230);
            };

            const onCancel = () => close(false);
            const onConfirm = () => close(true);
            const onOverlay = (ev) => { if (ev.target === overlay) close(false); };
            const onKey = (ev) => {
                if (ev.key === "Escape") close(false);
                else if (ev.key === "Enter") close(true);
            };

            cancelBtn.addEventListener("click", onCancel);
            confirmBtn.addEventListener("click", onConfirm);
            overlay.addEventListener("click", onOverlay);
            document.addEventListener("keydown", onKey);

            overlay.classList.remove("closing");
            overlay.style.display = "flex";
            void overlay.offsetWidth;
            overlay.classList.add("open");
            setTimeout(() => confirmBtn.focus(), 60);
        });
    }

    function showCenterModal(title, text) {
        centerModalTitle.textContent = title || "Bilgi";
        centerModalText.textContent = text || "";
        centerModalOverlay.classList.remove("closing");
        centerModalOverlay.classList.add("open");
        centerModalOverlay.style.display = "flex";
        setTimeout(() => {
            centerModalOverlay.classList.add("closing");
            setTimeout(() => {
                centerModalOverlay.classList.remove("open");
                centerModalOverlay.classList.remove("closing");
                centerModalOverlay.style.display = "none";
            }, 230);
        }, 1500);
    }

    function renderPlayerCover(song) {
        if (!playerCoverEl) return;

        const coverUrl = song && song.coverUrl ? song.coverUrl : null;
        const title = song && (song.name || song.title || song.songName)
            ? (song.name || song.title || song.songName)
            : "Atify";

        playerCoverEl.textContent = "";
        if (coverUrl) {
            const img = document.createElement("img");
            img.src = coverUrl;
            img.alt = title + " kapağı";
            img.className = "cover-fade";
            playerCoverEl.appendChild(img);
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

            const nameLine = document.createElement("div");
            nameLine.textContent = name;
            div.appendChild(nameLine);

            const countLine = document.createElement("div");
            countLine.style.fontSize = "11px";
            countLine.style.color = "#9ca3af";
            countLine.textContent = count != null ? count + " şarkı" : "";
            div.appendChild(countLine);

            div.onclick = () => addSongToPlaylistFromModal(pl.id);
            playlistModalList.appendChild(div);
        });

        playlistModalOverlay.classList.remove("closing");
        playlistModalOverlay.classList.add("open");
        playlistModalOverlay.style.display = "flex";
    }

    function openPlaylistModalForCurrentSong() {
        openPlaylistModalForSong(currentSong);
    }

    function closePlaylistModal() {
        playlistModalOverlay.classList.add("closing");
        pendingPlaylistSong = null;
        setTimeout(() => {
            playlistModalOverlay.classList.remove("open");
            playlistModalOverlay.classList.remove("closing");
            playlistModalOverlay.style.display = "none";
        }, 230);
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
        if (!authToken || !loggedUsername) {
            el.textContent = "Giriş yapılmadı";
            if (logoutBtn) logoutBtn.style.display = "none";
            return;
        }
        const roleText = currentRole === "ADMIN" ? "Admin" : "Kullanıcı";
        el.innerHTML = `Rol: <b>${roleText}</b> | Giriş yapan: <b>${loggedUsername}</b>`;
        if (logoutBtn) logoutBtn.style.display = "inline-block";
    }



