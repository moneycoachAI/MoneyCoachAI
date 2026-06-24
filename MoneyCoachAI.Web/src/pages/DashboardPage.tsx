import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMonthlyDashboardCards, getTopCategory, getAiAdvisorInsights } from "../services/dashboardService";
import type { MonthlyDashboardCard } from "../types/dashboardTypes";
import DashboardCharts from "../components/DashboardCharts";
import { getExpenses } from "../services/expenseService";
import { getIncomes } from "../services/incomeService";
import type { financialActivity } from "../types/financialActivityTypes";
import { getBudgets } from "../services/budgetService";
import type { Budget } from "../types/budgetTypes";
import type { TopCategory } from "../types/topCategoryTypes";
import { getMonthlyComparison } from "../services/dashboardService";
import type { MonthlyComparison } from "../types/monthlyComparisonTypes";
import type { AiAdvisorInsight } from "../types/aiInsightTypes";
import { exportMonthlyPdf } from "../services/reportService";
import { getFinancialGoals } from "../services/financialGoalService";
import type { FinancialGoal } from "../types/financialGoalTypes";
import { getNetWorthSummary } from "../services/netWorthService";
import type { NetWorthSummary } from "../types/netWorthTypes";


function DashboardPage() {
  const [year, setYear] = useState("2026");
  const [cards, setCards] = useState<MonthlyDashboardCard[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  

  const navigate = useNavigate();

  const [recentTransactions, setRecentTransactions] = useState<
  financialActivity[]>([]);

  const [recentBudgets, setRecentBudgets] = useState<Budget[]>([]);


  const [ topCategory, setTopCategory] =  useState<TopCategory | null>(null);

  const [topCategoryMonth, setTopCategoryMonth] = useState("");
  const [topCategoryYear, setTopCategoryYear] = useState("");

  const [loadedTopCategoryMonth, setLoadedTopCategoryMonth] = useState("");
  const [loadedTopCategoryYear, setLoadedTopCategoryYear] = useState("");

  const [monthlyComparison, setMonthlyComparison] =
  useState<MonthlyComparison | null>(null);

  const [aiInsights, setAiInsights] = useState<AiAdvisorInsight[]>([]);

  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
 
  const [netWorthSummary, setNetWorthSummary] = useState<NetWorthSummary | null>(null);

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

  const getCardColor = (severity: string) => {
    switch (severity) {
      case "Success":
        return "#16a34a";
      case "Warning":
        return "#f59e0b";
      case "Danger":
        return "#dc2626";
      case "Info":
        return "#2563eb";
      default:
        return "#6b7280";
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

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return "🟢";
      case "Moderate":
        return "🟡";
      case "Risky":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const loadDashboardCards = async () => {
    try {
      setLoading(true);

      const data = await getMonthlyDashboardCards(Number(year));

      const netWorthData = await getNetWorthSummary();
      setNetWorthSummary(netWorthData);

      setCards(data);
      await loadRecentTransactions();
    } catch (error) {
      console.error(error);
      alert("Failed to load dashboard cards");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async (month: number, year: number) => {
  try {
    const pdfBlob = await exportMonthlyPdf(month, year);

    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `MoneyCoachAI_Report_${month}_${year}.pdf`;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Failed to export PDF");
  }
};

const loadRecentTransactions = async () => {
  const expenses = await getExpenses();
  const incomes = await getIncomes();
  const budgets = await getBudgets();

  const goalsData = await getFinancialGoals();
  setFinancialGoals(goalsData);

  const netWorthData = await getNetWorthSummary();
  setNetWorthSummary(netWorthData);

{/*..*/}


{/*..*/}




  const expenseTransactions: financialActivity[] = expenses.map((expense) => ({
    id: expense.id,
    type: "Expense",
    amount: expense.amount,
    categoryOrSource: expense.category,
    description: expense.description,
    date: expense.date,
  }));

  const incomeTransactions: financialActivity[] = incomes.map((income) => ({
    id: income.id,
    type: "Income",
    amount: income.amount,
    categoryOrSource: income.source,
    description: income.description,
    date: income.date,
  }));

  const combinedTransactions = [
    ...expenseTransactions,
    ...incomeTransactions,
  ]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

  setRecentTransactions(combinedTransactions);
  {/*--*/}
  const latestTransactionDate = combinedTransactions[0]?.date;

if (latestTransactionDate) {
  const latestDate = new Date(latestTransactionDate);

  const latestMonth = latestDate.getMonth() + 1;
  const latestYear = latestDate.getFullYear();

  setTopCategoryMonth(latestMonth.toString());
  setTopCategoryYear(latestYear.toString());

  

  const latestBudgets = budgets.filter(
    (budget) =>
      budget.month === latestMonth &&
      budget.year === latestYear
  );

  setRecentBudgets(latestBudgets);

  const categoryData = await getTopCategory(
    latestMonth,
    latestYear
  );

  setTopCategory(categoryData);

  
  const comparisonData =
  await getMonthlyComparison(
    latestMonth,
    latestYear
  );

  setMonthlyComparison(comparisonData);

  const insightData = await getAiAdvisorInsights(
  latestMonth,
  latestYear
);

setAiInsights(insightData);

  setLoadedTopCategoryMonth(latestMonth.toString());
  setLoadedTopCategoryYear(latestYear.toString());

}


  {/*--*/}

  

};

const handleLoadTopCategory = async () => {
  try {
    const data = await getTopCategory(
      Number(topCategoryMonth),
      Number(topCategoryYear)
    );
    
    setTopCategory(data);
    setLoadedTopCategoryMonth(topCategoryMonth);
    setLoadedTopCategoryYear(topCategoryYear);

    

  } catch (error) {
    console.error(error);
    alert("Failed to load top category");
  }
};


  useEffect(() => {
    const loadInitialDashboard = async () => {
      try {
        setLoading(true);

        const data = await getMonthlyDashboardCards(Number(year));

        setCards(data);
        await loadRecentTransactions();
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

  const alertCards = cards.filter(
    (card) =>
      card.topSeverity === "Danger" ||
      card.topSeverity === "Warning"
  );

  console.log("Top Category:", topCategory);
  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1>MoneyCoachAI Dashboard</h1>
          <p>Track income, expenses, savings, and smart alerts.</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />

        <button onClick={loadDashboardCards}>
          Load Year
        </button>
      </div>

      {loading && <p>Loading dashboard...</p>}

      <h2>Auto Alerts</h2>

      {cards.length === 0 ? (
        <p>No alerts available.</p>
      ) : alertCards.length === 0 ? (
        <p>No critical alerts. You are doing well.</p>
      ) : (
        <div
          style={{
            marginBottom: "24px",
            maxHeight: "350px",
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
          {alertCards.map((card) => (
            <div
              key={`${card.month}-${card.year}-alert`}
              style={{
                border: `2px solid ${getCardColor(card.topSeverity)}`,
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
              }}
            >
              <strong>
                {getSeverityIcon(card.topSeverity)} {card.topSeverity} -{" "}
                {monthNames[card.month]} {card.year}
              </strong>

              <p>{card.topMessage}</p> 
            </div>
          ))}
        </div>
        
      )}


      {/* Top Spending Category */}
<h2>🏆 Top Spending Category</h2>

<div style={{ marginBottom: "12px" }}>
  <select
  value={topCategoryMonth}
  onChange={(e) => setTopCategoryMonth(e.target.value)}
  style={{ padding: "8px", marginRight: "8px" }}
>
  <option value="1">January</option>
  <option value="2">February</option>
  <option value="3">March</option>
  <option value="4">April</option>
  <option value="5">May</option>
  <option value="6">June</option>
  <option value="7">July</option>
  <option value="8">August</option>
  <option value="9">September</option>
  <option value="10">October</option>
  <option value="11">November</option>
  <option value="12">December</option>
</select>

  <input
    type="number"
    placeholder="Year"
    value={topCategoryYear}
    onChange={(e) => setTopCategoryYear(e.target.value)}
    style={{ padding: "8px", marginRight: "8px" }}
  />

  <button onClick={handleLoadTopCategory}>
    🔍 View
  </button>
</div>

{topCategory ? (
  <div
    style={{
      maxWidth: "500px",
      margin: "20px auto",
      border: "2px solid orange",
      borderRadius: "16px",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#fff8e6",
    }}
  >
 <h3>
  {monthNames[Number(loadedTopCategoryMonth)]} {loadedTopCategoryYear}
</h3>

<h2 style={{ marginTop: "15px" }}>
  🛒 {topCategory.category}
</h2>

<p
  style={{
    fontSize: "24px",
    fontWeight: "bold",
    color: "#f59e0b",
  }}
>
  ₹{topCategory.totalSpent}
</p>

<p>
  {topCategory.percentageOfTotal.toFixed(1)}%
  of all spending this month
</p>

<p
  style={{
    color: "#666",
    fontSize: "14px",
  }}
>
  Largest spending category
</p>

    

    <div
      style={{
        width: "100%",
        height: "12px",
        backgroundColor: "#e5e7eb",
        borderRadius: "8px",
        marginTop: "12px",
      }}
    >
      <div
        style={{
          width: `${topCategory.percentageOfTotal}%`,
          height: "100%",
          backgroundColor: "#f59e0b",
          borderRadius: "8px",
        }}
      />
    </div>
  </div>
) : (
  
  <p>No top category found for selected month.</p>
)}

{/* ----Month Comparison---- */}

{monthlyComparison && (
  <>
    <h2
      style={{
        textAlign: "center",
        marginTop: "30px",
      }}
    >
      📈 Monthly Comparison
    </h2>

    <div
      style={{
        border: "2px solid #4caf50",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "30px",
      }}
    >
      <table
        style={{
          width: "100%",
          textAlign: "center",
        }}
      >
        <thead>
  <tr>
    <th>Category</th>

    <th>
      {monthNames[monthlyComparison.previousMonth]}{" "}
      {monthlyComparison.previousMonth}
    </th>

    <th>
      {monthNames[monthlyComparison.currentMonth]}{" "}
      {monthlyComparison.currentMonth}
    </th>

    <th>Trend</th>
  </tr>
</thead>

        <tbody>
          <tr>
            <td>Income</td>

            <td>
              ₹{monthlyComparison.previousIncome}
            </td>

            <td>
              ₹{monthlyComparison.currentIncome}
            </td>

            <td
              style={{
                color:
                  monthlyComparison.incomeChangePercent >= 0
                    ? "green"
                    : "red",
              }}
            >
              {monthlyComparison.incomeChangePercent >= 0
                ? "▲ "
                : "▼ "}
              {Math.abs(
                monthlyComparison.incomeChangePercent
              )}
              %
            </td>
          </tr>

          <tr>
            <td>Expenses</td>

            <td>
              ₹{monthlyComparison.previousSpent}
            </td>

            <td>
              ₹{monthlyComparison.currentSpent}
            </td>

            <td
              style={{
                color:
                  monthlyComparison.expenseChangePercent <= 0
                    ? "green"
                    : "red",
              }}
            >
              {monthlyComparison.expenseChangePercent <= 0
                ? "▼ "
                : "▲ "}
              {Math.abs(
                monthlyComparison.expenseChangePercent
              )}
              %
            </td>
          </tr>

          <tr>
            <td>Savings</td>

            <td>
              ₹{monthlyComparison.previousSavings}
            </td>

            <td>
              ₹{monthlyComparison.currentSavings}
            </td>

            <td
              style={{
                color:
                  monthlyComparison.savingsChangePercent >= 0
                    ? "green"
                    : "red",
              }}
            >
              {monthlyComparison.savingsChangePercent >= 0
                ? "▲ "
                : "▼ "}
              {Math.abs(
                monthlyComparison.savingsChangePercent
              )}
              %
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </>
)}

{/* ----AI Advisor widget UI---- */}
{aiInsights.length > 0 && (
  <>
    <h2 style={{ textAlign: "center", marginTop: "30px" }}>
      🤖 AI Advisor Insights
    </h2>

    <div style={{ marginBottom: "30px" }}>
      {aiInsights.map((insight, index) => (
        <div
          key={index}
          style={{
            border:
              insight.severity === "Danger"
                ? "2px solid red"
                : insight.severity === "Warning"
                ? "2px solid orange"
                : insight.severity === "Success"
                ? "2px solid green"
                : "2px solid blue",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "12px",
            backgroundColor: "#fff",
          }}
        >
          <h3>{insight.title}</h3>
          <p>{insight.message}</p>
          <strong>{insight.severity}</strong>
        </div>
      ))}
    </div>
  </>
)}

{/* ----Dashboard Goals Widget---- */}
<h2 style={{ textAlign: "center", marginTop: "30px" }}>
  🎯 Goals Overview
</h2>

{financialGoals.filter((goal) => goal.progressPercentage < 100).length === 0 ? (
  <p style={{ textAlign: "center" }}>
    No active goals. Completed goals are available on the Goals page.
  </p>
) : (
  <div
    style={{
      border: "2px solid #2563eb",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "30px",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "20px",
        textAlign: "center",
      }}
    >
      <div>
        <strong>Total Goals</strong>
        <h3>{financialGoals.length}</h3>
      </div>

      <div>
        <strong>Completed</strong>
        <h3>
          {
            financialGoals.filter(
              (goal) => goal.progressPercentage >= 100
            ).length
          }
        </h3>
      </div>

      <div>
        <strong>Total Target</strong>
        <h3>
          ₹
          {financialGoals.reduce(
            (sum, goal) => sum + goal.targetAmount,
            0
          )}
        </h3>
      </div>
    </div>

    {financialGoals
  .filter((goal) => goal.progressPercentage < 100)
  .slice(0, 3)
  .map((goal) => (
    <div key={goal.id} style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <strong>🎯 {goal.name}</strong>

        <span>
          {goal.progressPercentage.toFixed(1)}%
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: "10px",
          backgroundColor: "#e5e7eb",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: `${Math.min(
              goal.progressPercentage,
              100
            )}%`,
            height: "100%",
            backgroundColor:
              goal.progressPercentage >= 80
                ? "#2563eb"
                : goal.progressPercentage >= 50
                ? "orange"
                : "red",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
))}
    <div
  style={{
    textAlign: "center",
    marginTop: "20px",
  }}
>
  <button
    onClick={() => navigate("/financialGoals")}
    style={{
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      backgroundColor: "#2563eb",
      color: "white",
      fontWeight: "bold",
    }}
  >
    🎯 View All Goals
  </button>
</div>
  </div>
)}

{/* ----Net Worth Widget.---- */}

{netWorthSummary && (
  <>
    <h2 style={{ textAlign: "center", marginTop: "30px" }}>
      💎 Net Worth Overview
    </h2>

    <div
      style={{
        border: "2px solid #7c3aed",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "30px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        <div>
          <strong>Total Assets</strong>
          <h3 style={{ color: "green" }}>
            ₹{netWorthSummary.totalAssets}
          </h3>
        </div>

        <div>
          <strong>Total Liabilities</strong>
          <h3 style={{ color: "red" }}>
            ₹{netWorthSummary.totalLiabilities}
          </h3>
        </div>

        <div>
          <strong>Net Worth</strong>
          <h3
            style={{
              color:
                netWorthSummary.netWorth >= 0
                  ? "green"
                  : "red",
            }}
          >
            ₹{netWorthSummary.netWorth}
          </h3>
        </div>
      </div>

      <button
        onClick={() => navigate("/net-worth")}
        style={{
          marginTop: "18px",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          backgroundColor: "#7c3aed",
          color: "white",
          fontWeight: "bold",
        }}
      >
        💎 View Net Worth
      </button>
    </div>
  </>
)}
      

{/* ----Recent Financial Activity---- */}

      <h2>Recent Financial Activity</h2>

{recentTransactions.length === 0 ? (
  <p>No recent transactions found.</p>
) : (
  <div style={{ marginBottom: "24px" }}>
    <div style={{ marginBottom: "20px" }}>
      <h3>Recent Income</h3>

      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Source</th>
            <th>Description</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {recentTransactions
            .filter((transaction) => transaction.type === "Income")
            .map((transaction) => (
              <tr key={`${transaction.type}-${transaction.id}`}>
                <td>{transaction.categoryOrSource}</td>
                <td>{transaction.description}</td>
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  +₹{transaction.amount}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}
    >
      <div>
        <h3>Recent Budget</h3>

        <table border={1} cellPadding={8} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Month</th>
              <th>Year</th>
              <th>Limit</th>
            </tr>
          </thead>

            <tbody>
              {recentBudgets.map((budget) => (
                <tr key={budget.id}>
                  <td>{budget.category}</td>
                  <td>{budget.month}</td>
                  <td>{budget.year}</td>
                  <td style={{ color: "blue", fontWeight: "bold" }}>
                    ₹{budget.monthlyLimit}
                  </td>
                </tr>
               ))}
            </tbody>
          
        </table>
      </div>

      <div>
        <h3>Recent Expenses</h3>

        <table border={1} cellPadding={8} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {recentTransactions
              .filter((transaction) => transaction.type === "Expense")
              .map((transaction) => (
                <tr key={`expense-${transaction.id}`}>
                  <td>{transaction.categoryOrSource}</td>
                  <td>{transaction.description}</td>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td style={{ color: "red", fontWeight: "bold" }}>
                    -₹{transaction.amount}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}




      <h2>Monthly Financial Overview</h2>

      {cards.length === 0 ? (
        <p>No dashboard data found for this year.</p>
      ) : (
        <div
          style={{
            display: "flex",
            gap: "18px",
            overflowX: "auto",
            paddingBottom: "20px",
          }}
        >
          {cards.map((card) => {
            const cardKey = `${card.month}-${card.year}`;
            const isExpanded = expandedCard === cardKey;
            const color = getCardColor(card.topSeverity);

            return (
              <div
                key={cardKey}
                style={{
                  minWidth: "330px",
                  border: `3px solid ${color}`,
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  backgroundColor: "#ffffff",
                }}
              >
                <h3>
                  {monthNames[card.month]} {card.year}
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <div>
                    <strong>💰 Income</strong>
                    <p>₹{card.totalIncome}</p>
                  </div>

                  <div>
                    <strong>💸 Expenses</strong>
                    <p>₹{card.totalSpent}</p>
                  </div>

                  <div>
                    <strong>🏦 Savings</strong>
                    <p>₹{card.savings}</p>
                  </div>

                  <div>
                    <strong>📈 Savings Rate</strong>
                    <p>{card.savingsRate.toFixed(1)}%</p>
                  </div>

                  <div>
                    <strong>❤️ Health</strong>
                    <p>
                      {getHealthIcon(card.healthStatus)}{" "}
                      {card.healthStatus}
                    </p>
                    <p>Score: {card.healthScore}/100</p>
                  </div>
                </div>

                <hr />

                <p style={{ color, fontWeight: "bold" }}>
                  {getSeverityIcon(card.topSeverity)}{" "}
                  {card.topSeverity}
                </p>

                <p>{card.topMessage}</p>

                {isExpanded && (
                  <div>
                    <hr />

                    <p>
                      <strong>Total Budget:</strong> ₹{card.totalBudget}
                    </p>

                    <p>
                      <strong>Budget Remaining:</strong> ₹{card.remaining}
                    </p>

                    <p>
                      <strong>Total Smart Insights:</strong>{" "}
                      {card.suggestionCount}
                    </p>

                    <button
                      onClick={() =>
                        navigate(
                          `/suggestions?month=${card.month}&year=${card.year}`
                        )
                      }
                    >
                      View Full Suggestions
                    </button>

                    <button
                      onClick={() => handleExportPdf(card.month, card.year)}
                      style={{ marginLeft: "10px" }}
                      >
                        📄 Export PDF
                    </button>
                  </div>
                )}

                <button
                  onClick={() => toggleExpand(card)}
                  style={{ marginTop: "12px", width: "100%" }}
                >
                  {isExpanded ? "▲ Hide Insights" : "▼ Show Insights"}
                </button>
              </div>
            );
          })}
        </div>
      )}


      {cards.length > 0 && <DashboardCharts cards={cards} />}
    </div>
  );
}

export default DashboardPage;