"""
Чаты проекта: создание чата менеджером, добавление участников,
отправка и получение сообщений.
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"
CHAT_ROLES = {"admin", "manager", "head", "foreman", "supply", "designer", "supervision", "contractor", "client"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict, status: int = 200) -> dict:
    return {"statusCode": status, "headers": {"Content-Type": "application/json", **CORS},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg: str, status: int = 400) -> dict:
    return ok({"error": msg}, status)


def get_user(event: dict, conn):
    sid = (event.get("headers") or {}).get("X-Session-Id", "")
    if not sid:
        return None
    cur = conn.cursor()
    now = datetime.now(timezone.utc)
    cur.execute(f"""
        SELECT u.id, u.full_name, r.code, r.has_global_access, u.object_id
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        JOIN {SCHEMA}.roles r ON r.id = u.role_id
        WHERE s.id = %s AND s.expires_at > %s AND u.is_active = TRUE
    """, (sid, now))
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "full_name": row[1], "role": row[2], "global": row[3], "object_id": row[4]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}
    action = body.get("action", qs.get("action", ""))

    conn = get_conn()
    user = get_user(event, conn)
    if not user:
        conn.close()
        return err("Нет доступа", 401)

    cur = conn.cursor()

    # ── GET: список чатов объекта ─────────────────────────────────────────────
    if method == "GET" and action == "list":
        object_id = qs.get("object_id") or user.get("object_id")
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        cur.execute(f"""
            SELECT c.id, c.name, c.created_at,
                   u.full_name AS creator,
                   COUNT(DISTINCT cm.user_id) AS members_count,
                   (SELECT COUNT(*) FROM {SCHEMA}.chat_messages WHERE chat_id = c.id) AS msg_count
            FROM {SCHEMA}.chats c
            JOIN {SCHEMA}.users u ON u.id = c.created_by
            LEFT JOIN {SCHEMA}.chat_members cm ON cm.chat_id = c.id
            WHERE c.object_id = %s
            GROUP BY c.id, u.full_name
            ORDER BY c.created_at
        """, (object_id,))
        rows = cur.fetchall()
        conn.close()
        return ok({"chats": [{"id": r[0], "name": r[1], "created_at": r[2], "creator": r[3], "members_count": r[4], "msg_count": r[5]} for r in rows]})

    # ── GET: сообщения чата ───────────────────────────────────────────────────
    if method == "GET" and action == "messages":
        chat_id = qs.get("chat_id")
        if not chat_id:
            conn.close()
            return err("Укажите chat_id")
        cur.execute(f"""
            SELECT m.id, m.text, m.created_at, u.id, u.full_name, r.code
            FROM {SCHEMA}.chat_messages m
            JOIN {SCHEMA}.users u ON u.id = m.user_id
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            WHERE m.chat_id = %s
            ORDER BY m.created_at
        """, (chat_id,))
        rows = cur.fetchall()
        # Участники
        cur.execute(f"""
            SELECT u.id, u.full_name, r.code, r.name
            FROM {SCHEMA}.chat_members cm
            JOIN {SCHEMA}.users u ON u.id = cm.user_id
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            WHERE cm.chat_id = %s
        """, (chat_id,))
        members = cur.fetchall()
        conn.close()
        return ok({
            "messages": [{"id": r[0], "text": r[1], "created_at": r[2], "user_id": r[3], "full_name": r[4], "role_code": r[5]} for r in rows],
            "members": [{"id": m[0], "full_name": m[1], "role_code": m[2], "role_name": m[3]} for m in members],
        })

    # ── GET: пользователи объекта для добавления в чат ────────────────────────
    if method == "GET" and action == "users_for_chat":
        object_id = qs.get("object_id") or user.get("object_id")
        chat_id = qs.get("chat_id")
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        # Все участники объекта (привязанные + глобальные)
        cur.execute(f"""
            SELECT u.id, u.full_name, r.code, r.name
            FROM {SCHEMA}.users u
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            WHERE u.is_active = TRUE
              AND (u.object_id = %s OR r.has_global_access = TRUE)
              AND u.id != %s
        """, (object_id, user["id"]))
        all_users = cur.fetchall()
        # Уже в чате
        in_chat = set()
        if chat_id:
            cur.execute(f"SELECT user_id FROM {SCHEMA}.chat_members WHERE chat_id = %s", (chat_id,))
            in_chat = {r[0] for r in cur.fetchall()}
        conn.close()
        return ok({"users": [
            {"id": u[0], "full_name": u[1], "role_code": u[2], "role_name": u[3], "in_chat": u[0] in in_chat}
            for u in all_users
        ]})

    # ── POST: создать чат ─────────────────────────────────────────────────────
    if action == "create_chat":
        if user["role"] not in ("manager", "head", "admin"):
            conn.close()
            return err("Нет прав. Чат создаёт менеджер проекта", 403)
        object_id = body.get("object_id") or user.get("object_id")
        name = (body.get("name") or "Общий чат").strip()
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        cur.execute(f"""
            INSERT INTO {SCHEMA}.chats (object_id, name, created_by)
            VALUES (%s, %s, %s) RETURNING id
        """, (object_id, name, user["id"]))
        chat_id = cur.fetchone()[0]
        # Автоматически добавляем создателя
        cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, user["id"]))
        conn.commit()
        conn.close()
        return ok({"ok": True, "id": chat_id})

    # ── POST: добавить/убрать участника чата ─────────────────────────────────
    if action == "add_member":
        chat_id = body.get("chat_id")
        user_id = body.get("user_id")
        if not chat_id or not user_id:
            conn.close()
            return err("Укажите chat_id и user_id")
        cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, user_id))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    if action == "remove_member":
        chat_id = body.get("chat_id")
        user_id = body.get("user_id")
        if not chat_id or not user_id:
            conn.close()
            return err("Укажите chat_id и user_id")
        cur.execute(f"DELETE FROM {SCHEMA}.chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── POST: отправить сообщение ─────────────────────────────────────────────
    if action == "send":
        chat_id = body.get("chat_id")
        text = (body.get("text") or "").strip()
        if not chat_id or not text:
            conn.close()
            return err("Укажите chat_id и text")
        now = datetime.now(timezone.utc)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.chat_messages (chat_id, user_id, text, created_at)
            VALUES (%s, %s, %s, %s) RETURNING id, created_at
        """, (chat_id, user["id"], text, now))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"ok": True, "id": row[0], "created_at": str(row[1]),
                   "user_id": user["id"], "full_name": user["full_name"]})

    conn.close()
    return err("Неизвестное действие", 404)
