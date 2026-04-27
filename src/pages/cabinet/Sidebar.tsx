import Icon from "@/components/ui/icon";
import { NAV_ITEMS, Section } from "./data";
import { User } from "../Login";

const LOGO = "https://cdn.poehali.dev/projects/bde71961-0812-45ae-89b3-4231a85c07a4/bucket/eb845745-b317-4d39-b2a4-2fe646b5447f.png";

interface SidebarProps {
  active: Section;
  sidebarOpen: boolean;
  setActive: (s: Section) => void;
  setSidebarOpen: (v: boolean) => void;
  user: User;
  onLogout: () => void;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function Sidebar({ active, sidebarOpen, setActive, setSidebarOpen, user, onLogout }: SidebarProps) {
  return (
    <aside
      className={`
        fixed lg:relative z-30 h-full flex flex-col w-64
        border-r border-border transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="ГлобалСТ" className="h-9 w-auto flex-shrink-0" />
          <div>
            <div className="font-display font-black text-sm leading-none tracking-wide">ГлобалСТ</div>
            <div className="text-xs text-muted-foreground mt-0.5">Личный кабинет</div>
          </div>
        </div>

        <div
          className="mt-4 px-3 py-2.5 rounded-xl border border-border"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="text-xs text-muted-foreground">Ваш объект</div>
          <div className="font-semibold text-sm mt-0.5">Дом 180 м² · Краснодар</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full w-[58%] rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(195,100%,50%), hsl(265,90%,65%))" }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: "hsl(195,100%,50%)" }}>58%</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin space-y-0.5 pb-2">
        {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role_code)).map((item) => (
          <button
            key={item.id}
            onClick={() => { setActive(item.id); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: active === item.id ? "hsla(195,100%,50%,0.1)" : "transparent",
              color: active === item.id ? "hsl(195,100%,50%)" : "hsl(215,15%,55%)",
            }}
            onMouseEnter={(e) => {
              if (active !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(210,20%,95%)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (active !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.color = "hsl(215,15%,55%)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            <Icon name={item.icon} size={17} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "hsl(0,80%,60%)", color: "white" }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, hsl(195,100%,50%), hsl(265,90%,65%))", color: "hsl(220,20%,6%)" }}
          >
            {getInitials(user.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user.full_name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.role_name}</div>
          </div>
          <button onClick={onLogout} title="Выйти"
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <Icon name="LogOut" size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}