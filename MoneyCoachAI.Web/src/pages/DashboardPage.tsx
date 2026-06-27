import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMonthlyDashboardCards,
  getTopCategory,
  getAiAdvisorInsights,
  getMonthlyComparison,
} from "../services/dashboardService";

import type { MonthlyDashboardCard } from "../types/dashboardTypes";
import DashboardCharts from "../components/DashboardCharts";

import { getExpenses } from "../services/expenseService";
import { getIncomes } from "../services/incomeService";
import type { financialActivity } from "../types/financialActivityTypes";

import { getBudgets } from "../services/budgetService";
import type { Budget } from "../types/budgetTypes";

import type { TopCategory } from "../types/topCategoryTypes";
import type { MonthlyComparison } from "../types/monthlyComparisonTypes";
import type { AiAdvisorInsight } from "../types/aiInsightTypes";

import { exportMonthlyPdf } from "../services/reportService";

import { getFinancialGoals } from "../services/financialGoalService";
import type { FinancialGoal } from "../types/financialGoalTypes";

import { getNetWorthSummary } from "../services/netWorthService";
import type { NetWorthSummary } from "../types/netWorthTypes";

import { getInvestmentSummary } from "../services/investmentService";
import type { InvestmentSummary } from "../types/investmentTypes";

function DashboardPage() {
  const navigate = useNavigate();

  const [year, setYear] = useState("2026");
  const [cards, setCards] = useState<MonthlyDashboardCard[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [recentTransactions, setRecentTransactions] = useState<financialActivity[]>([]);
  const [recentIncome, setRecentIncome] = useState<financialActivity[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<financialActivity[]>([]);
  const [recentBudgets, setRecentBudgets] = useState<Budget[]>([]);

  const [topCategory, setTopCategory] = useState<TopCategory | null>(null);
  const [topCategoryMonth, setTopCategoryMonth] = useState("");
  const [topCategoryYear, setTopCategoryYear] = useState("");
  const [loadedTopCategoryMonth, setLoadedTopCategoryMonth] = useState("");
  const [loadedTopCategoryYear, setLoadedTopCategoryYear] = useState("");

  const [monthlyComparison, setMonthlyComparison] =
    useState<MonthlyComparison | null>(null);

  const [aiInsights, setAiInsights] = useState<AiAdvisorInsight[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [netWorthSummary, setNetWorthSummary] =
    useState<NetWorthSummary | null>(null);
  const [investmentSummary, setInvestmentSummary] =
    useState<InvestmentSummary | null>(null);

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

  const loadRecentTransactions = async () => {
    const expenses = await getExpenses();
    const incomes = await getIncomes();
    const budgets = await getBudgets();

    const goalsData = await getFinancialGoals();
    setFinancialGoals(goalsData);

    const netWorthData = await getNetWorthSummary();
    setNetWorthSummary(netWorthData);

    const investmentData = await getInvestmentSummary();
    setInvestmentSummary(investmentData);

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

    const allTransactions = [...expenseTransactions, ...incomeTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestTransactionDate = allTransactions[0]?.date;

    if (!latestTransactionDate) {
      setRecentTransactions([]);
      setRecentIncome([]);
      setRecentExpenses([]);
      setRecentBudgets([]);
      setTopCategory(null);
      setMonthlyComparison(null);
      setAiInsights([]);
      return;
    }

    const latestDate = new Date(latestTransactionDate);
    const latestMonthIndex = latestDate.getMonth();
    const latestMonth = latestMonthIndex + 1;
    const latestYear = latestDate.getFullYear();

    const latestIncome = incomeTransactions
      .filter((transaction) => {
        const date = new Date(transaction.date);
        return (
          date.getMonth() === latestMonthIndex &&
          date.getFullYear() === latestYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latestExpenses = expenseTransactions
      .filter((transaction) => {
        const date = new Date(transaction.date);
        return (
          date.getMonth() === latestMonthIndex &&
          date.getFullYear() === latestYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setRecentIncome(latestIncome);
    setRecentExpenses(latestExpenses);
    setRecentTransactions([...latestIncome, ...latestExpenses]);

    setTopCategoryMonth(latestMonth.toString());
    setTopCategoryYear(latestYear.toString());
    setLoadedTopCategoryMonth(latestMonth.toString());
    setLoadedTopCategoryYear(latestYear.toString());

    const latestBudgets = budgets.filter(
      (budget) => budget.month === latestMonth && budget.year === latestYear
    );
    setRecentBudgets(latestBudgets);

    const categoryData = await getTopCategory(latestMonth, latestYear);
    setTopCategory(categoryData);

    const comparisonData = await getMonthlyComparison(latestMonth, latestYear);
    setMonthlyComparison(comparisonData);

    const insightData = await getAiAdvisorInsights(latestMonth, latestYear);
    setAiInsights(insightData);
  };

  const loadDashboardCards = async () => {
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

  const handleLoadTopCategory = async () => {
    try {
      const month = Number(topCategoryMonth);
      const selectedYear = Number(topCategoryYear);

      const data = await getTopCategory(month, selectedYear);
      setTopCategory(data);

      const comparisonData = await getMonthlyComparison(month, selectedYear);
      setMonthlyComparison(comparisonData);

      const insightData = await getAiAdvisorInsights(month, selectedYear);
      setAiInsights(insightData);

      setLoadedTopCategoryMonth(topCategoryMonth);
      setLoadedTopCategoryYear(topCategoryYear);
    } catch (error) {
      console.error(error);
      alert("Failed to load top category");
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
    setExpandedCard((current) => (current === cardKey ? null : cardKey));
  };

  const alertCards = cards.filter(
    (card) => card.topSeverity === "Danger" || card.topSeverity === "Warning"
  );

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

        <button onClick={loadDashboardCards}>Load Year</button>
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

      <h2>🏆 Top Spending Category</h2>

      <div style={{ marginBottom: "12px" }}>
        <select
          value={topCategoryMonth}
          onChange={(e) => setTopCategoryMonth(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        >
          <option value="">Select Month</option>
          {monthNames.slice(1).map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Year"
          value={topCategoryYear}
          onChange={(e) => setTopCategoryYear(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />

        <button onClick={handleLoadTopCategory}>🔍 View</button>
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

          <h2 style={{ marginTop: "15px" }}>🛒 {topCategory.category}</h2>

          <p
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#f59e0b",
            }}
          >
            ₹{topCategory.totalSpent}
          </p>

          <p>{topCategory.percentageOfTotal.toFixed(1)}% of all spending this month</p>

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

      {monthlyComparison && (
        <>
          <h2 style={{ textAlign: "center", marginTop: "30px" }}>
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
            <table style={{ width: "100%", textAlign: "center" }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>{monthNames[monthlyComparison.previousMonth]}</th>
                  <th>{monthNames[monthlyComparison.currentMonth]}</th>
                  <th>Trend</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Income</td>
                  <td>₹{monthlyComparison.previousIncome}</td>
                  <td>₹{monthlyComparison.currentIncome}</td>
                  <td
                    style={{
                      color:
                        monthlyComparison.incomeChangePercent >= 0
                          ? "green"
                          : "red",
                    }}
                  >
                    {monthlyComparison.incomeChangePercent >= 0 ? "▲ " : "▼ "}
                    {Math.abs(monthlyComparison.incomeChangePercent)}%
                  </td>
                </tr>

                <tr>
                  <td>Expenses</td>
                  <td>₹{monthlyComparison.previousSpent}</td>
                  <td>₹{monthlyComparison.currentSpent}</td>
                  <td
                    style={{
                      color:
                        monthlyComparison.expenseChangePercent <= 0
                          ? "green"
                          : "red",
                    }}
                  >
                    {monthlyComparison.expenseChangePercent <= 0 ? "▼ " : "▲ "}
                    {Math.abs(monthlyComparison.expenseChangePercent)}%
                  </td>
                </tr>

                <tr>
                  <td>Savings</td>
                  <td>₹{monthlyComparison.previousSavings}</td>
                  <td>₹{monthlyComparison.currentSavings}</td>
                  <td
                    style={{
                      color:
                        monthlyComparison.savingsChangePercent >= 0
                          ? "green"
                          : "red",
                    }}
                  >
                    {monthlyComparison.savingsChangePercent >= 0 ? "▲ " : "▼ "}
                    {Math.abs(monthlyComparison.savingsChangePercent)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

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
                  border: `2px solid ${getCardColor(insight.severity)}`,
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

      <h2 style={{ textAlign: "center", marginTop: "30px" }}>🎯 Goals Overview</h2>

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
          {financialGoals
            .filter((goal) => goal.progressPercentage < 100)
            .slice(0, 3)
            .map((goal) => (
              <div key={goal.id} style={{ marginBottom: "14px" }}>
                <strong>🎯 {goal.name}</strong>
                <span style={{ float: "right" }}>
                  {goal.progressPercentage.toFixed(1)}%
                </span>

                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "8px",
                    marginTop: "6px",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(goal.progressPercentage, 100)}%`,
                      height: "100%",
                      backgroundColor: "#2563eb",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>
            ))}

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button onClick={() => navigate("/financialGoals")}>
              🎯 View All Goals
            </button>
          </div>
        </div>
      )}

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
                <h3 style={{ color: "green" }}>₹{netWorthSummary.totalAssets}</h3>
              </div>

              <div>
                <strong>Total Liabilities</strong>
                <h3 style={{ color: "red" }}>₹{netWorthSummary.totalLiabilities}</h3>
              </div>

              <div>
                <strong>Net Worth</strong>
                <h3 style={{ color: netWorthSummary.netWorth >= 0 ? "green" : "red" }}>
                  ₹{netWorthSummary.netWorth}
                </h3>
              </div>
            </div>

            <button onClick={() => navigate("/net-worth")}>💎 View Net Worth</button>
          </div>
        </>
      )}

      {investmentSummary && (
        <>
          <h2 style={{ textAlign: "center", marginTop: "30px" }}>
            📈 Investment Overview
          </h2>

          <div
            style={{
              border: "2px solid #16a34a",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                textAlign: "center",
              }}
            >
              <div>
                <strong>Total Invested</strong>
                <h3>₹{investmentSummary.totalInvested}</h3>
              </div>

              <div>
                <strong>Current Value</strong>
                <h3>₹{investmentSummary.totalCurrentValue}</h3>
              </div>

              <div>
                <strong>Profit / Loss</strong>
                <h3
                  style={{
                    color:
                      investmentSummary.totalProfitOrLoss >= 0
                        ? "green"
                        : "red",
                  }}
                >
                  ₹{investmentSummary.totalProfitOrLoss}
                  <br />({investmentSummary.profitOrLossPercentage}%)
                </h3>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button onClick={() => navigate("/investments")}>
                📈 View Investments
              </button>
            </div>
          </div>
        </>
      )}

      {/* ----Recent Financial Activity---- */}

<h2 style={{ textAlign: "center" }}>Recent Financial Activity</h2>

{recentTransactions.length === 0 ? (
  <p style={{ textAlign: "center" }}>No recent transactions found.</p>
) : (
  <div
    style={{
      marginBottom: "30px",
      border: "1px solid #e5e7eb",
      padding: "20px 24px",
    }}
  >
    {/* Recent Income - Full Width */}
    <div style={{ marginBottom: "40px" }}>
      <h3 style={{ textAlign: "center" }}>Recent Income</h3>

      <div
        style={{
          maxHeight: "260px",
          overflowY: "auto",
          overflowX: "auto",
        }}
      >
        <table
          border={1}
          cellPadding={12}
          style={{
            width: "100%",
            textAlign: "center",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Source</th>
              <th>Description</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {recentIncome.map((transaction) => (
              <tr key={`income-${transaction.id}`}>
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
    </div>

    {/* Budget and Expenses - Side by Side */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "22px",
      }}
    >
      <div>
        <h3 style={{ textAlign: "center" }}>Recent Budget</h3>

        <div
          style={{
            maxHeight: "260px",
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <table
            border={1}
            cellPadding={12}
            style={{
              width: "100%",
              textAlign: "center",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Category</th>
                <th>Month</th>
                <th>Year</th>
                <th>Limit</th>
              </tr>
            </thead>

            <tbody>
              {recentBudgets.length === 0 ? (
                <tr>
                  <td colSpan={4}>No budget found for recent month.</td>
                </tr>
              ) : (
                recentBudgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>{budget.category}</td>
                    <td>{budget.month}</td>
                    <td>{budget.year}</td>
                    <td style={{ color: "blue", fontWeight: "bold" }}>
                      ₹{budget.monthlyLimit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 style={{ textAlign: "center" }}>Recent Expenses</h3>

        <div
          style={{
            maxHeight: "260px",
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <table
            border={1}
            cellPadding={12}
            style={{
              width: "100%",
              textAlign: "center",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {recentExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4}>No expenses found for recent month.</td>
                </tr>
              ) : (
                recentExpenses.map((transaction) => (
                  <tr key={`expense-${transaction.id}`}>
                    <td>{transaction.categoryOrSource}</td>
                    <td>{transaction.description}</td>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td style={{ color: "red", fontWeight: "bold" }}>
                      -₹{transaction.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

                <p>
                  <strong>💰 Income:</strong> ₹{card.totalIncome}
                </p>
                <p>
                  <strong>💸 Expenses:</strong> ₹{card.totalSpent}
                </p>
                <p>
                  <strong>🏦 Savings:</strong> ₹{card.savings}
                </p>
                <p>
                  <strong>📈 Savings Rate:</strong>{" "}
                  {card.savingsRate.toFixed(1)}%
                </p>
                <p>
                  <strong>❤️ Health:</strong> {getHealthIcon(card.healthStatus)}{" "}
                  {card.healthStatus}
                </p>

                <hr />

                <p style={{ color, fontWeight: "bold" }}>
                  {getSeverityIcon(card.topSeverity)} {card.topSeverity}
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
                      <strong>Total Smart Insights:</strong> {card.suggestionCount}
                    </p>

                    <button
                      onClick={() =>
                        navigate(`/suggestions?month=${card.month}&year=${card.year}`)
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