import { useState } from "react";
import Icon from "@/components/ui/icon";
import { pFetch, Project } from "./projectsApi";

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface ModalProps {
  initial?: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProjectModal({ initial, onClose, onSaved }: ModalProps) {
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
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Название объекта <span style={{ color: "hsl(0,80%,60%)" }}>*</span>
            </label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required
              placeholder="Жилой дом, ул. Ленина 12"
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Адрес</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              placeholder="г. Краснодар, ул. Ленина, д. 12"
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Описание</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Краткое описание объекта, особенности..."
              rows={2}
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors resize-none" />
          </div>

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

export function ArchiveConfirm({ project, onClose, onDone }: {
  project: Project; onClose: () => void; onDone: () => void;
}) {
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
