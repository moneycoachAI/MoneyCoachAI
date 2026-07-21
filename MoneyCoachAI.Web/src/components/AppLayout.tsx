import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
//import MoneyCoachLogo from "./branding/MoneyCoachLogo";

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
    {
      label: "Recurring Transactions",
      icon: "🔁",
      path: "/recurring",
    },
    { label: "Investments", icon: "📈", path: "/investments" },
    { label: "Net Worth", icon: "💎", path: "/net-worth" },
    { label: "Reports", icon: "📑", path: "/reports" },
    { label: "Suggestions", icon: "💡", path: "/suggestions" },
    { label: "Notifications", icon: "🔔", path: "/notifications" },
    { label: "AI Advisor", icon: "🤖", path: "/ai-advisor" },
    { label: "Profile", icon: "👤", path: "/profile" },
    { label: "Settings", icon: "⚙️", path: "/settings" },
  ];

  return (
    <div className="mca-app-shell">
      <style>
        {`
          .mca-app-shell {
            min-height: 100vh;
            width: 100%;

            background:
              radial-gradient(
                circle at 20% 10%,
                rgba(91, 140, 255, 0.12),
                transparent 28%
              ),
              radial-gradient(
                circle at 85% 18%,
                rgba(124, 92, 252, 0.12),
                transparent 30%
              ),
              radial-gradient(
                circle at 70% 80%,
                rgba(33, 199, 122, 0.08),
                transparent 30%
              ),
              linear-gradient(
                135deg,
                #F3F5F7 0%,
                #ECEFF3 35%,
                #E7EBF0 70%,
                #F8F9FB 100%
              );

            background-attachment: fixed;
          }

          .mca-sidebar {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 270px;
            height: calc(100vh - 40px);

            padding: 22px 16px;
            z-index: 1100;

            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;

            background: rgba(255, 255, 255, 0.58);

            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);

            border: 1px solid rgba(255, 255, 255, 0.65);
            border-radius: 30px;

            box-shadow:
              0 20px 50px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
          }
          

          .mca-sidebar::-webkit-scrollbar {
            display: none;
          }

          .mca-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 4px 8px 24px;
          }

          .mca-brand-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            color: #fff;
            font-size: 20px;
            background: linear-gradient(135deg, #5B8CFF, #7B61FF);
            box-shadow: 0 12px 24px rgba(79,124,255,.24);
          }

          .mca-brand-title {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.6px;
            color: #111827;
            line-height: 1;
          }

          .mca-brand-title span {
            color: var(--mca-primary);
          }

          .mca-brand-subtitle {
            margin: 6px 0 0;
            font-size: 11px;
            color: var(--mca-muted);
            font-weight: 600;
          }

          .mca-nav-button {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 13px 14px;
            margin-bottom: 7px;
            border: none;
            border-radius: 18px;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
            font-weight: 700;
            color: #465064;
            background: transparent;
          }

          .mca-nav-button:hover {
            background: rgba(255,255,255,.65);
          }

          .mca-nav-button.active {
            color: var(--mca-primary);
            background: linear-gradient(135deg, rgba(79,124,255,.16), rgba(124,92,252,.12));
            box-shadow: inset 0 1px 0 rgba(255,255,255,.75);
          }

          .mca-nav-icon {
            width: 30px;
            height: 30px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,.55);
          }

          .mca-pro-card {
            margin-top: 22px;
            padding: 18px;
            border-radius: 24px;
            color: #fff;
            background: linear-gradient(135deg, #111827, #243047);
            box-shadow: 0 18px 35px rgba(17,24,39,.22);
          }

          .mca-pro-title {
            font-weight: 900;
            margin-bottom: 8px;
          }

          .mca-pro-text {
            margin: 0;
            font-size: 12px;
            line-height: 1.6;
            color: rgba(255,255,255,.72);
          }

          .mca-pro-button {
            margin-top: 16px;
            width: 100%;
            border: none;
            border-radius: 16px;
            padding: 12px;
            color: #fff;
            font-weight: 800;
            cursor: pointer;
            background: linear-gradient(135deg, #5B8CFF, #7B61FF);
          }

          .mca-logout {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
            padding: 13px 14px;
            border: none;
            border-radius: 18px;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
            color: #FF6467;
            background: rgba(255,100,103,.1);
            font-weight: 800;
          }

          .mca-main {
            margin-left: 290px;
            min-height: 100vh;

            padding: 26px 0 34px 12px;

            background: transparent;
            box-sizing: border-box;
            overflow-x: clip;
          }
          .mca-mobile-header {
            display: none;
          }

          @media (max-width: 900px) {
            .mca-app-shell {
              width: 100%;
              max-width: 100%;
              min-width: 0;
              overflow-x: hidden;
            }

            .mca-sidebar {
              top: 12px;
              left: 12px;

              width: min(270px, calc(100vw - 24px));
              max-width: calc(100vw - 24px);
              height: calc(100vh - 24px);

              transform: translateX(calc(-100% - 24px));
            }

            .mca-sidebar.open {
              transform: translateX(0);
            }

            .mca-main {
              margin: 0 !important;
              margin-left: 0 !important;

              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;

              padding: 84px 0 24px !important;

              box-sizing: border-box;
              overflow-x: hidden;
            }

            .mca-mobile-header {
              display: flex;

              position: fixed;
              top: 12px;
              left: 8px;
              right: 8px;

              width: auto;
              max-width: none;
              height: 64px;

              align-items: center;
              justify-content: space-between;

              padding: 0 14px;

              z-index: 1000;

              background: rgba(255, 255, 255, 0.72);
              backdrop-filter: blur(24px);
              -webkit-backdrop-filter: blur(24px);

              border: 1px solid rgba(255, 255, 255, 0.6);
              border-radius: 22px;

              box-shadow: var(--mca-shadow);
              box-sizing: border-box;
            }
          }
        `}
      </style>

      <div className="mca-mobile-header">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mca-gradient-button"
          style={{ padding: "10px 13px", borderRadius: "14px" }}
        >
          ☰
        </button>

        <strong style={{ fontSize: "19px", color: "#111827" }}>
          Money<span style={{ color: "var(--mca-primary)" }}>CoachAI</span>
        </strong>
      </div>

      <aside className={`mca-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="mca-brand">
          <div className="mca-brand-icon">📊</div>

          <div>
            <h2 className="mca-brand-title">
              Money<span>CoachAI</span>
            </h2>
            <p className="mca-brand-subtitle">Manage Smarter, Live Better</p>
          </div>
        </div>

        <nav>
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`mca-nav-button ${active ? "active" : ""}`}
              >
                <span className="mca-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mca-pro-card">
          <div className="mca-pro-title">💎 Go Premium</div>
          <p className="mca-pro-text">
            Unlock AI insights, smart budget alerts, and advanced financial reports.
          </p>
          <button className="mca-pro-button">Upgrade Now</button>
        </div>

        <button onClick={handleLogout} className="mca-logout">
          🚪 Logout
        </button>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,.35)",
            zIndex: 1050,
          }}
        />
      )}

      <main className="mca-main">{children}</main>
    </div>
  );
}

export default AppLayout;