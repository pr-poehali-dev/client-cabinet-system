import { useState } from "react";
import Icon from "@/components/ui/icon";
import FUNC_URLS from "../../backend/func2url.json";

const LOGO = "https://cdn.poehali.dev/projects/bde71961-0812-45ae-89b3-4231a85c07a4/bucket/eb845745-b317-4d39-b2a4-2fe646b5447f.png";

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
      if (!res.ok) setError(data.error || "Ошибка входа");
      else onLogin(data.user, data.session_id);
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">

      {/* ── Left panel — branding ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(218,60%,12%) 0%, hsl(220,50%,8%) 50%, hsl(215,70%,15%) 100%)" }}>

        {/* Geometric grid lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />

        {/* Radial glow blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(215,80%,50%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "hsl(195,100%,50%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5 blur-3xl"
          style={{ background: "hsl(265,90%,65%)" }} />

        {/* Diagonal accent stripe */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-0 bottom-0 w-40 opacity-5"
            style={{ background: "linear-gradient(180deg, transparent, hsl(195,100%,50%), transparent)", transform: "skewX(-8deg)" }} />
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo top */}
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="ГлобалСТ" className="h-10 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <div>
              <div className="font-display font-black text-xl text-white tracking-wider">ГлобалСТ</div>
              <div className="text-xs text-white/50 tracking-widest uppercase">Строительство</div>
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-md">
              <div className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-4">Личный кабинет</div>
              <h1 className="font-display text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
                Управление<br />строительством<br />
                <span style={{ color: "hsl(195,100%,60%)" }}>под контролем</span>
              </h1>
              <p className="text-white/50 text-base leading-relaxed">
                Единая платформа для заказчиков, подрядчиков и проектировщиков. Прогресс, документы, финансы — всё в одном месте.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-10">
              {["График работ", "Финансовый контроль", "Документы", "Фотоотчёты", "Командный чат"].map((f) => (
                <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="text-white/20 text-xs">© 2025 ГлобалСТ. Все права защищены.</div>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 p-8 relative">

        {/* Mobile bg */}
        <div className="absolute inset-0 lg:hidden"
          style={{ background: "linear-gradient(135deg, hsl(218,60%,12%), hsl(220,50%,8%))" }} />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <img src={LOGO} alt="ГлобалСТ" className="h-16 w-auto mb-4" style={{ filter: "brightness(0) invert(1)" }} />
            <div className="font-display font-black text-2xl text-white tracking-wider">ГлобалСТ</div>
          </div>

          {/* Logo desktop top */}
          <div className="hidden lg:flex items-center gap-2 mb-10">
            <img src={LOGO} alt="ГлобалСТ" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="font-display font-black text-lg text-white tracking-wide">ГлобалСТ</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-white">Добро пожаловать</h2>
            <p className="text-white/40 text-sm mt-1">Войдите в личный кабинет</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
                Логин
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                autoComplete="username"
                required
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all placeholder:text-white/20 text-white"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(195,100%,50%)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">
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
                  className="w-full rounded-xl px-4 py-3.5 pr-12 text-sm outline-none transition-all placeholder:text-white/20 text-white"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(195,100%,50%)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60 transition-colors">
                  <Icon name={showPwd ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                style={{ background: "hsla(0,80%,60%,0.15)", color: "hsl(0,80%,70%)", border: "1px solid hsla(0,80%,60%,0.2)" }}>
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 mt-2"
              style={{ background: "linear-gradient(135deg, hsl(215,80%,45%), hsl(195,100%,40%))", color: "white", boxShadow: "0 4px 20px hsla(215,80%,45%,0.4)" }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Входим…</span>
                : "Войти в кабинет"}
            </button>
          </form>

          <p className="text-center text-xs text-white/20 mt-8">
            Доступ предоставляется администратором ГлобалСТ
          </p>
        </div>
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
