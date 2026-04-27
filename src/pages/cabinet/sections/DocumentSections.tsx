import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import FUNC_URLS from "../../../../backend/func2url.json";
import { useMyProject } from "@/hooks/useMyProject";

const SESSION_KEY = "cabinet_session";
function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

function filesFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.files + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

const TYPE_COLORS: Record<string, string> = {
  "Договор": "hsl(265,90%,65%)",
  "Проект": "hsl(195,100%,50%)",
  "Смета": "hsl(30,100%,55%)",
  "Акт": "hsl(142,80%,50%)",
  "Сертификат": "hsl(45,90%,55%)",
  "Документ": "hsl(215,60%,60%)",
};

const DOC_TYPES = ["Договор", "Проект", "Смета", "Акт", "Сертификат", "Документ"];

// ─── Upload Document Modal ────────────────────────────────────────────────────

function UploadDocModal({ objectId, onClose, onUploaded }: {
  objectId: number; onClose: () => void; onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Документ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const b64 = await toBase64(file);
      const res = await filesFetch("/", {
        method: "POST",
        body: JSON.stringify({
          action: "upload_document",
          object_id: objectId,
          file_name: file.name,
          doc_type: docType,
          file_b64: b64,
          mime_type: file.type || "application/octet-stream",
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Ошибка загрузки");
      else { onUploaded(); onClose(); }
    } catch { setError("Нет связи с сервером"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Загрузить документ</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4"
          style={{ borderColor: file ? "hsl(195,100%,50%)" : "hsl(220,15%,20%)" }}>
          <input ref={inputRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div>
              <Icon name="FileCheck" size={28} className="mx-auto mb-2" style={{ color: "hsl(195,100%,50%)" }} />
              <div className="text-sm font-semibold truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{fmtSize(file.size)}</div>
            </div>
          ) : (
            <div>
              <Icon name="Upload" size={28} className="mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Нажмите или перетащите файл</div>
              <div className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, изображения</div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Тип документа</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value)}
            className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors">
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl mb-4"
            style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>
            <Icon name="AlertCircle" size={14} />{error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
          <button onClick={handleUpload} disabled={!file || loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            {loading ? "Загружаем…" : "Загрузить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Documents Section ────────────────────────────────────────────────────────

interface DocItem {
  id: number; name: string; type: string;
  file_size: number | null; mime_type: string | null;
  s3_key: string; created_at: string; uploaded_by: string;
}

export function DocumentsSection() {
  const { project } = useMyProject();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Все");
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const objectId = project?.id;

  const load = useCallback(async () => {
    if (!objectId) { setLoading(false); return; }
    setLoading(true);
    const res = await filesFetch(`/?action=documents&object_id=${objectId}`);
    const data = await res.json();
    setDocs(data.documents || []);
    setLoading(false);
  }, [objectId]);

  useEffect(() => { load(); }, [load]);

  const download = async (doc: DocItem) => {
    setDownloading(doc.id);
    const res = await filesFetch(`/?action=download&key=${encodeURIComponent(doc.s3_key)}`);
    const data = await res.json();
    if (data.url) {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = doc.name;
      a.click();
    }
    setDownloading(null);
  };

  const deleteDoc = async (doc: DocItem) => {
    if (!confirm(`Удалить «${doc.name}»?`)) return;
    setDeleting(doc.id);
    await filesFetch("/", { method: "POST", body: JSON.stringify({ action: "delete_document", id: doc.id }) });
    await load();
    setDeleting(null);
  };

  const filtered = filter === "Все" ? docs : docs.filter((d) => d.type === filter);

  if (!objectId && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-2xl font-bold">Документы</h2>
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground text-sm">
          Проект не назначен — документы недоступны
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Документы</h2>
          <p className="text-muted-foreground mt-1">Все документы по проекту</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {["Все", ...DOC_TYPES].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filter === f ? "hsl(195,100%,40%)" : "rgba(255,255,255,0.05)",
                  color: filter === f ? "white" : "hsl(215,15%,55%)",
                  border: filter === f ? "none" : "1px solid hsl(220,15%,16%)",
                }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Plus" size={13} />
            Загрузить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(195,100%,50%,0.1)" }}>
            <Icon name="FileText" size={26} style={{ color: "hsl(195,100%,50%)" }} />
          </div>
          <div className="font-semibold mb-1">{filter !== "Все" ? `Нет документов типа «${filter}»` : "Документов пока нет"}</div>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Загрузите первый документ</p>
          <button onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            Загрузить документ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => {
            const color = TYPE_COLORS[doc.type] || TYPE_COLORS["Документ"];
            return (
              <div key={doc.id} className="glass rounded-xl p-4 flex items-center gap-4 hover-scale group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20` }}>
                  <Icon name="FileText" size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{doc.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(doc.created_at)} · {fmtSize(doc.file_size)} · {doc.uploaded_by}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0"
                  style={{ background: `${color}15`, color }}>
                  {doc.type}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => download(doc)} disabled={downloading === doc.id}
                    title="Скачать" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    {downloading === doc.id
                      ? <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                      : <Icon name="Download" size={15} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => deleteDoc(doc)} disabled={deleting === doc.id}
                    title="Удалить" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Icon name="Trash2" size={15} style={{ color: "hsl(0,80%,60%)" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpload && objectId && (
        <UploadDocModal objectId={objectId} onClose={() => setShowUpload(false)} onUploaded={load} />
      )}
    </div>
  );
}

// ─── Upload Photo Modal ───────────────────────────────────────────────────────

function UploadPhotoModal({ objectId, onClose, onUploaded }: {
  objectId: number; onClose: () => void; onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("");
  const [tag, setTag] = useState("Отчёт");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const b64 = await toBase64(file);
      const res = await filesFetch("/", {
        method: "POST",
        body: JSON.stringify({
          action: "upload_photo",
          object_id: objectId,
          title: title || file.name,
          stage, tag,
          file_b64: b64,
          mime_type: file.type || "image/jpeg",
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
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Загрузить фото</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Preview / drop */}
        <div onClick={() => inputRef.current?.click()}
          className="rounded-2xl overflow-hidden mb-4 cursor-pointer transition-all"
          style={{ border: "2px dashed hsl(220,15%,20%)", minHeight: "140px" }}>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-36 object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-muted-foreground">
              <Icon name="ImagePlus" size={28} className="mb-2" />
              <span className="text-sm">Выбрать фото</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Подпись</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Описание фото"
              className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Этап</label>
              <input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Фундамент…"
                className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Тег</label>
              <select value={tag} onChange={(e) => setTag(e.target.value)}
                className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors">
                {["Отчёт", "Процесс", "Проблема", "Материал", "Фото"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
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
          <button onClick={handleUpload} disabled={!file || loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            {loading ? "Загружаем…" : "Загрузить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Photos Section ───────────────────────────────────────────────────────────

interface PhotoItem {
  id: number; title: string; stage: string | null; tag: string;
  cdn_url: string; s3_key: string; created_at: string; uploaded_by: string;
}

export function PhotosSection() {
  const { project } = useMyProject();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<PhotoItem | null>(null);

  const objectId = project?.id;

  const load = useCallback(async () => {
    if (!objectId) { setLoading(false); return; }
    setLoading(true);
    const res = await filesFetch(`/?action=photos&object_id=${objectId}`);
    const data = await res.json();
    setPhotos(data.photos || []);
    setLoading(false);
  }, [objectId]);

  useEffect(() => { load(); }, [load]);

  const deletePhoto = async (p: PhotoItem) => {
    if (!confirm(`Удалить фото «${p.title}»?`)) return;
    setDeleting(p.id);
    await filesFetch("/", { method: "POST", body: JSON.stringify({ action: "delete_photo", id: p.id }) });
    await load();
    setDeleting(null);
  };

  if (!objectId && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-2xl font-bold">Фотоотчёты</h2>
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground text-sm">
          Проект не назначен — фотоотчёты недоступны
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Фотоотчёты</h2>
          <p className="text-muted-foreground mt-1">Визуальный прогресс строительства</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: "hsl(195,100%,40%)", color: "white" }}>
          <Icon name="Plus" size={15} />
          Добавить фото
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка…</div>
      ) : photos.length === 0 ? (
        <div className="glass rounded-3xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(30,100%,50%,0.1)" }}>
            <Icon name="Camera" size={26} style={{ color: "hsl(30,100%,50%)" }} />
          </div>
          <div className="font-semibold mb-1">Фотоотчётов пока нет</div>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Добавьте первый фотоотчёт по объекту</p>
          <button onClick={() => setShowUpload(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            Добавить фото
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden hover-scale group relative">
              <div className="h-36 bg-secondary relative cursor-pointer" onClick={() => setLightbox(p)}>
                <img src={p.cdn_url} alt={p.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors" />
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-black/50 text-white">{p.tag}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deletePhoto(p); }}
                  disabled={deleting === p.id}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="Trash2" size={13} style={{ color: "hsl(0,80%,70%)" }} />
                </button>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                  <span>{p.stage || p.uploaded_by}</span>
                  <span>{fmtDate(p.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && objectId && (
        <UploadPhotoModal objectId={objectId} onClose={() => setShowUpload(false)} onUploaded={load} />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.cdn_url} alt={lightbox.title} className="w-full rounded-2xl" />
            <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-2xl"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
              <div className="text-white font-semibold">{lightbox.title}</div>
              <div className="text-white/50 text-xs mt-0.5">{lightbox.stage} · {fmtDate(lightbox.created_at)}</div>
            </div>
            <button onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Certificates (static) ────────────────────────────────────────────────────

import { CERTS } from "../data";

export function CertificatesSection() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Сертификаты качества</h2>
        <p className="text-muted-foreground mt-1">Документы на строительные материалы объекта</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CERTS.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-5 gradient-border hover-scale">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: "hsla(265,90%,65%,0.1)" }}>
                <Icon name="Award" size={22} style={{ color: "hsl(265,90%,65%)" }} />
              </div>
              <span className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: "hsla(142,80%,50%,0.12)", color: "hsl(142,80%,50%)" }}>
                ✓ Действителен
              </span>
            </div>
            <div className="font-semibold text-sm">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.material} · {c.vendor}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Выдан: {c.date}</div>
            <button className="mt-3 text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "hsl(195,100%,50%)" }}>
              <Icon name="Download" size={12} />
              Скачать PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
