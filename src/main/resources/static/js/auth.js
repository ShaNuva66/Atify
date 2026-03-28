    function applyRoleToUI() {
        const panelLabel = document.getElementById("panelLabel");
        const homeTitle  = document.getElementById("homeTitle");
        const homeDesc   = document.getElementById("homeDesc");
        const homeNavBtn = document.querySelector('nav button[data-page="home"]');
        const authBox = document.getElementById("authBox");
        const homeDashboard = document.getElementById("homeDashboard");
        const artistRoleText = document.getElementById("artistRoleText");
        const artistAdminBox = document.getElementById("artistAdminBox");
        const songEditContainer = document.getElementById("songEditContainer");
        const importJamendoResultsBtn = document.getElementById("importJamendoResultsBtn");
        const isLoggedIn = Boolean(authToken && loggedUsername);

        if (!currentRole) {
            panelLabel.textContent = "Admin / Kullanıcı Paneli";
            homeTitle.textContent = "Giriş";
            homeDesc.textContent = "Giriş yap, sonra şarkı ve playlist ekranlarına geç.";
            if (homeNavBtn) homeNavBtn.textContent = "Giriş";
            if (authBox) authBox.style.display = "";
            if (homeDashboard) homeDashboard.style.display = "none";
            if (artistRoleText) artistRoleText.textContent = "";
            if (artistAdminBox) artistAdminBox.style.display = "none";
            if (songEditContainer) songEditContainer.style.display = "none";
        } else if (currentRole === "ADMIN" && isLoggedIn) {
            panelLabel.textContent = "Admin Paneli";
            homeTitle.textContent  = "Admin Ana Sayfa";
            homeDesc.textContent   = "Yönetim araçların, favorilerin ve dinleme özetin burada.";
            if (homeNavBtn) homeNavBtn.textContent = "Ana Sayfa";
            if (authBox) authBox.style.display = "none";
            if (homeDashboard) homeDashboard.style.display = "block";
            if (artistRoleText) artistRoleText.textContent = "Adminler sanatçı ekleyebilir.";
            if (artistAdminBox) artistAdminBox.style.display = "";
            if (songEditContainer) songEditContainer.style.display = "block";
        } else if (currentRole === "USER" && isLoggedIn) {
            panelLabel.textContent = "Kullanıcı Paneli";
            homeTitle.textContent  = "Ana Sayfa";
            homeDesc.textContent   = "Favorilerin, en çok dinlediklerin ve hızlı özetin burada.";
            if (homeNavBtn) homeNavBtn.textContent = "Ana Sayfa";
            if (authBox) authBox.style.display = "none";
            if (homeDashboard) homeDashboard.style.display = "block";
            if (artistRoleText) artistRoleText.textContent = "Kullanıcılar sanatçı ekleyemez.";
            if (artistAdminBox) artistAdminBox.style.display = "none";
            if (songEditContainer) songEditContainer.style.display = "none";
        } else {
            panelLabel.textContent = currentRole === "ADMIN" ? "Admin Paneli" : "Kullanıcı Paneli";
            homeTitle.textContent  = currentRole === "ADMIN" ? "Admin Girişi" : "Kullanıcı Girişi";
            homeDesc.textContent   = "Giriş yap, sonra şarkı ve playlist ekranlarına geç.";
            if (homeNavBtn) homeNavBtn.textContent = "Giriş";
            if (authBox) authBox.style.display = "";
            if (homeDashboard) homeDashboard.style.display = "none";
            if (artistRoleText) artistRoleText.textContent = currentRole === "ADMIN"
                ? "Adminler sanatçı ekleyebilir."
                : "Kullanıcılar sanatçı ekleyemez.";
            if (artistAdminBox) artistAdminBox.style.display = currentRole === "ADMIN" ? "" : "none";
            if (songEditContainer) songEditContainer.style.display = currentRole === "ADMIN" ? "block" : "none";
        }

        document.querySelectorAll("nav button").forEach(btn => {
            const needRole = btn.getAttribute("data-role");
            const pageId = btn.getAttribute("data-page");

            if (isLoggedIn && pageId === "register") {
                btn.style.display = "none";
            } else if (!isLoggedIn && pageId !== "home" && pageId !== "register") {
                btn.style.display = "none";
            } else if (!needRole || needRole === "BOTH") {
                btn.style.display = "inline-block";
            } else if (needRole === "ADMIN" && currentRole !== "ADMIN") {
                btn.style.display = "none";
            } else if (needRole === "USER" && currentRole !== "USER") {
                btn.style.display = "none";
            } else {
                btn.style.display = "inline-block";
            }
        });

        if (importJamendoResultsBtn) {
            importJamendoResultsBtn.style.display = currentRole === "ADMIN" ? "inline-block" : "none";
        }
        if (typeof syncJamendoBulkImportButton === "function") {
            syncJamendoBulkImportButton();
        }

        updateUserInfo();
    }

    let authResetInProgress = false;

    function decodeJwtPayload(token) {
        if (!token) return null;
        const parts = token.split(".");
        if (parts.length < 2) return null;

        try {
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
            const json = decodeURIComponent(Array.from(atob(padded))
                .map(ch => "%" + ch.charCodeAt(0).toString(16).padStart(2, "0"))
                .join(""));
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    function isStoredTokenExpired(token) {
        const payload = decodeJwtPayload(token);
        if (!payload || typeof payload.exp !== "number") {
            return true;
        }
        return Date.now() >= payload.exp * 1000;
    }

    function extractApiMessage(data) {
        if (!data) return "";
        if (typeof data === "string") return data.trim();
        if (typeof data.message === "string") return data.message.trim();
        return "";
    }

    function isAdminOnlyRequest(path, method = "GET") {
        if (!path) return false;
        const upperMethod = (method || "GET").toUpperCase();

        if (path.startsWith(CONFIG.endpoints.users) ||
            path.startsWith(CONFIG.endpoints.auditLogs) ||
            path.startsWith(CONFIG.endpoints.jamendoPreloadAdmin) ||
            path.startsWith("/admin/")) {
            return true;
        }

        return ["POST", "PUT", "DELETE"].includes(upperMethod) &&
            (path.startsWith(CONFIG.endpoints.songs) || path.startsWith(CONFIG.endpoints.artists));
    }

    function resetClientSession({
        statusMessage = "",
        statusOk = true,
        popupMessage = null,
        modalTitle = null,
        modalText = null
    } = {}) {
        if (authResetInProgress) return;
        authResetInProgress = true;

        authToken = null;
        loggedUsername = null;
        currentRole = null;
        currentSong = null;
        favoritesCache = [];
        favoriteSongIds = new Set();
        favoriteExternalRefs = new Map();
        recentHistoryCache = [];
        topHistoryCache = [];
        dashboardStatsCache = null;
        topArtistsInsightsCache = [];
        personalRecommendationsCache = [];

        if (audio) {
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
        }
        if (playerBar) {
            playerBar.classList.add("hidden");
        }
        if (typeof renderPlayerCover === "function") {
            renderPlayerCover(null);
        }

        localStorage.removeItem("atifyToken");
        localStorage.removeItem("atifyUser");
        localStorage.removeItem("atifyRole");

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById("page-roleSelect").classList.add("active");
        document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
        if (typeof closeMobileNav === "function") closeMobileNav();

        applyRoleToUI();
        updateFavoriteButton();

        setTimeout(() => {
            if (statusMessage) {
                setStatus(statusMessage, statusOk);
            }
            if (popupMessage) {
                showPopup(popupMessage);
            }
            if (modalTitle || modalText) {
                showCenterModal(modalTitle || "Bilgi", modalText || "");
            }
            authResetInProgress = false;
        }, 0);
    }

    function handleAuthFailure(message = "Oturum süren doldu ya da geçersiz hale geldi. Lütfen tekrar giriş yap.") {
        if (typeof suppressUnauthorizedStatus === "function") {
            suppressUnauthorizedStatus();
        }
        resetClientSession({
            statusMessage: message,
            statusOk: false,
            modalTitle: "Oturum yeniden gerekli",
            modalText: message
        });
    }

    function maybeHandleAuthFailure(status, data, path, method = "GET") {
        if (!authToken) return false;

        if (status === 401) {
            handleAuthFailure(extractApiMessage(data) || "Oturum doğrulanamadı. Lütfen tekrar giriş yap.");
            return true;
        }

        if (status === 403) {
            const adminOnlyRequest = isAdminOnlyRequest(path, method);
            const shouldReset = !adminOnlyRequest || currentRole === "ADMIN";
            if (shouldReset) {
                handleAuthFailure(extractApiMessage(data) || "Bu oturum artık geçerli değil. Lütfen yeniden giriş yap.");
                return true;
            }
        }

        return false;
    }

    function enterAs(role) {
        currentRole = role;
        localStorage.setItem("atifyRole", role);

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById("page-home").classList.add("active");
        document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
        document.querySelector('nav button[data-page="home"]').classList.add("active");
        if (typeof closeMobileNav === "function") closeMobileNav();
        applyRoleToUI();
        setStatus(role === "ADMIN" ? "Admin paneline geçtin." : "Kullanıcı paneline geçtin.", true);
    }

    function showPage(pageId, btn) {
        if (!currentRole) {
            setStatus("Önce Admin / Kullanıcı olarak giriş tipini seç.", false);
            return;
        }
        if (currentRole !== "ADMIN" && (pageId === "artists" || pageId === "addSong" || pageId === "users" || pageId === "audit")) {
            setStatus("Bu alan sadece admin için.", false);
            return;
        }

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        const pageEl = document.getElementById("page-" + pageId);
        if (pageEl) pageEl.classList.add("active");

        if (btn) {
            document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        }
        if (typeof closeMobileNav === "function") closeMobileNav();

        if (pageId === "songs" && authToken) {
            getSongs();
        }
        if (pageId === "playlists" && authToken) {
            loadPlaylists();
        }
        if (pageId === "addSong" && authToken) {
            loadPlaylists();
            if (typeof loadJamendoPreloadSettings === "function") {
                loadJamendoPreloadSettings();
            }
        }
        if (pageId === "home" && authToken) {
            loadFavorites();
            loadHistory();
            if (typeof loadInsights === "function") {
                loadInsights();
            }
        }
        if (pageId === "users" && authToken && typeof loadUsersAdmin === "function") {
            loadUsersAdmin();
        }
        if (pageId === "audit" && authToken && typeof loadAuditLogs === "function") {
            loadAuditLogs();
        }
        if (pageId === "favorites" && authToken) {
            loadFavorites();
        }
        if (pageId === "history" && authToken) {
            loadHistory();
        }
        if (pageId === "insights" && authToken && typeof loadInsights === "function") {
            loadInsights();
        }
    }

    function goHome() {
        if (typeof closeMobileNav === "function") closeMobileNav();
        if (!currentRole) {
            document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
            document.getElementById("page-roleSelect").classList.add("active");
            document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
        } else {
            showPage("home", document.querySelector('nav button[data-page="home"]'));
        }
    }

    async function apiRequest(path, method = "GET", body = null, withAuth = true, extraHeaders = {}) {
        const url = CONFIG.baseUrl + path;
        const options = { method, headers: { "Content-Type": "application/json" } };
        if (withAuth && authToken) {
            options.headers["Authorization"] = "Bearer " + authToken;
        }
        Object.assign(options.headers, extraHeaders || {});
        if (body != null) {
            options.body = JSON.stringify(body);
        }
        try {
            const res = await fetch(url, options);
            const text = await res.text();
            let json;
            try { json = text ? JSON.parse(text) : null; } catch { json = text; }
            if (withAuth) {
                maybeHandleAuthFailure(res.status, json, path, method);
            }
            return { status: res.status, ok: res.ok, data: json };
        } catch (e) {
            setStatus("İstek hatası: " + e.message, false);
            throw e;
        }
    }

    async function register() {
        const username = document.getElementById("regUsername").value.trim();
        const email    = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value.trim();

        if (!username || !email || !password) {
            setStatus("Kullanıcı adı, email ve şifre zorunlu", false);
            return;
        }

        const payload = { username, password, email };
        const { status, ok, data } = await apiRequest(CONFIG.endpoints.register, "POST", payload, false);
        setStatus("Kayıt sonucu: HTTP " + status, ok);
        console.log("register response:", data);

        if (ok) {
            showPopup("Kayıt başarılı");
            showCenterModal("Kayıt tamamlandı", "Şimdi Giriş sayfasından login olabilirsin.");
        } else if (data && data.message) {
            setStatus("Kayıt hatası: " + data.message, false);
        }
    }

    async function login() {
        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (!username || !password) {
            setStatus("Kullanıcı adı ve şifre zorunlu", false);
            return;
        }

        const payload = { username, password };
        const { status, ok, data } = await apiRequest(CONFIG.endpoints.login, "POST", payload, false);
        setStatus("Giriş sonucu: HTTP " + status, ok);
        console.log("login response:", data);

        if (ok) {
            const token = data && (data.token || data.jwt || data.jwtToken || data.accessToken);
            const backendRole = data && (data.role || data.userRole || data.authority);
            if (token) {
                authToken = token;
                loggedUsername = username;
                if (backendRole) currentRole = backendRole;
                localStorage.setItem("atifyToken", token);
                localStorage.setItem("atifyUser", username);
                if (currentRole) localStorage.setItem("atifyRole", currentRole);

                applyRoleToUI();
                updateUserInfo();
                showPopup("Giriş başarılı");
                showPage("songs", document.querySelector('nav button[data-page="songs"]'));
                getSongs();
                loadPlaylists();
                loadFavorites();
                loadHistory();
                if (typeof loadInsights === "function") {
                    loadInsights();
                }
            } else {
                setStatus("Login OK ama token alanı bulunamadı.", false);
            }
        }
    }

    function logout() {
        resetClientSession({
            statusMessage: "Çıkış yapıldı",
            popupMessage: "Çıkış yapıldı"
        });
    }



