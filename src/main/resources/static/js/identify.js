    // ─── Identify / Shazam modal state ───────────────────────────────────────
    let identifyMediaRecorder = null;
    let identifyRecordingChunks = [];
    let identifyCountdownTimer = null;
    let identifyFoundSong = null;   // last IdentifyResponse with found=true

    const RECORD_SECONDS = 10;

    // DOM refs (safe — called after DOMContentLoaded via init.js)
    function getIdEl(id) { return document.getElementById(id); }

    // ─── Open / close ────────────────────────────────────────────────────────

    function openIdentifyModal() {
        if (!authToken) {
            setStatus("Şarkı tanımak için önce giriş yap.", false);
            showPage("home", document.querySelector('nav button[data-page="home"]'));
            return;
        }
        identifyFoundSong = null;
        showIdentifyView("idle");
        getIdEl("identifyModalOverlay").classList.add("open");
        document.body.classList.add("identify-open");
    }

    function closeIdentifyModal() {
        stopIdentifyRecording();
        const overlay = getIdEl("identifyModalOverlay");
        if (!overlay) return;
        overlay.classList.add("closing");
        document.body.classList.remove("identify-open");
        setTimeout(() => {
            overlay.classList.remove("open");
            overlay.classList.remove("closing");
        }, 240);
    }

    // ─── View switcher ───────────────────────────────────────────────────────

    function showIdentifyView(view) {
        ["identifyIdleView", "identifyListeningView", "identifyResultView", "identifyNotFoundView"].forEach(id => {
            const el = getIdEl(id);
            if (el) el.style.display = "none";
        });
        const target = getIdEl(
            view === "idle"     ? "identifyIdleView" :
            view === "listen"   ? "identifyListeningView" :
            view === "result"   ? "identifyResultView" :
                                  "identifyNotFoundView"
        );
        if (target) target.style.display = "flex";
    }

    // ─── Recording ───────────────────────────────────────────────────────────

    async function startIdentifyRecording() {
        if (!authToken) { closeIdentifyModal(); return; }

        identifyFoundSong = null;
        identifyRecordingChunks = [];

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            setStatus("Mikrofon erişimi reddedildi: " + err.message, false);
            showIdentifyView("idle");
            return;
        }

        showIdentifyView("listen");
        let remaining = RECORD_SECONDS;
        const countdownEl = getIdEl("identifyCountdownLabel");
        if (countdownEl) countdownEl.textContent = `Dinleniyor... ${remaining}s`;

        identifyCountdownTimer = setInterval(() => {
            remaining--;
            if (countdownEl) countdownEl.textContent = `Dinleniyor... ${remaining}s`;
            if (remaining <= 0) {
                clearInterval(identifyCountdownTimer);
                identifyCountdownTimer = null;
            }
        }, 1000);

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

        identifyMediaRecorder = new MediaRecorder(stream, { mimeType });

        identifyMediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) identifyRecordingChunks.push(e.data);
        };

        identifyMediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            clearInterval(identifyCountdownTimer);
            identifyCountdownTimer = null;
            await submitIdentifySample();
        };

        identifyMediaRecorder.start();

        setTimeout(() => {
            if (identifyMediaRecorder && identifyMediaRecorder.state === "recording") {
                identifyMediaRecorder.stop();
            }
        }, RECORD_SECONDS * 1000);
    }

    function stopIdentifyRecording() {
        clearInterval(identifyCountdownTimer);
        identifyCountdownTimer = null;
        if (identifyMediaRecorder && identifyMediaRecorder.state === "recording") {
            try { identifyMediaRecorder.stop(); } catch (_) {}
        }
        identifyMediaRecorder = null;
        identifyRecordingChunks = [];
    }

    // ─── Submit to backend ───────────────────────────────────────────────────

    async function submitIdentifySample() {
        if (!authToken) { closeIdentifyModal(); return; }

        if (identifyRecordingChunks.length === 0) {
            showIdentifyView("notfound");
            return;
        }

        const blob = new Blob(identifyRecordingChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "sample.webm");

        const countdownEl = getIdEl("identifyCountdownLabel");
        if (countdownEl) countdownEl.textContent = "Analiz ediliyor...";
        showIdentifyView("listen");

        try {
            const res = await fetch(CONFIG.baseUrl + "/api/identify", {
                method: "POST",
                headers: { "Authorization": "Bearer " + authToken },
                body: formData
            });

            if (res.status === 401 || res.status === 403) {
                handleAuthFailure("Oturum süresi dolmuş. Lütfen tekrar giriş yap.");
                closeIdentifyModal();
                return;
            }

            if (!res.ok) {
                setStatus("Tanıma isteği başarısız: HTTP " + res.status, false);
                showIdentifyView("notfound");
                return;
            }

            let data = null;
            try {
                data = await res.json();
            } catch (_) {
                data = null;
            }

            if (data && data.found) {
                identifyFoundSong = data;
                renderIdentifyResult(data);
                showIdentifyView("result");
            } else {
                showIdentifyView("notfound");
            }
        } catch (err) {
            console.error("identify error:", err);
            setStatus("Tanıma isteği başarısız: " + err.message, false);
            showIdentifyView("notfound");
        }
    }

    // ─── Render result ───────────────────────────────────────────────────────

    function renderIdentifyResult(data) {
        const titleEl   = getIdEl("identifyResultTitle");
        const artistEl  = getIdEl("identifyResultArtist");
        const coverEl   = getIdEl("identifyResultCover");
        const playBtn   = getIdEl("identifyPlayBtn");
        const plBtn     = getIdEl("identifyAddPlaylistBtn");

        if (titleEl)  titleEl.textContent  = data.title  || "Bilinmiyor";
        if (artistEl) artistEl.textContent = data.artist || "Bilinmiyor";

        if (coverEl) {
            coverEl.textContent = "";
            if (data.coverUrl) {
                const img = document.createElement("img");
                img.src = data.coverUrl;
                img.alt = "Kapak";
                coverEl.appendChild(img);
                coverEl.classList.add("has-image");
            } else {
                coverEl.textContent = "♪";
                coverEl.classList.remove("has-image");
            }
        }

        // Show play button only when we have an audio URL
        if (playBtn) {
            if (data.audioUrl) {
                playBtn.style.display = "inline-flex";
            } else {
                playBtn.style.display = "none";
            }
        }

        // Playlist button always visible when a song is found
        if (plBtn) plBtn.style.display = "inline-flex";
    }

    // ─── Actions from result view ────────────────────────────────────────────

    function identifyPlayNow() {
        if (!identifyFoundSong || !identifyFoundSong.audioUrl) return;

        const song = {
            id:         identifyFoundSong.songId,
            name:       identifyFoundSong.title,
            artistName: identifyFoundSong.artist,
            coverUrl:   identifyFoundSong.coverUrl,
            audioUrl:   identifyFoundSong.audioUrl,
            source:     identifyFoundSong.source || "LOCAL"
        };

        closeIdentifyModal();
        playSong(song);
    }

    function identifyAddToPlaylist() {
        if (!identifyFoundSong) return;

        const song = {
            id:         identifyFoundSong.songId,
            name:       identifyFoundSong.title,
            artistName: identifyFoundSong.artist,
            coverUrl:   identifyFoundSong.coverUrl,
            audioUrl:   identifyFoundSong.audioUrl,
            source:     identifyFoundSong.source || "LOCAL"
        };

        closeIdentifyModal();
        openPlaylistModalForSong(song);
    }
