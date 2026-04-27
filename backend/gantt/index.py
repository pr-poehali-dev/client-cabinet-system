"""
График производства работ (Диаграмма Ганта).
Формирует руководитель проекта (head) и администратор.
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"
EDIT_ROLES = {"head", "admin", "manager"}

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
        SELECT u.id, r.code, r.has_global_access, u.object_id
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        JOIN {SCHEMA}.roles r ON r.id = u.role_id
        WHERE s.id = %s AND s.expires_at > %s AND u.is_active = TRUE
    """, (sid, now))
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "role": row[1], "global": row[2], "object_id": row[3]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}
    action = body.get("action", "")

    conn = get_conn()
    user = get_user(event, conn)
    if not user:
        conn.close()
        return err("Нет доступа", 401)

    cur = conn.cursor()

    # ── GET: этапы объекта ────────────────────────────────────────────────────
    if method == "GET":
        object_id = qs.get("object_id") or user.get("object_id")
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        cur.execute(f"""
            SELECT id, name, start_day, plan_duration, fact_duration,
                   status, color, sort_order
            FROM {SCHEMA}.gantt_stages
            WHERE object_id = %s
            ORDER BY sort_order, id
        """, (object_id,))
        rows = cur.fetchall()
        conn.close()
        return ok({"stages": [{
            "id": r[0], "name": r[1], "start": r[2],
            "planDuration": r[3], "factDuration": r[4],
            "status": r[5], "color": r[6], "sort_order": r[7],
        } for r in rows]})

    # ── Только редакторы могут изменять ──────────────────────────────────────
    if action in ("create", "update", "delete", "reorder") and user["role"] not in EDIT_ROLES:
        conn.close()
        return err("Нет прав. График формирует руководитель проекта", 403)

    # ── POST: создать этап ────────────────────────────────────────────────────
    if action == "create":
        object_id = body.get("object_id") or user.get("object_id")
        name = (body.get("name") or "").strip()
        if not object_id or not name:
            conn.close()
            return err("Укажите object_id и name")
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.gantt_stages WHERE object_id = %s", (object_id,))
        order = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {SCHEMA}.gantt_stages
                (object_id, name, start_day, plan_duration, fact_duration, status, color, sort_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (object_id, name,
              body.get("start_day", 0), body.get("plan_duration", 14),
              body.get("fact_duration", 0), body.get("status", "planned"),
              body.get("color", "195,100%,50%"), order))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id})

    # ── POST: обновить этап ───────────────────────────────────────────────────
    if action == "update":
        stage_id = body.get("id")
        if not stage_id:
            conn.close()
            return err("Укажите id")
        fields, vals = [], []
        for f in ["name", "start_day", "plan_duration", "fact_duration", "status", "color", "sort_order"]:
            if f in body:
                fields.append(f"{f} = %s")
                vals.append(body[f])
        if not fields:
            conn.close()
            return err("Нет полей")
        vals.append(stage_id)
        cur.execute(f"UPDATE {SCHEMA}.gantt_stages SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── POST: удалить этап ────────────────────────────────────────────────────
    if action == "delete":
        stage_id = body.get("id")
        if not stage_id:
            conn.close()
            return err("Укажите id")
        cur.execute(f"DELETE FROM {SCHEMA}.gantt_stages WHERE id = %s", (stage_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    conn.close()
    return err("Неизвестное действие", 404)
