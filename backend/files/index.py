"""
Загрузка, получение и удаление документов и фотоотчётов.
Документы хранятся в S3, метаданные — в БД.
"""
import json
import os
import base64
import mimetypes
import uuid
from datetime import datetime, timezone
import psycopg2
import boto3

SCHEMA = "t_p86039137_client_cabinet_syste"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

DOC_TYPES = ["Договор", "Проект", "Смета", "Акт", "Сертификат", "Документ"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def ok(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", **CORS},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg: str, status: int = 400) -> dict:
    return ok({"error": msg}, status)


def get_session_user(event: dict, conn):
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")
    if not session_id:
        return None
    cur = conn.cursor()
    now = datetime.now(timezone.utc)
    cur.execute(f"""
        SELECT u.id, u.full_name, r.code, r.has_global_access, u.object_id
        FROM {SCHEMA}.sessions s
        JOIN {SCHEMA}.users u ON u.id = s.user_id
        JOIN {SCHEMA}.roles r ON r.id = u.role_id
        WHERE s.id = %s AND s.expires_at > %s AND u.is_active = TRUE
    """, (session_id, now))
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
    user = get_session_user(event, conn)
    if not user:
        conn.close()
        return err("Нет доступа", 401)

    cur = conn.cursor()

    # ── GET: список документов проекта ───────────────────────────────────────
    if method == "GET" and action == "documents":
        object_id = qs.get("object_id") or user.get("object_id")
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        cur.execute(f"""
            SELECT d.id, d.name, d.type, d.file_size, d.mime_type,
                   d.s3_key, d.created_at, u.full_name
            FROM {SCHEMA}.documents d
            JOIN {SCHEMA}.users u ON u.id = d.uploaded_by
            WHERE d.object_id = %s
            ORDER BY d.created_at DESC
        """, (object_id,))
        rows = cur.fetchall()
        conn.close()
        return ok({"documents": [{
            "id": r[0], "name": r[1], "type": r[2],
            "file_size": r[3], "mime_type": r[4],
            "s3_key": r[5], "created_at": str(r[6]),
            "uploaded_by": r[7],
        } for r in rows]})

    # ── GET: список фото проекта ──────────────────────────────────────────────
    if method == "GET" and action == "photos":
        object_id = qs.get("object_id") or user.get("object_id")
        if not object_id:
            conn.close()
            return err("Укажите object_id")
        cur.execute(f"""
            SELECT p.id, p.title, p.stage, p.tag, p.cdn_url,
                   p.s3_key, p.created_at, u.full_name
            FROM {SCHEMA}.photos p
            JOIN {SCHEMA}.users u ON u.id = p.uploaded_by
            WHERE p.object_id = %s
            ORDER BY p.created_at DESC
        """, (object_id,))
        rows = cur.fetchall()
        conn.close()
        return ok({"photos": [{
            "id": r[0], "title": r[1], "stage": r[2],
            "tag": r[3], "cdn_url": r[4],
            "s3_key": r[5], "created_at": str(r[6]),
            "uploaded_by": r[7],
        } for r in rows]})

    # ── GET: presigned download URL ───────────────────────────────────────────
    if method == "GET" and action == "download":
        s3_key = qs.get("key")
        if not s3_key:
            conn.close()
            return err("Укажите key")
        conn.close()
        s3 = s3_client()
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": "files", "Key": s3_key},
            ExpiresIn=300,
        )
        return ok({"url": url})

    # ── POST: загрузить документ ──────────────────────────────────────────────
    if action == "upload_document":
        object_id = body.get("object_id") or user.get("object_id")
        file_name = (body.get("file_name") or "").strip()
        doc_type = body.get("doc_type") or "Документ"
        file_b64 = body.get("file_b64") or ""
        mime_type = body.get("mime_type") or "application/octet-stream"

        if not object_id or not file_name or not file_b64:
            conn.close()
            return err("Укажите object_id, file_name и file_b64")

        if doc_type not in DOC_TYPES:
            doc_type = "Документ"

        file_data = base64.b64decode(file_b64)
        ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
        s3_key = f"documents/{object_id}/{uuid.uuid4()}.{ext}"

        s3 = s3_client()
        s3.put_object(
            Bucket="files",
            Key=s3_key,
            Body=file_data,
            ContentType=mime_type,
            ContentDisposition=f'attachment; filename="{file_name}"',
        )

        cur.execute(f"""
            INSERT INTO {SCHEMA}.documents
                (object_id, uploaded_by, name, type, s3_key, file_size, mime_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (object_id, user["id"], file_name, doc_type, s3_key, len(file_data), mime_type))
        new_id = cur.fetchone()[0]

        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'upload_document', %s, %s)
        """, (user["id"], f"Загружен документ: {file_name}", datetime.now(timezone.utc)))

        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id, "s3_key": s3_key})

    # ── POST: загрузить фото ──────────────────────────────────────────────────
    if action == "upload_photo":
        object_id = body.get("object_id") or user.get("object_id")
        title = (body.get("title") or "").strip() or "Фото"
        stage = body.get("stage") or ""
        tag = body.get("tag") or "Фото"
        file_b64 = body.get("file_b64") or ""
        mime_type = body.get("mime_type") or "image/jpeg"

        if not object_id or not file_b64:
            conn.close()
            return err("Укажите object_id и file_b64")

        file_data = base64.b64decode(file_b64)
        ext = mime_type.split("/")[-1] if "/" in mime_type else "jpg"
        if ext == "jpeg":
            ext = "jpg"
        s3_key = f"photos/{object_id}/{uuid.uuid4()}.{ext}"
        url = cdn_url(s3_key)

        s3 = s3_client()
        s3.put_object(
            Bucket="files",
            Key=s3_key,
            Body=file_data,
            ContentType=mime_type,
        )

        cur.execute(f"""
            INSERT INTO {SCHEMA}.photos
                (object_id, uploaded_by, title, stage, tag, s3_key, cdn_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (object_id, user["id"], title, stage, tag, s3_key, url))
        new_id = cur.fetchone()[0]

        cur.execute(f"""
            INSERT INTO {SCHEMA}.activity_log (user_id, action, detail, created_at)
            VALUES (%s, 'upload_photo', %s, %s)
        """, (user["id"], f"Загружено фото: {title}", datetime.now(timezone.utc)))

        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id, "cdn_url": url})

    # ── POST: удалить документ ────────────────────────────────────────────────
    if action == "delete_document":
        doc_id = body.get("id")
        if not doc_id:
            conn.close()
            return err("Укажите id")
        cur.execute(f"SELECT s3_key, uploaded_by FROM {SCHEMA}.documents WHERE id = %s", (doc_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Документ не найден", 404)
        s3_key, uploader = row
        # Удалять может загрузчик или глобальная роль
        if uploader != user["id"] and not user["global"]:
            conn.close()
            return err("Нет прав", 403)
        s3 = s3_client()
        s3.delete_object(Bucket="files", Key=s3_key)
        cur.execute(f"DELETE FROM {SCHEMA}.documents WHERE id = %s", (doc_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── POST: удалить фото ────────────────────────────────────────────────────
    if action == "delete_photo":
        photo_id = body.get("id")
        if not photo_id:
            conn.close()
            return err("Укажите id")
        cur.execute(f"SELECT s3_key, uploaded_by FROM {SCHEMA}.photos WHERE id = %s", (photo_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Фото не найдено", 404)
        s3_key, uploader = row
        if uploader != user["id"] and not user["global"]:
            conn.close()
            return err("Нет прав", 403)
        s3 = s3_client()
        s3.delete_object(Bucket="files", Key=s3_key)
        cur.execute(f"DELETE FROM {SCHEMA}.photos WHERE id = %s", (photo_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    conn.close()
    return err("Неизвестное действие", 404)
