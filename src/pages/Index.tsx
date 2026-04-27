import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS, Section } from "./cabinet/data";
import Sidebar from "./cabinet/Sidebar";
import {
  DashboardSection,
  GanttSection,
  ChatSection,
  DocumentsSection,
  PhotosSection,
  CertificatesSection,
  FinanceSection,
  ServicesSection,
  NotificationsSection,
} from "./cabinet/ContentSections";

export default function Index() {
  const [active, setActive] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const renderSection = () => {
    switch (active) {
      case "dashboard": return <DashboardSection />;
      case "gantt": return <GanttSection />;
      case "chat": return <ChatSection />;
      case "documents": return <DocumentsSection />;
      case "photos": return <PhotosSection />;
      case "certificates": return <CertificatesSection />;
      case "finance": return <FinanceSection />;
      case "services": return <ServicesSection />;
      case "notifications": return <NotificationsSection />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        active={active}
        sidebarOpen={sidebarOpen}
        setActive={setActive}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex-shrink-0 h-14 flex items-center px-4 lg:px-6 border-b border-border"
          style={{ background: "hsla(var(--background),0.8)", backdropFilter: "blur(20px)" }}
        >
          <button className="lg:hidden p-2 rounded-lg hover:bg-secondary mr-2" onClick={() => setSidebarOpen(true)}>
            <Icon name="Menu" size={18} />
          </button>
          <div className="flex-1">
            <span className="font-display font-bold text-sm">
              {NAV_ITEMS.find((i) => i.id === active)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={() => setActive("notifications")}>
              <Icon name="Bell" size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "hsl(0,80%,60%)" }} />
            </button>
            <button
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              onClick={toggleTheme}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              <Icon name={theme === "dark" ? "Sun" : "Moon"} size={18} />
            </button>
            <button className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <Icon name="Search" size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}