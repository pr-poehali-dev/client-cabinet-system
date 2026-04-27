"""
Сертификаты качества материалов.
Загружает снабжение (supply), видят все участники объекта.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3
from datetime import datetime, timezone

SCHEMA = "t_p86039137_client_cabinet_syste"
UPLOAD_ROLES = {"supply", "head", "admin", "manager"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def s3():
    return boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])


def cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


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

    # ── GET: список сертификатов объекта ──────────────────────────────────────
    if method == "GET":
        object_id = qs.get("object_id") or user.get("object_id")
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        cur.execute(f"""
            SELECT c.id, c.name, c.material, c.vendor, c.issued_date,
                   c.cdn_url, c.s3_key, c.created_at, u.full_name
            FROM {SCHEMA}.certificates c
            JOIN {SCHEMA}.users u ON u.id = c.uploaded_by
            WHERE c.object_id = %s
            ORDER BY c.created_at DESC
        """, (object_id,))
        rows = cur.fetchall()
        conn.close()
        return ok({"certificates": [{
            "id": r[0], "name": r[1], "material": r[2], "vendor": r[3],
            "issued_date": str(r[4]) if r[4] else None,
            "cdn_url": r[5], "s3_key": r[6],
            "created_at": str(r[7]), "uploaded_by": r[8],
        } for r in rows]})

    # ── POST: загрузить сертификат ────────────────────────────────────────────
    if action == "upload":
        if user["role"] not in UPLOAD_ROLES:
            conn.close()
            return err("Нет прав. Сертификаты загружает снабжение", 403)
        object_id = body.get("object_id") or user.get("object_id")
        name = (body.get("name") or "").strip()
        file_b64 = body.get("file_b64") or ""
        mime_type = body.get("mime_type") or "application/pdf"
        if not object_id or not name or not file_b64:
            conn.close()
            return err("Укажите object_id, name и file_b64")
        file_data = base64.b64decode(file_b64)
        ext = "pdf" if "pdf" in mime_type else mime_type.split("/")[-1]
        key = f"certs/{object_id}/{uuid.uuid4()}.{ext}"
        url = cdn_url(key)
        s3().put_object(Bucket="files", Key=key, Body=file_data, ContentType=mime_type,
                        ContentDisposition=f'attachment; filename="{name}"')
        cur.execute(f"""
            INSERT INTO {SCHEMA}.certificates
                (object_id, uploaded_by, name, material, vendor, issued_date, s3_key, cdn_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (object_id, user["id"], name,
              body.get("material") or None,
              body.get("vendor") or None,
              body.get("issued_date") or None,
              key, url))
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id, "cdn_url": url})

    # ── POST: удалить сертификат ──────────────────────────────────────────────
    if action == "delete":
        cert_id = body.get("id")
        if not cert_id:
            conn.close()
            return err("Укажите id")
        cur.execute(f"SELECT s3_key, uploaded_by FROM {SCHEMA}.certificates WHERE id = %s", (cert_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Сертификат не найден", 404)
        s3_key, uploader = row
        if uploader != user["id"] and not user["global"]:
            conn.close()
            return err("Нет прав", 403)
        s3().delete_object(Bucket="files", Key=s3_key)
        cur.execute(f"DELETE FROM {SCHEMA}.certificates WHERE id = %s", (cert_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    conn.close()
    return err("Неизвестное действие", 404)
