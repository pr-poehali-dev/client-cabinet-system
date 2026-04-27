import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useNotifications, notifFetch, JoinRequest } from "@/hooks/useNotifications";
import { User } from "../../../Login";

const TYPE_CFG: Record<string, { icon: string; color: string; label: string }> = {
  info:          { icon: "Info",          color: "hsl(195,100%,50%)", label: "Информация" },
  success:       { icon: "CheckCircle2",  color: "hsl(142,80%,50%)",  label: "Успешно" },
  warning:       { icon: "AlertTriangle", color: "hsl(30,100%,55%)",  label: "Внимание" },
  join_request:  { icon: "UserPlus",      color: "hsl(265,90%,65%)",  label: "Заявка" },
  join_approved: { icon: "UserCheck",     color: "hsl(142,80%,50%)",  label: "Заявка одобрена" },
  join_rejected: { icon: "UserX",         color: "hsl(0,80%,60%)",    label: "Заявка отклонена" },
};

function fmtAgo(dt: string) {
  const diff = (Date.now() - new Date(dt).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

function JoinRequestCard({ req, onReview }: { req: JoinRequest; onReview: () => void }) {
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);

  const review = async (decision: "approved" | "rejected") => {
    setBusy(decision);
    await notifFetch("/", {
      method: "POST",
      body: JSON.stringify({ action: "review_request", request_id: req.id, decision }),
    });
    onReview();
    setBusy(null);
  };

  return (
    <div className="glass rounded-xl p-4 gradient-border animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl flex-shrink-0" style={{ background: "hsla(265,90%,65%,0.12)" }}>
          <Icon name="UserPlus" size={18} style={{ color: "hsl(265,90%,65%)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{req.full_name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "hsla(265,90%,65%,0.12)", color: "hsl(265,90%,65%)" }}>
              {req.role_name}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            Хочет вступить в проект <span className="font-medium text-foreground">«{req.object_name}»</span>
          </div>
          {req.message && (
            <div className="text-xs text-muted-foreground mt-1 italic">«{req.message}»</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">{fmtAgo(req.created_at)}</div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => review("approved")} disabled={!!busy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-50"
              style={{ background: "hsl(142,80%,45%)", color: "white" }}>
              {busy === "approved"
                ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Icon name="Check" size={12} />}
              Принять
            </button>
            <button onClick={() => review("rejected")} disabled={!!busy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
              style={{ background: "hsla(0,80%,60%,0.15)", color: "hsl(0,80%,60%)", border: "1px solid hsla(0,80%,60%,0.25)" }}>
              {busy === "rejected"
                ? <div className="w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                : <Icon name="X" size={12} />}
              Отклонить
            </button>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: "hsl(265,90%,65%)" }} />
      </div>
    </div>
  );
}

export function NotificationsSection({ user }: { user?: User }) {
  const { notifications, loading, markRead, reload } = useNotifications(10000);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [tab, setTab] = useState<"all" | "requests">("all");
  const isReviewer = !!user && ["head", "admin", "manager"].includes(user.role_code);

  const loadRequests = useCallback(async () => {
    if (!isReviewer) return;
    const r = await notifFetch("/?action=join_requests");
    if (!r.ok) return;
    const d = await r.json();
    setJoinRequests(d.requests || []);
  }, [isReviewer]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const pendingCount = joinRequests.filter((r) => r.status === "pending").length;
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Уведомления</h2>
          <p className="text-muted-foreground mt-1">Все события и запросы по проекту</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markRead()}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-70"
            style={{ color: "hsl(195,100%,50%)", border: "1px solid hsla(195,100%,50%,0.3)" }}>
            Прочитать все ({unread})
          </button>
        )}
      </div>

      {/* Tabs — только для ревьюеров */}
      {isReviewer && (
        <div className="flex gap-2">
          {[
            { key: "all", label: "Уведомления", badge: unread },
            { key: "requests", label: "Заявки на вступление", badge: pendingCount },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as "all" | "requests")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t.key ? "hsl(195,100%,40%)" : "transparent",
                color: tab === t.key ? "white" : "hsl(215,15%,55%)",
                border: tab === t.key ? "none" : "1px solid hsl(220,15%,16%)",
              }}>
              {t.label}
              {t.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: tab === t.key ? "rgba(255,255,255,0.25)" : "hsl(265,90%,65%)", color: "white" }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Requests tab */}
      {tab === "requests" && isReviewer && (
        <div className="space-y-3">
          {joinRequests.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "hsla(142,80%,50%,0.1)" }}>
                <Icon name="CheckCircle2" size={26} style={{ color: "hsl(142,80%,50%)" }} />
              </div>
              <div className="font-semibold mb-1">Нет входящих заявок</div>
              <p className="text-sm text-muted-foreground mt-1">Все заявки обработаны</p>
            </div>
          ) : joinRequests.map((req) => (
            <JoinRequestCard key={req.id} req={req} onReview={() => { loadRequests(); reload(); }} />
          ))}
        </div>
      )}

      {/* Notifications tab */}
      {tab === "all" && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Загрузка…</div>
          ) : notifications.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "hsla(195,100%,50%,0.1)" }}>
                <Icon name="Bell" size={26} style={{ color: "hsl(195,100%,50%)" }} />
              </div>
              <div className="font-semibold mb-1">Нет уведомлений</div>
              <p className="text-sm text-muted-foreground mt-1">Здесь будут появляться все события по проекту</p>
            </div>
          ) : notifications.map((n) => {
            const cfg = TYPE_CFG[n.type] || TYPE_CFG.info;
            return (
              <div key={n.id}
                className={`glass rounded-xl p-4 flex items-start gap-3 transition-all cursor-pointer hover:bg-secondary/20 ${!n.is_read ? "gradient-border" : "opacity-60"}`}
                onClick={() => !n.is_read && markRead(n.id)}>
                <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                  <Icon name={cfg.icon} size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</div>
                  <div className="text-xs text-muted-foreground mt-1.5">{fmtAgo(n.created_at)}</div>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: cfg.color }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
