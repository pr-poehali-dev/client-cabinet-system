import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useMyProject } from "@/hooks/useMyProject";
import { toBase64, fmtDate } from "./filesApi";
import FUNC_URLS from "../../../../../backend/func2url.json";
import { User } from "../../../Login";

const SESSION_KEY = "cabinet_session";
function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

function certFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.certs + path, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Session-Id": getSession(), ...((opts.headers as Record<string, string>) || {}) },
  });
}

interface Cert {
  id: number; name: string; material: string | null; vendor: string | null;
  issued_date: string | null; cdn_url: string; s3_key: string;
  created_at: string; uploaded_by: string;
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadCertModal({ objectId, onClose, onUploaded }: {
  objectId: number; onClose: () => void; onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", material: "", vendor: "", issued_date: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async () => {
    if (!file || !form.name.trim()) return;
    setLoading(true); setError("");
    try {
      const b64 = await toBase64(file);
      const res = await certFetch("/", {
        method: "POST",
        body: JSON.stringify({
          action: "upload",
          object_id: objectId,
          name: form.name.trim(),
          material: form.material.trim() || null,
          vendor: form.vendor.trim() || null,
          issued_date: form.issued_date || null,
          file_b64: b64,
          mime_type: file.type || "application/pdf",
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Ошибка");
      else { onUploaded(); onClose(); }
    } catch { setError("Нет связи"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Загрузить сертификат</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* File picker */}
        <div onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer mb-4 transition-colors"
          style={{ borderColor: file ? "hsl(195,100%,50%)" : "hsl(220,15%,20%)" }}>
          <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div>
              <Icon name="FileCheck" size={26} className="mx-auto mb-1" style={{ color: "hsl(195,100%,50%)" }} />
              <div className="text-sm font-semibold truncate">{file.name}</div>
            </div>
          ) : (
            <div>
              <Icon name="Upload" size={26} className="mx-auto mb-1 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">PDF или фото сертификата</div>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Название <span style={{ color: "hsl(0,80%,60%)" }}>*</span>
            </label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              placeholder="Цемент М500 — ГОСТ 31108-2020"
              className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Материал</label>
              <input value={form.material} onChange={(e) => set("material", e.target.value)}
                placeholder="Цемент, Арматура…"
                className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Поставщик</label>
              <input value={form.vendor} onChange={(e) => set("vendor", e.target.value)}
                placeholder="ЦемСнаб…"
                className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Дата выдачи</label>
            <input type="date" value={form.issued_date} onChange={(e) => set("issued_date", e.target.value)}
              className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl mb-4"
            style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>
            <Icon name="AlertCircle" size={14} />{error}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
          <button onClick={handleUpload} disabled={!file || !form.name.trim() || loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            {loading ? "Загружаем…" : "Загрузить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Certificates Section ─────────────────────────────────────────────────────

export function CertificatesSection({ user }: { user?: User }) {
  const { project } = useMyProject();
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const canUpload = !!user && ["supply", "head", "admin", "manager"].includes(user.role_code);
  const objectId = project?.id;

  const load = useCallback(async () => {
    if (!objectId) { setLoading(false); return; }
    setLoading(true);
    const r = await certFetch(`/?object_id=${objectId}`);
    const d = await r.json();
    setCerts(d.certificates || []);
    setLoading(false);
  }, [objectId]);

  useEffect(() => { load(); }, [load]);

  const deleteCert = async (c: Cert) => {
    if (!confirm(`Удалить «${c.name}»?`)) return;
    setDeleting(c.id);
    await certFetch("/", { method: "POST", body: JSON.stringify({ action: "delete", id: c.id }) });
    await load();
    setDeleting(null);
  };

  if (!objectId && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-2xl font-bold">Сертификаты качества</h2>
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground text-sm">Проект не назначен</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Сертификаты качества</h2>
          <p className="text-muted-foreground mt-1">Документы на строительные материалы объекта</p>
        </div>
        {canUpload && (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Plus" size={15} />
            Загрузить
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка…</div>
      ) : certs.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(265,90%,65%,0.1)" }}>
            <Icon name="Award" size={26} style={{ color: "hsl(265,90%,65%)" }} />
          </div>
          <div className="font-semibold mb-1">Сертификатов пока нет</div>
          <p className="text-sm text-muted-foreground mt-1">
            {canUpload ? "Загрузите первый сертификат на материал" : "Отдел снабжения ещё не загрузил сертификаты"}
          </p>
          {canUpload && (
            <button onClick={() => setShowUpload(true)} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              Загрузить сертификат
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certs.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5 gradient-border hover-scale group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl" style={{ background: "hsla(265,90%,65%,0.1)" }}>
                  <Icon name="Award" size={22} style={{ color: "hsl(265,90%,65%)" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ background: "hsla(142,80%,50%,0.12)", color: "hsl(142,80%,50%)" }}>
                    ✓ Действителен
                  </span>
                  {canUpload && (
                    <button onClick={() => deleteCert(c)} disabled={deleting === c.id}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
                      <Icon name="Trash2" size={13} style={{ color: "hsl(0,80%,60%)" }} />
                    </button>
                  )}
                </div>
              </div>
              <div className="font-semibold text-sm">{c.name}</div>
              {(c.material || c.vendor) && (
                <div className="text-xs text-muted-foreground mt-1">
                  {[c.material, c.vendor].filter(Boolean).join(" · ")}
                </div>
              )}
              {c.issued_date && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Выдан: {fmtDate(c.issued_date)}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-0.5">
                Загрузил: {c.uploaded_by}
              </div>
              <a href={c.cdn_url} target="_blank" rel="noreferrer"
                className="mt-3 text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: "hsl(195,100%,50%)" }}>
                <Icon name="Download" size={12} />
                Скачать
              </a>
            </div>
          ))}
        </div>
      )}

      {showUpload && objectId && (
        <UploadCertModal objectId={objectId} onClose={() => setShowUpload(false)} onUploaded={load} />
      )}
    </div>
  );
}
