import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminFetch, AppUser, Role, Obj, ROLE_COLORS } from "./adminApi";

// ─── Create User Modal ────────────────────────────────────────────────────────

export function CreateModal({ roles, objects, onClose, onCreated }: {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
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

// ─── Change Password Modal ────────────────────────────────────────────────────

export function PasswordModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-sm gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Смена пароля</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
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
