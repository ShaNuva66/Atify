import argparse
import base64
import json
import secrets
import shlex
import string
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import requests


@dataclass
class Credentials:
    username: str
    password: str
    email: str


class SmokeFailure(RuntimeError):
    pass


class FingerprintLiveSmoke:
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
        return Credentials(username=username, password=password, email=email)

    def login(self, credentials: Credentials) -> str:
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": credentials.username, "password": credentials.password},
            timeout=20,
        )
        self.require(response.status_code == 200, f"Login failed: {response.status_code} {response.text}")
        data = response.json()
        token = data.get("token") or data.get("jwt") or data.get("jwtToken") or data.get("accessToken")
        self.require(bool(token), "Login succeeded but token missing")
        self.add_check(f"login ok: {credentials.username}")
        return token

    def auth_headers(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

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
        proc = subprocess.run(ssh_prefix + [remote_command], text=True, capture_output=True)
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

    def get_status(self, token: str) -> dict:
        response = requests.get(
            f"{self.base_url}/admin/fingerprints/status",
            headers=self.auth_headers(token),
            timeout=30,
        )
        self.require(response.status_code == 200, f"Fingerprint status failed: {response.status_code} {response.text}")
        data = response.json()
        self.add_check(
            "fingerprint status ok: "
            f"reachable={data.get('recognizerReachable')} catalog={data.get('recognizerCatalogSize')}"
        )
        return data

    def reindex(self, token: str) -> dict:
        response = requests.post(
            f"{self.base_url}/admin/fingerprints/reindex",
            headers=self.auth_headers(token),
            json={},
            timeout=120,
        )
        self.require(response.status_code == 200, f"Fingerprint reindex failed: {response.status_code} {response.text}")
        data = response.json()
        self.add_check(
            "fingerprint reindex ok: "
            f"registered={data.get('registeredCount')} remote={data.get('recognizerCatalogSize')}"
        )
        return data

    def wait_for_catalog_ready(self, token: str, timeout_seconds: int = 120) -> dict:
        deadline = time.time() + timeout_seconds
        last_status = None

        while time.time() < deadline:
            last_status = self.get_status(token)
            if (
                last_status.get("recognizerReachable")
                and not last_status.get("syncInProgress")
                and last_status.get("recognizerCatalogSize") == last_status.get("fingerprintedSongCount")
                and last_status.get("missingFingerprintCount") == 0
            ):
                self.add_check(
                    "fingerprint catalog ready: "
                    f"remote={last_status.get('recognizerCatalogSize')} local={last_status.get('fingerprintedSongCount')}"
                )
                return last_status
            time.sleep(5)

        raise SmokeFailure(f"Fingerprint catalog did not become ready in time: {last_status}")

    def get_songs(self, token: str) -> list[dict]:
        response = requests.get(f"{self.base_url}/songs", headers=self.auth_headers(token), timeout=30)
        self.require(response.status_code == 200, f"Songs fetch failed: {response.status_code} {response.text}")
        data = response.json()
        self.require(isinstance(data, list) and len(data) > 0, "Song catalog is empty")
        self.add_check(f"songs fetched: {len(data)}")
        return data

    def fetch_audio_sample(self, token: str, songs: list[dict]) -> tuple[str, bytes, str]:
        headers = self.auth_headers(token)

        for song in songs:
            song_id = song.get("id")
            if not song_id:
                continue
            response = requests.get(f"{self.base_url}/songs/{song_id}/stream", headers=headers, timeout=60)
            if response.status_code == 200 and response.content:
                title = song.get("name") or f"song:{song_id}"
                self.add_check(f"audio sample fetched from stream: {title}")
                return title, response.content, "sample.mp3"

        for song in songs:
            audio_url = song.get("audioUrl")
            if not audio_url:
                continue
            response = requests.get(audio_url, timeout=60)
            if response.status_code == 200 and response.content:
                title = song.get("name") or audio_url
                self.add_check(f"audio sample fetched from remote url: {title}")
                return title, response.content, "sample.mp3"

        raise SmokeFailure("No playable audio sample found in catalog")

    def identify(self, token: str, expected_title: str, audio_bytes: bytes, filename: str) -> dict:
        response = requests.post(
            f"{self.base_url}/api/identify",
            headers=self.auth_headers(token),
            files={"file": (filename, audio_bytes, "audio/mpeg")},
            timeout=120,
        )
        self.require(response.status_code == 200, f"Identify failed: {response.status_code} {response.text}")
        data = response.json()
        self.require(bool(data.get("found")), f"Identify returned no match: {data}")
        actual_title = data.get("title")
        self.require(actual_title == expected_title, f"Identify mismatch: expected '{expected_title}' got '{actual_title}'")
        self.add_check(f"identify ok: {actual_title}")
        return data

    def run(self) -> int:
        try:
            admin_credentials = self.register_temp_user("fp_smoke_admin", self.args.temp_admin_password)
            self.promote_admin(admin_credentials.username)
            admin_token = self.login(admin_credentials)

            status_before = self.wait_for_catalog_ready(admin_token)
            self.require(status_before.get("fingerprintedSongCount", 0) > 0, "No fingerprinted songs available")

            reindex_status = self.reindex(admin_token)
            if reindex_status.get("syncInProgress"):
                reindex_status = self.wait_for_catalog_ready(admin_token)
            else:
                self.require(bool(reindex_status.get("recognizerReachable")), "Recognizer is not reachable after reindex")
                self.require(
                    reindex_status.get("recognizerCatalogSize") == reindex_status.get("fingerprintedSongCount"),
                    f"Recognizer catalog mismatch after reindex: {reindex_status}",
                )

            songs = self.get_songs(admin_token)
            expected_title, audio_bytes, filename = self.fetch_audio_sample(admin_token, songs)
            self.identify(admin_token, expected_title, audio_bytes, filename)

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
    parser = argparse.ArgumentParser(description="Run Atify live fingerprint smoke test.")
    parser.add_argument("--base-url", default="https://atify.com.tr")
    parser.add_argument("--temp-admin-password", default="FingerprintSmoke123!")
    parser.add_argument("--ssh-host", required=True)
    parser.add_argument("--ssh-user", required=True)
    parser.add_argument("--ssh-key", required=True)
    parser.add_argument("--mysql-container", default="atify-prod-mysql")
    parser.add_argument("--keep-temp-users", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    smoke = FingerprintLiveSmoke(args)
    return smoke.run()


if __name__ == "__main__":
    sys.exit(main())