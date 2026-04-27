import FUNC_URLS from "../../../../../backend/func2url.json";

const SESSION_KEY = "cabinet_session";
export function getSession() { return localStorage.getItem(SESSION_KEY) || ""; }

export function filesFetch(path: string, opts: RequestInit = {}) {
  return fetch(FUNC_URLS.files + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getSession(),
      ...((opts.headers as Record<string, string>) || {}),
    },
  });
}

export function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

export const TYPE_COLORS: Record<string, string> = {
  "Договор": "hsl(265,90%,65%)",
  "Проект": "hsl(195,100%,50%)",
  "Смета": "hsl(30,100%,55%)",
  "Акт": "hsl(142,80%,50%)",
  "Сертификат": "hsl(45,90%,55%)",
  "Документ": "hsl(215,60%,60%)",
};

export const DOC_TYPES = ["Договор", "Проект", "Смета", "Акт", "Сертификат", "Документ"];

export interface DocItem {
  id: number; name: string; type: string;
  file_size: number | null; mime_type: string | null;
  s3_key: string; created_at: string; uploaded_by: string;
}

export interface PhotoItem {
  id: number; title: string; stage: string | null; tag: string;
  cdn_url: string; s3_key: string; created_at: string; uploaded_by: string;
}
