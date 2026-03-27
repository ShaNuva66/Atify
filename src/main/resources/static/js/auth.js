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
            setStatus("Kullanici adi, email ve sifre zorunlu", false);
            return;
        }

        const payload = { username, password, email };
        const { status, ok, data } = await apiRequest(CONFIG.endpoints.register, "POST", payload, false);
        setStatus("Kayit sonucu: HTTP " + status, ok);
        console.log("register response:", data);

        if (ok) {
            showPopup("Kayit basarili");
            showCenterModal("Kayit tamamlandi", "Simdi Giris sayfasindan login olabilirsin.");
        } else if (data && data.message) {
            setStatus("Kayit hatasi: " + data.message, false);
        }
    }

    async function login() {
        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (!username || !password) {
            setStatus("Kullanici adi ve sifre zorunlu", false);
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
        setStatus("Çıkış yapıldı");
        showPopup("Çıkış yapıldı");
    }






