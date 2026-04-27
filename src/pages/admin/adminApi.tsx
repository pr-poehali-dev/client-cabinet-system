import FUNC_URLS from "../../../backend/func2url.json";

export const LOGO = "https://cdn.poehali.dev/projects/bde71961-0812-45ae-89b3-4231a85c07a4/bucket/eb845745-b317-4d39-b2a4-2fe646b5447f.png";

const SESSION_KEY = "cabinet_session";
export function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

export function adminFetch(path: string, opts: RequestInit = {}) {
  const base = (FUNC_URLS as Record<string, string>).admin;
  return fetch(base + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

export interface AppUser {
  id: number; login: string; full_name: string;
  role_name: string; role_code: string;
  object_name: string | null; is_active: boolean;
  last_login_at: string | null; created_at: string;
}

export interface Role { id: number; code: string; name: string; global: boolean; }
export interface Obj { id: number; name: string; address: string; }
export interface LogEntry { user?: string; action: string; detail: string; ip: string; at: string; }

export const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(265,90%,65%)", head: "hsl(195,100%,40%)", manager: "hsl(195,100%,50%)",
  supply: "hsl(30,100%,50%)", foreman: "hsl(142,70%,45%)",
  client: "hsl(215,60%,60%)", designer: "hsl(280,70%,60%)",
  supervision: "hsl(45,90%,55%)", contractor: "hsl(15,80%,55%)",
};

export function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}
