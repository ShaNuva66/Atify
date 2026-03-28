function bindIfExists(id, eventName, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(eventName, handler);
    }
}

function setMobileNavOpen(isOpen) {
    const navToggleBtn = document.getElementById("mobileNavToggle");
    document.body.classList.toggle("nav-open", Boolean(isOpen));
    if (navToggleBtn) {
        navToggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        navToggleBtn.textContent = isOpen ? "Kapat" : "Menu";
    }
}

function toggleMobileNav() {
    setMobileNavOpen(!document.body.classList.contains("nav-open"));
}

function closeMobileNav() {
    setMobileNavOpen(false);
}

function bindStaticEvents() {
    bindIfExists("logoArea", "click", () => goHome());
    bindIfExists("mobileNavToggle", "click", () => toggleMobileNav());
    bindIfExists("headerLogoutBtn", "click", () => logout());
    bindIfExists("enterAdminBtn", "click", () => enterAs("ADMIN"));
    bindIfExists("enterUserBtn", "click", () => enterAs("USER"));

    document.querySelectorAll("nav button[data-page]").forEach(btn => {
        btn.addEventListener("click", () => showPage(btn.dataset.page, btn));
    });

    bindIfExists("loginForm", "submit", (ev) => {
        ev.preventDefault();
        login();
    });
    bindIfExists("registerForm", "submit", (ev) => {
        ev.preventDefault();
        register();
    });

    bindIfExists("searchJamendoBtn", "click", () => searchJamendoTracks());
    bindIfExists("importJamendoResultsBtn", "click", () => importCurrentJamendoResults());
    bindIfExists("showLocalSongsBtn", "click", () => showLocalSongs());
    bindIfExists("applyCatalogFiltersBtn", "click", () => applyCatalogFilters());
    bindIfExists("clearCatalogFiltersBtn", "click", () => resetCatalogFilters());
    bindIfExists("catalogSourceFilter", "change", () => applyCatalogFilters());
    bindIfExists("catalogArtistFilter", "change", () => applyCatalogFilters());
    bindIfExists("catalogSearchInput", "keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            applyCatalogFilters();
        }
    });
    bindIfExists("updateSongBtn", "click", () => updateSong());
    bindIfExists("loadArtistsBtn", "click", () => getArtists());
    bindIfExists("createArtistBtn", "click", () => createArtist());
    bindIfExists("createPlaylistBtn", "click", () => createPlaylist());
    bindIfExists("renamePlaylistBtn", "click", () => renameActivePlaylist());
    bindIfExists("deletePlaylistBtn", "click", () => deleteActivePlaylist());
    bindIfExists("savePlaylistCoverBtn", "click", () => savePlaylistCover());
    bindIfExists("useCurrentSongCoverBtn", "click", () => useCurrentSongCoverForPlaylist());
    bindIfExists("clearPlaylistCoverBtn", "click", () => clearPlaylistCover());
    bindIfExists("playlistRenameInput", "keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            renameActivePlaylist();
        }
    });
    bindIfExists("playlistCoverInput", "keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            savePlaylistCover();
        }
    });
    bindIfExists("createSongBtn", "click", () => createSong());
    bindIfExists("uploadSongBtn", "click", () => uploadSongFile());
    bindIfExists("saveJamendoPreloadBtn", "click", () => saveJamendoPreloadSettings());
    bindIfExists("runJamendoPreloadBtn", "click", () => runJamendoPreloadNow());
    bindIfExists("refreshFingerprintCatalogBtn", "click", () => loadFingerprintCatalogStatus());
    bindIfExists("reindexFingerprintCatalogBtn", "click", () => reindexFingerprintCatalog());
    bindIfExists("loadUsersBtn", "click", () => loadUsersAdmin());
    bindIfExists("loadAuditLogsBtn", "click", () => loadAuditLogs());
    bindIfExists("applyAuditFiltersBtn", "click", () => loadAuditLogs());
    bindIfExists("clearAuditFiltersBtn", "click", () => resetAuditFilters());
    bindIfExists("exportAuditCsvBtn", "click", () => exportAuditLogsCsv());
    bindIfExists("auditActionFilter", "change", () => loadAuditLogs());
    bindIfExists("auditTargetFilter", "change", () => loadAuditLogs());
    bindIfExists("auditSearchInput", "keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            loadAuditLogs();
        }
    });
    bindIfExists("auditActorInput", "keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            loadAuditLogs();
        }
    });

    bindIfExists("seekBackBtn", "click", () => seekRelative(-5));
    bindIfExists("jumpMiddleBtn", "click", () => jumpToMiddle());
    bindIfExists("playPauseBtn", "click", () => togglePlay());
    bindIfExists("seekForwardBtn", "click", () => seekRelative(5));
    bindIfExists("progressBarBg", "click", (ev) => clickProgress(ev));
    bindIfExists("volumeDownBtn", "click", () => changeVolume(-0.1));
    bindIfExists("volumeUpBtn", "click", () => changeVolume(0.1));
    bindIfExists("volumeSlider", "input", (ev) => onVolumeSliderChange(ev.target.value));
    bindIfExists("addToPlaylistBtn", "click", () => openPlaylistModalForCurrentSong());
    bindIfExists("favoriteToggleBtn", "click", () => toggleFavoriteCurrentSong());
    bindIfExists("playlistModalCloseBtn", "click", () => closePlaylistModal());
}

function initFromStorage() {
    const token = localStorage.getItem("atifyToken");
    const user = localStorage.getItem("atifyUser");
    const role = localStorage.getItem("atifyRole");

    if (token && role) {
        if (typeof isStoredTokenExpired === "function" && isStoredTokenExpired(token)) {
            handleAuthFailure("Oturum sÃ¼ren dolmuÅŸ. LÃ¼tfen tekrar giriÅŸ yap.");
            return;
        }
        authToken = token;
        loggedUsername = user;
        currentRole = role;
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById("page-home").classList.add("active");
        applyRoleToUI();
        const songsBtn = document.querySelector('nav button[data-page="songs"]');
        showPage("songs", songsBtn);
        getSongs();
        loadPlaylists();
        loadFavorites();
        loadHistory();
        if (typeof loadInsights === "function") {
            loadInsights();
        }
        setStatus("KaldÄ±ÄŸÄ±n yerden devam ediyorsun.", true);
    } else {
        setStatus("Rol seÃ§meni bekliyorum...", true);
        updateFavoriteButton();
    }

    document.addEventListener("click", () => {
        document.querySelectorAll(".song-actions-menu").forEach(m => m.style.display = "none");
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeMobileNav();
        }
    });

    document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") {
            closeMobileNav();
        }
    });
}

bindStaticEvents();
initFromStorage();






