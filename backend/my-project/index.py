"""
Данные проекта текущего пользователя.
Возвращает объект строительства, к которому привязан пользователь,
либо список всех объектов для глобальных ролей.
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    session_id = (event.get("headers") or {}).get("X-Session-Id", "")
    if not session_id:
        return err("Нет сессии", 401)

    conn = get_conn()
    cur = conn.cursor()
    now = datetime.now(timezone.utc)

    # Получаем пользователя из сессии
    cur.execute(f"""
        SELECT u.id, u.full_name, u.object_id, r.code, r.has_global_access
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        JOIN {SCHEMA}.roles r ON r.id = u.role_id
        WHERE s.id = %s AND s.expires_at > %s AND u.is_active = TRUE
    """, (session_id, now))
    row = cur.fetchone()
    if not row:
        conn.close()
        return err("Сессия истекла", 401)

    user_id, full_name, object_id, role_code, has_global = row

    # Пользователь привязан к конкретному объекту
    if object_id:
        cur.execute(f"""
            SELECT id, name, address, description, area_m2,
                   started_at, deadline_at, progress_pct, created_at
            FROM {SCHEMA}.objects
            WHERE id = %s AND is_active = TRUE
        """, (object_id,))
        obj = cur.fetchone()
        conn.close()
        if not obj:
            return ok({"project": None})
        return ok({"project": {
            "id": obj[0], "name": obj[1], "address": obj[2],
            "description": obj[3],
            "area_m2": float(obj[4]) if obj[4] else None,
            "started_at": str(obj[5]) if obj[5] else None,
            "deadline_at": str(obj[6]) if obj[6] else None,
            "progress_pct": obj[7],
            "created_at": str(obj[8]) if obj[8] else None,
        }})

    # Глобальная роль — возвращаем список всех активных проектов
    if has_global:
        cur.execute(f"""
            SELECT o.id, o.name, o.address, o.area_m2,
                   o.started_at, o.deadline_at, o.progress_pct,
                   COUNT(DISTINCT m.id) AS members_count
            FROM {SCHEMA}.objects o
            LEFT JOIN {SCHEMA}.users m ON m.object_id = o.id AND m.is_active = TRUE
            WHERE o.is_active = TRUE
            GROUP BY o.id
            ORDER BY o.created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        return ok({"projects": [{
            "id": r[0], "name": r[1], "address": r[2],
            "area_m2": float(r[3]) if r[3] else None,
            "started_at": str(r[4]) if r[4] else None,
            "deadline_at": str(r[5]) if r[5] else None,
            "progress_pct": r[6],
            "members_count": r[7],
        } for r in rows]})

    conn.close()
    return ok({"project": None})
