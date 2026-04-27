"""
Управление проектами (объектами строительства).
Доступно ролям: manager, head, admin.
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"
ALLOWED_ROLES = {"admin", "manager", "head"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg: str, status: int = 400) -> dict:
    return ok({"error": msg}, status)


def get_user(event: dict, conn):
    """Проверяет сессию, возвращает пользователя если роль разрешена."""
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")
    if not session_id:
        return None
    cur = conn.cursor()
    now = datetime.now(timezone.utc)
    cur.execute(f"""
        SELECT u.id, u.full_name, r.code
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        JOIN {SCHEMA}.roles r ON r.id = u.role_id
        WHERE s.id = %s AND s.expires_at > %s AND u.is_active = TRUE
    """, (session_id, now))
    row = cur.fetchone()
    if not row or row[2] not in ALLOWED_ROLES:
        return None
    return {"id": row[0], "full_name": row[1], "role": row[2]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}
    action = body.get("action", "")

    conn = get_conn()
    user = get_user(event, conn)
    if not user:
        conn.close()
        return err("Нет доступа", 403)

    cur = conn.cursor()

    # ── GET: список проектов ──────────────────────────────────────────────────
    if method == "GET":
        cur.execute(f"""
            SELECT
                o.id, o.name, o.address, o.description,
                o.area_m2, o.started_at, o.deadline_at,
                o.progress_pct, o.is_active, o.created_at,
                u.full_name AS created_by_name,
                COUNT(DISTINCT m.id) AS members_count
            FROM {SCHEMA}.objects o
            LEFT JOIN {SCHEMA}.users u ON u.id = o.created_by
            LEFT JOIN {SCHEMA}.users m ON m.object_id = o.id AND m.is_active = TRUE
            WHERE o.is_active = TRUE
            GROUP BY o.id, u.full_name
            ORDER BY o.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        return ok({"projects": [{
            "id": r[0], "name": r[1], "address": r[2], "description": r[3],
            "area_m2": float(r[4]) if r[4] else None,
            "started_at": r[5], "deadline_at": r[6],
            "progress_pct": r[7], "is_active": r[8],
            "created_at": r[9], "created_by_name": r[10],
            "members_count": r[11],
        } for r in rows]})

    # ── POST: создать проект ──────────────────────────────────────────────────
    if action == "create":
        name = (body.get("name") or "").strip()
        address = (body.get("address") or "").strip()
        description = (body.get("description") or "").strip() or None
        area_m2 = body.get("area_m2") or None
        started_at = body.get("started_at") or None
        deadline_at = body.get("deadline_at") or None

        if not name:
            conn.close()
            return err("Укажите название проекта")

        cur.execute(f"""
            INSERT INTO {SCHEMA}.objects
                (name, address, description, area_m2, started_at, deadline_at, progress_pct, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, 0, %s)
            RETURNING id
        """, (name, address or None, description, area_m2, started_at, deadline_at, user["id"]))
        new_id = cur.fetchone()[0]

        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'create_project', %s, %s)
        """, (user["id"], f"Создан проект: {name}", datetime.now(timezone.utc)))

        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id})

    # ── POST: обновить проект ─────────────────────────────────────────────────
    if action == "update":
        project_id = body.get("id")
        if not project_id:
            conn.close()
            return err("Укажите id проекта")

        fields = []
        vals = []
        for field in ["name", "address", "description", "area_m2", "started_at", "deadline_at", "progress_pct"]:
            if field in body:
                fields.append(f"{field} = %s")
                vals.append(body[field] if body[field] != "" else None)

        if not fields:
            conn.close()
            return err("Нет полей для обновления")

        vals.append(project_id)
        cur.execute(f"UPDATE {SCHEMA}.objects SET {', '.join(fields)} WHERE id = %s", vals)

        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'update_project', %s, %s)
        """, (user["id"], f"Обновлён проект id={project_id}", datetime.now(timezone.utc)))

        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── POST: архивировать проект ─────────────────────────────────────────────
    if action == "archive":
        project_id = body.get("id")
        if not project_id:
            conn.close()
            return err("Укажите id проекта")

        cur.execute(f"UPDATE {SCHEMA}.objects SET is_active = FALSE WHERE id = %s", (project_id,))
        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'archive_project', %s, %s)
        """, (user["id"], f"Архивирован проект id={project_id}", datetime.now(timezone.utc)))

        conn.commit()
        conn.close()
        return ok({"ok": True})

    conn.close()
    return err("Неизвестное действие", 404)
