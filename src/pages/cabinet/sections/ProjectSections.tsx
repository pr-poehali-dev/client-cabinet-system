import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GANTT_STAGES } from "../data";
import { useMyProject } from "@/hooks/useMyProject";

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

export function GanttSection() {
  const COL = 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">График работ</h2>
        <p className="text-muted-foreground mt-1">Диаграмма Ганта — план и факт выполнения</p>
      </div>

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

      <div className="glass rounded-2xl p-5 overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: `${180 * COL + 220}px` }}>
          <div className="flex mb-3" style={{ paddingLeft: "220px" }}>
            {["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь"].map((m) => (
              <div key={m} className="text-xs font-semibold text-muted-foreground" style={{ width: `${30 * COL}px` }}>
                {m}
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute top-0 bottom-0 z-10" style={{ left: `${220 + 107 * COL}px`, width: "2px", background: "hsl(195,100%,50%)", opacity: 0.7 }}>
              <div className="w-3 h-3 rounded-full absolute -top-1 -left-0.5" style={{ background: "hsl(195,100%,50%)" }} />
              <div className="absolute -top-6 -left-7 text-xs font-bold whitespace-nowrap" style={{ color: "hsl(195,100%,50%)" }}>Сегодня</div>
            </div>

            <div className="space-y-3">
              {GANTT_STAGES.map((stage) => (
                <div key={stage.id} className="flex items-center" style={{ height: "38px" }}>
                  <div className="flex-shrink-0 text-sm font-medium" style={{ width: "216px", paddingRight: "16px" }}>
                    {stage.name}
                  </div>
                  <div className="relative flex-1 h-full flex items-center">
                    <div className="absolute h-4 rounded-full"
                      style={{
                        left: `${stage.start * COL}px`,
                        width: `${stage.planDuration * COL}px`,
                        background: "rgba(255,255,255,0.1)",
                        border: `1px solid hsl(${stage.color},0.3)`
                      }} />
                    {stage.factDuration > 0 && (
                      <div className="absolute h-4 rounded-full"
                        style={{
                          left: `${stage.start * COL}px`,
                          width: `${stage.factDuration * COL}px`,
                          background: `hsl(${stage.color})`,
                          boxShadow: `0 0 10px hsla(${stage.color},0.4)`,
                        }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GANTT_STAGES.map((s) => (
          <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-4">
            <div className="w-1 self-stretch rounded-full" style={{ background: `hsl(${s.color})` }} />
            <div className="flex-1">
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.factDuration > 0
                  ? `Факт: ${s.factDuration} дн. / План: ${s.planDuration} дн.`
                  : `План: ${s.planDuration} дн.`}
              </div>
            </div>
            <div>
              {s.status === "done" && <Badge style={{ background: "hsla(142,80%,50%,0.15)", color: "hsl(142,80%,50%)" }}>Готово</Badge>}
              {s.status === "in-progress" && <Badge style={{ background: "hsla(195,100%,50%,0.15)", color: "hsl(195,100%,50%)" }}>В работе</Badge>}
              {s.status === "planned" && <Badge variant="secondary">Планируется</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
