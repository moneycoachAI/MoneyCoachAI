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

  const formatMoney = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const getCardColor = (severity: string) => {
    switch (severity) {
      case "Success":
        return "#21C77A";
      case "Warning":
        return "#FFB547";
      case "Danger":
        return "#FF6467";
      case "Info":
        return "#4F7CFF";
      default:
        return "#6B7280";
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

  const latestCard = [...cards].sort(
    (a, b) => b.year - a.year || b.month - a.month
  )[0];

  const totalBalance = latestCard
    ? latestCard.totalIncome - latestCard.totalSpent
    : 0;

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
    const timer = window.setTimeout(() => {
      loadDashboardCards();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (card: MonthlyDashboardCard) => {
    const cardKey = `${card.month}-${card.year}`;
    setExpandedCard((current) => (current === cardKey ? null : cardKey));
  };

  const alertCards = cards.filter(
    (card) => card.topSeverity === "Danger" || card.topSeverity === "Warning"
  );

  return (
    <AppLayout>
      <style>
        {`
          .dashboard-shell {
            max-width: 1480px;
            margin: 0 auto;
          }

          .dash-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 18px;
            margin-bottom: 24px;
          }

          .dash-title {
            margin: 0;
            font-size: 34px;
            font-weight: 900;
            letter-spacing: -1px;
            color: #111827;
          }

          .dash-subtitle {
            margin-top: 8px;
            color: var(--mca-muted);
            font-size: 15px;
            font-weight: 600;
          }

          .dash-actions {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .top-card-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 22px;
          }

          .money-card {
            padding: 22px;
            min-height: 150px;
          }

          .money-icon {
            width: 46px;
            height: 46px;
            display: grid;
            place-items: center;
            border-radius: 17px;
            background: rgba(255,255,255,.68);
            font-size: 22px;
            margin-bottom: 16px;
          }

          .money-label {
            font-size: 14px;
            color: var(--mca-muted);
            font-weight: 800;
          }

          .money-value {
            margin-top: 8px;
            font-size: 28px;
            font-weight: 900;
            color: #111827;
          }

          .dash-grid {
            display: grid;
            grid-template-columns: 1.25fr .75fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .dash-card {
            padding: 22px;
          }

          .dash-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            margin-bottom: 18px;
          }

          .soft-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .insight-list,
          .activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .scroll-box {
            max-height: 330px;
            overflow-y: auto;
            padding-right: 6px;
          }

          .soft-item {
            padding: 14px;
            border-radius: 18px;
            background: rgba(255,255,255,.55);
            border: 1px solid rgba(255,255,255,.65);
          }

          .activity-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px;
            border-radius: 18px;
            background: rgba(255,255,255,.55);
            border: 1px solid rgba(255,255,255,.65);
          }

          .activity-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .activity-icon {
            width: 42px;
            height: 42px;
            border-radius: 15px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,.75);
            flex-shrink: 0;
          }

          .progress-track {
            width: 100%;
            height: 10px;
            border-radius: 999px;
            background: rgba(17,24,39,.08);
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(135deg, #5B8CFF, #7B61FF);
          }

          .mini-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 20px;
          }

          .table-card {
            overflow-x: auto;
          }

          .mca-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 520px;
          }

          .mca-table th {
            text-align: left;
            color: #6b7280;
            font-size: 13px;
            padding: 12px;
          }

          .mca-table td {
            padding: 13px 12px;
            border-top: 1px solid rgba(17,24,39,.06);
            font-weight: 600;
          }

          .monthly-scroll {
            display: flex;
            gap: 18px;
            overflow-x: auto;
            padding-bottom: 14px;
          }

          .monthly-card {
            min-width: 320px;
            padding: 20px;
          }

          @media (max-width: 1180px) {
            .top-card-grid,
            .mini-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .dash-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 650px) {
            .dash-header {
              flex-direction: column;
              align-items: flex-start;
            }

            .dash-title {
              font-size: 28px;
            }

            .dash-actions,
            .dash-actions input {
              width: 100%;
            }

            .top-card-grid,
            .mini-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="dashboard-shell">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Good Morning, Rushikesh 👋</h1>
            <p className="dash-subtitle">
              Track income, expenses, savings, budgets, alerts and smart insights.
            </p>
          </div>

          <div className="dash-actions">
            <input
              className="mca-soft-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
            />

            <button className="mca-gradient-button" onClick={loadDashboardCards}>
              {loading ? "Loading..." : "Load Year"}
            </button>
          </div>
        </div>

        <div className="top-card-grid">
          <div className="mca-glass-card money-card">
            <div className="money-icon">💎</div>
            <div className="money-label">Total Balance</div>
            <div className="money-value">{formatMoney(totalBalance)}</div>
          </div>

          <div className="mca-glass-card money-card">
            <div className="money-icon">💰</div>
            <div className="money-label">Monthly Income</div>
            <div className="money-value">{formatMoney(latestCard?.totalIncome || 0)}</div>
          </div>

          <div className="mca-glass-card money-card">
            <div className="money-icon">💸</div>
            <div className="money-label">Monthly Expenses</div>
            <div className="money-value">{formatMoney(latestCard?.totalSpent || 0)}</div>
          </div>

          <div className="mca-glass-card money-card">
            <div className="money-icon">🏦</div>
            <div className="money-label">Monthly Savings</div>
            <div className="money-value">{formatMoney(latestCard?.savings || 0)}</div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="mca-glass-card dash-card">
            <div className="dash-card-head">
              <div>
                <h2 className="mca-section-title">Auto Alerts</h2>
                <p className="mca-muted">Important budget and spending warnings.</p>
              </div>
              <span>🔔</span>
            </div>

            <div className="insight-list scroll-box">
              {cards.length === 0 ? (
                <p className="mca-muted">No alerts available.</p>
              ) : alertCards.length === 0 ? (
                <p className="mca-muted">No critical alerts. You are doing well.</p>
              ) : (
                alertCards.map((card) => (
                  <div className="soft-item" key={`${card.month}-${card.year}-alert`}>
                    <strong style={{ color: getCardColor(card.topSeverity) }}>
                      {getSeverityIcon(card.topSeverity)} {card.topSeverity} -{" "}
                      {monthNames[card.month]} {card.year}
                    </strong>
                    <p style={{ marginTop: 8 }}>{card.topMessage}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mca-glass-card dash-card">
            <div className="dash-card-head">
              <div>
                <h2 className="mca-section-title">AI Coach</h2>
                <p className="mca-muted">Latest smart insights.</p>
              </div>
              <span>🤖</span>
            </div>

            <div className="insight-list">
              {aiInsights.length === 0 ? (
                <p className="mca-muted">No AI insights available.</p>
              ) : (
                aiInsights.slice(0, 3).map((insight, index) => (
                  <div className="soft-item" key={index}>
                    <strong style={{ color: getCardColor(insight.severity) }}>
                      {getSeverityIcon(insight.severity)} {insight.title}
                    </strong>
                    <p style={{ marginTop: 8 }}>{insight.message}</p>
                    <strong style={{ display: "block", marginTop: 8 }}>
                      {insight.severity}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dash-grid">
          <div className="mca-glass-card dash-card" style={{ minHeight: 0 }}>
            <div className="dash-card-head">
              <div>
                <h2 className="mca-section-title">Top Spending Category</h2>
                <p className="mca-muted">
                  {loadedTopCategoryMonth
                    ? `${monthNames[Number(loadedTopCategoryMonth)]} ${loadedTopCategoryYear}`
                    : "Select month and year"}
                </p>
              </div>

              <div className="soft-row">
                <select
                  className="mca-soft-input"
                  value={topCategoryMonth}
                  onChange={(e) => setTopCategoryMonth(e.target.value)}
                >
                  <option value="">Month</option>
                  {monthNames.slice(1).map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>

                <input
                  className="mca-soft-input"
                  style={{ width: 110 }}
                  type="number"
                  value={topCategoryYear}
                  onChange={(e) => setTopCategoryYear(e.target.value)}
                />

                <button className="mca-gradient-button" onClick={handleLoadTopCategory}>
                  View
                </button>
              </div>
            </div>

            {topCategory ? (
              <>
                <h2 style={{ fontSize: 32, margin: "10px 0" }}>
                  🛒 {topCategory.category}
                </h2>

                <h1 style={{ color: "var(--mca-warning)", margin: "10px 0" }}>
                  {formatMoney(topCategory.totalSpent)}
                </h1>

                <p className="mca-muted">
                  {topCategory.percentageOfTotal.toFixed(1)}% of all spending this month
                </p>

                <div className="progress-track" style={{ marginTop: 18 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(topCategory.percentageOfTotal, 100)}%`,
                      background: "linear-gradient(135deg, #FFB547, #FF8A3D)",
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="mca-muted">No top category found for selected month.</p>
            )}
          </div>

          {monthlyComparison && (
            <div className="mca-glass-card dash-card">
              <div className="dash-card-head">
                <div>
                  <h2 className="mca-section-title">Monthly Comparison</h2>
                  <p className="mca-muted">
                    {monthNames[monthlyComparison.previousMonth]} vs{" "}
                    {monthNames[monthlyComparison.currentMonth]}
                  </p>
                </div>
              </div>

              <div className="insight-list">
                <div className="soft-item">
                  <strong>Income</strong>
                  <p>
                    {formatMoney(monthlyComparison.previousIncome)} →{" "}
                    {formatMoney(monthlyComparison.currentIncome)}
                  </p>
                  <strong style={{ color: monthlyComparison.incomeChangePercent >= 0 ? "#21C77A" : "#FF6467" }}>
                    {monthlyComparison.incomeChangePercent >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(monthlyComparison.incomeChangePercent)}%
                  </strong>
                </div>

                <div className="soft-item">
                  <strong>Expenses</strong>
                  <p>
                    {formatMoney(monthlyComparison.previousSpent)} →{" "}
                    {formatMoney(monthlyComparison.currentSpent)}
                  </p>
                  <strong style={{ color: monthlyComparison.expenseChangePercent <= 0 ? "#21C77A" : "#FF6467" }}>
                    {monthlyComparison.expenseChangePercent <= 0 ? "▼" : "▲"}{" "}
                    {Math.abs(monthlyComparison.expenseChangePercent)}%
                  </strong>
                </div>

                <div className="soft-item">
                  <strong>Savings</strong>
                  <p>
                    {formatMoney(monthlyComparison.previousSavings)} →{" "}
                    {formatMoney(monthlyComparison.currentSavings)}
                  </p>
                  <strong style={{ color: monthlyComparison.savingsChangePercent >= 0 ? "#21C77A" : "#FF6467" }}>
                    {monthlyComparison.savingsChangePercent >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(monthlyComparison.savingsChangePercent)}%
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mini-grid">
          <div className="mca-glass-card dash-card">
            <h2 className="mca-section-title">Goals Overview</h2>

            <div className="insight-list" style={{ marginTop: 18 }}>
              {financialGoals.filter((goal) => goal.progressPercentage < 100).length === 0 ? (
                <p className="mca-muted">No active goals.</p>
              ) : (
                financialGoals
                  .filter((goal) => goal.progressPercentage < 100)
                  .slice(0, 3)
                  .map((goal) => (
                    <div key={goal.id}>
                      <strong>🎯 {goal.name}</strong>
                      <span style={{ float: "right" }}>
                        {goal.progressPercentage.toFixed(1)}%
                      </span>
                      <div className="progress-track" style={{ marginTop: 10 }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
              )}

              <button className="mca-gradient-button" onClick={() => navigate("/financialGoals")}>
                View Goals
              </button>
            </div>
          </div>

          <div className="mca-glass-card dash-card">
            <h2 className="mca-section-title">Net Worth Overview</h2>

            <h1 style={{ margin: "20px 0 10px" }}>
              {formatMoney(netWorthSummary?.netWorth || 0)}
            </h1>

            <p className="mca-muted">Assets: {formatMoney(netWorthSummary?.totalAssets || 0)}</p>
            <p className="mca-muted">Liabilities: {formatMoney(netWorthSummary?.totalLiabilities || 0)}</p>

            <button
              className="mca-gradient-button"
              style={{ marginTop: 18 }}
              onClick={() => navigate("/net-worth")}
            >
              View Net Worth
            </button>
          </div>

          <div className="mca-glass-card dash-card">
            <h2 className="mca-section-title">Investment Overview</h2>

            <h1 style={{ margin: "20px 0 10px" }}>
              {formatMoney(investmentSummary?.totalCurrentValue || 0)}
            </h1>

            <p className="mca-muted">
              Invested: {formatMoney(investmentSummary?.totalInvested || 0)}
            </p>

            <strong
              style={{
                color:
                  (investmentSummary?.totalProfitOrLoss || 0) >= 0
                    ? "#21C77A"
                    : "#FF6467",
              }}
            >
              {formatMoney(investmentSummary?.totalProfitOrLoss || 0)} (
              {investmentSummary?.profitOrLossPercentage || 0}%)
            </strong>

            <button
              className="mca-gradient-button"
              style={{ marginTop: 18 }}
              onClick={() => navigate("/investments")}
            >
              View Investments
            </button>
          </div>
        </div>

        <div className="mca-glass-card dash-card" style={{ marginBottom: 20 }}>
          <div className="dash-card-head">
            <div>
              <h2 className="mca-section-title">Recent Financial Activity</h2>
              <p className="mca-muted">Latest income, expenses and budget records.</p>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="mca-muted">No recent transactions found.</p>
          ) : (
            <div className="dash-grid">
              <div>
                <h3>Recent Income</h3>
                <div className="activity-list scroll-box">
                  {recentIncome.map((transaction) => (
                    <div className="activity-item" key={`income-${transaction.id}`}>
                      <div className="activity-left">
                        <div className="activity-icon">💰</div>
                        <div>
                          <strong>{transaction.categoryOrSource}</strong>
                          <p className="mca-muted">
                            {transaction.description} •{" "}
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <strong style={{ color: "#21C77A" }}>
                        +{formatMoney(transaction.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3>Recent Expenses</h3>
                <div className="activity-list scroll-box">
                  {recentExpenses.length === 0 ? (
                    <p className="mca-muted">No expenses found for recent month.</p>
                  ) : (
                    recentExpenses.map((transaction) => (
                      <div className="activity-item" key={`expense-${transaction.id}`}>
                        <div className="activity-left">
                          <div className="activity-icon">💸</div>
                          <div>
                            <strong>{transaction.categoryOrSource}</strong>
                            <p className="mca-muted">
                              {transaction.description} •{" "}
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <strong style={{ color: "#FF6467" }}>
                          -{formatMoney(transaction.amount)}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <h3>Recent Budget</h3>
            <div className="table-card">
              <table className="mca-table">
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
                        <td style={{ color: "#4F7CFF", fontWeight: 900 }}>
                          {formatMoney(budget.monthlyLimit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mca-glass-card dash-card" style={{ marginBottom: 20 }}>
          <div className="dash-card-head">
            <div>
              <h2 className="mca-section-title">Monthly Financial Overview</h2>
              <p className="mca-muted">Monthly income, expenses, savings and smart alerts.</p>
            </div>
          </div>

          {cards.length === 0 ? (
            <p className="mca-muted">No dashboard data found for this year.</p>
          ) : (
            <div className="monthly-scroll">
              {cards.map((card) => {
                const cardKey = `${card.month}-${card.year}`;
                const isExpanded = expandedCard === cardKey;
                const color = getCardColor(card.topSeverity);

                return (
                  <div className="mca-glass-card monthly-card" key={cardKey}>
                    <h3>{monthNames[card.month]} {card.year}</h3>

                    <p><strong>💰 Income:</strong> {formatMoney(card.totalIncome)}</p>
                    <p><strong>💸 Expenses:</strong> {formatMoney(card.totalSpent)}</p>
                    <p><strong>🏦 Savings:</strong> {formatMoney(card.savings)}</p>
                    <p><strong>📈 Savings Rate:</strong> {card.savingsRate.toFixed(1)}%</p>
                    <p><strong>❤️ Health:</strong> {getHealthIcon(card.healthStatus)} {card.healthStatus}</p>

                    <hr />

                    <p style={{ color, fontWeight: 900 }}>
                      {getSeverityIcon(card.topSeverity)} {card.topSeverity}
                    </p>

                    <p>{card.topMessage}</p>

                    {isExpanded && (
                      <div>
                        <hr />
                        <p><strong>Total Budget:</strong> {formatMoney(card.totalBudget)}</p>
                        <p><strong>Budget Remaining:</strong> {formatMoney(card.remaining)}</p>
                        <p><strong>Total Smart Insights:</strong> {card.suggestionCount}</p>

                        <button
                          className="mca-gradient-button"
                          style={{ width: "100%", marginTop: 10 }}
                          onClick={() =>
                            navigate(`/suggestions?month=${card.month}&year=${card.year}`)
                          }
                        >
                          View Suggestions
                        </button>

                        <button
                          className="mca-gradient-button"
                          style={{ width: "100%", marginTop: 10 }}
                          onClick={() => handleExportPdf(card.month, card.year)}
                        >
                          Export PDF
                        </button>
                      </div>
                    )}

                    <button
                      className="mca-gradient-button"
                      style={{ width: "100%", marginTop: 12 }}
                      onClick={() => toggleExpand(card)}
                    >
                      {isExpanded ? "Hide Details" : "Show Details"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cards.length > 0 && (
          <div className="mca-glass-card dash-card">
            <DashboardCharts cards={cards} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;