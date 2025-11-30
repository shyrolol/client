import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { BetaProvider } from "./context/BetaContext";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/Login";
import Home from "./pages/Home";

import Maintenance from "./pages/Maintenance";
import { API_URL } from "./config";
import { useState, useEffect } from "react";

function App() {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/system/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.maintenance) {
          // Check if we have a session (admin check would be better but requires auth load)
          // For now, simple maintenance page.
          // Admins can bypass via direct login if we implement that logic,
          // or we rely on AuthContext to load and then decide.
          // But if maintenance middleware blocks everything, we can't load auth unless we allow it.
          // Middleware allows /api/auth. So AuthContext works.
          setMaintenance(true);
        }
      })
      .catch(() => {});
  }, []);

  // We need to access AuthContext to check if user is admin.
  // But App wraps AuthProvider. So we can't use useAuth here.
  // We need a wrapper component inside AuthProvider.

  return (
    <AuthProvider>
      <BetaProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router>
              <AppContent maintenance={maintenance} />
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </BetaProvider>
    </AuthProvider>
  );
}

import { useAuth } from "./context/AuthContext";
import { useLocation } from "react-router-dom";

import { useSocket } from "./context/SocketContext";

const AppContent = ({ maintenance }: { maintenance: boolean }) => {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();

  useEffect(() => {
    if (!socket) return;

    const handleMaintenance = (data: { active: boolean; message?: string }) => {
      // If status changes, reload to ensure fresh state/cache
      if (data.active !== maintenance) {
        window.location.reload();
      }
    };

    socket.on("maintenance_status", handleMaintenance);

    return () => {
      socket.off("maintenance_status", handleMaintenance);
    };
  }, [socket, maintenance]);

  if (maintenance && !loading) {
    const isAdmin =
      user && (user.systemRole === "admin" || user.systemRole === "owner");
    if (!isAdmin && location.pathname !== "/login") {
      return <Maintenance />;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
};

export default App;
