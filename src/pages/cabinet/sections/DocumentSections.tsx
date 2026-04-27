import Icon from "@/components/ui/icon";
import { DOCUMENTS, CERTS } from "../data";

// ─── Documents ────────────────────────────────────────────────────────────────

export function DocumentsSection() {
  const typeColors: Record<string, string> = {
    "Договор": "hsl(265,90%,65%)",
    "Проект": "hsl(195,100%,50%)",
    "Смета": "hsl(30,100%,55%)",
    "Акт": "hsl(142,80%,50%)",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Документы</h2>
          <p className="text-muted-foreground mt-1">Все документы по проекту</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Все", "Договор", "Смета", "Акт"].map((f) => (
            <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium glass hover:bg-secondary transition-colors">
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {DOCUMENTS.map((doc) => (
          <div key={doc.id} className="glass rounded-xl p-4 flex items-center gap-4 hover-scale group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${typeColors[doc.type]}20` }}>
              <Icon name="FileText" size={20} style={{ color: typeColors[doc.type] }} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{doc.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{doc.date} · {doc.size}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg font-medium"
              style={{ background: `${typeColors[doc.type]}15`, color: typeColors[doc.type] }}>
              {doc.type}
            </span>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-secondary">
              <Icon name="Download" size={16} className="text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export function PhotosSection() {
  const photos = [
    { title: "Фундамент — готов", date: "28.02", tag: "Отчёт", stage: "Фундамент", bg: "from-cyan-900 to-slate-900" },
    { title: "Армирование плиты", date: "20.01", tag: "Процесс", stage: "Фундамент", bg: "from-purple-900 to-slate-900" },
    { title: "Кладка 1-го этажа", date: "15.03", tag: "Отчёт", stage: "Стены", bg: "from-emerald-900 to-slate-900" },
    { title: "Монтаж перекрытий", date: "28.03", tag: "Процесс", stage: "Стены", bg: "from-orange-900 to-slate-900" },
    { title: "Кровля установлена", date: "15.04", tag: "Отчёт", stage: "Кровля", bg: "from-blue-900 to-slate-900" },
    { title: "Укладка паро-изоляции", date: "10.04", tag: "Процесс", stage: "Кровля", bg: "from-rose-900 to-slate-900" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Фотоотчёты</h2>
        <p className="text-muted-foreground mt-1">Визуальный прогресс строительства</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((p, i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden hover-scale cursor-pointer group">
            <div className={`h-36 bg-gradient-to-br ${p.bg} flex items-center justify-center relative`}>
              <Icon name="Image" size={32} className="text-white/20" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors" />
              <div className="absolute top-2 left-2">
                <span className="text-xs px-2 py-0.5 rounded-lg bg-black/40 text-white">{p.tag}</span>
              </div>
            </div>
            <div className="p-3">
              <div className="text-sm font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                <span>{p.stage}</span>
                <span>{p.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export function CertificatesSection() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Сертификаты качества</h2>
        <p className="text-muted-foreground mt-1">Документы на строительные материалы объекта</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CERTS.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-5 gradient-border hover-scale">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: "hsla(265,90%,65%,0.1)" }}>
                <Icon name="Award" size={22} style={{ color: "hsl(265,90%,65%)" }} />
              </div>
              <span className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: "hsla(142,80%,50%,0.12)", color: "hsl(142,80%,50%)" }}>
                ✓ Действителен
              </span>
            </div>
            <div className="font-semibold text-sm">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.material} · {c.vendor}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Выдан: {c.date}</div>
            <button className="mt-3 text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "hsl(195,100%,50%)" }}>
              <Icon name="Download" size={12} />
              Скачать PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
