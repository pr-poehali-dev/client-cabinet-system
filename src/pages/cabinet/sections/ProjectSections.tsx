import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GANTT_STAGES } from "../data";

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSection() {
  const stages = [
    { name: "Фундамент", pct: 100, status: "done" },
    { name: "Стены и перекрытия", pct: 100, status: "done" },
    { name: "Кровля", pct: 100, status: "done" },
    { name: "Окна и двери", pct: 80, status: "active" },
    { name: "Инженерные сети", pct: 0, status: "todo" },
    { name: "Отделка", pct: 0, status: "todo" },
    { name: "Благоустройство", pct: 0, status: "todo" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Обзор проекта</h2>
        <p className="text-muted-foreground mt-1">Дом 180 м² · Краснодар · Старт 10 января 2025</p>
      </div>

      <div className="glass-strong rounded-3xl p-6 gradient-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ background: "radial-gradient(ellipse at top right, hsl(195,100%,50%), transparent 60%)" }} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-muted-foreground text-sm font-medium mb-1">Общий прогресс</div>
            <div className="font-display text-5xl font-black" style={{ color: "hsl(195,100%,50%)", textShadow: "0 0 20px hsla(195,100%,50%,0.5)" }}>58%</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-sm">Расчётная сдача</div>
            <div className="text-xl font-bold text-foreground mt-1">15 авг 2025</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(142,80%,50%)" }}>▲ 3 дня опережения</div>
          </div>
        </div>
        <Progress value={58} className="h-3 bg-secondary" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Начало: 10.01.2025</span>
          <span>Конец: 15.08.2025</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Оплачено" value="3,25 млн" sub="из 5,33 млн ₽" icon="Wallet" color="hsl(142,80%,50%)" />
        <StatCard label="Этапов завершено" value="4 из 7" sub="следующий: Инженерные сети" icon="CheckCircle2" color="hsl(195,100%,50%)" />
        <StatCard label="Документов" value="6" sub="2 акта подписаны" icon="FileText" color="hsl(265,90%,65%)" />
        <StatCard label="Фотоотчётов" value="24" sub="последний 2 дня назад" icon="Camera" color="hsl(30,100%,55%)" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(195,100%,50%)" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(195,100%,50%)" }}>АКТИВНЫЙ ЭТАП</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">Окна и двери</div>
            <div className="text-muted-foreground text-sm mt-1">Монтаж оконных блоков и дверных рам</div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-black" style={{ color: "hsl(195,100%,50%)" }}>80%</div>
            <div className="text-xs text-muted-foreground">выполнено</div>
          </div>
        </div>
        <Progress value={80} className="h-2 mt-4 bg-secondary" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="font-semibold mb-4">Этапы строительства</div>
        <div className="space-y-3">
          {stages.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: s.status === "done" ? "hsl(142,80%,50%)" : s.status === "active" ? "hsl(195,100%,50%)" : "hsl(220,15%,14%)",
                  color: s.status === "todo" ? "hsl(215,15%,55%)" : "hsl(220,20%,6%)",
                }}>
                {s.status === "done" ? "✓" : s.status === "active" ? "▶" : ""}
              </div>
              <div className="flex-1 text-sm">{s.name}</div>
              <div className="text-xs font-semibold w-8 text-right"
                style={{ color: s.status === "done" ? "hsl(142,80%,50%)" : s.status === "active" ? "hsl(195,100%,50%)" : "hsl(215,15%,55%)" }}>
                {s.pct}%
              </div>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${s.pct}%`,
                    background: s.status === "done" ? "hsl(142,80%,50%)" : s.status === "active" ? "hsl(195,100%,50%)" : "transparent"
                  }} />
              </div>
            </div>
          ))}
        </div>
      </div>
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
