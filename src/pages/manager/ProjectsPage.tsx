import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { pFetch, Project } from "./projects/projectsApi";
import { ProjectModal, ArchiveConfirm } from "./projects/ProjectModals";
import { MembersModal } from "./projects/MembersModal";
import { ProjectCard } from "./projects/ProjectCard";
import { User } from "../Login";
import { notifFetch } from "@/hooks/useNotifications";

interface ProjectsPageProps { user?: User; }

// ─── Join Request Modal ────────────────────────────────────────────────────────

function JoinRequestModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    const res = await notifFetch("/", {
      method: "POST",
      body: JSON.stringify({ action: "join_request", object_id: project.id, message: message.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok && data.ok) setDone(true);
    else setError(data.error || "Ошибка");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md gradient-border animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">Запрос на вступление</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "hsla(142,80%,50%,0.12)" }}>
              <Icon name="CheckCircle2" size={30} style={{ color: "hsl(142,80%,50%)" }} />
            </div>
            <div className="font-semibold text-base mb-1">Заявка отправлена!</div>
            <p className="text-sm text-muted-foreground">
              Руководитель проекта получил уведомление и рассмотрит вашу заявку.
            </p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl p-4 mb-5">
              <div className="font-semibold text-sm">{project.name}</div>
              {project.address && <div className="text-xs text-muted-foreground mt-0.5">{project.address}</div>}
              {project.members_count !== undefined && (
                <div className="text-xs text-muted-foreground mt-0.5">{project.members_count} участников</div>
              )}
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Сообщение (необязательно)
              </label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                placeholder="Опишите кратко свою роль или причину вступления…"
                className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors resize-none" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl mb-4"
                style={{ background: "hsla(0,80%,60%,0.12)", color: "hsl(0,80%,60%)" }}>
                <Icon name="AlertCircle" size={14} />{error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary hover:opacity-80">
                Отмена
              </button>
              <button onClick={submit} disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                {loading ? "Отправляем…" : "Отправить заявку"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Projects Page ────────────────────────────────────────────────────────────

export default function ProjectsPage({ user }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [archiveProject, setArchiveProject] = useState<Project | null>(null);
  const [membersProject, setMembersProject] = useState<Project | null>(null);
  const [joinProject, setJoinProject] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const isEditor = !!user && ["admin", "manager", "head"].includes(user.role_code);
  const isAdmin = user?.role_code === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    const res = await pFetch(showArchived ? "?archived=1" : "");
    const data = await res.json();
    setProjects(data.projects || []);
    setLoading(false);
  }, [showArchived]);

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
          <p className="text-muted-foreground mt-1">
            {isEditor ? "Управление объектами строительства" : "Список активных проектов — подайте заявку на вступление"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск…"
              className="bg-secondary/60 rounded-xl pl-9 pr-4 py-2 text-sm outline-none border border-border focus:border-primary transition-colors w-44" />
          </div>
          {isEditor && (
            <>
              <button onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: showArchived ? "hsla(30,100%,50%,0.15)" : "transparent",
                  color: showArchived ? "hsl(30,100%,50%)" : "hsl(215,15%,55%)",
                  border: `1px solid ${showArchived ? "hsla(30,100%,50%,0.3)" : "hsl(220,15%,16%)"}`,
                }}>
                <Icon name="Archive" size={14} />
                Архив
              </button>
              {!showArchived && (
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                  <Icon name="Plus" size={16} />
                  Новый проект
                </button>
              )}
            </>
          )}
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
            {search ? "Попробуйте другой запрос" : isEditor ? "Создайте первый объект строительства" : "Проекты пока не созданы"}
          </p>
          {!search && isEditor && (
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
            <div key={p.id} className="relative group">
              <ProjectCard
                p={p}
                onEdit={isEditor && !showArchived ? () => setEditProject(p) : undefined}
                onArchive={isEditor ? () => setArchiveProject(p) : undefined}
                onMembers={isEditor && !showArchived ? () => setMembersProject(p) : undefined}
              />
              {/* Метка «Архив» */}
              {showArchived && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ background: "hsla(30,100%,50%,0.15)", color: "hsl(30,100%,50%)" }}>
                  <Icon name="Archive" size={11} />
                  Архив
                </div>
              )}
              {/* Кнопка «Подать заявку» для обычных пользователей */}
              {!isEditor && (
                <button
                  onClick={() => setJoinProject(p)}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ background: "hsl(195,100%,40%)", color: "white" }}>
                  <Icon name="UserPlus" size={12} />
                  Подать заявку
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && <ProjectModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {editProject && <ProjectModal initial={editProject} onClose={() => setEditProject(null)} onSaved={load} />}
      {archiveProject && <ArchiveConfirm project={archiveProject} onClose={() => setArchiveProject(null)} onDone={load} isAdmin={user?.role_code === "admin"} />}
      {membersProject && <MembersModal project={membersProject} onClose={() => setMembersProject(null)} onChanged={load} />}
      {joinProject && <JoinRequestModal project={joinProject} onClose={() => setJoinProject(null)} />}
    </div>
  );
}