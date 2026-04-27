import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "./Login";
import { adminFetch, AppUser, Role, Obj, LOGO } from "./admin/adminApi";
import { CreateModal, PasswordModal } from "./admin/AdminModals";
import { ActivityLog, UsersTable } from "./admin/AdminUsersTable";

interface AdminProps { user: User; onLogout: () => void; }

export default function Admin({ user, onLogout }: AdminProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [objects, setObjects] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "log">("users");
  const [showCreate, setShowCreate] = useState(false);
  const [pwdModal, setPwdModal] = useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [uRes, rRes, oRes] = await Promise.all([
      adminFetch("/"),
      adminFetch("/?action=roles"),
      adminFetch("/?action=objects"),
    ]);
    const [uData, rData, oData] = await Promise.all([uRes.json(), rRes.json(), oRes.json()]);
    setUsers(uData.users || []);
    setRoles(rData.roles || []);
    setObjects(oData.objects || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleActive = async (u: AppUser) => {
    setTogglingId(u.id);
    await adminFetch("/", { method: "POST", body: JSON.stringify({ action: "toggle_active", user_id: u.id, is_active: !u.is_active }) });
    await loadUsers();
    setTogglingId(null);
  };

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.login.toLowerCase().includes(search.toLowerCase()) ||
    u.role_name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    blocked: users.filter((u) => !u.is_active).length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border flex-shrink-0"
        style={{ background: "hsla(var(--background),0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <img src={LOGO} alt="ГлобалСТ" className="h-8 w-auto opacity-90" />
          <div>
            <div className="font-display font-black text-sm tracking-wide">ГлобалСТ</div>
            <div className="text-xs text-muted-foreground">Панель администратора</div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user.full_name}</div>
              <div className="text-xs text-muted-foreground">{user.role_name}</div>
            </div>
            <button onClick={onLogout} className="p-2 rounded-xl hover:bg-secondary transition-colors" title="Выйти">
              <Icon name="LogOut" size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-6 py-8 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Всего пользователей", value: stats.total, icon: "Users", color: "hsl(195,100%,50%)" },
            { label: "Активных", value: stats.active, icon: "UserCheck", color: "hsl(142,70%,45%)" },
            { label: "Заблокированных", value: stats.blocked, icon: "UserX", color: "hsl(0,80%,60%)" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 gradient-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: s.color }} />
              <div className="p-2 rounded-xl inline-flex mb-3" style={{ background: `${s.color}20` }}>
                <Icon name={s.icon} size={18} style={{ color: s.color }} />
              </div>
              <div className="font-display text-3xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(["users", "log"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "hsl(195,100%,40%)" : "transparent",
                color: tab === t ? "white" : "hsl(215,15%,55%)",
                border: tab === t ? "none" : "1px solid hsl(220,15%,16%)",
              }}>
              {t === "users" ? "Пользователи" : "История действий"}
            </button>
          ))}
          <div className="flex-1" />
          {tab === "users" && (
            <>
              <div className="relative">
                <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск…"
                  className="bg-secondary/60 rounded-xl pl-9 pr-4 py-2 text-sm outline-none border border-border focus:border-primary transition-colors w-48" />
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                <Icon name="Plus" size={16} />
                Добавить
              </button>
            </>
          )}
        </div>

        {/* Content */}
        {tab === "log" ? <ActivityLog /> : loading ? (
          <div className="text-center py-16 text-muted-foreground">Загрузка…</div>
        ) : (
          <UsersTable
            filtered={filtered}
            togglingId={togglingId}
            onToggleActive={toggleActive}
            onSetPwdModal={setPwdModal}
          />
        )}
      </div>

      {showCreate && <CreateModal roles={roles} objects={objects} onClose={() => setShowCreate(false)} onCreated={loadUsers} />}
      {pwdModal && <PasswordModal user={pwdModal} onClose={() => setPwdModal(null)} />}
    </div>
  );
}
