import { Progress } from "@/components/ui/progress";
import { useMyProject } from "@/hooks/useMyProject";
import { StatCard, NoProject, fmtDate, daysLeft } from "./dashboardUtils";

export function DashboardSection() {
  const { project, projects, loading } = useMyProject();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Глобальные роли без активных проектов
  if (!project && projects.length === 0) return <NoProject isManager />;

  // Глобальные роли — видят активные проекты списком
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

      {/* Stat cards */}
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
