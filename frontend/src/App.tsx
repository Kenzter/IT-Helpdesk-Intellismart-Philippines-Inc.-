import { createContext, useContext, useState, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { TOKEN_KEY, USER_KEY, hasStaffAccess, type User } from "./api/client";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TicketsPage from "./pages/TicketsPage";
import AccountsPage from "./pages/AccountsPage";
import PublicTicketPage from "./pages/PublicTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import DeletionLogsPage from "./pages/DeletionLogsPage";
import AboutPage from "./pages/AboutPage";

interface AuthCtx {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      const saved = raw && localStorage.getItem(TOKEN_KEY) ? (JSON.parse(raw) as User) : null;
      return hasStaffAccess(saved) ? saved : null; // old employee sessions are ignored
    } catch { return null; }
  });

  const login = (token: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

function ProtectedRoute() {
  const { user } = useAuth();
  if (!hasStaffAccess(user)) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      {/* Left side bar is 15rem wide on desktop; the top strip is 3.5rem tall */}
      <main className="pt-14 md:pl-52">
        <div className="mx-auto max-w-6xl px-4 py-8"><Outlet /></div>
      </main>
    </>
  );
}

// Main admin only. The server also enforces this; this keeps other roles off the page itself.
function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/new-ticket" element={<PublicTicketPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/deletion-logs" element={<DeletionLogsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
