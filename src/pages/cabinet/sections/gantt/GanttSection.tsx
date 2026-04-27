import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useMyProject } from "@/hooks/useMyProject";
import { User } from "../../../Login";
import { ganttFetch, GanttStage, STATUS_COLORS, STATUS_LABELS } from "./ganttApi";

export function GanttSection({ user }: { user?: User }) {
  const { project } = useMyProject();
  const [stages, setStages] = useState<GanttStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editStage, setEditStage] = useState<GanttStage | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const COL = 3;

  const canEdit = !!user && ["head", "admin", "manager"].includes(user.role_code);
  const objectId = project?.id;

  const load = useCallback(async () => {
    if (!objectId) { setLoading(false); return; }
    setLoading(true);
    const r = await ganttFetch(`/?object_id=${objectId}`);
    const d = await r.json();
    setStages(d.stages || []);
    setLoading(false);
  }, [objectId]);

  useEffect(() => { load(); }, [load]);

  const addStage = async () => {
    if (!newName.trim() || !objectId) return;
    setSaving(true);
    await ganttFetch("/", { method: "POST", body: JSON.stringify({ action: "create", object_id: objectId, name: newName.trim() }) });
    setNewName(""); setShowAdd(false);
    await load();
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editStage) return;
    setSaving(true);
    await ganttFetch("/", { method: "POST", body: JSON.stringify({ action: "update", ...editStage }) });
    setEditStage(null);
    await load();
    setSaving(false);
  };

  const deleteStage = async (id: number) => {
    if (!confirm("Удалить этап?")) return;
    await ganttFetch("/", { method: "POST", body: JSON.stringify({ action: "delete", id }) });
    await load();
  };

  if (!objectId && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-2xl font-bold">График работ</h2>
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground text-sm">Проект не назначен</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">График работ</h2>
          <p className="text-muted-foreground mt-1">Диаграмма Ганта — план и факт выполнения</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Plus" size={15} />
            Добавить этап
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { color: "hsl(142,80%,50%)", label: "Завершено (факт)" },
          { color: "hsl(195,100%,50%)", label: "В работе" },
          { color: "hsl(265,90%,65%)", label: "Запланировано" },
          { color: "rgba(255,255,255,0.12)", label: "Плановый срок" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ background: l.color }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка…</div>
      ) : stages.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(195,100%,50%,0.1)" }}>
            <Icon name="GanttChart" size={26} style={{ color: "hsl(195,100%,50%)" }} />
          </div>
          <div className="font-semibold mb-1">График не заполнен</div>
          <p className="text-sm text-muted-foreground mt-1">
            {canEdit ? "Добавьте первый этап строительства" : "Руководитель проекта ещё не заполнил график"}
          </p>
          {canEdit && (
            <button onClick={() => setShowAdd(true)} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              Добавить этап
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Gantt chart */}
          <div className="glass rounded-2xl p-5 overflow-x-auto scrollbar-thin">
            <div style={{ minWidth: `${Math.max(...stages.map((s) => s.start + s.planDuration), 180) * COL + 220}px` }}>
              <div className="relative">
                <div className="space-y-3">
                  {stages.map((stage) => {
                    const color = stage.color || STATUS_COLORS[stage.status] || "195,100%,50%";
                    return (
                      <div key={stage.id} className="flex items-center" style={{ height: "38px" }}>
                        <div className="flex-shrink-0 text-sm font-medium flex items-center gap-2" style={{ width: "216px", paddingRight: "16px" }}>
                          <span className="truncate">{stage.name}</span>
                          {canEdit && (
                            <button onClick={() => setEditStage(stage)}
                              className="p-1 rounded hover:bg-secondary flex-shrink-0 opacity-40 hover:opacity-100">
                              <Icon name="Pencil" size={11} />
                            </button>
                          )}
                        </div>
                        <div className="relative flex-1 h-full flex items-center">
                          <div className="absolute h-4 rounded-full"
                            style={{
                              left: `${stage.start * COL}px`,
                              width: `${Math.max(stage.planDuration, 1) * COL}px`,
                              background: "rgba(255,255,255,0.1)",
                              border: `1px solid hsl(${color},0.3)`,
                            }} />
                          {stage.factDuration > 0 && (
                            <div className="absolute h-4 rounded-full"
                              style={{
                                left: `${stage.start * COL}px`,
                                width: `${stage.factDuration * COL}px`,
                                background: `hsl(${color})`,
                                boxShadow: `0 0 10px hsla(${color},0.4)`,
                              }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stages.map((s) => {
              const color = s.color || STATUS_COLORS[s.status] || "195,100%,50%";
              return (
                <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-4 group">
                  <div className="w-1 self-stretch rounded-full" style={{ background: `hsl(${color})` }} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.factDuration > 0
                        ? `Факт: ${s.factDuration} дн. / План: ${s.planDuration} дн.`
                        : `План: ${s.planDuration} дн.`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge style={{ background: `hsla(${color},0.15)`, color: `hsl(${color})` }}>
                      {STATUS_LABELS[s.status] || s.status}
                    </Badge>
                    {canEdit && (
                      <button onClick={() => deleteStage(s.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
                        <Icon name="Trash2" size={13} style={{ color: "hsl(0,80%,60%)" }} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add stage modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">Новый этап</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl hover:bg-secondary">
                <Icon name="X" size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Название этапа</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Фундамент, Кровля…"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
                onKeyDown={(e) => { if (e.key === "Enter") addStage(); }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
              <button onClick={addStage} disabled={!newName.trim() || saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                {saving ? "…" : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit stage modal */}
      {editStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Редактировать этап</h3>
              <button onClick={() => setEditStage(null)} className="p-2 rounded-xl hover:bg-secondary">
                <Icon name="X" size={18} className="text-muted-foreground" />
              </button>
            </div>
            {[
              { label: "Название", key: "name", type: "text" },
              { label: "Начало (день)", key: "start_day", type: "number" },
              { label: "Длительность план (дн.)", key: "plan_duration", type: "number" },
              { label: "Длительность факт (дн.)", key: "fact_duration", type: "number" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <input type={f.type}
                  value={String((editStage as Record<string, unknown>)[f.key === "start_day" ? "start" : f.key === "plan_duration" ? "planDuration" : f.key === "fact_duration" ? "factDuration" : f.key] ?? "")}
                  onChange={(e) => setEditStage((prev) => {
                    if (!prev) return prev;
                    const map: Record<string, string> = { start_day: "start", plan_duration: "planDuration", fact_duration: "factDuration" };
                    const k = map[f.key] || f.key;
                    return { ...prev, [k]: f.type === "number" ? Number(e.target.value) : e.target.value };
                  })}
                  className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Статус</label>
              <select value={editStage.status}
                onChange={(e) => setEditStage((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors">
                <option value="planned">Планируется</option>
                <option value="in-progress">В работе</option>
                <option value="done">Готово</option>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditStage(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                {saving ? "…" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
