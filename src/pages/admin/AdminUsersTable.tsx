import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminFetch, AppUser, LogEntry, ROLE_COLORS, Badge, fmt } from "./adminApi";

// ─── Activity Log ─────────────────────────────────────────────────────────────

export function ActivityLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch("/?action=activity")
      .then((r) => r.json())
      .then((d) => setLog(d.log || []))
      .finally(() => setLoading(false));
  }, []);

  const ACTION_LABELS: Record<string, string> = {
    login: "Вход", admin_create_user: "Создан пользователь",
    admin_toggle_active: "Изменён статус", admin_change_password: "Смена пароля",
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Загрузка…</div>;

  return (
    <div className="space-y-2">
      {log.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Нет событий</div>}
      {log.map((entry, i) => (
        <div key={i} className="glass rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ background: entry.action === "login" ? "hsl(142,70%,45%)" : "hsl(195,100%,50%)" }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {entry.user && <span className="text-sm font-semibold">{entry.user}</span>}
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {ACTION_LABELS[entry.action] || entry.action}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{entry.detail}</div>
          </div>
          <div className="text-xs text-muted-foreground flex-shrink-0">{fmt(entry.at)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Users Table ──────────────────────────────────────────────────────────────

interface UsersTableProps {
  filtered: AppUser[];
  togglingId: number | null;
  onToggleActive: (u: AppUser) => void;
  onSetPwdModal: (u: AppUser) => void;
}

export function UsersTable({ filtered, togglingId, onToggleActive, onSetPwdModal }: UsersTableProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-3">Пользователь</div>
        <div className="col-span-2">Роль</div>
        <div className="col-span-2">Объект</div>
        <div className="col-span-2">Последний вход</div>
        <div className="col-span-1">Статус</div>
        <div className="col-span-2 text-right">Действия</div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">Пользователи не найдены</div>
      )}

      <div className="divide-y divide-border">
        {filtered.map((u) => {
          const color = ROLE_COLORS[u.role_code] || "hsl(215,60%,60%)";
          const initials = u.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
          return (
            <div key={u.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-secondary/20 transition-colors">
              {/* User */}
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: `${color}20`, color }}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">@{u.login}</div>
                </div>
              </div>
              {/* Role */}
              <div className="col-span-2">
                <Badge label={u.role_name} color={color} />
              </div>
              {/* Object */}
              <div className="col-span-2 text-xs text-muted-foreground truncate">
                {u.object_name || <span className="text-primary text-xs">Все объекты</span>}
              </div>
              {/* Last login */}
              <div className="col-span-2 text-xs text-muted-foreground">{fmt(u.last_login_at)}</div>
              {/* Status */}
              <div className="col-span-1">
                {u.is_active
                  ? <span className="text-xs font-semibold" style={{ color: "hsl(142,70%,45%)" }}>● Активен</span>
                  : <span className="text-xs font-semibold" style={{ color: "hsl(0,80%,60%)" }}>● Заблокирован</span>
                }
              </div>
              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1">
                <button onClick={() => onSetPwdModal(u)} title="Сменить пароль"
                  className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Icon name="KeyRound" size={14} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => onToggleActive(u)}
                  disabled={togglingId === u.id || u.role_code === "admin"}
                  title={u.is_active ? "Заблокировать" : "Разблокировать"}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30">
                  <Icon name={u.is_active ? "UserX" : "UserCheck"} size={14}
                    style={{ color: u.is_active ? "hsl(0,80%,60%)" : "hsl(142,70%,45%)" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
