import { useState, useEffect, useCallback } from "react";
import FUNC_URLS from "../../backend/func2url.json";

const SESSION_KEY = "cabinet_session";
export function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

export function notifFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.notifications + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

export interface Notification {
  id: number;
  type: string;   // info | success | warning | join_request | join_approved | join_rejected
  title: string;
  body: string;
  is_read: boolean;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface JoinRequest {
  id: number;
  user_id: number;
  full_name: string;
  login: string;
  role_name: string;
  object_id: number;
  object_name: string;
  message: string | null;
  status: string;
  created_at: string;
}

export function useNotifications(pollInterval = 15000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await notifFetch("/?action=list");
      if (!r.ok) return;
      const d = await r.json();
      const list: Notification[] = d.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, pollInterval);
    return () => clearInterval(t);
  }, [load, pollInterval]);

  const markRead = useCallback(async (id?: number) => {
    const body = id ? { action: "mark_read", id } : { action: "mark_read", all: true };
    await notifFetch("/", { method: "POST", body: JSON.stringify(body) });
    await load();
  }, [load]);

  return { notifications, unreadCount, loading, reload: load, markRead };
}
