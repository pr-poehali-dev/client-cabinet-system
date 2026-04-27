"""
Уведомления пользователей и запросы на вступление в проект.

GET  /?action=list          — список уведомлений текущего пользователя
GET  /?action=unread_count  — количество непрочитанных
GET  /?action=join_requests — список запросов на вступление (для head/admin/manager)
POST action=mark_read       — отметить прочитанным (id или all=true)
POST action=join_request    — отправить запрос на вступление в проект
POST action=review_request  — подтвердить или отклонить запрос (head/admin/manager)
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"
REVIEW_ROLES = {"admin", "head", "manager"}

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


def push_notification(cur, user_id: int, ntype: str, title: str, body: str, meta: dict = None):
    """Создать уведомление для пользователя."""
    cur.execute(f"""
        INSERT INTO {SCHEMA}.notifications (user_id, type, title, body, meta, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, ntype, title, body,
          json.dumps(meta, ensure_ascii=False) if meta else None,
          datetime.now(timezone.utc)))


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

    # ── GET: список уведомлений ───────────────────────────────────────────────
    if method == "GET" and action == "list":
        cur.execute(f"""
            SELECT id, type, title, body, is_read, meta, created_at
            FROM {SCHEMA}.notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user["id"],))
        rows = cur.fetchall()
        conn.close()
        return ok({"notifications": [{
            "id": r[0], "type": r[1], "title": r[2], "body": r[3],
            "is_read": r[4], "meta": r[5], "created_at": str(r[6]),
        } for r in rows]})

    # ── GET: количество непрочитанных ─────────────────────────────────────────
    if method == "GET" and action == "unread_count":
        cur.execute(f"""
            SELECT COUNT(*) FROM {SCHEMA}.notifications
            WHERE user_id = %s AND is_read = FALSE
        """, (user["id"],))
        count = cur.fetchone()[0]
        conn.close()
        return ok({"count": count})

    # ── GET: входящие запросы на вступление (для ревьюеров) ───────────────────
    if method == "GET" and action == "join_requests":
        if user["role"] not in REVIEW_ROLES:
            conn.close()
            return err("Нет доступа", 403)
        # Руководитель видит запросы к своему объекту, admin — все
        where = "jr.status = 'pending'"
        params = []
        if user["role"] != "admin" and user["object_id"]:
            where += " AND jr.object_id = %s"
            params.append(user["object_id"])
        cur.execute(f"""
            SELECT jr.id, jr.user_id, u.full_name, u.login, r.name AS role_name,
                   o.id AS object_id, o.name AS object_name,
                   jr.message, jr.status, jr.created_at
            FROM {SCHEMA}.join_requests jr
            JOIN {SCHEMA}.users u ON u.id = jr.user_id
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            JOIN {SCHEMA}.objects o ON o.id = jr.object_id
            WHERE {where}
            ORDER BY jr.created_at DESC
        """, params or None)
        rows = cur.fetchall()
        conn.close()
        return ok({"requests": [{
            "id": r[0], "user_id": r[1], "full_name": r[2], "login": r[3],
            "role_name": r[4], "object_id": r[5], "object_name": r[6],
            "message": r[7], "status": r[8], "created_at": str(r[9]),
        } for r in rows]})

    # ── POST: отметить прочитанным ────────────────────────────────────────────
    if action == "mark_read":
        if body.get("all"):
            cur.execute(f"""
                UPDATE {SCHEMA}.notifications SET is_read = TRUE
                WHERE user_id = %s AND is_read = FALSE
            """, (user["id"],))
        else:
            notif_id = body.get("id")
            if not notif_id:
                conn.close()
                return err("Укажите id или all=true")
            cur.execute(f"""
                UPDATE {SCHEMA}.notifications SET is_read = TRUE
                WHERE id = %s AND user_id = %s
            """, (notif_id, user["id"]))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── POST: отправить запрос на вступление ──────────────────────────────────
    if action == "join_request":
        object_id = body.get("object_id")
        message = (body.get("message") or "").strip() or None
        if not object_id:
            conn.close()
            return err("Укажите object_id")

        # Проверяем что объект существует
        cur.execute(f"SELECT name FROM {SCHEMA}.objects WHERE id = %s AND is_active = TRUE", (object_id,))
        obj_row = cur.fetchone()
        if not obj_row:
            conn.close()
            return err("Проект не найден")
        object_name = obj_row[0]

        # Проверяем нет ли уже активного запроса
        cur.execute(f"""
            SELECT id, status FROM {SCHEMA}.join_requests
            WHERE user_id = %s AND object_id = %s
        """, (user["id"], object_id))
        existing = cur.fetchone()
        if existing:
            if existing[1] == "pending":
                conn.close()
                return err("Запрос уже отправлен, ожидайте подтверждения")
            if existing[1] == "approved":
                conn.close()
                return err("Вы уже участник этого проекта")
            # rejected — разрешаем повторно (UPDATE статуса)
            cur.execute(f"""
                UPDATE {SCHEMA}.join_requests
                SET status = 'pending', message = %s, created_at = %s, reviewed_by = NULL, reviewed_at = NULL
                WHERE user_id = %s AND object_id = %s
            """, (message, datetime.now(timezone.utc), user["id"], object_id))
        else:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.join_requests (user_id, object_id, message, created_at)
                VALUES (%s, %s, %s, %s)
            """, (user["id"], object_id, message, datetime.now(timezone.utc)))

        # Найти руководителей и менеджеров проекта для уведомления
        cur.execute(f"""
            SELECT u.id FROM {SCHEMA}.users u
            JOIN {SCHEMA}.roles r ON r.id = u.role_id
            WHERE r.code IN ('head', 'manager', 'admin')
              AND u.is_active = TRUE
        """)
        reviewers = cur.fetchall()
        for reviewer in reviewers:
            push_notification(
                cur, reviewer[0],
                "join_request",
                "Запрос на вступление в проект",
                f"{user['full_name']} хочет вступить в проект «{object_name}»" +
                (f". Сообщение: {message}" if message else ""),
                {"object_id": object_id, "requester_id": user["id"], "requester_name": user["full_name"]},
            )

        # Уведомить самого пользователя
        push_notification(
            cur, user["id"],
            "info",
            "Запрос отправлен",
            f"Ваш запрос на вступление в проект «{object_name}» отправлен. Ожидайте подтверждения руководителя.",
            {"object_id": object_id},
        )

        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── POST: подтвердить или отклонить запрос ────────────────────────────────
    if action == "review_request":
        if user["role"] not in REVIEW_ROLES:
            conn.close()
            return err("Нет прав", 403)
        request_id = body.get("request_id")
        decision = body.get("decision")  # "approved" | "rejected"
        if not request_id or decision not in ("approved", "rejected"):
            conn.close()
            return err("Укажите request_id и decision (approved/rejected)")

        cur.execute(f"""
            SELECT jr.user_id, jr.object_id, o.name, jr.status
            FROM {SCHEMA}.join_requests jr
            JOIN {SCHEMA}.objects o ON o.id = jr.object_id
            WHERE jr.id = %s
        """, (request_id,))
        req = cur.fetchone()
        if not req:
            conn.close()
            return err("Запрос не найден")
        requester_id, object_id, object_name, req_status = req
        if req_status != "pending":
            conn.close()
            return err("Запрос уже обработан")

        now = datetime.now(timezone.utc)
        cur.execute(f"""
            UPDATE {SCHEMA}.join_requests
            SET status = %s, reviewed_by = %s, reviewed_at = %s
            WHERE id = %s
        """, (decision, user["id"], now, request_id))

        if decision == "approved":
            # Привязываем пользователя к объекту
            cur.execute(f"UPDATE {SCHEMA}.users SET object_id = %s WHERE id = %s", (object_id, requester_id))

            # Получаем имя нового участника
            cur.execute(f"SELECT full_name FROM {SCHEMA}.users WHERE id = %s", (requester_id,))
            member_row = cur.fetchone()
            member_name = member_row[0] if member_row else "Участник"

            # Добавляем во все чаты объекта + системное сообщение
            cur.execute(f"SELECT id FROM {SCHEMA}.chats WHERE object_id = %s", (object_id,))
            chat_ids = [r[0] for r in cur.fetchall()]
            for chat_id in chat_ids:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.chat_members (chat_id, user_id, added_at)
                    VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
                """, (chat_id, requester_id, now))
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.chat_messages (chat_id, user_id, text, created_at)
                    VALUES (%s, %s, %s, %s)
                """, (chat_id, user["id"],
                      f"✦ {member_name} присоединился к проекту",
                      now))

            push_notification(
                cur, requester_id,
                "join_approved",
                "Запрос одобрен",
                f"{user['full_name']} принял ваш запрос. Вы добавлены в проект «{object_name}» и все чаты проекта.",
                {"object_id": object_id},
            )
        else:
            push_notification(
                cur, requester_id,
                "join_rejected",
                "Запрос отклонён",
                f"Ваш запрос на вступление в проект «{object_name}» был отклонён.",
                {"object_id": object_id},
            )

        conn.commit()
        conn.close()
        return ok({"ok": True})

    conn.close()
    return err("Неизвестное действие", 404)