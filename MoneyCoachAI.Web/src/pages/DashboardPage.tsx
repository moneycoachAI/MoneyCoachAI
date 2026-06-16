import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMonthlyDashboardCards } from "../services/dashboardService";
import type { MonthlyDashboardCard } from "../types/dashboardTypes";

function DashboardPage() {
  const [year, setYear] = useState("2026");
  const [cards, setCards] = useState<MonthlyDashboardCard[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case "Success":
        return "green";
      case "Warning":
        return "orange";
      case "Danger":
        return "red";
      case "Info":
        return "blue";
      default:
        return "gray";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Success":
        return "✅";
      case "Warning":
        return "⚠️";
      case "Danger":
        return "🚨";
      case "Info":
        return "📊";
      default:
        return "💡";
    }
  };

  const refreshDashboard = async () => {
    try {
      setLoading(true);

      const data = await getMonthlyDashboardCards(Number(year));

      setCards(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load dashboard cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialDashboard = async () => {
      try {
        setLoading(true);

        const data = await getMonthlyDashboardCards(Number(year));

        setCards(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load dashboard cards");
      } finally {
        setLoading(false);
      }
    };

    loadInitialDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleExpand = (card: MonthlyDashboardCard) => {
    const cardKey = `${card.month}-${card.year}`;

    setExpandedCard((current) =>
      current === cardKey ? null : cardKey
    );
  };

  return (
    <div>
      <h1>MoneyCoachAI Dashboard</h1>

      <button onClick={handleLogout}>Logout</button>

      <hr />

      <div>
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <button onClick={refreshDashboard}>Load Year</button>
      </div>

      {loading && <p>Loading dashboard...</p>}

      <hr />

      <h2>Monthly Smart Cards</h2>

      {cards.length === 0 ? (
        <p>No dashboard data found for this year.</p>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingBottom: "16px",
          }}
        >
          {cards.map((card) => {
            const cardKey = `${card.month}-${card.year}`;
            const isExpanded = expandedCard === cardKey;

            return (
              <div
                key={cardKey}
                style={{
                  minWidth: "280px",
                  border: `4px solid ${getBorderColor(
                    card.topSeverity
                  )}`,
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <h3>
                  {monthNames[card.month]} {card.year}
                </h3>

                <p>
                  <strong>Budget:</strong> ₹{card.totalBudget}
                </p>

                <p>
                  <strong>Spent:</strong> ₹{card.totalSpent}
                </p>

                <p>
                  <strong>Remaining:</strong> ₹{card.remaining}
                </p>

                <p>
                  {getSeverityIcon(card.topSeverity)}{" "}
                  <strong>{card.topSeverity}</strong>
                </p>

                <p>{card.topMessage}</p>

                {isExpanded && (
                  <div>
                    <hr />

                    <p>
                      <strong>Total Suggestions:</strong>{" "}
                      {card.suggestionCount}
                    </p>

                    <p>
                      This month has {card.suggestionCount} smart
                      insight(s). Open the Suggestions page for full
                      details.
                    </p>

                    <button
                      onClick={() => navigate("/suggestions")}
                    >
                      View Full Suggestions
                    </button>
                  </div>
                )}

                <button onClick={() => toggleExpand(card)}>
                  {isExpanded ? "▲ Hide Insights" : "▼ Show Insights"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;