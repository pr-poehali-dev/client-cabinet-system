import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { NOTIFICATIONS } from "../data";
import FUNC_URLS from "../../../../backend/func2url.json";
import { useMyProject } from "@/hooks/useMyProject";
import { User } from "../../Login";

const SESSION_KEY = "cabinet_session";
function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

function chatFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.chat + path, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Session-Id": getSession(), ...((opts.headers as Record<string, string>) || {}) },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chat { id: number; name: string; creator: string; members_count: number; msg_count: number; }
interface Message { id: number; text: string; created_at: string; user_id: number; full_name: string; role_code: string; }
interface ChatMember { id: number; full_name: string; role_code: string; role_name: string; }
interface ChatUser { id: number; full_name: string; role_code: string; role_name: string; in_chat: boolean; }

const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(265,90%,65%)", head: "hsl(195,100%,40%)", manager: "hsl(195,100%,50%)",
  supply: "hsl(30,100%,50%)", foreman: "hsl(142,70%,45%)", client: "hsl(215,60%,60%)",
  designer: "hsl(280,70%,60%)", supervision: "hsl(45,90%,55%)", contractor: "hsl(15,80%,55%)",
};

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Members Drawer ───────────────────────────────────────────────────────────

function MembersDrawer({ chat, objectId, onClose, onChanged }: {
  chat: Chat; objectId: number; onClose: () => void; onChanged: () => void;
}) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await chatFetch(`/?action=users_for_chat&object_id=${objectId}&chat_id=${chat.id}`);
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  }, [chat.id, objectId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (u: ChatUser) => {
    setBusy(u.id);
    const action = u.in_chat ? "remove_member" : "add_member";
    await chatFetch("/", { method: "POST", body: JSON.stringify({ action, chat_id: chat.id, user_id: u.id }) });
    await load();
    onChanged();
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl w-full max-w-sm gradient-border animate-fade-in" style={{ maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="font-display text-base font-bold">Участники чата</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{chat.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin space-y-2">
          {loading ? <div className="text-center py-6 text-muted-foreground text-sm">Загрузка…</div> :
            users.map((u) => {
              const color = ROLE_COLORS[u.role_code] || "hsl(215,60%,60%)";
              return (
                <div key={u.id} className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: `${color}20`, color }}>{getInitials(u.full_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.full_name}</div>
                    <div className="text-xs text-muted-foreground">{u.role_name}</div>
                  </div>
                  <button onClick={() => toggle(u)} disabled={busy === u.id}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-40">
                    {busy === u.id
                      ? <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                      : u.in_chat
                        ? <Icon name="UserMinus" size={14} style={{ color: "hsl(0,80%,60%)" }} />
                        : <Icon name="UserPlus" size={14} style={{ color: "hsl(195,100%,50%)" }} />}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({ chat, currentUser, objectId, canManage }: {
  chat: Chat; currentUser: User; objectId: number; canManage: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await chatFetch(`/?action=messages&chat_id=${chat.id}`);
    const d = await r.json();
    setMessages(d.messages || []);
    setMembers(d.members || []);
  }, [chat.id]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await chatFetch("/", { method: "POST", body: JSON.stringify({ action: "send", chat_id: chat.id, text: text.trim() }) });
    setText("");
    await load();
    setSending(false);
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="font-semibold text-sm">{chat.name}</div>
          <div className="text-xs text-muted-foreground">{members.length} участников</div>
        </div>
        {canManage && (
          <button onClick={() => setShowMembers(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: "hsla(195,100%,40%,0.15)", color: "hsl(195,100%,50%)" }}>
            <Icon name="Users" size={13} />
            Участники
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Нет сообщений. Напишите первым!</div>
        )}
        {messages.map((m) => {
          const isMe = m.user_id === currentUser.id;
          const color = ROLE_COLORS[m.role_code] || "hsl(215,60%,60%)";
          return (
            <div key={m.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: isMe ? "hsl(195,100%,40%)" : `${color}20`, color: isMe ? "white" : color }}>
                {getInitials(m.full_name)}
              </div>
              <div className={`max-w-xs flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                <div className="text-xs text-muted-foreground">{isMe ? "" : m.full_name} · {fmtTime(m.created_at)}</div>
                <div className="px-4 py-2.5 text-sm"
                  style={{
                    background: isMe ? "hsl(195,100%,40%)" : "rgba(255,255,255,0.06)",
                    color: isMe ? "white" : "inherit",
                    borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    border: isMe ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="glass rounded-2xl p-3 flex gap-3 items-center">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
            placeholder="Написать сообщение… (Enter — отправить)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button onClick={send} disabled={!text.trim() || sending}
            className="p-2 rounded-xl transition-opacity disabled:opacity-40"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>

      {showMembers && (
        <MembersDrawer chat={chat} objectId={objectId} onClose={() => setShowMembers(false)} onChanged={load} />
      )}
    </div>
  );
}

// ─── Chat Section ─────────────────────────────────────────────────────────────

export function ChatSection({ user }: { user?: User }) {
  const { project } = useMyProject();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const objectId = project?.id;
  const canManage = !!user && ["manager", "head", "admin"].includes(user.role_code);

  const loadChats = useCallback(async () => {
    if (!objectId) { setLoading(false); return; }
    setLoading(true);
    const r = await chatFetch(`/?action=list&object_id=${objectId}`);
    const d = await r.json();
    const list = d.chats || [];
    setChats(list);
    if (!activeChat && list.length > 0) setActiveChat(list[0]);
    setLoading(false);
  }, [objectId]);

  useEffect(() => { loadChats(); }, [loadChats]);

  const createChat = async () => {
    if (!newName.trim() || !objectId) return;
    setCreating(true);
    await chatFetch("/", { method: "POST", body: JSON.stringify({ action: "create_chat", object_id: objectId, name: newName.trim() }) });
    setNewName(""); setShowCreate(false);
    await loadChats();
    setCreating(false);
  };

  if (!objectId && !loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="font-display text-2xl font-bold">Чат с командой</h2>
        <div className="glass rounded-3xl p-12 text-center text-muted-foreground text-sm">
          Проект не назначен — чат недоступен
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col" style={{ minHeight: "calc(100vh - 160px)" }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-display text-2xl font-bold">Чат с командой</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">Прямая связь участников проекта</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Plus" size={15} />
            Новый чат
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Загрузка…</div>
      ) : chats.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center flex-1">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(195,100%,50%,0.1)" }}>
            <Icon name="MessageSquare" size={26} style={{ color: "hsl(195,100%,50%)" }} />
          </div>
          <div className="font-semibold mb-1">Чатов пока нет</div>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            {canManage ? "Создайте первый чат для проекта" : "Менеджер ещё не создал чаты"}
          </p>
          {canManage && (
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              Создать чат
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Chat list */}
          <div className="w-56 flex-shrink-0 space-y-1.5 overflow-y-auto scrollbar-thin">
            {chats.map((c) => (
              <button key={c.id} onClick={() => setActiveChat(c)}
                className="w-full text-left px-3 py-3 rounded-xl transition-all"
                style={{
                  background: activeChat?.id === c.id ? "hsla(195,100%,40%,0.15)" : "rgba(255,255,255,0.04)",
                  border: activeChat?.id === c.id ? "1px solid hsla(195,100%,50%,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <div className="flex items-center gap-2">
                  <Icon name="MessageCircle" size={14} style={{ color: activeChat?.id === c.id ? "hsl(195,100%,50%)" : "hsl(215,15%,55%)" }} />
                  <span className="text-sm font-medium truncate" style={{ color: activeChat?.id === c.id ? "hsl(195,100%,50%)" : "inherit" }}>
                    {c.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                  <span>{c.members_count} уч.</span>
                  <span>{c.msg_count} сообщ.</span>
                </div>
              </button>
            ))}
          </div>

          {/* Active chat */}
          {activeChat && user ? (
            <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-h-0">
              <ChatView chat={activeChat} currentUser={user} objectId={objectId!} canManage={canManage} />
            </div>
          ) : (
            <div className="flex-1 glass rounded-2xl flex items-center justify-center text-muted-foreground text-sm">
              Выберите чат
            </div>
          )}
        </div>
      )}

      {/* Create chat modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">Новый чат</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-secondary">
                <Icon name="X" size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Название чата</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Общий чат, Технадзор…"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors"
                onKeyDown={(e) => { if (e.key === "Enter") createChat(); }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
              <button onClick={createChat} disabled={!newName.trim() || creating}
                className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                {creating ? "Создаём…" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
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
