import Icon from "@/components/ui/icon";
import { PAYMENTS, SERVICES, fmt } from "../data";

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
