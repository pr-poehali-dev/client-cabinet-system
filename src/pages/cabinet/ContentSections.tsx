import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GANTT_STAGES,
  PAYMENTS,
  DOCUMENTS,
  CERTS,
  NOTIFICATIONS,
  SERVICES,
  CHAT_MESSAGES,
  fmt,
} from "./data";

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: string; color: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 hover-scale gradient-border relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ background: color }} />
      <div className="mb-3">
        <div className="p-2 rounded-xl inline-flex" style={{ background: `${color}20` }}>
          <Icon name={icon} size={20} style={{ color }} />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      <div className="text-xs mt-2 font-medium" style={{ color }}>{sub}</div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSection() {
  const stages = [
    { name: "Фундамент", pct: 100, status: "done" },
    { name: "Стены и перекрытия", pct: 100, status: "done" },
    { name: "Кровля", pct: 100, status: "done" },
    { name: "Окна и двери", pct: 80, status: "active" },
    { name: "Инженерные сети", pct: 0, status: "todo" },
    { name: "Отделка", pct: 0, status: "todo" },
    { name: "Благоустройство", pct: 0, status: "todo" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Обзор проекта</h2>
        <p className="text-muted-foreground mt-1">Дом 180 м² · Краснодар · Старт 10 января 2025</p>
      </div>

      <div className="glass-strong rounded-3xl p-6 gradient-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ background: "radial-gradient(ellipse at top right, hsl(195,100%,50%), transparent 60%)" }} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-muted-foreground text-sm font-medium mb-1">Общий прогресс</div>
            <div className="font-display text-5xl font-black" style={{ color: "hsl(195,100%,50%)", textShadow: "0 0 20px hsla(195,100%,50%,0.5)" }}>58%</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-sm">Расчётная сдача</div>
            <div className="text-xl font-bold text-foreground mt-1">15 авг 2025</div>
            <div className="text-xs mt-0.5" style={{ color: "hsl(142,80%,50%)" }}>▲ 3 дня опережения</div>
          </div>
        </div>
        <Progress value={58} className="h-3 bg-secondary" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Начало: 10.01.2025</span>
          <span>Конец: 15.08.2025</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Оплачено" value="3,25 млн" sub="из 5,33 млн ₽" icon="Wallet" color="hsl(142,80%,50%)" />
        <StatCard label="Этапов завершено" value="4 из 7" sub="следующий: Инженерные сети" icon="CheckCircle2" color="hsl(195,100%,50%)" />
        <StatCard label="Документов" value="6" sub="2 акта подписаны" icon="FileText" color="hsl(265,90%,65%)" />
        <StatCard label="Фотоотчётов" value="24" sub="последний 2 дня назад" icon="Camera" color="hsl(30,100%,55%)" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(195,100%,50%)" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(195,100%,50%)" }}>АКТИВНЫЙ ЭТАП</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">Окна и двери</div>
            <div className="text-muted-foreground text-sm mt-1">Монтаж оконных блоков и дверных рам</div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-black" style={{ color: "hsl(195,100%,50%)" }}>80%</div>
            <div className="text-xs text-muted-foreground">выполнено</div>
          </div>
        </div>
        <Progress value={80} className="h-2 mt-4 bg-secondary" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="font-semibold mb-4">Этапы строительства</div>
        <div className="space-y-3">
          {stages.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: s.status === "done" ? "hsl(142,80%,50%)" : s.status === "active" ? "hsl(195,100%,50%)" : "hsl(220,15%,14%)",
                  color: s.status === "todo" ? "hsl(215,15%,55%)" : "hsl(220,20%,6%)",
                }}>
                {s.status === "done" ? "✓" : s.status === "active" ? "▶" : ""}
              </div>
              <div className="flex-1 text-sm">{s.name}</div>
              <div className="text-xs font-semibold w-8 text-right"
                style={{ color: s.status === "done" ? "hsl(142,80%,50%)" : s.status === "active" ? "hsl(195,100%,50%)" : "hsl(215,15%,55%)" }}>
                {s.pct}%
              </div>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${s.pct}%`,
                    background: s.status === "done" ? "hsl(142,80%,50%)" : s.status === "active" ? "hsl(195,100%,50%)" : "transparent"
                  }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Gantt ────────────────────────────────────────────────────────────────────

export function GanttSection() {
  const COL = 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">График работ</h2>
        <p className="text-muted-foreground mt-1">Диаграмма Ганта — план и факт выполнения</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { color: "hsl(142,80%,50%)", label: "Завершено (факт)" },
          { color: "hsl(195,100%,50%)", label: "В работе" },
          { color: "hsl(265,90%,65%)", label: "Запланировано" },
          { color: "rgba(255,255,255,0.12)", label: "Плановый срок" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-4 h-3 rounded" style={{ background: l.color }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: `${180 * COL + 220}px` }}>
          <div className="flex mb-3" style={{ paddingLeft: "220px" }}>
            {["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь"].map((m) => (
              <div key={m} className="text-xs font-semibold text-muted-foreground" style={{ width: `${30 * COL}px` }}>
                {m}
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute top-0 bottom-0 z-10" style={{ left: `${220 + 107 * COL}px`, width: "2px", background: "hsl(195,100%,50%)", opacity: 0.7 }}>
              <div className="w-3 h-3 rounded-full absolute -top-1 -left-0.5" style={{ background: "hsl(195,100%,50%)" }} />
              <div className="absolute -top-6 -left-7 text-xs font-bold whitespace-nowrap" style={{ color: "hsl(195,100%,50%)" }}>Сегодня</div>
            </div>

            <div className="space-y-3">
              {GANTT_STAGES.map((stage) => (
                <div key={stage.id} className="flex items-center" style={{ height: "38px" }}>
                  <div className="flex-shrink-0 text-sm font-medium" style={{ width: "216px", paddingRight: "16px" }}>
                    {stage.name}
                  </div>
                  <div className="relative flex-1 h-full flex items-center">
                    <div className="absolute h-4 rounded-full"
                      style={{
                        left: `${stage.start * COL}px`,
                        width: `${stage.planDuration * COL}px`,
                        background: "rgba(255,255,255,0.1)",
                        border: `1px solid hsl(${stage.color},0.3)`
                      }} />
                    {stage.factDuration > 0 && (
                      <div className="absolute h-4 rounded-full"
                        style={{
                          left: `${stage.start * COL}px`,
                          width: `${stage.factDuration * COL}px`,
                          background: `hsl(${stage.color})`,
                          boxShadow: `0 0 10px hsla(${stage.color},0.4)`,
                        }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GANTT_STAGES.map((s) => (
          <div key={s.id} className="glass rounded-xl p-4 flex items-center gap-4">
            <div className="w-1 self-stretch rounded-full" style={{ background: `hsl(${s.color})` }} />
            <div className="flex-1">
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.factDuration > 0
                  ? `Факт: ${s.factDuration} дн. / План: ${s.planDuration} дн.`
                  : `План: ${s.planDuration} дн.`}
              </div>
            </div>
            <div>
              {s.status === "done" && <Badge style={{ background: "hsla(142,80%,50%,0.15)", color: "hsl(142,80%,50%)" }}>Готово</Badge>}
              {s.status === "in-progress" && <Badge style={{ background: "hsla(195,100%,50%,0.15)", color: "hsl(195,100%,50%)" }}>В работе</Badge>}
              {s.status === "planned" && <Badge variant="secondary">Планируется</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export function ChatSection() {
  const [msg, setMsg] = useState("");

  return (
    <div className="space-y-4 animate-fade-in flex flex-col">
      <div>
        <h2 className="font-display text-2xl font-bold">Чат с командой</h2>
        <p className="text-muted-foreground mt-1">Прямая связь с прорабом и менеджером</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {[
          { name: "Прораб Алексей", role: "Строительство", online: true, avatar: "А" },
          { name: "Менеджер Ирина", role: "Документы", online: true, avatar: "И" },
          { name: "Архитектор Дмитрий", role: "Проект", online: false, avatar: "Д" },
        ].map((p) => (
          <div key={p.name} className="glass rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">{p.avatar}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
                style={{ background: p.online ? "hsl(142,80%,50%)" : "hsl(215,15%,55%)" }} />
            </div>
            <div>
              <div className="text-xs font-semibold">{p.name.split(" ")[1]}</div>
              <div className="text-xs text-muted-foreground">{p.role}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
        {CHAT_MESSAGES.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "client" ? "flex-row-reverse" : ""}`}>
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
              style={{
                background: m.role === "client" ? "hsl(195,100%,50%)" : m.role === "foreman" ? "hsla(142,80%,50%,0.2)" : "hsla(265,90%,65%,0.2)",
                color: m.role === "client" ? "hsl(220,20%,6%)" : m.role === "foreman" ? "hsl(142,80%,50%)" : "hsl(265,90%,65%)",
              }}>
              {m.avatar}
            </div>
            <div className={`max-w-xs flex flex-col gap-1 ${m.role === "client" ? "items-end" : "items-start"}`}>
              <div className="text-xs text-muted-foreground">{m.author} · {m.time}</div>
              <div className="px-4 py-2.5 rounded-2xl text-sm"
                style={{
                  background: m.role === "client" ? "hsl(195,100%,50%)" : "rgba(255,255,255,0.06)",
                  color: m.role === "client" ? "hsl(220,20%,6%)" : "inherit",
                  borderRadius: m.role === "client" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  border: m.role !== "client" ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 flex gap-3 items-center">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button className="p-2 rounded-xl transition-opacity hover:opacity-90"
          style={{ background: "hsl(195,100%,50%)", color: "hsl(220,20%,6%)" }}>
          <Icon name="Send" size={16} />
        </button>
      </div>
    </div>
  );
}

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

