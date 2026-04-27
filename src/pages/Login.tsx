import { useState } from "react";
import Icon from "@/components/ui/icon";
import FUNC_URLS from "../../backend/func2url.json";

export default function Login({ onLogin }: { onLogin: (user: User, sessionId: string) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(FUNC_URLS.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", login: login.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
      } else {
        onLogin(data.user, data.session_id);
      }
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 animate-pulse-glow"
            style={{ background: "linear-gradient(135deg, hsl(195,100%,40%), hsl(265,90%,65%))" }}
          >
            <Icon name="Home" size={28} style={{ color: "white" }} />
          </div>
          <div className="font-display font-black text-2xl tracking-wide">СТРОЙКАБИНЕТ</div>
          <div className="text-muted-foreground text-sm mt-1">Личный кабинет</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-strong rounded-2xl p-6 gradient-border space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Логин
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                autoComplete="username"
                required
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  required
                  className="w-full bg-secondary/60 rounded-xl px-4 py-3 pr-11 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPwd ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
                style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}
            >
              {loading ? "Входим…" : "Войти"}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Доступ предоставляется администратором
          </p>
        </form>
      </div>
    </div>
  );
}

export interface User {
  id: number;
  full_name: string;
  role_code: string;
  role_name: string;
  has_global_access: boolean;
  object_id: number | null;
}
