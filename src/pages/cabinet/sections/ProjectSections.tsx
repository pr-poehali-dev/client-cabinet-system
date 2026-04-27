import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMyProject } from "@/hooks/useMyProject";
import FUNC_URLS from "../../../../backend/func2url.json";
import { User } from "../../Login";

const SESSION_KEY = "cabinet_session";
function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

function ganttFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.gantt + path, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Session-Id": getSession(), ...((opts.headers as Record<string, string>) || {}) },
  });
}

interface GanttStage {
  id: number; name: string; start: number;
  planDuration: number; factDuration: number;
  status: string; color: string; sort_order: number;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: string; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 hover-scale gradient-border relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: color }} />
      <div className="mb-3">
        <div className="p-2 rounded-xl inline-flex" style={{ background: `${color}20` }}>
          <Icon name={icon} size={20} style={{ color }} />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      <div className="text-xs mt-2 font-medium" style={{ color }}>{sub}</div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function daysLeft(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ─── No Project State ─────────────────────────────────────────────────────────

function NoProject() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Обзор проекта</h2>
      </div>
      <div className="glass rounded-3xl p-16 text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "hsla(195,100%,50%,0.1)" }}>
          <Icon name="Building2" size={28} style={{ color: "hsl(195,100%,50%)" }} />
        </div>
        <div className="font-display text-lg font-bold mb-2">Проект не назначен</div>
        <p className="text-sm text-muted-foreground">
          Обратитесь к менеджеру проекта — он привяжет вас к объекту строительства.
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSection() {
  const { project, projects, loading } = useMyProject();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Глобальные роли — видят все проекты списком
  if (!project && projects.length > 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Все проекты</h2>
          <p className="text-muted-foreground mt-1">Общий обзор объектов строительства</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Всего объектов", value: String(projects.length), icon: "Building2", color: "hsl(195,100%,50%)" },
            { label: "В работе", value: String(projects.filter((p) => p.progress_pct > 0 && p.progress_pct < 100).length), icon: "Hammer", color: "hsl(30,100%,50%)" },
            { label: "Завершено", value: String(projects.filter((p) => p.progress_pct === 100).length), icon: "CheckCircle2", color: "hsl(142,80%,50%)" },
          ].map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub="" icon={s.icon} color={s.color} />
          ))}
        </div>
        <div className="space-y-3">
          {projects.map((p) => {
            const left = daysLeft(p.deadline_at);
            return (
              <div key={p.id} className="glass rounded-2xl p-5 flex items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold">{p.name}</div>
                  {p.address && <div className="text-xs text-muted-foreground mt-0.5">{p.address}</div>}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${p.progress_pct}%`,
                        background: p.progress_pct === 100 ? "hsl(142,80%,50%)" : "linear-gradient(90deg, hsl(215,80%,45%), hsl(195,100%,50%))"
                      }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: "hsl(195,100%,50%)" }}>{p.progress_pct}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Сдача</div>
                  <div className="text-sm font-semibold mt-0.5">{fmtDate(p.deadline_at)}</div>
                  {left !== null && left > 0 && (
                    <div className="text-xs mt-0.5" style={{ color: left < 30 ? "hsl(0,80%,60%)" : "hsl(142,70%,45%)" }}>
                      {left} дн.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Нет привязанного проекта
  if (!project) return <NoProject />;

  // Конкретный проект пользователя
  const left = daysLeft(project.deadline_at);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Обзор проекта</h2>
        <p className="text-muted-foreground mt-1">
          {[project.area_m2 ? `${project.area_m2} м²` : null, project.address].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Hero progress */}
      <div className="glass-strong rounded-3xl p-6 gradient-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ background: "radial-gradient(ellipse at top right, hsl(195,100%,50%), transparent 60%)" }} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-muted-foreground text-sm font-medium mb-1">Общий прогресс</div>
            <div className="font-display text-5xl font-black"
              style={{ color: "hsl(195,100%,50%)", textShadow: "0 0 20px hsla(195,100%,50%,0.5)" }}>
              {project.progress_pct}%
            </div>
          </div>
          <div className="text-right">
            {project.deadline_at && (
              <>
                <div className="text-muted-foreground text-sm">Расчётная сдача</div>
                <div className="text-xl font-bold text-foreground mt-1">{fmtDate(project.deadline_at)}</div>
                {left !== null && left > 0 && (
                  <div className="text-xs mt-0.5" style={{ color: left < 30 ? "hsl(0,80%,60%)" : "hsl(142,80%,50%)" }}>
                    {left < 30 ? `⚠ ${left} дн. до сдачи` : `▲ ${left} дн. осталось`}
                  </div>
                )}
                {left !== null && left <= 0 && (
                  <div className="text-xs mt-0.5" style={{ color: "hsl(0,80%,60%)" }}>Срок истёк</div>
                )}
              </>
            )}
          </div>
        </div>
        <Progress value={project.progress_pct} className="h-3 bg-secondary" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{project.started_at ? `Начало: ${fmtDate(project.started_at)}` : ""}</span>
          <span>{project.deadline_at ? `Конец: ${fmtDate(project.deadline_at)}` : ""}</span>
        </div>
      </div>

      {/* Stat cards — пока статика, в будущем из БД */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Документов" value="—" sub="загружаются" icon="FileText" color="hsl(265,90%,65%)" />
        <StatCard label="Фотоотчётов" value="—" sub="загружаются" icon="Camera" color="hsl(30,100%,55%)" />
        <StatCard label="Сертификатов" value="—" sub="загружаются" icon="Award" color="hsl(195,100%,50%)" />
        <StatCard label="Прогресс" value={`${project.progress_pct}%`} sub="общий по объекту" icon="CheckCircle2" color="hsl(142,80%,50%)" />
      </div>

      {/* Project info */}
      {project.description && (
        <div className="glass rounded-2xl p-5">
          <div className="font-semibold mb-2">О проекте</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Gantt ────────────────────────────────────────────────────────────────────

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

  const STATUS_COLORS: Record<string, string> = {
    done: "142,80%,50%", "in-progress": "195,100%,50%", planned: "265,90%,65%",
  };
  const STATUS_LABELS: Record<string, string> = { done: "Готово", "in-progress": "В работе", planned: "Планируется" };

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