// ─── Finance ──────────────────────────────────────────────────────────────────

export function FinanceSection() {
  const paid = PAYMENTS.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const upcoming = PAYMENTS.filter((p) => p.status === "upcoming").reduce((s, p) => s + p.amount, 0);
  const total = paid + upcoming;
  const pct = Math.round((paid / total) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Финансы</h2>
        <p className="text-muted-foreground mt-1">График платежей и детализация по этапам</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-muted-foreground text-xs mb-1">Итого по договору</div>
          <div className="font-display text-lg font-bold">{fmt(total)}</div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-muted-foreground text-xs mb-1">Оплачено</div>
          <div className="font-display text-lg font-bold" style={{ color: "hsl(142,80%,50%)" }}>{fmt(paid)}</div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-muted-foreground text-xs mb-1">Остаток</div>
          <div className="font-display text-lg font-bold" style={{ color: "hsl(30,100%,55%)" }}>{fmt(upcoming)}</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Оплачено {pct}%</span>
          <span className="font-semibold" style={{ color: "hsl(142,80%,50%)" }}>{fmt(paid)}</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(142,80%,50%), hsl(195,100%,50%))" }} />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <span className="font-semibold">История платежей</span>
        </div>
        <div className="divide-y divide-border">
          {PAYMENTS.map((p) => (
            <div key={p.id} className="px-4 py-3.5 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: p.status === "paid" ? "hsla(142,80%,50%,0.15)" : "hsla(30,100%,55%,0.15)",
                  color: p.status === "paid" ? "hsl(142,80%,50%)" : "hsl(30,100%,55%)",
                }}>
                {p.status === "paid" ? <Icon name="Check" size={14} /> : <Icon name="Clock" size={14} />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.date}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">{fmt(p.amount)}</div>
                <div className="text-xs" style={{ color: p.status === "paid" ? "hsl(142,80%,50%)" : "hsl(215,15%,55%)" }}>
                  {p.status === "paid" ? "Оплачено" : "Ожидается"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────

export function ServicesSection() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold">Дополнительные услуги</h2>
        <p className="text-muted-foreground mt-1">Расширения к этапам строительства</p>
      </div>

      {SERVICES.map((group) => (
        <div key={group.stage} className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
            <Icon name="Layers" size={16} style={{ color: "hsl(195,100%,50%)" }} />
            <span className="font-semibold text-sm">{group.stage}</span>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((item, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="font-display text-base font-bold mt-0.5" style={{ color: "hsl(195,100%,50%)" }}>
                    {(item.price / 1000).toFixed(0)} тыс. ₽
                  </div>
                </div>
                {item.status === "accepted" ? (
                  <span className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                    style={{ background: "hsla(142,80%,50%,0.12)", color: "hsl(142,80%,50%)" }}>
                    ✓ Добавлено
                  </span>
                ) : (
                  <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "hsl(195,100%,50%)", color: "hsl(220,20%,6%)" }}>
                    Добавить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function NotificationsSection() {
  const typeConfig: Record<string, { icon: string; color: string }> = {
    success: { icon: "CheckCircle2", color: "hsl(142,80%,50%)" },
    info: { icon: "Info", color: "hsl(195,100%,50%)" },
    warning: { icon: "AlertTriangle", color: "hsl(30,100%,55%)" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Уведомления</h2>
          <p className="text-muted-foreground mt-1">Все события по проекту</p>
        </div>
        <button className="text-xs hover:underline" style={{ color: "hsl(195,100%,50%)" }}>
          Отметить все прочитанными
        </button>
      </div>

      <div className="space-y-2">
        {NOTIFICATIONS.map((n) => {
          const cfg = typeConfig[n.type];
          return (
            <div key={n.id} className={`glass rounded-xl p-4 flex items-start gap-3 transition-all ${n.read ? "opacity-50" : "gradient-border"}`}>
              <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                <Icon name={cfg.icon} size={18} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm">{n.text}</div>
                <div className="text-xs text-muted-foreground mt-1">{n.time}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: cfg.color }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
