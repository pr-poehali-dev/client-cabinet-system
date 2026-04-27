import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { pFetch, Project } from "./projects/projectsApi";
import { ProjectModal, ArchiveConfirm } from "./projects/ProjectModals";
import { MembersModal } from "./projects/MembersModal";
import { ProjectCard } from "./projects/ProjectCard";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);
  const [membersProject, setMembersProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await pFetch();
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Проекты</h2>
          <p className="text-muted-foreground mt-1">Управление объектами строительства</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск…"
              className="bg-secondary/60 rounded-xl pl-9 pr-4 py-2 text-sm outline-none border border-border focus:border-primary transition-colors w-44" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "hsl(195,100%,40%)", color: "white" }}>
            <Icon name="Plus" size={16} />
            Новый проект
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Всего проектов", value: projects.length, icon: "Building2", color: "hsl(195,100%,50%)" },
          { label: "В работе", value: projects.filter((p) => p.progress_pct > 0 && p.progress_pct < 100).length, icon: "Hammer", color: "hsl(30,100%,50%)" },
          { label: "Завершено", value: projects.filter((p) => p.progress_pct === 100).length, icon: "CheckCircle2", color: "hsl(142,70%,45%)" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}20` }}>
              <Icon name={s.icon} size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div className="font-display text-2xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Загрузка проектов…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "hsla(195,100%,50%,0.1)" }}>
            <Icon name="Building2" size={28} style={{ color: "hsl(195,100%,50%)" }} />
          </div>
          <div className="font-display text-lg font-bold mb-2">
            {search ? "Проекты не найдены" : "Нет активных проектов"}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {search ? "Попробуйте другой запрос" : "Создайте первый объект строительства"}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl text-sm font-bold"
              style={{ background: "hsl(195,100%,40%)", color: "white" }}>
              Создать проект
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              onEdit={() => setEditProject(p)}
              onArchive={() => setArchiveProject(p)}
              onMembers={() => setMembersProject(p)}
            />
          ))}
        </div>
      )}

      {showCreate && <ProjectModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {editProject && <ProjectModal initial={editProject} onClose={() => setEditProject(null)} onSaved={load} />}
      {archiveProject && <ArchiveConfirm project={archiveProject} onClose={() => setArchiveProject(null)} onDone={load} />}
      {membersProject && <MembersModal project={membersProject} onClose={() => setMembersProject(null)} onChanged={load} />}
    </div>
  );
}
