export { DocumentsSection } from "./files/DocumentsSection";
export { PhotosSection } from "./files/PhotosSection";

// ─── Certificates (static) ────────────────────────────────────────────────────

import Icon from "@/components/ui/icon";
import { CERTS } from "../data";

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
