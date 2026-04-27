import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { chatFetch, Chat } from "./chatApi";
import { ChatView } from "./ChatView";
import { useMyProject } from "@/hooks/useMyProject";
import { User } from "../../../Login";

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
