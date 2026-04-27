import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { pFetch, getSession, Project, Member, ROLE_COLORS } from "./projectsApi";
import FUNC_URLS from "../../../../backend/func2url.json";

export function MembersModal({ project, onClose, onChanged }: {
  project: Project; onClose: () => void; onChanged: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [available, setAvailable] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"current" | "add">("current");
  const [busy, setBusy] = useState<number | null>(null);
  const [invited, setInvited] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${FUNC_URLS.projects}?action=members&project_id=${project.id}`, {
      headers: { "X-Session-Id": getSession() },
    });
    const data = await r.json();
    setMembers(data.members || []);
    setAvailable(data.available || []);
    setLoading(false);
  }, [project.id]);

  useEffect(() => { load(); }, [load]);

  const inviteMember = async (userId: number) => {
    setBusy(userId);
    const res = await pFetch({ method: "POST", body: JSON.stringify({ action: "invite_member", project_id: project.id, user_id: userId }) });
    const data = await res.json();
    if (res.ok && data.ok) {
      setInvited((prev) => new Set(prev).add(userId));
    }
    setBusy(null);
  };

  const removeMember = async (userId: number) => {
    setBusy(userId);
    await pFetch({ method: "POST", body: JSON.stringify({ action: "remove_member", user_id: userId }) });
    await load();
    onChanged();
    setBusy(null);
  };

  const filteredAvailable = available.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.login.toLowerCase().includes(search.toLowerCase()) ||
    u.role_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="glass-strong rounded-3xl w-full max-w-lg gradient-border animate-fade-in flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold">Команда проекта</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{project.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors flex-shrink-0">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pb-4">
          <button onClick={() => setTab("current")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === "current" ? "hsl(195,100%,40%)" : "transparent", color: tab === "current" ? "white" : "hsl(215,15%,55%)", border: tab === "current" ? "none" : "1px solid hsl(220,15%,16%)" }}>
            <Icon name="Users" size={14} />
            Участники {members.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>{members.length}</span>}
          </button>
          <button onClick={() => setTab("add")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === "add" ? "hsl(195,100%,40%)" : "transparent", color: tab === "add" ? "white" : "hsl(215,15%,55%)", border: tab === "add" ? "none" : "1px solid hsl(220,15%,16%)" }}>
            <Icon name="UserPlus" size={14} />
            Пригласить {available.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>{available.length}</span>}
          </button>
        </div>

        {/* Search (only on add tab) */}
        {tab === "add" && (
          <div className="px-6 pb-3">
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени, логину, роли…"
                className="w-full bg-secondary/60 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">
              Пользователь получит уведомление и сам подтвердит вступление в проект.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin space-y-2 min-h-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Загрузка…</div>
          ) : tab === "current" ? (
            members.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "hsla(195,100%,50%,0.1)" }}>
                  <Icon name="Users" size={20} style={{ color: "hsl(195,100%,50%)" }} />
                </div>
                <div className="text-sm font-semibold mb-1">Нет участников</div>
                <p className="text-xs text-muted-foreground">Перейдите на вкладку «Пригласить»</p>
              </div>
            ) : members.map((m) => {
              const color = ROLE_COLORS[m.role_code] || "hsl(215,60%,60%)";
              const initials = m.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
              return (
                <div key={m.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: `${color}20`, color }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{m.full_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                        {m.role_name}
                      </span>
                      <span className="text-xs text-muted-foreground">@{m.login}</span>
                    </div>
                  </div>
                  <button onClick={() => removeMember(m.id)} disabled={busy === m.id}
                    title="Убрать из проекта"
                    className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-40 flex-shrink-0">
                    {busy === m.id
                      ? <div className="w-4 h-4 border-2 border-border border-t-muted-foreground rounded-full animate-spin" />
                      : <Icon name="UserMinus" size={15} style={{ color: "hsl(0,80%,60%)" }} />}
                  </button>
                </div>
              );
            })
          ) : (
            filteredAvailable.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-sm font-semibold mb-1">{search ? "Не найдено" : "Нет доступных пользователей"}</div>
                <p className="text-xs text-muted-foreground">{search ? "Попробуйте другой запрос" : "Все пользователи уже в проекте"}</p>
              </div>
            ) : filteredAvailable.map((m) => {
              const color = ROLE_COLORS[m.role_code] || "hsl(215,60%,60%)";
              const initials = m.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
              const isInvited = invited.has(m.id);
              return (
                <div key={m.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: `${color}20`, color }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{m.full_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
                        {m.role_name}
                      </span>
                      <span className="text-xs text-muted-foreground">@{m.login}</span>
                    </div>
                  </div>
                  {isInvited ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: "hsla(142,80%,50%,0.12)", color: "hsl(142,80%,50%)" }}>
                      <Icon name="Clock" size={12} />
                      Отправлено
                    </div>
                  ) : (
                    <button onClick={() => inviteMember(m.id)} disabled={busy === m.id}
                      title="Отправить приглашение"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 flex-shrink-0"
                      style={{ background: "hsla(195,100%,40%,0.15)", color: "hsl(195,100%,50%)" }}>
                      {busy === m.id
                        ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        : <Icon name="Send" size={12} />}
                      Пригласить
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
