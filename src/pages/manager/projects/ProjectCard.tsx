import Icon from "@/components/ui/icon";
import { Project } from "./projectsApi";

export function ProjectCard({ p, onEdit, onArchive, onMembers }: {
  p: Project; onEdit?: () => void; onArchive?: () => void; onMembers?: () => void;
}) {
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—";
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
          {onMembers && (
            <button onClick={onMembers} title="Команда проекта"
              className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Icon name="Users" size={14} className="text-muted-foreground" />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} title="Редактировать"
              className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Icon name="Pencil" size={14} className="text-muted-foreground" />
            </button>
          )}
          {onArchive && (
            <button onClick={onArchive} title="Архивировать"
              className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Icon name="Archive" size={14} className="text-muted-foreground" />
            </button>
          )}
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
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">Создал: {p.created_by_name || "—"}</span>
        {onMembers && (
          <button onClick={onMembers}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ background: "hsla(195,100%,40%,0.15)", color: "hsl(195,100%,50%)" }}>
            <Icon name="Users" size={13} />
            Команда · {p.members_count}
          </button>
        )}
      </div>
    </div>
  );
}