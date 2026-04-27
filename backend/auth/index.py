"""
Авторизация: вход, выход, проверка сессии.
POST body: {"action": "login"|"logout"}, GET для /me. v2
"""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = "t_p86039137_client_cabinet_syste"
SESSION_TTL_HOURS = 24 * 7  # 7 дней

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def ok(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg: str, status: int = 400) -> dict:
    return ok({"error": msg}, status)


def get_session_id(event: dict) -> str:
    return (event.get("headers") or {}).get("X-Session-Id", "")


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}
    action = body.get("action", "")

    # ── login ─────────────────────────────────────────────────────────────────
    if action == "login":
        login = (body.get("login") or "").strip()
        password = (body.get("password") or "").strip()

        if not login or not password:
            return err("Укажите логин и пароль")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT u.id, u.full_name, u.is_active, u.password_hash,
                   r.code, r.name, r.has_global_access, u.object_id
            FROM {SCHEMA}.users u
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            WHERE u.login = %s
        """, (login,))
        row = cur.fetchone()

        if not row:
            conn.close()
            return err("Неверный логин или пароль", 401)

        uid, full_name, is_active, pwd_hash, role_code, role_name, global_access, object_id = row

        if not is_active:
            conn.close()
            return err("Доступ заблокирован. Обратитесь к администратору", 403)

        if pwd_hash != hash_password(password):
            conn.close()
            return err("Неверный логин или пароль", 401)

        session_id = secrets.token_hex(48)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=SESSION_TTL_HOURS)
        ip = (event.get("requestContext") or {}).get("identity", {}).get("sourceIp", "")
        ua = (event.get("headers") or {}).get("User-Agent", "")

        cur.execute(f"""
            INSERT INTO {SCHEMA}.sessions (id, user_id, created_at, expires_at, ip_address, user_agent)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (session_id, uid, now, expires, ip, ua))

        cur.execute(f"UPDATE {SCHEMA}.users SET last_login_at = %s WHERE id = %s", (now, uid))

        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, ip_address, created_at)
            VALUES (%s, 'login', 'Вход в систему', %s, %s)
        """, (uid, ip, now))

        conn.commit()
        conn.close()

        return ok({
            "session_id": session_id,
            "user": {
                "id": uid,
                "full_name": full_name,
                "role_code": role_code,
                "role_name": role_name,
                "has_global_access": global_access,
                "object_id": object_id,
            }
        })

    # ── logout ────────────────────────────────────────────────────────────────
    if action == "logout":
        session_id = get_session_id(event)
        if session_id:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE id = %s", (session_id,))
            conn.commit()
            conn.close()
        return ok({"ok": True})

    # ── me (GET) ──────────────────────────────────────────────────────────────
    if method == "GET":
        session_id = get_session_id(event)
        if not session_id:
            return err("Нет сессии", 401)

        conn = get_conn()
        cur = conn.cursor()
        now = datetime.now(timezone.utc)
        cur.execute(f"""
            SELECT u.id, u.full_name, u.is_active,
                   r.code, r.name, r.has_global_access, u.object_id
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            WHERE s.id = %s AND s.expires_at > %s
        """, (session_id, now))
        row = cur.fetchone()
        conn.close()

        if not row:
            return err("Сессия истекла", 401)

        uid, full_name, is_active, role_code, role_name, global_access, object_id = row

        if not is_active:
            return err("Доступ заблокирован", 403)

        return ok({
            "user": {
                "id": uid,
                "full_name": full_name,
                "role_code": role_code,
                "role_name": role_name,
                "has_global_access": global_access,
                "object_id": object_id,
            }
        })

    return err("Not found", 404)