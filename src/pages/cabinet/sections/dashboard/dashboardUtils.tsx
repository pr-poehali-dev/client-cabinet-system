import Icon from "@/components/ui/icon";

export function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function daysLeft(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export function StatCard({ label, value, sub, icon, color }: {
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

export function NoProject({ isManager }: { isManager?: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          {isManager ? "Все проекты" : "Обзор проекта"}
        </h2>
      </div>
      <div className="glass rounded-3xl p-16 text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "hsla(195,100%,50%,0.1)" }}>
          <Icon name="Building2" size={28} style={{ color: "hsl(195,100%,50%)" }} />
        </div>
        <div className="font-display text-lg font-bold mb-2">
          {isManager ? "Нет активных проектов" : "Проект не назначен"}
        </div>
        <p className="text-sm text-muted-foreground">
          {isManager
            ? "Создайте первый проект в разделе «Проекты» или разархивируйте существующий."
            : "Обратитесь к менеджеру проекта — он привяжет вас к объекту строительства."}
        </p>
      </div>
    </div>
  );
}
