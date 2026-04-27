import { useState, useEffect } from "react";
import FUNC_URLS from "../../backend/func2url.json";

const SESSION_KEY = "cabinet_session";

export interface ProjectData {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  area_m2: number | null;
  started_at: string | null;
  deadline_at: string | null;
  progress_pct: number;
  created_at: string | null;
}

export function useMyProject() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY) || "";
    if (!sessionId) { setLoading(false); return; }

    fetch(FUNC_URLS["my-project"], {
      headers: { "X-Session-Id": sessionId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.project) setProject(data.project);
        if (data.projects) setProjects(data.projects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { project, projects, loading };
}
