"""
Панель администратора: управление пользователями.
Все методы требуют роль admin в сессии.
"""
import json
import os
import hashlib
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"

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


def get_admin(event: dict, conn):
    """Проверяет сессию и возвращает пользователя с ролью admin."""
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")
    if not session_id:
        return None
    cur = conn.cursor()
    now = datetime.now(timezone.utc)
    cur.execute(f"""
        SELECT u.id, r.code
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        JOIN {SCHEMA}.roles r ON r.id = u.role_id
        WHERE s.id = %s AND s.expires_at > %s AND u.is_active = TRUE
    """, (session_id, now))
    row = cur.fetchone()
    if not row or row[1] != "admin":
        return None
    return {"id": row[0], "role": row[1]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}
    action = body.get("action", "")

    conn = get_conn()
    admin = get_admin(event, conn)
    if not admin:
        conn.close()
        return err("Нет доступа. Требуется роль администратора", 403)

    cur = conn.cursor()

    # ── GET: список пользователей ─────────────────────────────────────────────
    if method == "GET":
        ga = (event.get("queryStringParameters") or {}).get("action", "")

        if ga == "roles":
            cur.execute(f"SELECT id, code, name, has_global_access FROM {SCHEMA}.roles ORDER BY id")
            rows = cur.fetchall()
            conn.close()
            return ok({"roles": [{"id": r[0], "code": r[1], "name": r[2], "global": r[3]} for r in rows]})

        if ga == "objects":
            cur.execute(f"SELECT id, name, address FROM {SCHEMA}.objects WHERE is_active = TRUE ORDER BY id")
            rows = cur.fetchall()
            conn.close()
            return ok({"objects": [{"id": r[0], "name": r[1], "address": r[2]} for r in rows]})

        if ga == "activity":
            user_id = (event.get("queryStringParameters") or {}).get("user_id")
            if user_id:
                cur.execute(f"""
                    SELECT a.action, a.detail, a.ip_address, a.created_at
                    FROM {SCHEMA}.activity_log a
                    WHERE a.user_id = %s
                    ORDER BY a.created_at DESC LIMIT 50
                """, (user_id,))
            else:
                cur.execute(f"""
                    SELECT u.full_name, a.action, a.detail, a.ip_address, a.created_at
                    FROM {SCHEMA}.activity_log a
                    JOIN {SCHEMA}.users u ON u.id = a.user_id
                    ORDER BY a.created_at DESC LIMIT 100
                """)
            rows = cur.fetchall()
            conn.close()
            if user_id:
                return ok({"log": [{"action": r[0], "detail": r[1], "ip": r[2], "at": r[3]} for r in rows]})
            return ok({"log": [{"user": r[0], "action": r[1], "detail": r[2], "ip": r[3], "at": r[4]} for r in rows]})

        # Список пользователей
        cur.execute(f"""
            SELECT u.id, u.login, u.full_name, r.name AS role_name, r.code AS role_code,
                   o.name AS object_name, u.is_active, u.last_login_at, u.created_at
            FROM {SCHEMA}.users u
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            LEFT JOIN {SCHEMA}.objects o ON o.id = u.object_id
            ORDER BY u.id
        """)
        rows = cur.fetchall()
        conn.close()
        return ok({"users": [{
            "id": r[0], "login": r[1], "full_name": r[2],
            "role_name": r[3], "role_code": r[4],
            "object_name": r[5], "is_active": r[6],
            "last_login_at": r[7], "created_at": r[8],
        } for r in rows]})

    # ── POST actions ──────────────────────────────────────────────────────────

    # Создать пользователя
    if action == "create_user":
        login = (body.get("login") or "").strip()
        password = (body.get("password") or "").strip()
        full_name = (body.get("full_name") or "").strip()
        role_id = body.get("role_id")
        object_id = body.get("object_id") or None

        if not all([login, password, full_name, role_id]):
            conn.close()
            return err("Заполните все обязательные поля")

        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s", (login,))
        if cur.fetchone():
            conn.close()
            return err(f"Логин «{login}» уже занят")

        cur.execute(f"""
            INSERT INTO {SCHEMA}.users (login, password_hash, full_name, role_id, object_id, created_by)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (login, hash_password(password), full_name, role_id, object_id, admin["id"]))
        new_id = cur.fetchone()[0]

        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'admin_create_user', %s, %s)
        """, (admin["id"], f"Создан пользователь: {full_name} ({login})", datetime.now(timezone.utc)))

        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id})

    # Изменить пароль
    if action == "change_password":
        user_id = body.get("user_id")
        new_password = (body.get("password") or "").strip()
        if not user_id or not new_password:
            conn.close()
            return err("Укажите пользователя и новый пароль")
        cur.execute(f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s", (hash_password(new_password), user_id))
        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'admin_change_password', %s, %s)
        """, (admin["id"], f"Смена пароля для user_id={user_id}", datetime.now(timezone.utc)))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # Блокировать / разблокировать
    if action == "toggle_active":
        user_id = body.get("user_id")
        is_active = body.get("is_active")
        if user_id is None or is_active is None:
            conn.close()
            return err("Укажите user_id и is_active")
        if user_id == admin["id"]:
            conn.close()
            return err("Нельзя заблокировать самого себя")
        cur.execute(f"UPDATE {SCHEMA}.users SET is_active = %s WHERE id = %s", (is_active, user_id))
        # Удаляем сессии при блокировке
        if not is_active:
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = %s", (user_id,))
        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, %s, %s, %s)
        """, (admin["id"], "admin_toggle_active",
              f"{'Разблокирован' if is_active else 'Заблокирован'} user_id={user_id}",
              datetime.now(timezone.utc)))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # Удалить пользователя
    if action == "delete_user":
        user_id = body.get("user_id")
        if not user_id:
            conn.close()
            return err("Укажите user_id")
        if user_id == admin["id"]:
            conn.close()
            return err("Нельзя удалить самого себя")
        cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = %s", (user_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.activity_log WHERE user_id = %s", (user_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    conn.close()
    return err("Неизвестное действие", 404)
