import FUNC_URLS from "../../../../backend/func2url.json";

export const SESSION_KEY = "cabinet_session";
export function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

export function pFetch(opts: RequestInit = {}) {
  return fetch(FUNC_URLS.projects, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

export interface Project {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  area_m2: number | null;
  started_at: string | null;
  deadline_at: string | null;
  progress_pct: number;
  created_at: string;
  created_by_name: string | null;
  members_count: number;
}

export interface Member {
  id: number;
  full_name: string;
  login: string;
  role_name: string;
  role_code: string;
  is_active?: boolean;
  last_login_at?: string | null;
}

export const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(265,90%,65%)", head: "hsl(195,100%,40%)", manager: "hsl(195,100%,50%)",
  supply: "hsl(30,100%,50%)", foreman: "hsl(142,70%,45%)",
  client: "hsl(215,60%,60%)", designer: "hsl(280,70%,60%)",
  supervision: "hsl(45,90%,55%)", contractor: "hsl(15,80%,55%)",
};
