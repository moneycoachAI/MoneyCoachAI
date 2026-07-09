import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

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
        return "✔️";
      case "Warning":
        return "⚠️";
      case "Danger":
        return "🚨";
      case "Info":
        return "ℹ️";
      default:
        return "🔔";
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
        return "❔";
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

    const validTransactions = allTransactions.filter(
      (transaction) => transaction.amount > 0
    );

    const latestTransactionDate = validTransactions[0]?.date;

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

    console.log("Latest Transaction Date:", latestMonth, latestYear);

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

        const validTransactions = allTransactions.filter(
          (transaction) => transaction.amount > 0
        );

        const latestTransactionDate = validTransactions[0]?.date;

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
      } catch (error) {
        console.error(error);
        alert("Failed to load dashboard cards");
      } finally {
        setLoading(false);
      }
    };

    loadInitialDashboard();
  }, [year]);

 

  const toggleExpand = (card: MonthlyDashboardCard) => {
    const cardKey = `${card.month}-${card.year}`;
    setExpandedCard((current) => (current === cardKey ? null : cardKey));
  };

  const alertCards = cards.filter(
    (card) => card.topSeverity === "Danger" || card.topSeverity === "Warning"
  );

  const sortedCards = [...cards].sort(
    (a, b) => a.year * 100 + a.month - (b.year * 100 + b.month)
  );
  const latestCard = sortedCards[sortedCards.length - 1] ?? null;

  const sectionCardStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "18px",
    boxShadow: "0 18px 46px rgba(0, 0, 0, 0.38)",
    padding: "20px",
  } as const;

  return (
    <AppLayout>
      <div style={{ fontFamily: "Inter, Arial, sans-serif", backgroundColor: "#090b17", minHeight: "100vh", color: "#e2e8f0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", color: "#f8fafc" }}>
              MoneyCoachAI Dashboard
            </h1>
            <p style={{ margin: "6px 0 0", color: "#94a3b8" }}>
              Track income, expenses, savings, and smart alerts.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid #334155", minWidth: "110px", backgroundColor: "#020617", color: "#e2e8f0" }}
            />

            <button onClick={loadDashboardCards} style={{ padding: "10px 14px", borderRadius: "10px", border: "none", backgroundColor: "#60a5fa", color: "#fff", cursor: "pointer", boxShadow: "0 10px 20px rgba(37, 99, 235, 0.25)" }}>
              Load Year
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ ...sectionCardStyle, marginBottom: "24px", textAlign: "center" }}>
            Loading dashboard...
          </div>
        )}

        {cards.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={sectionCardStyle}>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>Income</p>
              <h3 style={{ margin: "8px 0 0", fontSize: "1.35rem", color: "#f8fafc" }}>
                ₹{latestCard?.totalIncome ?? 0}
              </h3>
            </div>

            <div style={sectionCardStyle}><p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>Expenses</p><h3 style={{ margin: "8px 0 0", fontSize: "1.35rem", color: "#f8fafc" }}>₹{latestCard?.totalSpent ?? 0}</h3>
            </div>

            <div style={sectionCardStyle}><p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>Savings</p><h3 style={{ margin: "8px 0 0", fontSize: "1.35rem", color: "#f8fafc" }}>₹{latestCard?.savings ?? 0}</h3>
            </div>

            <div style={sectionCardStyle}><p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>Savings Rate</p><h3 style={{ margin: "8px 0 0", fontSize: "1.35rem", color: "#f8fafc" }}>{latestCard ? `${latestCard.savingsRate.toFixed(1)}%` : "0.0%"}</h3>
            </div>

            <div style={sectionCardStyle}>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>Financial Health</p>
              <h3 style={{ margin: "8px 0 0", fontSize: "1.2rem", color: "#f8fafc" }}>
                {latestCard ? `${getHealthIcon(latestCard.healthStatus)} ${latestCard.healthStatus}` : "Not available"}
              </h3>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
          <section style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>Auto Alerts</h2>
            {cards.length === 0 ? (
              <p style={{ margin: 0, color: "#94a3b8" }}>No alerts available.</p>
            ) : alertCards.length === 0 ? (
              <p style={{ margin: 0, color: "#94a3b8" }}>No critical alerts. You are doing well.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px", maxHeight: "320px", overflowY: "auto", paddingRight: "6px" }}>
                {alertCards.map((card) => (
                  <div
                    key={`${card.month}-${card.year}-alert`}
                    style={{
                      borderLeft: `4px solid ${getCardColor(card.topSeverity)}`,
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "#111827",
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "4px" }}>
                      {getSeverityIcon(card.topSeverity)} {card.topSeverity} - {monthNames[card.month]} {card.year}
                    </strong>
                    <span style={{ color: "#cbd5e1" }}>{card.topMessage}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <section style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>🏆 Top Spending Category</h2>

              <div style={{ marginBottom: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <select
                  value={topCategoryMonth}
                  onChange={(e) => setTopCategoryMonth(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: "10px", border: "1px solid #334155" }}
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
                  style={{ padding: "8px 10px", borderRadius: "10px", border: "1px solid #334155", minWidth: "90px" }}
                />

                <button onClick={handleLoadTopCategory} style={{ padding: "8px 12px", borderRadius: "10px", border: "none", backgroundColor: "#f59e0b", color: "#fff", cursor: "pointer" }}>
                  🔍 View
                </button>
              </div>

              {topCategory ? (
                <div style={{ padding: "16px", borderRadius: "14px", backgroundColor: "#111827", textAlign: "center", border: "1px solid #334155" }}>
                  <h3 style={{ margin: "0 0 6px", color: "#f8fafc" }}>
                    {monthNames[Number(loadedTopCategoryMonth)]} {loadedTopCategoryYear}
                  </h3>
                  <h2 style={{ margin: "8px 0", color: "#f59e0b" }}>🏆 {topCategory.category}</h2>
                  <p style={{ margin: "6px 0", fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>
                    ₹{topCategory.totalSpent}
                  </p>
                  <p style={{ margin: "6px 0 10px", color: "#cbd5e1" }}>
                    {topCategory.percentageOfTotal.toFixed(1)}% of all spending this month
                  </p>
                  <div style={{ width: "100%", height: "10px", backgroundColor: "#1f2937", borderRadius: "999px" }}>
                    <div style={{ width: `${topCategory.percentageOfTotal}%`, height: "100%", backgroundColor: "#f59e0b", borderRadius: "999px" }} />
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: "#94a3b8" }}>No top category found for selected month.</p>
              )}
            </section>

            <section style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>📊 Monthly Comparison</h2>

              {monthlyComparison ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {[
                    {
                      label: "Income",
                      previous: monthlyComparison.previousIncome,
                      current: monthlyComparison.currentIncome,
                      trend: monthlyComparison.incomeChangePercent,
                      positive: monthlyComparison.incomeChangePercent >= 0,
                    },
                    {
                      label: "Expenses",
                      previous: monthlyComparison.previousSpent,
                      current: monthlyComparison.currentSpent,
                      trend: monthlyComparison.expenseChangePercent,
                      positive: monthlyComparison.expenseChangePercent <= 0,
                    },
                    {
                      label: "Savings",
                      previous: monthlyComparison.previousSavings,
                      current: monthlyComparison.currentSavings,
                      trend: monthlyComparison.savingsChangePercent,
                      positive: monthlyComparison.savingsChangePercent >= 0,
                    },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827", border: "1px solid #334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong>{item.label}</strong>
                        <span style={{ color: item.positive ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {item.positive ? "▲" : "▼"} {Math.abs(item.trend)}%
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                        <span>{monthNames[monthlyComparison.previousMonth]}: ₹{item.previous}</span>
                        <span>{monthNames[monthlyComparison.currentMonth]}: ₹{item.current}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: "#94a3b8" }}>No comparison data available.</p>
              )}
            </section>
          </div>
        </div>

        {aiInsights.length > 0 && (
          <section style={{ ...sectionCardStyle, marginBottom: "24px" }}>
                <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>🤖 AI Advisor Insights</h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {aiInsights.map((insight, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${getCardColor(insight.severity)}`,
                    borderRadius: "14px",
                    padding: "14px 16px",
                    backgroundColor: "#0f172a",
                  }}
                >
                  <h3 style={{ margin: "0 0 6px", color: "#f8fafc" }}>{insight.title}</h3>
                  <p style={{ margin: "0 0 6px", color: "#cbd5e1" }}>{insight.message}</p>
                  <strong style={{ color: getCardColor(insight.severity) }}>{insight.severity}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          <section style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>🎯 Goals Overview</h2>

            {financialGoals.filter((goal) => goal.progressPercentage < 100).length === 0 ? (
              <p style={{ margin: 0, color: "#94a3b8" }}>
                No active goals. Completed goals are available on the Goals page.
              </p>
            ) : (
              <div>
                {financialGoals
                  .filter((goal) => goal.progressPercentage < 100)
                  .slice(0, 3)
                  .map((goal) => (
                    <div key={goal.id} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong>🎯 {goal.name}</strong>
                        <span style={{ color: "#60a5fa", fontWeight: 600 }}>{goal.progressPercentage.toFixed(1)}%</span>
                      </div>
                        <div style={{ width: "100%", height: "10px", backgroundColor: "#1f2937", borderRadius: "999px" }}>
                          <div style={{ width: `${Math.min(goal.progressPercentage, 100)}%`, height: "100%", backgroundColor: "#60a5fa", borderRadius: "999px" }} />
                      </div>
                    </div>
                  ))}

                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button onClick={() => navigate("/financialGoals")} style={{ padding: "8px 12px", borderRadius: "10px", border: "none", backgroundColor: "#60a5fa", color: "#fff", cursor: "pointer" }}>
                    🎯 View All Goals
                  </button>
                </div>
              </div>
            )}
          </section>

          {netWorthSummary && (
            <section style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>💹 Net Worth Overview</h2>
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                  <strong>Total Assets</strong>
                  <h3 style={{ margin: "6px 0 0", color: "#22c55e" }}>₹{netWorthSummary.totalAssets}</h3>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                  <strong>Total Liabilities</strong>
                  <h3 style={{ margin: "6px 0 0", color: "#f87575" }}>₹{netWorthSummary.totalLiabilities}</h3>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                  <strong>Net Worth</strong>
                  <h3 style={{ margin: "6px 0 0", color: netWorthSummary.netWorth >= 0 ? "#22c55e" : "#f87575" }}>
                    ₹{netWorthSummary.netWorth}
                  </h3>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button onClick={() => navigate("/net-worth")} style={{ padding: "8px 12px", borderRadius: "10px", border: "none", backgroundColor: "#7c3aed", color: "#fff", cursor: "pointer" }}>
                  💹 View Net Worth
                </button>
              </div>
            </section>
          )}

          {investmentSummary && (
            <section style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>📈 Investment Overview</h2>
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                  <strong>Total Invested</strong>
                  <h3 style={{ margin: "6px 0 0", color: "#60a5fa" }}>₹{investmentSummary.totalInvested}</h3>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                  <strong>Current Value</strong>
                  <h3 style={{ margin: "6px 0 0", color: "#60a5fa" }}>₹{investmentSummary.totalCurrentValue}</h3>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                  <strong>Profit / Loss</strong>
                  <h3 style={{ margin: "6px 0 0", color: investmentSummary.totalProfitOrLoss >= 0 ? "#22c55e" : "#f87575" }}>
                    ₹{investmentSummary.totalProfitOrLoss} ({investmentSummary.profitOrLossPercentage}%)
                  </h3>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <button onClick={() => navigate("/investments")} style={{ padding: "8px 12px", borderRadius: "10px", border: "none", backgroundColor: "#16a34a", color: "#fff", cursor: "pointer" }}>
                  📈 View Investments
                </button>
              </div>
            </section>
          )}
        </div>

        <section style={{ ...sectionCardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#f8fafc" }}>Recent Financial Activity</h2>

          {recentTransactions.length === 0 ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>No recent transactions found.</p>
          ) : (
            <div style={{ display: "grid", gap: "24px" }}>
              <div style={{ display: "grid", gap: "12px" }}>
                <h3 style={{ margin: 0, color: "#f8fafc" }}>Recent Income</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  {recentIncome.map((transaction) => (
                    <div key={`income-${transaction.id}`} style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#111827" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong>{transaction.categoryOrSource}</strong>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>&#43;₹{transaction.amount}</span>
                      </div>
                      <p style={{ margin: "2px 0", color: "#cbd5e1" }}>{transaction.description}</p>
                      <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <h3 style={{ margin: 0, color: "#f8fafc" }}>Budget & Expenses</h3>

                <div style={{ display: "grid", gap: "24px" }}>
                  <div style={{ backgroundColor: "#111827", borderRadius: "14px", padding: "16px" }}>
                    <h4 style={{ margin: "0 0 12px", color: "#f8fafc" }}>Recent Budget</h4>
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" as const }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "30%" }}>Category</th>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "20%" }}>Month</th>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "20%" }}>Year</th>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "30%" }}>Limit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBudgets.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ padding: "12px 0", color: "#94a3b8", textAlign: "center" }}>
                                No budget found for recent month.
                              </td>
                            </tr>
                          ) : (
                            recentBudgets.map((budget) => (
                              <tr key={budget.id}>
                                <td style={{ padding: "10px 0", color: "#cbd5e1", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{budget.category}</td>
                                <td style={{ padding: "10px 0", color: "#cbd5e1", textAlign: "center" }}>{budget.month}</td>
                                <td style={{ padding: "10px 0", color: "#cbd5e1", textAlign: "center" }}>{budget.year}</td>
                                <td style={{ padding: "10px 0", color: "#60a5fa", textAlign: "center", fontWeight: 700 }}>₹{budget.monthlyLimit}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#111827", borderRadius: "14px", padding: "16px" }}>
                    <h4 style={{ margin: "0 0 12px", color: "#f8fafc" }}>Recent Expenses</h4>
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" as const }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "20%" }}>Category</th>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "45%" }}>Description</th>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "20%" }}>Date</th>
                            <th style={{ textAlign: "center", paddingBottom: "10px", color: "#f8fafc", width: "15%" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentExpenses.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ padding: "12px 0", color: "#94a3b8", textAlign: "center" }}>
                                No expenses found for recent month.
                              </td>
                            </tr>
                          ) : (
                            recentExpenses.map((transaction) => (
                              <tr key={`expense-${transaction.id}`}>
                                <td style={{ padding: "10px 0", color: "#cbd5e1", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{transaction.categoryOrSource}</td>
                                <td style={{ padding: "10px 0", color: "#cbd5e1", textAlign: "center", wordBreak: "break-word" }}>{transaction.description}</td>
                                <td style={{ padding: "10px 0", color: "#cbd5e1", textAlign: "center" }}>{new Date(transaction.date).toLocaleDateString()}</td>
                                <td style={{ padding: "10px 0", color: "#dc2626", textAlign: "center", fontWeight: 700 }}>-₹{transaction.amount}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section style={{ ...sectionCardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#f8fafc" }}>Monthly Financial Overview</h2>

          {cards.length === 0 ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>No dashboard data found for this year.</p>
          ) : (
            <div style={{ display: "flex", gap: "18px", overflowX: "auto", paddingBottom: "12px" }}>
              {cards.map((card) => {
                const cardKey = `${card.month}-${card.year}`;
                const isExpanded = expandedCard === cardKey;
                const color = getCardColor(card.topSeverity);

                return (
                  <div
                    key={cardKey}
                    style={{
                      minWidth: "330px",
                      border: `1px solid ${color}`,
                      borderRadius: "16px",
                      padding: "18px",
                      boxShadow: "0 18px 46px rgba(0, 0, 0, 0.35)",
                      backgroundColor: "#111827",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: "#f8fafc" }}>
                      {monthNames[card.month]} {card.year}
                    </h3>

                    <p style={{ margin: "8px 0", color: "#cbd5e1" }}><strong>💰 Income:</strong> ₹{card.totalIncome}</p>
                    <p style={{ margin: "8px 0", color: "#cbd5e1" }}><strong>💸 Expenses:</strong> ₹{card.totalSpent}</p>
                    <p style={{ margin: "8px 0", color: "#cbd5e1" }}><strong>🏦 Savings:</strong> ₹{card.savings}</p>
                    <p style={{ margin: "8px 0", color: "#cbd5e1" }}><strong>📈 Savings Rate:</strong> {card.savingsRate.toFixed(1)}%</p>
                    <p style={{ margin: "8px 0", color: "#cbd5e1" }}><strong>❤️ Health:</strong> {getHealthIcon(card.healthStatus)} {card.healthStatus}</p>

                    <hr style={{ borderColor: "#334155" }} />

                    <p style={{ color, fontWeight: 700, margin: "8px 0" }}>
                      {getSeverityIcon(card.topSeverity)} {card.topSeverity}
                    </p>
                    <p style={{ margin: "6px 0 12px", color: "#cbd5e1" }}>{card.topMessage}</p>

                    {isExpanded && (
                      <div style={{ marginTop: "10px" }}>
                          <p style={{ margin: "6px 0", color: "#cbd5e1" }}><strong>Total Budget:</strong> ₹{card.totalBudget}</p>
                          <p style={{ margin: "6px 0", color: "#cbd5e1" }}><strong>Budget Remaining:</strong> ₹{card.remaining}</p>
                        <p style={{ margin: "6px 0", color: "#cbd5e1" }}><strong>Total Smart Insights:</strong> {card.suggestionCount}</p>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                            <button
                              onClick={() => navigate(`/suggestions?month=${card.month}&year=${card.year}`)}
                              style={{ padding: "8px 10px", borderRadius: "10px", border: "none", backgroundColor: "#60a5fa", color: "#fff", cursor: "pointer" }}
                            >
                              View Full Suggestions
                            </button>

                          <button
                            onClick={() => handleExportPdf(card.month, card.year)}
                            style={{ padding: "8px 10px", borderRadius: "10px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#e2e8f0", cursor: "pointer" }}
                          >
                            📄 Export PDF
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => toggleExpand(card)}
                      style={{ marginTop: "12px", width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#e2e8f0", cursor: "pointer" }}
                    >
                      {isExpanded ? "▲ Hide Insights" : "▼ Show Insights"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {cards.length > 0 && (
          <section style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "12px", color: "#f8fafc" }}>Charts</h2>
            <DashboardCharts cards={cards} />
          </section>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
