import FUNC_URLS from "../../../../../backend/func2url.json";

const SESSION_KEY = "cabinet_session";
export function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

export function chatFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.chat + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

export interface Chat { id: number; name: string; creator: string; members_count: number; msg_count: number; }
export interface Message { id: number; text: string; created_at: string; user_id: number; full_name: string; role_code: string; }
export interface ChatMember { id: number; full_name: string; role_code: string; role_name: string; }
export interface ChatUser { id: number; full_name: string; role_code: string; role_name: string; in_chat: boolean; }

export const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(265,90%,65%)", head: "hsl(195,100%,40%)", manager: "hsl(195,100%,50%)",
  supply: "hsl(30,100%,50%)", foreman: "hsl(142,70%,45%)", client: "hsl(215,60%,60%)",
  designer: "hsl(280,70%,60%)", supervision: "hsl(45,90%,55%)", contractor: "hsl(15,80%,55%)",
};

export function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
