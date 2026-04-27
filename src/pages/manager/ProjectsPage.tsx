import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import FUNC_URLS from "../../../backend/func2url.json";

const SESSION_KEY = "cabinet_session";
function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

function pFetch(opts: RequestInit = {}) {
  return fetch(FUNC_URLS.projects, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  area_m2: number | null;
  started_at: string | null;
  deadline_at: string | null;
  progress_pct: number;
  created_at: string;
  created_by_name: string | null;
  members_count: number;
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface ModalProps {
  initial?: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProjectModal({ initial, onClose, onSaved }: ModalProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    address: initial?.address ?? "",
    description: initial?.description ?? "",
    area_m2: initial?.area_m2?.toString() ?? "",
    started_at: initial?.started_at?.slice(0, 10) ?? "",
    deadline_at: initial?.deadline_at?.slice(0, 10) ?? "",
    progress_pct: initial?.progress_pct?.toString() ?? "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = isEdit
        ? { action: "update", id: initial!.id, ...form, area_m2: form.area_m2 ? Number(form.area_m2) : null, progress_pct: Number(form.progress_pct) }
        : { action: "create", ...form, area_m2: form.area_m2 ? Number(form.area_m2) : null };

      const res = await pFetch({ method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Ошибка");
      else { onSaved(); onClose(); }
    } catch { setError("Нет связи с сервером"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-lg gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold">
              {isEdit ? "Редактировать проект" : "Новый проект"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? "Измените данные объекта" : "Заполните данные нового объекта строительства"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Название объекта <span style={{ color: "hsl(0,80%,60%)" }}>*</span>
            </label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              placeholder="Жилой дом, ул. Ленина 12"
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Адрес</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              placeholder="г. Краснодар, ул. Ленина, д. 12"
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Описание</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Краткое описание объекта, особенности..."
              rows={2}
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors resize-none" />
          </div>

          {/* Area + Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Площадь, м²</label>
              <input value={form.area_m2} onChange={(e) => set("area_m2", e.target.value)}
                type="number" min="0" placeholder="180"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            {isEdit && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Прогресс, %</label>
                <input value={form.progress_pct} onChange={(e) => set("progress_pct", e.target.value)}
                  type="number" min="0" max="100" placeholder="0"
                  className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Дата начала</label>
              <input value={form.started_at} onChange={(e) => set("started_at", e.target.value)}
                type="date"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Срок сдачи</label>
              <input value={form.deadline_at} onChange={(e) => set("deadline_at", e.target.value)}
                type="date"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
              style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>
              <Icon name="AlertCircle" size={14} />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80 transition-opacity">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              {loading ? "Сохраняем…" : isEdit ? "Сохранить" : "Создать проект"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Archive Confirm ──────────────────────────────────────────────────────────

function ArchiveConfirm({ project, onClose, onDone }: { project: Project; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    await pFetch({ method: "POST", body: JSON.stringify({ action: "archive", id: project.id }) });
    onDone(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "hsla(30,100%,50%,0.15)" }}>
          <Icon name="Archive" size={24} style={{ color: "hsl(30,100%,50%)" }} />
        </div>
        <h3 className="font-display text-lg font-bold mb-2">Архивировать проект?</h3>
        <p className="text-sm text-muted-foreground mb-6">
          «{project.name}» будет скрыт из активных. Данные сохранятся.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ background: "hsl(30,100%,50%)", color: "white" }}>
            {loading ? "…" : "Архивировать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ p, onEdit, onArchive }: { p: Project; onEdit: () => void; onArchive: () => void }) {
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const daysLeft = p.deadline_at ? Math.ceil((new Date(p.deadline_at).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="glass rounded-2xl p-5 gradient-border hover-scale flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display text-base font-bold leading-tight">{p.name}</div>
          {p.address && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Icon name="MapPin" size={11} />
              {p.address}
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} title="Редактировать"
            className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Icon name="Pencil" size={14} className="text-muted-foreground" />
          </button>
          <button onClick={onArchive} title="Архивировать"
            className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Icon name="Archive" size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Description */}
      {p.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>
      )}

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Прогресс</span>
          <span className="font-bold" style={{ color: "hsl(195,100%,50%)" }}>{p.progress_pct}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${p.progress_pct}%`,
              background: p.progress_pct === 100
                ? "hsl(142,70%,45%)"
                : "linear-gradient(90deg, hsl(215,80%,45%), hsl(195,100%,50%))"
            }} />
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {p.area_m2 && (
          <div className="glass rounded-lg px-3 py-2">
            <div className="text-muted-foreground mb-0.5">Площадь</div>
            <div className="font-semibold">{p.area_m2} м²</div>
          </div>
        )}
        <div className="glass rounded-lg px-3 py-2">
          <div className="text-muted-foreground mb-0.5">Участников</div>
          <div className="font-semibold">{p.members_count}</div>
        </div>
        <div className="glass rounded-lg px-3 py-2">
          <div className="text-muted-foreground mb-0.5">Старт</div>
          <div className="font-semibold">{fmtDate(p.started_at)}</div>
        </div>
        <div className="glass rounded-lg px-3 py-2">
          <div className="text-muted-foreground mb-0.5">Сдача</div>
          <div className="font-semibold">{fmtDate(p.deadline_at)}</div>
          {daysLeft !== null && daysLeft > 0 && (
            <div className="text-xs mt-0.5" style={{ color: daysLeft < 30 ? "hsl(0,80%,60%)" : "hsl(142,70%,45%)" }}>
              {daysLeft} дн.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
        <span>Создал: {p.created_by_name || "—"}</span>
        <span>{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await pFetch();
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Проекты</h2>
          <p className="text-muted-foreground mt-1">Управление объектами строительства</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск…"
              className="bg-secondary/60 rounded-xl pl-9 pr-4 py-2 text-sm outline-none border border-border focus:border-primary transition-colors w-44" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Plus" size={16} />
            Новый проект
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Всего проектов", value: projects.length, icon: "Building2", color: "hsl(195,100%,50%)" },
          { label: "В работе", value: projects.filter((p) => p.progress_pct > 0 && p.progress_pct < 100).length, icon: "Hammer", color: "hsl(30,100%,50%)" },
          { label: "Завершено", value: projects.filter((p) => p.progress_pct === 100).length, icon: "CheckCircle2", color: "hsl(142,70%,45%)" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}20` }}>
              <Icon name={s.icon} size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div className="font-display text-2xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Загрузка проектов…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(195,100%,50%,0.1)" }}>
            <Icon name="Building2" size={28} style={{ color: "hsl(195,100%,50%)" }} />
          </div>
          <div className="font-display text-lg font-bold mb-2">
            {search ? "Проекты не найдены" : "Нет активных проектов"}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {search ? "Попробуйте другой запрос" : "Создайте первый объект строительства"}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl text-sm font-bold"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              Создать проект
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              onEdit={() => setEditProject(p)}
              onArchive={() => setArchiveProject(p)}
            />
          ))}
        </div>
      )}

      {showCreate && <ProjectModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {editProject && <ProjectModal initial={editProject} onClose={() => setEditProject(null)} onSaved={load} />}
      {archiveProject && <ArchiveConfirm project={archiveProject} onClose={() => setArchiveProject(null)} onDone={load} />}
    </div>
  );
}
