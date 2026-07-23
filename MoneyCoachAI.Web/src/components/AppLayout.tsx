import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

type AppLayoutProps = {
  children: React.ReactNode;
};

function AppLayout({
  children,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const isActive = (path: string) =>
    location.pathname === path;

  const handleNavigate = (
    path: string
  ) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");

    setSidebarOpen(false);
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: "🏠",
      path: "/dashboard",
    },
    {
      label: "Expenses",
      icon: "💸",
      path: "/expenses",
    },
    {
      label: "Incomes",
      icon: "💰",
      path: "/incomes",
    },
    {
      label: "Budgets",
      icon: "📊",
      path: "/budgets",
    },
    {
      label: "Goals",
      icon: "🎯",
      path: "/financialGoals",
    },
    {
      label: "Recurring Transactions",
      icon: "🔁",
      path: "/recurring",
    },
    {
      label: "Investments",
      icon: "📈",
      path: "/investments",
    },
    {
      label: "Net Worth",
      icon: "💎",
      path: "/net-worth",
    },
    {
      label: "Reports",
      icon: "📑",
      path: "/reports",
    },
    {
      label: "Suggestions",
      icon: "💡",
      path: "/suggestions",
    },
    {
      label: "Notifications",
      icon: "🔔",
      path: "/notifications",
    },
    {
      label: "AI Advisor",
      icon: "🤖",
      path: "/ai-advisor",
    },
    {
      label: "Profile",
      icon: "👤",
      path: "/profile",
    },
    {
      label: "Settings",
      icon: "⚙️",
      path: "/settings",
    },
  ];

  return (
    <div className="mca-app-shell">
      <style>
        {`
          .mca-app-shell,
          .mca-app-shell * {
            box-sizing: border-box;
          }

          .mca-app-shell {
            width: 100%;
            min-height: 100vh;

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
                #f3f5f7 0%,
                #eceff3 35%,
                #e7ebf0 70%,
                #f8f9fb 100%
              );

            background-attachment: fixed;
          }

          /*
          ============================================
          DESKTOP SIDEBAR
          ============================================
          */

          .mca-sidebar {
            position: fixed;
            top: 20px;
            bottom: 20px;
            left: 20px;
            z-index: 1100;

            display: flex;
            flex-direction: column;

            width: 270px;
            min-width: 270px;

            padding: 14px 12px 16px;

            overflow-y: auto;
            overflow-x: hidden;

            border:
              1px solid
              rgba(255, 255, 255, 0.68);

            border-radius: 30px;

            background:
              rgba(255, 255, 255, 0.58);

            box-shadow:
              0 20px 50px
              rgba(0, 0, 0, 0.06),
              inset 0 1px 0
              rgba(255, 255, 255, 0.82);

            backdrop-filter: blur(24px);
            -webkit-backdrop-filter:
              blur(24px);

            scrollbar-width: none;

            transition:
              transform 0.28s ease;
          }

          .mca-sidebar::-webkit-scrollbar {
            display: none;
          }

          /*
          ============================================
          COMPACT BRAND AREA
          ============================================
          */

          .mca-brand {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;

            width: 100%;
            min-height: 64px;

            margin: 0 0 4px;
            padding: 4px 36px 8px 4px;
          }

          .mca-brand-symbol-wrap {
            display: grid;
            place-items: center;

            flex: 0 0 58px;
            width: 58px;
            height: 58px;

            overflow: hidden;
          }

          .mca-brand-symbol {
            display: block;

            width: 58px;
            height: 58px;

            object-fit: contain;

            transform: scale(1.45);
            transform-origin: center;
          }

          .mca-brand-copy {
            display: flex;
            flex: 1;
            flex-direction: column;
            justify-content: center;

            min-width: 0;
            overflow: visible;
          }

          .mca-brand-text-logo {
            display: block;

            width: 150px;
            max-width: 100%;
            height: 34px;

            object-fit: contain;
            object-position: left center;

            transform: scale(3.2);
            transform-origin: left center;
          }

          .mca-brand-subtitle {
            margin: 4px 0 0 2px;

            color: #6b7280;

            font-size: 12px;
            font-weight: 655;
            line-height: 0;

            white-space: nowrap;
          }

          .mca-sidebar-close {
            position: absolute;
            top: 7px;
            right: 1px;

            display: none;
            place-items: center;

            width: 30px;
            height: 30px;

            padding: 0;

            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 10px;

            background: rgba(255, 255, 255, 0.8);
            color: #475569;

            cursor: pointer;

            font-size: 20px;
            font-weight: 700;
            line-height: 1;
          }

          /*
          ============================================
          NAVIGATION
          ============================================
          */

          .mca-sidebar-nav {
            display: flex;
            flex-direction: column;

            width: 100%;
            margin-top: 2px;
          }

          .mca-nav-button {
            display: flex;
            align-items: center;
            gap: 12px;

            width: 100%;
            min-height: 51px;

            margin: 0 0 6px;
            padding: 8px 11px;

            border: 0;
            border-radius: 18px;

            background: transparent;
            color: #465064;

            cursor: pointer;

            font: inherit;
            font-size: 13px;
            font-weight: 750;
            text-align: left;

            transition:
              background 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease;
          }

          .mca-nav-button:hover {
            background:
              rgba(255, 255, 255, 0.66);

            transform: translateX(2px);
          }

          .mca-nav-button.active {
            background:
              linear-gradient(
                135deg,
                rgba(79, 124, 255, 0.16),
                rgba(124, 92, 252, 0.12)
              );

            box-shadow:
              inset 0 1px 0
              rgba(255, 255, 255, 0.78);

            color: var(
              --mca-primary,
              #4f7cff
            );
          }

          .mca-nav-icon {
            display: grid;
            place-items: center;

            flex: 0 0 auto;

            width: 34px;
            height: 34px;

            border-radius: 12px;

            background:
              rgba(255, 255, 255, 0.62);

            font-size: 15px;
          }

          .mca-nav-label {
            min-width: 0;

            overflow: hidden;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /*
          ============================================
          SIDEBAR BOTTOM
          ============================================
          */

          .mca-sidebar-bottom {
            margin-top: auto;
          }

          .mca-pro-card {
            margin-top: 15px;
            padding: 16px;

            border-radius: 22px;

            background:
              linear-gradient(
                135deg,
                #111827,
                #243047
              );

            box-shadow:
              0 18px 35px
              rgba(17, 24, 39, 0.2);

            color: #ffffff;
          }

          .mca-pro-title {
            margin-bottom: 7px;

            font-size: 13px;
            font-weight: 900;
          }

          .mca-pro-text {
            margin: 0;

            color:
              rgba(255, 255, 255, 0.72);

            font-size: 11px;
            line-height: 1.55;
          }

          .mca-pro-button {
            width: 100%;

            margin-top: 12px;
            padding: 10px;

            border: 0;
            border-radius: 14px;

            background:
              linear-gradient(
                135deg,
                #5b8cff,
                #7b61ff
              );

            color: #ffffff;

            cursor: pointer;

            font: inherit;
            font-size: 12px;
            font-weight: 850;
          }

          .mca-logout {
            display: flex;
            align-items: center;
            gap: 11px;

            width: 100%;
            min-height: 48px;

            margin-top: 12px;
            padding: 10px 13px;

            border: 0;
            border-radius: 17px;

            background:
              rgba(255, 100, 103, 0.1);

            color: #ff6467;

            cursor: pointer;

            font: inherit;
            font-size: 13px;
            font-weight: 850;
            text-align: left;
          }

          /*
          ============================================
          MAIN CONTENT
          ============================================
          */

          .mca-main {
            width: auto;
            min-width: 0;
            min-height: 100vh;

            margin-left: 290px;
            padding: 26px 0 34px 12px;

            overflow-x: clip;

            background: transparent;
          }

          /*
          ============================================
          MOBILE HEADER
          ============================================
          */

          .mca-mobile-header {
            display: none;
          }

          .mca-mobile-menu-button {
            display: grid;
            place-items: center;

            flex: 0 0 auto;

            width: 40px;
            height: 40px;

            padding: 0;

            border: 0;
            border-radius: 13px;

            background:
              linear-gradient(
                135deg,
                #5b8cff,
                #7b61ff
              );

            box-shadow:
              0 9px 20px
              rgba(91, 140, 255, 0.22);

            color: #ffffff;

            cursor: pointer;

            font-size: 18px;
          }

          .mca-mobile-brand {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 7px;

            min-width: 0;
          }

          .mca-mobile-symbol {
            display: block;

            width: 32px;
            height: 32px;

            object-fit: contain;
          }

          .mca-mobile-text-logo {
            display: block;

            
            max-width:
              calc(100vw - 135px);
            height: 130px;

            object-fit: contain;
            object-position: center;
          }

          .mca-sidebar-overlay {
            position: fixed;
            inset: 0;
            z-index: 1050;

            background:
              rgba(17, 24, 39, 0.38);

            backdrop-filter: blur(2px);
            -webkit-backdrop-filter:
              blur(2px);
          }

          /*
          ============================================
          TABLET AND MOBILE
          ============================================
          */

          @media (max-width: 900px) {
            .mca-app-shell {
              width: 100%;
              max-width: 100%;
              min-width: 0;

              overflow-x: hidden;
            }

            .mca-sidebar {
              top: 10px;
              bottom: 10px;
              left: 10px;

              width:
                min(
                  270px,
                  calc(100vw - 20px)
                );

              min-width: 0;
              height: auto;

              transform:
                translateX(
                  calc(-100% - 20px)
                );
            }

            .mca-sidebar.open {
              transform: translateX(0);
            }

            .mca-sidebar-close {
              display: grid;
            }

            .mca-main {
              width: 100%;
              max-width: 100%;
              min-width: 0;

              margin: 0 !important;
              padding:
                82px
                0
                24px !important;

              overflow-x: hidden;
            }

            .mca-mobile-header {
              position: fixed;
              top: 10px;
              left: 8px;
              right: 8px;
              z-index: 1000;

              display: flex;
              align-items: center;
              justify-content:
                space-between;

              width: auto;
              height: 62px;

              padding: 0 12px;

              border:
                1px solid
                rgba(
                  255,
                  255,
                  255,
                  0.64
                );

              border-radius: 21px;

              background:
                rgba(
                  255,
                  255,
                  255,
                  0.76
                );

              box-shadow:
                0 12px 34px
                rgba(15, 23, 42, 0.08);

              backdrop-filter: blur(24px);
              -webkit-backdrop-filter:
                blur(24px);
            }

            .mca-brand {
              padding-bottom: 8px;
              margin-bottom: 2px;
            }
          }

          @media (max-width: 480px) {
            .mca-sidebar {
              padding: 12px 10px 14px;
            }

            .mca-brand {
              gap: 8px;
              min-height: 58px;
              padding: 2px 35px 8px 3px;
            }

            .mca-brand-symbol-wrap {
              flex-basis: 50px;
              width: 50px;
              height: 50px;
            }

            .mca-brand-symbol {
              width: 50px;
              height: 50px;
              transform: scale(1.35);
            }

            .mca-brand-text-logo {
              width: 138px;
              height: 30px;
              transform: scale(1.75);
            }

            .mca-brand-subtitle {
              margin-top: 3px;
              font-size: 8px;
            }

            .mca-nav-button {
              min-height: 48px;
              margin-bottom: 5px;
            }

            .mca-mobile-text-logo {
              width: auto;
            }
          }
        `}
      </style>

      <header className="mca-mobile-header">
        <button
          type="button"
          className="mca-mobile-menu-button"
          aria-label="Open navigation"
          onClick={() =>
            setSidebarOpen(true)
          }
        >
          ☰
        </button>

        <div className="mca-mobile-brand">
         

          <img
            src="/branding/text-logo.png"
            alt="MoneyCoachAI"
            className="mca-mobile-text-logo"
          />
        </div>
      </header>

      <aside
        className={`mca-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="mca-brand">
          <div className="mca-brand-symbol-wrap">
            <img
              src="/branding/mcai-logo.png"
              alt=""
              aria-hidden="true"
              className="mca-brand-symbol"
            />
          </div>

          <div className="mca-brand-copy">
            <img
              src="/branding/text-logo.png"
              alt="MoneyCoachAI"
              className="mca-brand-text-logo"
            />

            <p className="mca-brand-subtitle">
              Manage Smarter, Live Better
            </p>
          </div>

          <button
            type="button"
            className="mca-sidebar-close"
            aria-label="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            ×
          </button>
        </div>

        <nav className="mca-sidebar-nav">
          {navItems.map((item) => {
            const active =
              isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                className={`mca-nav-button ${
                  active ? "active" : ""
                }`}
                onClick={() =>
                  handleNavigate(item.path)
                }
              >
                <span className="mca-nav-icon">
                  {item.icon}
                </span>

                <span className="mca-nav-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mca-sidebar-bottom">
          <div className="mca-pro-card">
            <div className="mca-pro-title">
              💎 Go Premium
            </div>

            <p className="mca-pro-text">
              Unlock AI insights, smart
              budget alerts and advanced
              reports.
            </p>

            <button
              type="button"
              className="mca-pro-button"
            >
              Upgrade Now
            </button>
          </div>

          <button
            type="button"
            className="mca-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="mca-sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <main className="mca-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;