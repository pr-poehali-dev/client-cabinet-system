import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { chatFetch, Chat, Message, ChatMember, ChatUser, ROLE_COLORS, fmtTime, getInitials } from "./chatApi";
import { User } from "../../../Login";

// ─── Members Drawer ───────────────────────────────────────────────────────────

export function MembersDrawer({ chat, objectId, onClose, onChanged }: {
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

export function ChatView({ chat, currentUser, objectId, canManage }: {
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
