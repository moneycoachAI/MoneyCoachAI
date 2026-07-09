import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type AppLayoutProps = {
  children: React.ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "Expenses", icon: "💸", path: "/expenses" },
    { label: "Incomes", icon: "💰", path: "/incomes" },
    { label: "Budgets", icon: "📊", path: "/budgets" },
    { label: "Goals", icon: "🎯", path: "/financialGoals" },
    { label: "Investments", icon: "📈", path: "/investments" },
    { label: "Net Worth", icon: "💎", path: "/net-worth" },
    { label: "Notifications", icon: "🔔", path: "/notifications" },
    { label: "Profile", icon: "👤", path: "/profile" },
    { label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#090b17", color: "#e2e8f0" }}>
      <style>
        {`
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
            }

            .sidebar.open {
              transform: translateX(0);
            }

            .main-content {
              margin-left: 0 !important;
              padding: 80px 16px 24px !important;
            }

            .mobile-header {
              display: flex !important;
            }
          }
        `}
      </style>

      {/* Mobile Header */}
      <div
        className="mobile-header"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "#0f172a",
          borderBottom: "1px solid #1f2937",
          color: "#e2e8f0",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 1100,
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            fontSize: "26px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ☰
        </button>

        <strong>
          Money<span style={{ color: "#16a34a" }}>CoachAI</span>
        </strong>
      </div>

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "260px",
          height: "100vh",
          background: "#0f172a",
          borderRight: "1px solid #111827",
          padding: "24px 20px",
          boxSizing: "border-box",
          zIndex: 1000,
          transition: "transform 0.25s ease",
          overflowY: "auto",
          color: "#e2e8f0",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "30px" }}>
          💳 Money<span style={{ color: "#16a34a" }}>CoachAI</span>
        </h2>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "13px 16px",
                marginBottom: "8px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "15px",
                fontWeight: isActive(item.path) ? "bold" : "normal",
                background: isActive(item.path) ? "#2563eb" : "transparent",
                color: isActive(item.path) ? "#ffffff" : "#cbd5e1",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <hr style={{ margin: "22px 0", borderColor: "#e5e7eb" }} />

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "13px 16px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "15px",
              color: "#dc2626",
              background: "transparent",
            }}
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 900,
          }}
        />
      )}

      {/* Main Content */}
      <main
        className="main-content"
        style={{
          marginLeft: "260px",
          padding: "32px 28px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default AppLayout;