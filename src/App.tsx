import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login, { User } from "./pages/Login";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import FUNC_URLS from "../backend/func2url.json";

const queryClient = new QueryClient();
const SESSION_KEY = "cabinet_session";

function AppInner() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) { setChecking(false); return; }
    fetch(FUNC_URLS.auth, { headers: { "X-Session-Id": stored } })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem(SESSION_KEY);
      })
      .catch(() => localStorage.removeItem(SESSION_KEY))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = (u: User, sessionId: string) => {
    localStorage.setItem(SESSION_KEY, sessionId);
    setUser(u);
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      await fetch(FUNC_URLS.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ action: "logout" }),
      }).catch(() => {});
      localStorage.removeItem(SESSION_KEY);
    }
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="text-xs text-muted-foreground">Загрузка…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;

  // Администратор → отдельная панель
  if (user.role_code === "admin") return <Admin user={user} onLogout={handleLogout} />;

  // Все остальные → кабинет
  return <Index user={user} onLogout={handleLogout} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppInner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
