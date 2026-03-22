async function loadUsersAdmin() {
    if (currentRole !== "ADMIN") {
        setStatus("Kullanıcı yönetimi sadece admin için.", false);
        return;
    }

    const { status, ok, data } = await apiRequest(CONFIG.endpoints.users, "GET", null, true);
    setStatus("Kullanıcılar getirildi: HTTP " + status, ok);

    const box = document.getElementById("usersAdminList");
    if (!box) return;

    const items = Array.isArray(data) ? data : [];
    if (!ok || items.length === 0) {
        box.textContent = ok ? "Henüz kullanıcı yok." : (typeof data === "string" ? data : JSON.stringify(data, null, 2));
        return;
    }

    box.innerHTML = "";
    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "user-admin-row";

        const roles = Array.isArray(item.roles) ? item.roles : [];
        const primaryRole = roles.includes("ADMIN") ? "ADMIN" : "USER";

        row.innerHTML = `
            <div>
                <div class="user-admin-name">${item.username || "(kullanıcı adı yok)"}</div>
                <div class="user-admin-meta">${item.email || "email yok"} · ID: ${item.id}</div>
            </div>
            <div class="user-admin-actions">
                <span class="role-badge-inline">${primaryRole}</span>
            </div>
        `;

        const actions = row.querySelector(".user-admin-actions");

        if (primaryRole !== "ADMIN") {
            const adminBtn = document.createElement("button");
            adminBtn.type = "button";
            adminBtn.className = "btn secondary";
            adminBtn.style.marginTop = "0";
            adminBtn.textContent = "Admin Yap";
            adminBtn.onclick = async () => {
                await updateUserRole(item.id, "ADMIN");
            };
            actions.appendChild(adminBtn);
        }

        if (primaryRole !== "USER") {
            const userBtn = document.createElement("button");
            userBtn.type = "button";
            userBtn.className = "btn gray";
            userBtn.style.marginTop = "0";
            userBtn.textContent = "Kullanıcı Yap";
            userBtn.onclick = async () => {
                await updateUserRole(item.id, "USER");
            };
            actions.appendChild(userBtn);
        }

        if (item.username !== loggedUsername) {
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "btn danger";
            deleteBtn.style.marginTop = "0";
            deleteBtn.textContent = "Kullanıcıyı Sil";
            deleteBtn.onclick = async () => {
                await deleteUserAdmin(item.id, item.username);
            };
            actions.appendChild(deleteBtn);
        }

        box.appendChild(row);
    });
}

async function updateUserRole(userId, role) {
    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.users}/${userId}/role`, "PUT", { role }, true);
    setStatus(`Rol güncelleme sonucu: HTTP ${status}`, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Rol güncellenemedi.";
        showCenterModal("Kullanıcı işlemi başarısız", message);
        return;
    }

    showPopup("Kullanıcı rolü güncellendi");
    await loadUsersAdmin();
    if (typeof loadAuditLogs === "function") {
        await loadAuditLogs();
    }
}

async function deleteUserAdmin(userId, username) {
    if (!confirm(`${username} kullanıcısını silmek istediğine emin misin?`)) {
        return;
    }

    const { status, ok, data } = await apiRequest(`${CONFIG.endpoints.users}/${userId}`, "DELETE", null, true);
    setStatus(`Kullanıcı silme sonucu: HTTP ${status}`, ok);

    if (!ok) {
        const message = data && data.message ? data.message : "Kullanıcı silinemedi.";
        showCenterModal("Kullanıcı silinemedi", message);
        return;
    }

    showPopup("Kullanıcı silindi");
    await loadUsersAdmin();
    if (typeof loadAuditLogs === "function") {
        await loadAuditLogs();
    }
}
