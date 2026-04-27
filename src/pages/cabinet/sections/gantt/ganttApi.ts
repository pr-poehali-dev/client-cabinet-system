import FUNC_URLS from "../../../../../backend/func2url.json";

const SESSION_KEY = "cabinet_session";
export function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

export function ganttFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.gantt + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

export interface GanttStage {
  id: number; name: string; start: number;
  planDuration: number; factDuration: number;
  status: string; color: string; sort_order: number;
}

export const STATUS_COLORS: Record<string, string> = {
  done: "142,80%,50%", "in-progress": "195,100%,50%", planned: "265,90%,65%",
};

export const STATUS_LABELS: Record<string, string> = {
  done: "Готово", "in-progress": "В работе", planned: "Планируется",
};
