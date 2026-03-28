import argparse
import base64
import json
import unicodedata
import secrets
import shlex
import string
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_CHROME_BINARY = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
DEFAULT_VIEWPORTS = {
    "mobile": (390, 844),
    "desktop": (1440, 900),
}


@dataclass
class Credentials:
    username: str
    password: str
    email: str | None = None
    temporary: bool = False


class SmokeFailure(RuntimeError):
    pass


class UISmoke:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.base_url = args.base_url.rstrip("/")
        self.results: dict[str, list[str] | str] = {"checks": [], "issues": []}
        self.created_users: list[str] = []

    def add_check(self, message: str) -> None:
        self.results["checks"].append(message)

    def add_issue(self, message: str) -> None:
        self.results["issues"].append(message)

    def require(self, condition: bool, message: str) -> None:
        if not condition:
            raise SmokeFailure(message)

    def random_suffix(self) -> str:
        return "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8))

    def register_temp_user(self, prefix: str, password: str) -> Credentials:
        username = f"{prefix}_{self.random_suffix()}"
        email = f"{username}@example.com"
        payload = {"username": username, "email": email, "password": password}
        response = requests.post(f"{self.base_url}/auth/register", json=payload, timeout=20)
        self.require(response.status_code == 200, f"Temp user register failed: {response.status_code} {response.text}")
        self.created_users.append(username)
        self.add_check(f"temp user created: {username}")
        return Credentials(username=username, password=password, email=email, temporary=True)

    def run_remote_mysql(self, sql: str) -> str:
        self.require(self.args.ssh_host and self.args.ssh_user and self.args.ssh_key, "SSH bilgileri gerekli")
        ssh_prefix = [
            "ssh",
            "-i",
            str(Path(self.args.ssh_key).expanduser()),
            f"{self.args.ssh_user}@{self.args.ssh_host}",
        ]
        inspect_cmd = ssh_prefix + [
            f"docker inspect {self.args.mysql_container} --format='{{{{range .Config.Env}}}}{{{{println .}}}}{{{{end}}}}'"
        ]
        inspect_proc = subprocess.run(inspect_cmd, text=True, capture_output=True)
        if inspect_proc.returncode != 0:
            raise SmokeFailure(f"Remote docker inspect failed: {inspect_proc.stderr.strip() or inspect_proc.stdout.strip()}")
        root_password = ""
        for line in inspect_proc.stdout.splitlines():
            if line.startswith("MYSQL_ROOT_PASSWORD="):
                root_password = line.split("=", 1)[1].strip()
                break
        self.require(bool(root_password), "MYSQL_ROOT_PASSWORD could not be resolved from container config")

        encoded_sql = base64.b64encode(sql.encode("utf-8")).decode("ascii")
        remote_command = (
            f"echo {encoded_sql} | base64 -d | "
            f"docker exec -i -e MYSQL_PWD={shlex.quote(root_password)} {self.args.mysql_container} mysql -uroot"
        )
        cmd = ssh_prefix + [remote_command]
        proc = subprocess.run(cmd, text=True, capture_output=True)
        if proc.returncode != 0:
            raise SmokeFailure(f"Remote MySQL command failed: {proc.stderr.strip() or proc.stdout.strip()}")
        return proc.stdout.strip()

    def promote_admin(self, username: str) -> None:
        sql = f"""
USE atify;
INSERT IGNORE INTO user_roles (user_id, roles)
SELECT id, 'ADMIN' FROM app_user WHERE username = '{username}';
SELECT user_id, roles FROM user_roles
WHERE user_id = (SELECT id FROM app_user WHERE username = '{username}');
""".strip()
        output = self.run_remote_mysql(sql)
        self.require("ADMIN" in output, f"Admin promotion failed for {username}")
        self.add_check(f"temp admin promoted: {username}")

    def cleanup_temp_users(self) -> None:
        if not self.created_users:
            return
        if not (self.args.ssh_host and self.args.ssh_user and self.args.ssh_key):
            self.add_issue("Temp users created but SSH cleanup skipped; provide ssh args or cleanup manually.")
            return

        quoted = ", ".join(f"'{username}'" for username in self.created_users)
        sql = f"""
USE atify;
SET @cleanup_users := '{",".join(self.created_users)}';
DELETE ps FROM playlist_song ps
JOIN playlist p ON ps.playlist_id = p.id
WHERE p.user_id IN (SELECT id FROM app_user WHERE username IN ({quoted}));
DELETE FROM favorite WHERE user_id IN (SELECT id FROM app_user WHERE username IN ({quoted}));
DELETE FROM listening_history WHERE user_id IN (SELECT id FROM app_user WHERE username IN ({quoted}));
DELETE FROM playlist WHERE user_id IN (SELECT id FROM app_user WHERE username IN ({quoted}));
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM app_user WHERE username IN ({quoted}));
DELETE FROM app_user WHERE username IN ({quoted});
SELECT username FROM app_user WHERE username IN ({quoted});
""".strip()
        output = self.run_remote_mysql(sql)
        if any(username in output for username in self.created_users):
            raise SmokeFailure("Temp users cleanup failed")
        self.add_check(f"temp users cleaned: {', '.join(self.created_users)}")

    def build_driver(self, width: int, height: int) -> webdriver.Chrome:
        options = Options()
        chrome_binary = Path(self.args.chrome_binary).expanduser()
        if chrome_binary.exists():
            options.binary_location = str(chrome_binary)
        options.add_argument("--headless=new")
        options.add_argument(f"--window-size={width},{height}")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--ignore-certificate-errors")
        options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
        return webdriver.Chrome(service=Service(), options=options)

    def save_screenshot(self, driver: webdriver.Chrome, viewport: str, name: str) -> None:
        if not self.args.artifacts_dir:
            return
        artifacts_dir = Path(self.args.artifacts_dir)
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        safe_name = name.replace("/", "-")
        driver.save_screenshot(str(artifacts_dir / f"{viewport}-{safe_name}.png"))

    def reset_state(self, driver: webdriver.Chrome, wait: WebDriverWait) -> None:
        driver.get(self.base_url)
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
        driver.delete_all_cookies()
        driver.get(self.base_url)
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")

    def open_nav(self, driver: webdriver.Chrome, wait: WebDriverWait, is_mobile: bool) -> None:
        if not is_mobile:
            return
        btn = wait.until(EC.element_to_be_clickable((By.ID, "mobileNavToggle")))
        body_class = driver.find_element(By.TAG_NAME, "body").get_attribute("class") or ""
        if "nav-open" not in body_class:
            btn.click()
            time.sleep(0.2)
        body_class = driver.find_element(By.TAG_NAME, "body").get_attribute("class") or ""
        self.require("nav-open" in body_class, "Mobile nav did not open")

    def nav_to(self, driver: webdriver.Chrome, wait: WebDriverWait, page: str, selector: str, viewport: str, is_mobile: bool) -> None:
        self.open_nav(driver, wait, is_mobile)
        button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, f'nav button[data-page="{page}"]')))
        driver.execute_script('arguments[0].scrollIntoView({block:"center"});', button)
        button.click()
        time.sleep(0.6)
        active_page = driver.execute_script('return document.querySelector(".page.active")?.id')
        self.require(active_page == f"page-{page}", f"{viewport} {page} page did not activate")
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))
        self.check_no_overflow(driver, f"{viewport} {page}")
        self.save_screenshot(driver, viewport, page)
        self.add_check(f"{viewport} {page}: active")

    def check_no_overflow(self, driver: webdriver.Chrome, label: str) -> None:
        scroll_width, inner_width = driver.execute_script("return [document.documentElement.scrollWidth, window.innerWidth]")
        self.require(scroll_width <= inner_width + 2, f"{label}: horizontal overflow ({scroll_width}>{inner_width})")
        self.add_check(f"{label}: no overflow")

    def login(self, driver: webdriver.Chrome, wait: WebDriverWait, credentials: Credentials, role: str, viewport: str, is_mobile: bool) -> None:
        self.reset_state(driver, wait)
        wait.until(EC.visibility_of_element_located((By.ID, "loginUsername")))
        driver.find_element(By.ID, "loginUsername").clear()
        driver.find_element(By.ID, "loginUsername").send_keys(credentials.username)
        driver.find_element(By.ID, "loginPassword").clear()
        driver.find_element(By.ID, "loginPassword").send_keys(credentials.password)
        driver.find_element(By.CSS_SELECTOR, '#loginForm button[type="submit"]').click()
        wait.until(lambda d: d.execute_script('return document.querySelector(".page.active")?.id') == "page-songs")
        time.sleep(0.8)
        panel_label = driver.find_element(By.ID, "panelLabel").text.strip()
        if role == "ADMIN":
            self.require("Admin Paneli" in panel_label, f"{viewport} {role} login label mismatch: {panel_label}")
        else:
            self.require("Kullan" in panel_label and "Paneli" in panel_label, f"{viewport} {role} login label mismatch: {panel_label}")
        self.check_no_overflow(driver, f"{viewport} {role.lower()} songs initial")
        self.save_screenshot(driver, viewport, f"{role.lower()}-songs-initial")
        self.add_check(f"{viewport} {role} login ok")

    def run_user_flow(self, driver: webdriver.Chrome, wait: WebDriverWait, credentials: Credentials, viewport: str, is_mobile: bool) -> None:
        self.login(driver, wait, credentials, "USER", viewport, is_mobile)
        for page, selector in (
            ("songs", "#songsTableBody"),
            ("playlists", "#createPlaylistBtn"),
            ("favorites", "#favoritesList"),
            ("history", "#recentHistoryList"),
            ("insights", "#insightStatsGrid"),
        ):
            self.nav_to(driver, wait, page, selector, viewport, is_mobile)
        self.open_nav(driver, wait, is_mobile)
        visible_admin_buttons: list[str] = []
        for page in ("artists", "users", "audit", "addSong"):
            buttons = driver.find_elements(By.CSS_SELECTOR, f'nav button[data-page="{page}"]')
            if any(button.is_displayed() for button in buttons):
                visible_admin_buttons.append(page)
        self.require(not visible_admin_buttons, f"{viewport} user sees admin buttons: {', '.join(visible_admin_buttons)}")
        self.add_check(f"{viewport} user admin buttons hidden")

    def run_admin_flow(self, driver: webdriver.Chrome, wait: WebDriverWait, credentials: Credentials, viewport: str, is_mobile: bool) -> None:
        self.login(driver, wait, credentials, "ADMIN", viewport, is_mobile)
        page_checks = (
            ("songs", "#songsTableBody"),
            ("artists", "#loadArtistsBtn"),
            ("users", "#loadUsersBtn"),
            ("audit", "#loadAuditLogsBtn"),
            ("addSong", "#createSongBtn"),
        )
        for page, selector in page_checks:
            self.nav_to(driver, wait, page, selector, viewport, is_mobile)

    def check_secondary_pages(self, driver: webdriver.Chrome, wait: WebDriverWait, viewport: str) -> None:
        for page_path in ("identify.html", "songs.html"):
            driver.get(f"{self.base_url}/{page_path}")
            wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
            self.check_no_overflow(driver, f"{viewport} {page_path}")
            self.save_screenshot(driver, viewport, page_path.replace(".html", ""))
            self.add_check(f"{viewport} {page_path}: reachable")

    def verify_console(self, driver: webdriver.Chrome, viewport: str) -> None:
        severe_logs = [entry.get("message", "") for entry in driver.get_log("browser") if entry.get("level") == "SEVERE"]
        self.require(not severe_logs, f"{viewport} browser console severe: {' | '.join(severe_logs[:5])}")
        self.add_check(f"{viewport} browser console clean")

    def run_viewport(self, viewport: str, user_credentials: Credentials, admin_credentials: Credentials) -> None:
        width, height = DEFAULT_VIEWPORTS[viewport]
        driver = self.build_driver(width, height)
        wait = WebDriverWait(driver, 25)
        try:
            self.run_user_flow(driver, wait, user_credentials, viewport, viewport == "mobile")
            self.run_admin_flow(driver, wait, admin_credentials, viewport, viewport == "mobile")
            self.check_secondary_pages(driver, wait, viewport)
            self.verify_console(driver, viewport)
        finally:
            driver.quit()

    def resolve_credentials(self) -> tuple[Credentials, Credentials]:
        if self.args.user_username and self.args.user_password:
            user_credentials = Credentials(
                username=self.args.user_username,
                password=self.args.user_password,
                email=self.args.user_email,
                temporary=False,
            )
        else:
            user_credentials = self.register_temp_user("ui_smoke_user", self.args.temp_user_password)

        if self.args.admin_username and self.args.admin_password:
            admin_credentials = Credentials(
                username=self.args.admin_username,
                password=self.args.admin_password,
                email=self.args.admin_email,
                temporary=False,
            )
        else:
            admin_credentials = self.register_temp_user("ui_smoke_admin", self.args.temp_admin_password)
            self.promote_admin(admin_credentials.username)

        return user_credentials, admin_credentials

    def run(self) -> int:
        try:
            user_credentials, admin_credentials = self.resolve_credentials()
            viewports = [self.args.mode] if self.args.mode in DEFAULT_VIEWPORTS else ["mobile", "desktop"]
            for viewport in viewports:
                self.run_viewport(viewport, user_credentials, admin_credentials)
            if not self.args.keep_temp_users:
                self.cleanup_temp_users()
        except Exception as exc:  # noqa: BLE001
            self.add_issue(str(exc))
            if not self.args.keep_temp_users:
                try:
                    self.cleanup_temp_users()
                except Exception as cleanup_exc:  # noqa: BLE001
                    self.add_issue(f"cleanup failed: {cleanup_exc}")
        print(json.dumps(self.results, ensure_ascii=False, indent=2))
        return 1 if self.results["issues"] else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run Atify desktop/mobile UI smoke tests.")
    parser.add_argument("--base-url", default="https://atify.com.tr")
    parser.add_argument("--mode", choices=["mobile", "desktop", "both"], default="both")
    parser.add_argument("--chrome-binary", default=str(DEFAULT_CHROME_BINARY))
    parser.add_argument("--artifacts-dir", default="")
    parser.add_argument("--user-username", default="")
    parser.add_argument("--user-password", default="")
    parser.add_argument("--user-email", default="")
    parser.add_argument("--admin-username", default="")
    parser.add_argument("--admin-password", default="")
    parser.add_argument("--admin-email", default="")
    parser.add_argument("--temp-user-password", default="UiSmokeUser123!")
    parser.add_argument("--temp-admin-password", default="UiSmokeAdmin123!")
    parser.add_argument("--ssh-host", default="")
    parser.add_argument("--ssh-user", default="")
    parser.add_argument("--ssh-key", default="")
    parser.add_argument("--mysql-container", default="atify-prod-mysql")
    parser.add_argument("--keep-temp-users", action="store_true")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.mode == "both":
        args.mode = "both"
    smoke = UISmoke(args)
    return smoke.run()


if __name__ == "__main__":
    sys.exit(main())
