import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CHAT_MESSAGES, NOTIFICATIONS } from "../data";

// ─── Chat ─────────────────────────────────────────────────────────────────────

export function ChatSection() {
  const [msg, setMsg] = useState("");

  return (
    <div className="space-y-4 animate-fade-in flex flex-col">
      <div>
        <h2 className="font-display text-2xl font-bold">Чат с командой</h2>
        <p className="text-muted-foreground mt-1">Прямая связь с прорабом и менеджером</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {[
          { name: "Прораб Алексей", role: "Строительство", online: true, avatar: "А" },
          { name: "Менеджер Ирина", role: "Документы", online: true, avatar: "И" },
          { name: "Архитектор Дмитрий", role: "Проект", online: false, avatar: "Д" },
        ].map((p) => (
          <div key={p.name} className="glass rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">{p.avatar}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
                style={{ background: p.online ? "hsl(142,80%,50%)" : "hsl(215,15%,55%)" }} />
            </div>
            <div>
              <div className="text-xs font-semibold">{p.name.split(" ")[1]}</div>
              <div className="text-xs text-muted-foreground">{p.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
        {CHAT_MESSAGES.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "client" ? "flex-row-reverse" : ""}`}>
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
              style={{
                background: m.role === "client" ? "hsl(195,100%,50%)" : m.role === "foreman" ? "hsla(142,80%,50%,0.2)" : "hsla(265,90%,65%,0.2)",
                color: m.role === "client" ? "hsl(220,20%,6%)" : m.role === "foreman" ? "hsl(142,80%,50%)" : "hsl(265,90%,65%)",
              }}>
              {m.avatar}
            </div>
            <div className={`max-w-xs flex flex-col gap-1 ${m.role === "client" ? "items-end" : "items-start"}`}>
              <div className="text-xs text-muted-foreground">{m.author} · {m.time}</div>
              <div className="px-4 py-2.5 rounded-2xl text-sm"
                style={{
                  background: m.role === "client" ? "hsl(195,100%,50%)" : "rgba(255,255,255,0.06)",
                  color: m.role === "client" ? "hsl(220,20%,6%)" : "inherit",
                  borderRadius: m.role === "client" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  border: m.role !== "client" ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 flex gap-3 items-center">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button className="p-2 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: "hsl(195,100%,50%)", color: "hsl(220,20%,6%)" }}>
          <Icon name="Send" size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function NotificationsSection() {
  const typeConfig: Record<string, { icon: string; color: string }> = {
    success: { icon: "CheckCircle2", color: "hsl(142,80%,50%)" },
    info: { icon: "Info", color: "hsl(195,100%,50%)" },
    warning: { icon: "AlertTriangle", color: "hsl(30,100%,55%)" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Уведомления</h2>
          <p className="text-muted-foreground mt-1">Все события по проекту</p>
        </div>
        <button className="text-xs hover:underline" style={{ color: "hsl(195,100%,50%)" }}>
          Отметить все прочитанными
        </button>
      </div>

      <div className="space-y-2">
        {NOTIFICATIONS.map((n) => {
          const cfg = typeConfig[n.type];
          return (
            <div key={n.id} className={`glass rounded-xl p-4 flex items-start gap-3 transition-all ${n.read ? "opacity-50" : "gradient-border"}`}>
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                <Icon name={cfg.icon} size={18} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm">{n.text}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.time}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: cfg.color }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
