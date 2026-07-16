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

import { getProfile } from "../services/profileService";
import type { UserProfile } from "../types/profileTypes";

function DashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  

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

  const financialMotivations = [
  {
    icon: "💰📈",
    title: "Small savings today become financial freedom tomorrow.",
    description:
      "Every expense you track brings you one step closer to your financial goals.",
    footer: "Stay consistent. Stay disciplined. Grow every day.",
  },
  {
    icon: "🎯💵",
    title: "Give every rupee a purpose before you spend it.",
    description:
      "A simple monthly plan helps you control spending and protect your savings.",
    footer: "Plan first. Spend wisely. Save confidently.",
  },
  {
    icon: "🌱🏦",
    title: "Great financial futures are built through small daily habits.",
    description:
      "Tracking even your smallest transactions helps you make better decisions.",
    footer: "Small habits today create stronger finances tomorrow.",
  },
  {
    icon: "📊🚀",
    title: "You do not need to be perfect. You only need to keep improving.",
    description:
      "Review your progress regularly and adjust your budget one step at a time.",
    footer: "Progress matters more than perfection.",
  },
  {
    icon: "🛡️💎",
    title: "Saving money gives your future more choices.",
    description:
      "Build your emergency fund gradually and prepare for unexpected expenses.",
    footer: "Protect today. Prepare tomorrow. Live confidently.",
  },
];
const [motivationIndex, setMotivationIndex] = useState(0);

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
    const loadInitialDashboard = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);

        await loadDashboardCards();
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      }
    };

    const timer = window.setTimeout(() => {
      void loadInitialDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const motivationTimer = window.setInterval(() => {
      setMotivationIndex(
        (currentIndex) =>
          (currentIndex + 1) % financialMotivations.length
      );
    }, 10000);

    return () => window.clearInterval(motivationTimer);
  }, []);

  const currentMotivation = financialMotivations[motivationIndex];

  const toggleExpand = (card: MonthlyDashboardCard) => {
    const cardKey = `${card.month}-${card.year}`;
    setExpandedCard((current) => (current === cardKey ? null : cardKey));
  };

  const alertCards = cards.filter(
    (card) => card.topSeverity === "Danger" || card.topSeverity === "Warning"
  );



  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    }

    if (hour >= 12 && hour < 17) {
      return "Good Afternoon";
    }

    if (hour >= 17 && hour < 21) {
      return "Good Evening";
    }

    return "Good Night";
  };

  const greeting = getGreeting();

  const displayName = profile?.fullName?.trim() || "MoneyCoachAI User";

  const activeCards = cards.filter(
    (card) =>
      Number(card.totalIncome) > 0 ||
      Number(card.totalSpent) > 0 ||
      Number(card.totalBudget) > 0 ||
      Number(card.savings) !== 0
  );

  const latestCard = [...activeCards].sort(
    (a, b) => b.year - a.year || b.month - a.month
  )[0];

  const totalBalance = latestCard
  ? latestCard.totalIncome - latestCard.totalSpent
  : 0;

  return (
    <AppLayout>
      <style>
        {`
          .dashboard-shell {
            width: 100%;
            max-width: none;
            min-width: 0;
            margin: 0;
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

              scrollbar-width: thin;
              scrollbar-color: #da61ff9d transparent;
          }
              

          /* width */
          .scroll-box::-webkit-scrollbar {
              width: 8px;
          }

          /* default scrollbar (Auto Alerts etc.) */
          .scroll-box::-webkit-scrollbar-track {
              background: transparent;
              border-radius: 20px;
          }

          .scroll-box::-webkit-scrollbar-thumb {
              background: linear-gradient(
                  180deg,
                #8B5CF6,
                #6D28D9
            );
            border-radius: 999px;
          }

          .scroll-box::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(
                  180deg,
                #7C3AED,
                #5B21B6
              );
          }

          /* ---------- ONLY for Recent Income & Recent Expenses ---------- */

          .activity-scroll::-webkit-scrollbar-track {
              background: rgba(255,255,255,.35);
              border-radius: 999px;
          }

          .activity-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(
                  180deg,
                  #5B8CFF,
                  #7B61FF
              );
              border-radius: 999px;
          }

          .activity-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(
                  180deg,
                  #4F7CFF,
                  #6C4DFF
              );
          }

          .activity-scroll {
              scrollbar-width: thin;
              scrollbar-color: #cbaddc rgba(255,255,255,.35);
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
            max-height: 260px;
            overflow-y: auto;
            overflow-x: auto;
          }

          .budget-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          .budget-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.35);
            border-radius: 999px;
          }

          .budget-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(
              180deg,
              #8B5CF6,
              #6D28D9
            );
            border-radius: 999px;
          }

          .budget-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(
              180deg,
              #7C3AED,
              #5B21B6
            );
          }

          .budget-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbaddc rgba(255, 255, 255, 0.35);
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

          .monthly-overview-section {
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.78),
                rgba(248, 250, 255, 0.66)
              );

            overflow: hidden;
          }

          .monthly-overview-section::before,
          .monthly-overview-section::after {
            display: none;
          }

          .monthly-scroll {
            display: flex;
            gap: 18px;

            width: 100%;
            min-width: 0;

            overflow-x: auto;
            overflow-y: hidden;

            padding: 8px 0 14px;

            background: transparent;
            border: none;
            border-radius: 0;
            box-shadow: none;
            backdrop-filter: none;

            scrollbar-width: thin;
            scrollbar-color:  #7b61ff92  rgba(255,255,255,.18);
          }

          .monthly-scroll::-webkit-scrollbar {
                height: 8px;
            }

            .monthly-scroll::-webkit-scrollbar-track {
                background: rgba(255,255,255,.18);
                border-radius: 999px;
                margin: 12px;
            }

            .monthly-scroll::-webkit-scrollbar-thumb {
                border-radius: 999px;
                background: linear-gradient(
                    90deg,
                    #5B8CFF,
                    #7B61FF,
                    #9F67FF

                );

                border-radius: 2px solid rgba(255,255,255,.25);
            }

            .monthly-scroll::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(
                    90deg,
                    #4F7CFF,
                    #6C4DFF,
                    #8B5CF6
                );
            }

          .monthly-card {
            flex: 0 0 320px;
            min-width: 320px;

            padding: 20px;

            background: linear-gradient(
              135deg,
              #F3F5F7 0%,
              #ECEFF3 35%,
              #E7EBF0 70%,
              #F8F9FB 100%
            );

            border: 1px solid rgba(255,255,255,.6);

            box-shadow:
              0 12px 30px rgba(0,0,0,.06),
              inset 0 1px 0 rgba(255,255,255,.8);
          }

          .monthly-card::before,
          .monthly-card::after {
            display: none;
          }



          .recent-three-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            align-items: start;
          }

          .recent-column {
            min-width: 0;
          }

          .recent-column-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 14px;
          }

          .recent-column-head h3 {
            margin: 0;
            font-size: 17px;
            color: #111827;
          }

          .recent-count {
            min-width: 30px;
            height: 30px;
            padding: 0 9px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            font-size: 12px;
            font-weight: 800;
            color: #6c4dff;
            background: rgba(124, 92, 252, 0.12);
          }

          .recent-column .scroll-box,
          .budget-card-list {
            max-height: 330px;
            min-height: 330px;
            overflow-y: auto;
            padding-right: 5px;
          }

          .budget-card-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .budget-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px;
            min-height: 88px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.55);
            border: 1px solid rgba(255, 255, 255, 0.65);
          }

          /* Budget scrollbar */
          .budget-scroll {
            scrollbar-width: thin;
            scrollbar-color: #8b5cf6 rgba(255, 255, 255, 0.25);
          }

          .budget-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .budget-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.25);
            border-radius: 999px;
          }

          .budget-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(
              180deg,
              #8b5cf6,
              #6d28d9
            );
            border-radius: 999px;
          }

          .budget-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(
              180deg,
              #7c3aed,
              #5b21b6
            );
          }

          @media (max-width: 1180px) {
            .recent-three-grid {
              grid-template-columns: 1fr 1fr;
            }

            .recent-column:last-child {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 720px) {
            .recent-three-grid {
              grid-template-columns: 1fr;
            }

            .recent-column:last-child {
              grid-column: auto;
            }

            .recent-column .scroll-box,
            .budget-card-list {
              min-height: 0;
              max-height: 300px;
            }
          }


          .empty-dashboard{
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:center;

              padding:55px 30px;

              text-align:center;
              min-height: 330px;
          }

          .empty-icon{
              font-size:70px;
              margin-bottom:16px;
          }

          .empty-dashboard h2{
              margin:0;
              font-size:28px;
              color:#111827;
          }

          .empty-dashboard p{
              max-width:600px;
              color:#6B7280;
              line-height:1.7;
              margin-top:14px;
          }

          .empty-features{
              display:flex;
              gap:14px;
              flex-wrap:wrap;
              justify-content:center;
              margin:26px 0;
          }

          .empty-features span{
              padding:10px 18px;
              border-radius:999px;

              background:rgba(91,140,255,.08);

              color:#5B61FF;

              font-weight:700;
          }

          .alerts-ai-grid {
            align-items: stretch;
          }

          .alerts-ai-grid > .dash-card {
            height: 100%;
          }

          .alert-empty-state {
            min-height: 0;
            height: auto;
            padding: 18px 20px 22px;
          }

          .alert-empty-state .empty-icon {
            font-size: 46px;
            margin-bottom: 8px;
          }

          .alert-empty-state h2 {
            margin: 0;
            font-size: 22px;
          }

          .alert-empty-state p {
            margin: 8px 0 0;
            line-height: 1.5;
          }

          .alert-empty-state .empty-features {
            margin: 16px 0 0;
            gap: 10px;
          }

          .alert-empty-state .empty-features span {
            padding: 8px 14px;
            font-size: 13px;
          }

          .dashboard-motivation {
            position: relative;
            height: 215px;
            margin-top: 14px;
            padding: 10px 24px 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            text-align: center;
            overflow: hidden;
          }

          .motivation-slide {
            width: 100%;
            animation: motivationChange 0.65s ease;
          }

          .motivation-header {
            color: #6c4dff;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          .motivation-emoji {
            margin: 9px 0 7px;
            font-size: 38px;
            line-height: 1;
            animation: motivationFloat 2.8s ease-in-out infinite;
          }

          .dashboard-motivation h3 {
            max-width: 620px;
            margin: 0 auto;

            color: #111827;
            font-size: 22px;
            font-weight: 900;
            line-height: 1.35;
          }

          .dashboard-motivation p {
            max-width: 570px;
            margin: 10px auto 0;

            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
          }

          .motivation-footer-text {
            display: inline-block;
            margin-top: 12px;

            color: #6547f5;
            font-size: 13px;
            font-weight: 800;
          }

          .motivation-dots {
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);

            display: flex;
            align-items: center;
            gap: 6px;
          }

          .motivation-dot {
            width: 7px;
            height: 7px;
            padding: 0;

            border: none;
            border-radius: 999px;
            cursor: pointer;

            background: rgba(124, 92, 252, 0.24);
            transition: width 0.25s ease, background 0.25s ease;
          }

          .motivation-dot:hover {
            transform: none;
          }

          .motivation-dot.active {
            width: 22px;
            background: linear-gradient(
              90deg,
              #5b8cff,
              #7b61ff
            );
          }

          @keyframes motivationChange {
            from {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(3px);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes motivationFloat {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-5px);
            }
          }

          @media (max-width: 650px) {
            .dashboard-motivation {
              height: auto;
              min-height: 225px;
              padding: 14px 10px 24px;
            }

            .dashboard-motivation h3 {
              font-size: 19px;
            }

            .dashboard-motivation p {
              font-size: 13px;
            }
          }


          .dashboard-page {
            width: 100%;
            box-sizing: border-box;
            padding: 0 16px 24px;
          }

          @media (max-width: 900px) {
            .dashboard-page {
              padding: 0 10px 20px;
            }
          }

          @media (max-width: 650px) {
            .dashboard-page {
              padding: 0 6px 18px;
            }
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
            .chart-card {
              width: 100%;
              min-width: 0;
              height: auto;
              overflow: hidden;
            }

            .chart-card > div {
              width: 100%;
              min-width: 0;
            }
        `}
      </style>
      <div className="dashboard-page">

      <div className="dashboard-shell">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">{greeting}, {displayName} 👋</h1>
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
          <div className="mca-glass-card money-card mca-glow-purple">
            <div className="money-icon">💎</div>
            <div className="money-label">Total Balance</div>
            <div className="money-value">{formatMoney(totalBalance)}</div>
          </div>

          <div className="mca-glass-card money-card mca-glow-purple">
            <div className="money-icon">💰</div>
            <div className="money-label">Monthly Income</div>
            <div className="money-value">{formatMoney(latestCard?.totalIncome || 0)}</div>
          </div>

          <div className="mca-glass-card money-card mca-glow-purple">
            <div className="money-icon">💸</div>
            <div className="money-label">Monthly Expenses</div>
            <div className="money-value">{formatMoney(latestCard?.totalSpent || 0)}</div>
          </div>

          <div className="mca-glass-card money-card mca-glow-purple">
            <div className="money-icon">🏦</div>
            <div className="money-label">Monthly Savings</div>
            <div className="money-value">{formatMoney(latestCard?.savings || 0)}</div>
          </div>
        </div>

        <div className="dash-grid alerts-ai-grid">
          <div className="mca-glass-card dash-card mca-glow-red">
            <div className="dash-card-head">
              <div>
                <h2 className="mca-section-title">Auto Alerts</h2>
                <p className="mca-muted">Important budget and spending warnings.</p>
              </div>
              <span>🔔</span>
            </div>

            <div className={`insight-list ${alertCards.length > 0 ? "scroll-box" : ""}`}>
              {alertCards.length === 0 ? (
                <div className="empty-dashboard alert-empty-state">
                  <div className="empty-icon">📅</div>

                  <h2>No Financial Data Found</h2>

                  <p>
                    We couldn't find any financial records for{" "}
                    <strong>{year}</strong>.
                  </p>

                  <div className="empty-features">
                    <span>💰 Add Income</span>
                    <span>💸 Add Expenses</span>
                    <span>📊 Create Budget</span>
                  </div>
                </div>
              ) : (
                alertCards.map((card) => (
                  <div
                    key={`${card.month}-${card.year}-alert`}
                    className={`alert-item ${
                      card.topSeverity === "Danger"
                        ? "alert-danger"
                        : card.topSeverity === "Warning"
                          ? "alert-warning"
                          : card.topSeverity === "Success"
                            ? "alert-success"
                            : "alert-info"
                    }`}
                  >
                    <strong
                      className={
                        card.topSeverity === "Danger"
                          ? "alert-title-danger"
                          : card.topSeverity === "Warning"
                            ? "alert-title-warning"
                            : card.topSeverity === "Success"
                              ? "alert-title-success"
                              : "alert-title-info"
                      }
                    >
                      {getSeverityIcon(card.topSeverity)} {card.topSeverity} -{" "}
                      {monthNames[card.month]} {card.year}
                    </strong>

                    <p style={{ marginTop: 10 }}>{card.topMessage}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mca-glass-card dash-card mca-glow-purple">
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
          <div>
            <div className="mca-glass-card dash-card mca-glow-orange" style={{ minHeight: 0 }}>
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

            <div className="dashboard-motivation">
              <div
                className="motivation-slide"
                key={motivationIndex}
              >
                <div className="motivation-header">
                  💡 Daily Financial Motivation
                </div>

                <div className="motivation-emoji">
                  {currentMotivation.icon}
                </div>

                <h3>
                  “{currentMotivation.title}”
                </h3>

                <p>
                  {currentMotivation.description}
                </p>

                <div className="motivation-footer-text">
                  ⭐ {currentMotivation.footer}
                </div>
              </div>

              <div className="motivation-dots">
                {financialMotivations.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Show motivation ${index + 1}`}
                    className={`motivation-dot ${
                      index === motivationIndex ? "active" : ""
                    }`}
                    onClick={() => setMotivationIndex(index)}
                  />
                ))}
              </div>
            </div>
    
           
          </div>

          {monthlyComparison && (
            <div className="mca-glass-card dash-card mca-glow-blue">
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
          <div className="mca-glass-card dash-card mca-glow-blue">
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

          <div className="mca-glass-card dash-card mca-glow-purple">
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

          <div className="mca-glass-card dash-card mca-glow-green">
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
            
          <div className="recent-three-grid">
             {/* Recent Income */}
            <div className="recent-column">
              <div className="recent-column-head">
                <h3>Recent Income</h3>
                <span className="recent-count">{recentIncome.length}</span>
              </div>

              <div className="activity-list scroll-box activity-scroll">
                {recentIncome.length === 0 ? (
                  <p className="mca-muted">No income found for recent month.</p>
                ) : (
                  recentIncome.map((transaction) => (
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
                  ))
                )}
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="recent-column">
              <div className="recent-column-head">
                <h3>Recent Expenses</h3>
                <span className="recent-count">{recentExpenses.length}</span>
              </div>

              <div className="activity-list scroll-box activity-scroll">
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

            {/* Recent Budget */}
            <div className="recent-column">
              <div className="recent-column-head">
                <h3>Recent Budget</h3>
                <span className="recent-count">{recentBudgets.length}</span>
              </div>

              <div className="budget-card-list budget-scroll">
                {recentBudgets.length === 0 ? (
                  <p className="mca-muted">No budget found for recent month.</p>
                ) : (
                  recentBudgets.map((budget) => (
                    <div className="budget-item" key={budget.id}>
                      <div className="activity-left">
                        <div className="activity-icon">📊</div>

                        <div>
                          <strong>{budget.category}</strong>

                          <p className="mca-muted">
                            {monthNames[budget.month]} {budget.year}
                          </p>
                        </div>
                      </div>

                      <strong style={{ color: "#4F7CFF" }}>
                        {formatMoney(budget.monthlyLimit)}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          )}

          
        </div>

        <div className="mca-glass-card dash-card monthly-overview-section" style={{ marginBottom: 20 }}>
          <div className="dash-card-head">
            <div>
              <h2 className="mca-section-title">Monthly Financial Overview</h2>
              <p className="mca-muted">Monthly income, expenses, savings and smart alerts.</p>
            </div>
          </div>

          {activeCards.length === 0 ? (
            <p className="mca-muted">No dashboard data found for this year.</p>
          ) : (
            <div className="monthly-scroll">
              {activeCards.map((card) => {
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
          <div className="mca-glass-card dash-card chart-card">
            <DashboardCharts cards={cards} />
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  );
}

export default DashboardPage;