import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { User } from "./Login";
import FUNC_URLS from "../../backend/func2url.json";

const LOGO = "https://cdn.poehali.dev/projects/bde71961-0812-45ae-89b3-4231a85c07a4/bucket/eb845745-b317-4d39-b2a4-2fe646b5447f.png";

const SESSION_KEY = "cabinet_session";

function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

function adminFetch(path: string, opts: RequestInit = {}) {
  const base = (FUNC_URLS as Record<string, string>).admin;
  return fetch(base + path, {
    ...opts,
    headers: { "Content-Type": "application/json", "X-Session-Id": getSession(), ...((opts.headers as Record<string, string>) || {}) },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppUser {
  id: number; login: string; full_name: string;
  role_name: string; role_code: string;
  object_name: string | null; is_active: boolean;
  last_login_at: string | null; created_at: string;
}

interface Role { id: number; code: string; name: string; global: boolean; }
interface Obj { id: number; name: string; address: string; }
interface LogEntry { user?: string; action: string; detail: string; ip: string; at: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(265,90%,65%)", head: "hsl(195,100%,40%)", manager: "hsl(195,100%,50%)",
  supply: "hsl(30,100%,50%)", foreman: "hsl(142,70%,45%)",
  client: "hsl(215,60%,60%)", designer: "hsl(280,70%,60%)",
  supervision: "hsl(45,90%,55%)", contractor: "hsl(15,80%,55%)",
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateModal({ roles, objects, onClose, onCreated }: {
  roles: Role[]; objects: Obj[];
  onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({ login: "", password: "", full_name: "", role_id: "", object_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedRole = roles.find((r) => r.id === Number(form.role_id));
  const needsObject = selectedRole && !selectedRole.global;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await adminFetch("/", {
        method: "POST",
        body: JSON.stringify({
          action: "create_user",
          login: form.login.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role_id: Number(form.role_id),
          object_id: needsObject && form.object_id ? Number(form.object_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Ошибка");
      else { onCreated(); onClose(); }
    } catch { setError("Нет связи"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-bold">Новый пользователь</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Заполните данные для доступа</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">ФИО</label>
            <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required
              placeholder="Иванов Иван Иванович"
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Логин</label>
              <input value={form.login} onChange={(e) => set("login", e.target.value)} required
                placeholder="ivanov"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Пароль</label>
              <input value={form.password} onChange={(e) => set("password", e.target.value)} required
                placeholder="Пароль"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Роль</label>
            <select value={form.role_id} onChange={(e) => set("role_id", e.target.value)} required
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors">
              <option value="">— Выберите роль —</option>
              {roles.filter((r) => r.code !== "admin").map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {needsObject && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Объект</label>
              <select value={form.object_id} onChange={(e) => set("object_id", e.target.value)}
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors">
                <option value="">— Выберите объект —</option>
                {objects.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedRole && (
            <div className="px-3 py-2 rounded-xl text-xs"
              style={{ background: `${ROLE_COLORS[selectedRole.code] || "hsl(195,100%,50%)"}15`, color: ROLE_COLORS[selectedRole.code] || "hsl(195,100%,50%)" }}>
              {selectedRole.global ? "✦ Глобальный доступ — видит все объекты" : "◈ Доступ только к привязанному объекту"}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
              style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>
              <Icon name="AlertCircle" size={14} />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity">
              Отмена
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              {loading ? "Создаём…" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────────

function PasswordModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await adminFetch("/", { method: "POST", body: JSON.stringify({ action: "change_password", user_id: user.id, password: pwd }) });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setDone(true); else setError(data.error || "Ошибка");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Смена пароля</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary"><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{user.full_name}</p>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✓</div>
            <div className="font-semibold" style={{ color: "hsl(142,70%,45%)" }}>Пароль изменён</div>
            <button onClick={onClose} className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Закрыть</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={pwd} onChange={(e) => setPwd(e.target.value)} required placeholder="Новый пароль"
              className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors" />
            {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>{error}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">Отмена</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                {loading ? "…" : "Сохранить"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

function ActivityLog() {
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

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

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
                      <button onClick={() => setPwdModal(u)} title="Сменить пароль"
                        className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <Icon name="KeyRound" size={14} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
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
        )}
      </div>

      {showCreate && <CreateModal roles={roles} objects={objects} onClose={() => setShowCreate(false)} onCreated={loadUsers} />}
      {pwdModal && <PasswordModal user={pwdModal} onClose={() => setPwdModal(null)} />}
    </div>
  );
}
