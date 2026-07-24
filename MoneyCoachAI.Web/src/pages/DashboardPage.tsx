
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

import { isFutureMonth } from "../utils/dateUtils";

function DashboardPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  

  const [year, setYear] = useState("2026");
  const [cards, setCards] = useState<MonthlyDashboardCard[]>([]);
  const [openMonthlyMenu, setOpenMonthlyMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [recentTransactions, setRecentTransactions] = useState<financialActivity[]>([]);
  const [recentIncome, setRecentIncome] = useState<financialActivity[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<financialActivity[]>([]);
  const [recentBudgets, setRecentBudgets] = useState<Budget[]>([]);

  const [allIncomeTransactions, setAllIncomeTransactions] =
    useState<financialActivity[]>([]);
  const [allExpenseTransactions, setAllExpenseTransactions] =
    useState<financialActivity[]>([]);
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);

  const [activityMonth, setActivityMonth] = useState("");
  const [activityYear, setActivityYear] = useState("");

  const [comparisonPreviousMonth, setComparisonPreviousMonth] = useState("");
  const [comparisonPreviousYear, setComparisonPreviousYear] = useState("");
  const [comparisonCurrentMonth, setComparisonCurrentMonth] = useState("");
  const [comparisonCurrentYear, setComparisonCurrentYear] = useState("");
  const [comparisonLoading, setComparisonLoading] = useState(false);

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

  const today = new Date();
  const currentMonthValue = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const toMonthInputValue = (month: string, selectedYear: string) => {
    if (!month || !selectedYear) {
      return "";
    }

    return `${selectedYear}-${month.padStart(2, "0")}`;
  };

  const updateMonthAndYear = (
    value: string,
    setMonth: (month: string) => void,
    setSelectedYear: (year: string) => void
  ) => {
    const [selectedYear, selectedMonth] = value.split("-");

    setSelectedYear(selectedYear || "");
    setMonth(selectedMonth ? String(Number(selectedMonth)) : "");
  };

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

  const calculateChangePercent = (
    previousValue: number,
    currentValue: number
  ) => {
    if (previousValue === 0) {
      return currentValue === 0 ? 0 : 100;
    }

    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  };

  const applyRecentActivityFilter = (
    month: number,
    selectedYear: number,
    incomeTransactions: financialActivity[],
    expenseTransactions: financialActivity[],
    budgets: Budget[]
  ) => {
    const selectedMonthIndex = month - 1;

    const filteredIncome = incomeTransactions
      .filter((transaction) => {
        const date = new Date(transaction.date);

        return (
          date.getMonth() === selectedMonthIndex &&
          date.getFullYear() === selectedYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredExpenses = expenseTransactions
      .filter((transaction) => {
        const date = new Date(transaction.date);

        return (
          date.getMonth() === selectedMonthIndex &&
          date.getFullYear() === selectedYear
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredBudgets = budgets.filter(
      (budget) => budget.month === month && budget.year === selectedYear
    );

    setRecentIncome(filteredIncome);
    setRecentExpenses(filteredExpenses);
    setRecentTransactions([...filteredIncome, ...filteredExpenses]);
    setRecentBudgets(filteredBudgets);
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

    setAllIncomeTransactions(incomeTransactions);
    setAllExpenseTransactions(expenseTransactions);
    setAllBudgets(budgets);

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

    setActivityMonth(latestMonth.toString());
    setActivityYear(latestYear.toString());

    applyRecentActivityFilter(
      latestMonth,
      latestYear,
      incomeTransactions,
      expenseTransactions,
      budgets
    );

    setTopCategoryMonth(latestMonth.toString());
    setTopCategoryYear(latestYear.toString());
    setLoadedTopCategoryMonth(latestMonth.toString());
    setLoadedTopCategoryYear(latestYear.toString());

    const categoryData = await getTopCategory(latestMonth, latestYear);
    setTopCategory(categoryData);

    const comparisonData = await getMonthlyComparison(latestMonth, latestYear);
    setMonthlyComparison(comparisonData);

    setComparisonPreviousMonth(comparisonData.previousMonth.toString());
    setComparisonPreviousYear(comparisonData.previousYear.toString());
    setComparisonCurrentMonth(comparisonData.currentMonth.toString());
    setComparisonCurrentYear(comparisonData.currentYear.toString());

    const insightData = await getAiAdvisorInsights(latestMonth, latestYear);
    setAiInsights(insightData);
  };

  const loadDashboardCards = async () => {
    const selectedYear = Number(year);

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > new Date().getFullYear()
    ) {
      alert("Please enter a valid year.");
      return;
    }

    try {
      setLoading(true);

      const data = await getMonthlyDashboardCards(selectedYear);

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
    const month = Number(topCategoryMonth);
    const selectedYear = Number(topCategoryYear);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      alert("Please select a valid month.");
      return;
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000
    ) {
      alert("Please enter a valid year.");
      return;
    }

    if (isFutureMonth(month, selectedYear)) {
      alert("Future months cannot be selected.");
      return;
    }

    try {
      const data = await getTopCategory(month, selectedYear);

      setTopCategory(data);

      setLoadedTopCategoryMonth(topCategoryMonth);
      setLoadedTopCategoryYear(topCategoryYear);
    } catch (error) {
      console.error(error);
      alert("Failed to load top category");
    }
  };

  const handleCompareMonths = async () => {
    const previousMonth = Number(comparisonPreviousMonth);
    const previousYear = Number(comparisonPreviousYear);
    const currentMonth = Number(comparisonCurrentMonth);
    const currentYear = Number(comparisonCurrentYear);

    if (
      !Number.isInteger(previousMonth) ||
      previousMonth < 1 ||
      previousMonth > 12 ||
      !Number.isInteger(currentMonth) ||
      currentMonth < 1 ||
      currentMonth > 12
    ) {
      alert("Please select valid comparison months.");
      return;
    }

    if (
      !Number.isInteger(previousYear) ||
      previousYear < 2000 ||
      previousYear > new Date().getFullYear() ||
      !Number.isInteger(currentYear) ||
      currentYear < 2000 ||
      currentYear > new Date().getFullYear()
    ) {
      alert("Please enter valid comparison years.");
      return;
    }

    if (
      isFutureMonth(previousMonth, previousYear) ||
      isFutureMonth(currentMonth, currentYear)
    ) {
      alert("Future months cannot be selected.");
      return;
    }

    try {
      setComparisonLoading(true);

      const [previousCards, currentCards] =
        previousYear === currentYear
          ? await getMonthlyDashboardCards(previousYear).then((data) => [
              data,
              data,
            ])
          : await Promise.all([
              getMonthlyDashboardCards(previousYear),
              getMonthlyDashboardCards(currentYear),
            ]);

      const previousCard = previousCards.find(
        (card) => card.month === previousMonth && card.year === previousYear
      );

      const currentCard = currentCards.find(
        (card) => card.month === currentMonth && card.year === currentYear
      );

      const previousIncome = Number(previousCard?.totalIncome || 0);
      const currentIncome = Number(currentCard?.totalIncome || 0);
      const previousSpent = Number(previousCard?.totalSpent || 0);
      const currentSpent = Number(currentCard?.totalSpent || 0);
      const previousSavings = Number(previousCard?.savings || 0);
      const currentSavings = Number(currentCard?.savings || 0);

      setMonthlyComparison({
        previousMonth,
        previousYear,
        currentMonth,
        currentYear,
        previousIncome,
        currentIncome,
        previousSpent,
        currentSpent,
        previousSavings,
        currentSavings,
        incomeChangePercent: calculateChangePercent(
          previousIncome,
          currentIncome
        ),
        expenseChangePercent: calculateChangePercent(
          previousSpent,
          currentSpent
        ),
        savingsChangePercent: calculateChangePercent(
          previousSavings,
          currentSavings
        ),
      });
    } catch (error) {
      console.error("Failed to compare selected months:", error);
      alert("Failed to compare selected months.");
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleLoadRecentActivity = () => {
    const month = Number(activityMonth);
    const selectedYear = Number(activityYear);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      alert("Please select a valid activity month.");
      return;
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > new Date().getFullYear()
    ) {
      alert("Please enter a valid activity year.");
      return;
    }

    if (isFutureMonth(month, selectedYear)) {
      alert("Future months cannot be selected.");
      return;
    }

    applyRecentActivityFilter(
      month,
      selectedYear,
      allIncomeTransactions,
      allExpenseTransactions,
      allBudgets
    );
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

  const selectedDashboardYear = Number(year);

  const activeCards = cards.filter(
    (card) =>
      card.year === selectedDashboardYear &&
      (
        Number(card.totalIncome) > 0 ||
        Number(card.totalSpent) > 0 ||
        Number(card.totalBudget) > 0 ||
        Number(card.savings) !== 0
      )
  );

  const latestCard = [...activeCards].sort(
    (a, b) => b.month - a.month
  )[0];

  const hasSummaryData = Boolean(latestCard);

  const totalBalance = latestCard
  ? latestCard.totalIncome - latestCard.totalSpent
  : 0;

  const incomeDifference =
    (monthlyComparison?.currentIncome ?? 0) -
    (monthlyComparison?.previousIncome ?? 0);

  const expenseDifference =
    (monthlyComparison?.currentSpent ?? 0) -
    (monthlyComparison?.previousSpent ?? 0);

  const savingsDifference =
    (monthlyComparison?.currentSavings ?? 0) -
    (monthlyComparison?.previousSavings ?? 0);

  const hasComparisonData = Boolean(
    monthlyComparison &&
      (
        monthlyComparison.previousIncome !== 0 ||
        monthlyComparison.currentIncome !== 0 ||
        monthlyComparison.previousSpent !== 0 ||
        monthlyComparison.currentSpent !== 0 ||
        monthlyComparison.previousSavings !== 0 ||
        monthlyComparison.currentSavings !== 0
      )
  );

  const activityPeriodText =
    activityMonth && activityYear
      ? `${monthNames[Number(activityMonth)]} ${activityYear}`
      : "latest month";

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
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 22px;
          }

          .money-card {
            position: relative;
            isolation: isolate;

            min-height: 150px;
            padding: 22px;

            overflow: hidden;

            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease;
          }

          .money-card::after {
            content: "";

            position: absolute;
            right: -42px;
            bottom: -54px;
            z-index: -1;

            width: 128px;
            height: 128px;

            border-radius: 42% 58% 64% 36% / 48% 36% 64% 52%;

            background:
              linear-gradient(
                145deg,
                rgba(124, 92, 252, 0.13),
                rgba(91, 140, 255, 0.04)
              );

            transform: rotate(18deg);
          }

          .money-card:hover {
            transform: translateY(-3px);

            box-shadow:
              0 18px 42px rgba(76, 29, 149, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.86);
          }

          .money-card:nth-child(2)::after {
            background:
              linear-gradient(
                145deg,
                rgba(33, 199, 122, 0.13),
                rgba(91, 140, 255, 0.04)
              );
          }

          .money-card:nth-child(3)::after {
            background:
              linear-gradient(
                145deg,
                rgba(255, 100, 103, 0.13),
                rgba(255, 181, 71, 0.05)
              );
          }

          .money-icon {
            display: grid;
            place-items: center;

            width: 46px;
            height: 46px;

            margin-bottom: 16px;

            border: 1px solid rgba(255, 255, 255, 0.82);
            border-radius: 17px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.92),
                rgba(255, 255, 255, 0.55)
              );

            box-shadow:
              0 10px 22px rgba(76, 29, 149, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.98);

            font-size: 22px;
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
            position: relative;

            padding: 14px 14px 14px 17px;

            border: 1px solid rgba(255, 255, 255, 0.68);
            border-radius: 18px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.72),
                rgba(255, 255, 255, 0.47)
              );
          }

          .soft-item::after {
            content: "";

            position: absolute;
            top: 16px;
            right: 14px;

            width: 7px;
            height: 7px;

            border-radius: 50%;

            background:
              linear-gradient(
                135deg,
                #5b8cff,
                #7b61ff
              );

            box-shadow:
              0 0 0 5px rgba(124, 92, 252, 0.08);
          }

          .activity-item {
            position: relative;

            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;

            padding: 14px 14px 14px 18px;

            border: 1px solid rgba(255, 255, 255, 0.68);
            border-radius: 18px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.72),
                rgba(255, 255, 255, 0.48)
              );

            transition:
              transform 0.18s ease,
              background 0.18s ease;
          }

          .activity-item::before {
            content: "";

            position: absolute;
            top: 14px;
            bottom: 14px;
            left: 7px;

            width: 3px;

            border-radius: 999px;

            background:
              linear-gradient(
                180deg,
                #5b8cff,
                #7b61ff
              );
          }

          .activity-item:hover {
            transform: translateX(3px);

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.86),
                rgba(255, 255, 255, 0.58)
              );
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

          .overview-card {
            position: relative;

            display: flex;
            flex-direction: column;

            min-height: 270px;

            overflow: hidden;
          }

          .overview-card::after {
            content: "";

            position: absolute;
            right: -54px;
            bottom: -72px;

            width: 168px;
            height: 168px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(124, 92, 252, 0.12),
                transparent 68%
              );

            pointer-events: none;
          }

          .overview-card-content {
            display: flex;
            flex: 1;
            flex-direction: column;
          }

          .overview-card-action {
            margin-top: auto;
            padding-top: 18px;
          }

          .overview-card-action .mca-gradient-button {
            margin-top: 0 !important;
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

            overflow: visible;
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

          .monthly-card {
            position: relative;

            min-height: 420px;

            overflow: visible;

            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease;
          }

          .monthly-card:hover {
            transform: translateY(-3px);

            box-shadow:
              0 20px 44px rgba(15, 23, 42, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.88);
          }

          .monthly-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;

            width: fit-content;

            margin: 4px 0 10px;
            padding: 6px 10px;

            border-radius: 999px;

            background: rgba(255, 255, 255, 0.66);

            font-size: 11px;
            font-weight: 900;
          }

          .monthly-card-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }

          .monthly-card-head h3 {
            margin: 0;
            padding-right: 8px;
          }

          .monthly-menu {
            position: relative;
            flex: 0 0 auto;
          }

          .monthly-menu-trigger {
            display: grid;
            place-items: center;

            width: 36px;
            height: 36px;

            padding: 0;

            border: 1px solid rgba(124, 92, 252, 0.2);
            border-radius: 12px;

            background: #ffffff;
            color: #6c4dff;

            box-shadow: 0 8px 18px rgba(76, 29, 149, 0.1);

            cursor: pointer;

            font-size: 22px;
            font-weight: 900;
            line-height: 1;
          }

          .monthly-menu-trigger:hover,
          .monthly-menu-trigger.active {
            background: #f3efff;
            border-color: rgba(124, 92, 252, 0.35);
          }

          .monthly-menu-popover {
            position: absolute;
            top: 58px;
            right: 18px;
            z-index: 100;

            display: grid;
            gap: 6px;

            width: 190px;
            padding: 8px;

            border: 1px solid rgba(124, 92, 252, 0.16);
            border-radius: 14px;

            background: #ffffff;

            box-shadow:
              0 18px 42px rgba(15, 23, 42, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.96);
          }

          .monthly-menu-popover button {
            display: flex;
            align-items: center;

            width: 100%;
            min-height: 42px;

            padding: 0 12px;

            border: 0;
            border-radius: 10px;

            background: #f8fafc;
            color: #334155;

            cursor: pointer;

            font: inherit;
            font-size: 12px;
            font-weight: 800;
            line-height: 1.2;
            text-align: left;
            white-space: nowrap;
          }

          .monthly-menu-popover button:hover {
            background: #eee9ff;
            color: #5b4df5;
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


          .alerts-ai-grid {
            align-items: stretch;
          }

          .alerts-ai-grid > .dash-card {
            height: 100%;
          }

          .alerts-ai-grid-single {
            grid-template-columns: 1fr;
          }

          .alerts-ai-grid-single > .dash-card {
            width: 100%;
          }


          .dashboard-motivation {
            position: relative;

            display: flex;
            align-items: center;
            justify-content: center;

            height: 288px;
            margin-top: 14px;
            padding: 14px 26px 20px;

            overflow: hidden;

            border: 1px solid rgba(255, 255, 255, 0.52);
            border-radius: 30px;

            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.34),
                rgba(124, 92, 252, 0.06),
                rgba(255, 181, 71, 0.05)
              );

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.72);

            text-align: center;
          }

          .dashboard-motivation::before {
            content: "✦";

            position: absolute;
            top: 16px;
            left: 18px;

            color: rgba(124, 92, 252, 0.34);

            font-size: 22px;
          }

          .dashboard-motivation::after {
            content: "✦";

            position: absolute;
            right: 22px;
            bottom: 18px;

            color: rgba(255, 181, 71, 0.38);

            font-size: 18px;
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

          .compact-section-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  min-width: 0;
}

.compact-section-head h2 {
  margin: 0;
}

.compact-section-head p {
  margin: 0;
}

.compact-month-actions {
  display: flex;
  align-items: center;
  gap: 10px;

  flex: 0 0 auto;
}

.compact-month-input {
  width: 180px;
  min-width: 0;
  height: 46px;

  padding: 0 14px;

  border: 1px solid rgba(124, 92, 252, 0.16);
  border-radius: 15px;

  background: rgba(255, 255, 255, 0.76);
  color: #1f2937;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9);

  font: inherit;
  font-size: 13px;
  font-weight: 700;

  outline: none;
}

.compact-month-input:focus {
  border-color: rgba(124, 92, 252, 0.45);

  box-shadow:
    0 0 0 4px rgba(124, 92, 252, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.compact-view-button {
  min-width: 88px;
  height: 46px;
  padding: 0 20px;

  white-space: nowrap;
}

          .section-filter-row {
            display: flex;
            align-items: end;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
          }

          .section-filter-group {
            display: grid;
            gap: 5px;
          }

          .section-filter-group label {
            color: #6b7280;
            font-size: 10px;
            font-weight: 800;
          }

          .section-filter-group .mca-soft-input {
            min-width: 104px;
          }

          .comparison-period-row {
            display: grid;
            grid-template-columns: minmax(145px, 1fr) auto minmax(145px, 1fr) auto;
            align-items: end;
            gap: 10px;

            width: 100%;
            margin-bottom: 18px;
          }

          .comparison-period-field {
            display: grid;
            gap: 6px;
          }

          .comparison-period-field label {
            color: #6b7280;
            font-size: 10px;
            font-weight: 800;
          }

          .comparison-month-input {
            width: 100%;
            min-width: 0;
            height: 46px;

            padding: 0 14px;

            border: 1px solid rgba(124, 92, 252, 0.12);
            border-radius: 15px;

            background: rgba(255, 255, 255, 0.72);
            color: #1f2937;

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.82);

            font: inherit;
            font-size: 13px;
            font-weight: 700;

            outline: none;
          }

          .comparison-month-input:focus {
            border-color: rgba(124, 92, 252, 0.42);
            box-shadow:
              0 0 0 4px rgba(124, 92, 252, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .comparison-filter-divider {
            align-self: center;
            margin-top: 17px;

            color: #8b5cf6;
            font-size: 12px;
            font-weight: 900;
          }

          .section-empty-message {
            padding: 18px;
            border: 1px dashed rgba(124, 92, 252, 0.24);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.46);
            color: #6b7280;
            line-height: 1.5;
            text-align: center;
          }

          .money-empty-text {
            margin-top: 8px;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.35;
          }

          .comparison-change {
            display: flex;
            align-items: center;
            gap: 10px;

            margin-top: 12px;

            font-size: 15px;
            font-weight: 800;

            white-space: nowrap;
          }

          .comparison-change.positive {
            color: #17b26a;
          }

          .comparison-change.negative {
            color: #ef4444;
          }

          .comparison-amount {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .comparison-divider {
            color: #9ca3af;
            font-size: 17px;
            font-weight: 700;
          }

          .comparison-percent {
            font-weight: 800;
          }

          @media (max-width: 390px) {
            .comparison-change {
              gap: 7px;
              font-size: 13px;
            }

            .comparison-divider {
              font-size: 15px;
            }
          }

          .chart-card {
            position: relative;

            overflow: hidden;

            border: 1px solid rgba(255, 255, 255, 0.9);

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.92),
                rgba(248, 250, 255, 0.86)
              );

            box-shadow:
              0 18px 44px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 1);

            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }

          .chart-card::before {
            content: "";

            position: absolute;
            top: -90px;
            right: -80px;

            width: 220px;
            height: 220px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(126, 217, 174, 0.11),
                transparent 68%
              );

            pointer-events: none;
          }

          .chart-card::after {
            content: "";

            position: absolute;
            bottom: -110px;
            left: -90px;

            width: 240px;
            height: 240px;

            border-radius: 50%;

            background:
              radial-gradient(
                circle,
                rgba(142, 120, 255, 0.09),
                transparent 68%
              );

            pointer-events: none;
          }

          .chart-card > div {
            position: relative;
            z-index: 1;
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

            .monthly-overview-section {
              padding-left: 10px;
              padding-right: 10px;
              overflow: visible;
            }

            .monthly-scroll {
              width: 100%;
              padding: 8px 0 14px;
              overflow-x: auto;
              overflow-y: visible;
              scroll-snap-type: x mandatory;
            }

            .monthly-card {
              scroll-snap-align: start;
            }

            .dash-card-head.compact-responsive-head {
  display: block;
}

.compact-section-head {
  width: 100%;
}

.compact-section-head .mca-section-title {
  font-size: 20px;
  line-height: 1.2;
}

.compact-section-head .mca-muted {
  margin-top: 7px;
  font-size: 13px;
  line-height: 1.45;
}

.compact-month-actions {
  width: 100%;
  margin-top: 14px;
}

.compact-month-input {
  flex: 1;
  width: auto;
}

.compact-view-button {
  flex: 0 0 86px;
  min-width: 86px;
  padding: 0 12px;
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

            .section-filter-row {
              width: 100%;
              justify-content: flex-start;
            }

            .section-filter-group {
              flex: 1 1 120px;
            }

            .section-filter-group .mca-soft-input {
              width: 100%;
              min-width: 0;
            }

            .comparison-period-row {
              grid-template-columns: 1fr;
              gap: 10px;
            }

            .comparison-filter-divider {
              margin: -2px 0;
              text-align: center;
            }

            .comparison-period-row .mca-gradient-button {
              width: 100%;
            }

            .top-card-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 8px;
            }

            .mini-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .mini-grid > :last-child {
              grid-column: auto;
            }

            .money-card {
              min-height: 112px;
              padding: 12px 9px;
            }

            .money-icon {
              width: 34px;
              height: 34px;
              margin-bottom: 8px;
              border-radius: 12px;
              font-size: 16px;
            }

            .money-label {
              font-size: 9px;
              line-height: 1.25;
            }

            .money-value {
              margin-top: 6px;
              font-size: 16px;
              line-height: 1.15;
              overflow-wrap: anywhere;
            }

            .overview-card {
              min-height: 230px;
            }

            .monthly-card-head {
              margin-bottom: 10px;
            }

            .monthly-menu-popover {
              position: static;

              width: 100%;
              margin: 0 0 12px;
              padding: 7px;

              border-radius: 13px;

              box-shadow:
                0 10px 24px rgba(15, 23, 42, 0.11);
            }

            .monthly-menu-popover button {
              min-height: 40px;
              justify-content: center;
              text-align: center;
            }
          }
          @media (max-width: 390px) {
            .top-card-grid {
              gap: 6px;
            }

            .money-card {
              min-height: 104px;
              padding: 10px 7px;
              border-radius: 17px;
            }

            .money-icon {
              width: 30px;
              height: 30px;
              margin-bottom: 7px;
              font-size: 14px;
            }

            .money-label {
              font-size: 8px;
            }

            .money-value {
              font-size: 14px;
            }

            .monthly-card {
  flex: 0 0 calc(100vw - 36px);
  min-width: calc(100vw - 36px);
  max-width: calc(100vw - 36px);
  padding: 18px;
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
              min={1997}
              max={new Date().getFullYear()}
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
            <div className="money-value">
              {hasSummaryData ? formatMoney(totalBalance) : "No data"}
            </div>
            {!hasSummaryData && (
              <div className="money-empty-text">
                No financial records found for {year}.
              </div>
            )}
          </div>

          <div className="mca-glass-card money-card mca-glow-purple">
            <div className="money-icon">💰</div>
            <div className="money-label">Monthly Income</div>
            <div className="money-value">
              {hasSummaryData
                ? formatMoney(latestCard?.totalIncome || 0)
                : "No data"}
            </div>
            {!hasSummaryData && (
              <div className="money-empty-text">
                Add income to view this summary. {year}
              </div>
            )}
          </div>

          <div className="mca-glass-card money-card mca-glow-purple">
            <div className="money-icon">💸</div>
            <div className="money-label">Monthly Expenses</div>
            <div className="money-value">
              {hasSummaryData
                ? formatMoney(latestCard?.totalSpent || 0)
                : "No data"}
            </div>
            {!hasSummaryData && (
              <div className="money-empty-text">
                Add expenses to view this summary. {year}
              </div>
            )}
          </div>

        </div>

        <div
          className={`dash-grid alerts-ai-grid ${
            alertCards.length === 0 ? "alerts-ai-grid-single" : ""
          }`}
        >
          {alertCards.length > 0 && (
            <div className="mca-glass-card dash-card mca-glow-red">
              <div className="dash-card-head">
                <div>
                  <h2 className="mca-section-title">Auto Alerts</h2>
                  <p className="mca-muted">
                    Important budget and spending warnings.
                  </p>
                </div>

                <span>🔔</span>
              </div>

              <div className="insight-list scroll-box">
                {alertCards.map((card) => (
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
                ))}
              </div>
            </div>
          )}

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
              <div className="dash-card-head compact-responsive-head">
                <div className="compact-section-head">
                  <h2 className="mca-section-title">Top Spending Category</h2>

                  <p className="mca-muted">
                    {loadedTopCategoryMonth
                      ? `${monthNames[Number(loadedTopCategoryMonth)]} ${loadedTopCategoryYear}`
                      : "Select a month to view your highest spending category."}
                  </p>
                </div>

                <div className="compact-month-actions">
                  <input
                    type="month"
                    className="compact-month-input"
                    value={toMonthInputValue(
                      topCategoryMonth,
                      topCategoryYear
                    )}
                    max={currentMonthValue}
                    onChange={(event) =>
                      updateMonthAndYear(
                        event.target.value,
                        setTopCategoryMonth,
                        setTopCategoryYear
                      )
                    }
                  />

                  <button
                    className="mca-gradient-button compact-view-button"
                    onClick={handleLoadTopCategory}
                  >
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
                    {monthNames[monthlyComparison.previousMonth]}{" "}
                    {monthlyComparison.previousYear} vs{" "}
                    {monthNames[monthlyComparison.currentMonth]}{" "}
                    {monthlyComparison.currentYear}
                  </p>
                </div>
              </div>

              <div className="comparison-period-row">
                <div className="comparison-period-field">
                  <label>From</label>
                  <input
                    className="comparison-month-input"
                    type="month"
                    value={toMonthInputValue(
                      comparisonPreviousMonth,
                      comparisonPreviousYear
                    )}
                    max={currentMonthValue}
                    onChange={(event) =>
                      updateMonthAndYear(
                        event.target.value,
                        setComparisonPreviousMonth,
                        setComparisonPreviousYear
                      )
                    }
                  />
                </div>

                <span className="comparison-filter-divider">vs</span>

                <div className="comparison-period-field">
                  <label>To</label>
                  <input
                    className="comparison-month-input"
                    type="month"
                    value={toMonthInputValue(
                      comparisonCurrentMonth,
                      comparisonCurrentYear
                    )}
                    max={currentMonthValue}
                    onChange={(event) =>
                      updateMonthAndYear(
                        event.target.value,
                        setComparisonCurrentMonth,
                        setComparisonCurrentYear
                      )
                    }
                  />
                </div>

                <button
                  className="mca-gradient-button"
                  onClick={handleCompareMonths}
                  disabled={comparisonLoading}
                >
                  {comparisonLoading ? "Comparing..." : "Compare"}
                </button>
              </div>

              {!hasComparisonData ? (
                <div className="section-empty-message">
                  No comparison data found for the selected months.
                </div>
              ) : (
              <div className="insight-list">
                <div className="soft-item">
                  <strong>Income</strong>
                  <p>
                    {formatMoney(monthlyComparison.previousIncome)} →{" "}
                    {formatMoney(monthlyComparison.currentIncome)}
                  </p>
                  <div
                    className={`comparison-change ${
                      incomeDifference >= 0 ? "positive" : "negative"
                    }`}
                  >
                    <span className="comparison-amount">
                      {incomeDifference >= 0 ? "▲" : "▼"}{" "}
                      {incomeDifference >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(incomeDifference))}
                    </span>

                    <span className="comparison-divider">•</span>

                    <span className="comparison-percent">
                      {monthlyComparison.incomeChangePercent >= 0 ? "+" : "-"}
                      {Math.abs(monthlyComparison.incomeChangePercent).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="soft-item">
                  <strong>Expenses</strong>
                  <p>
                    {formatMoney(monthlyComparison.previousSpent)} →{" "}
                    {formatMoney(monthlyComparison.currentSpent)}
                  </p>
                  <div
                    className={`comparison-change ${
                      expenseDifference <= 0 ? "positive" : "negative"
                    }`}
                  >
                    <span className="comparison-amount">
                      {expenseDifference >= 0 ? "▲" : "▼"}{" "}
                      {expenseDifference >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(expenseDifference))}
                    </span>

                    <span className="comparison-divider">•</span>

                    <span className="comparison-percent">
                      {monthlyComparison.expenseChangePercent >= 0 ? "+" : "-"}
                      {Math.abs(monthlyComparison.expenseChangePercent).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="soft-item">
                  <strong>Savings</strong>
                  <p>
                    {formatMoney(monthlyComparison.previousSavings)} →{" "}
                    {formatMoney(monthlyComparison.currentSavings)}
                  </p>
                  <div
                    className={`comparison-change ${
                      savingsDifference >= 0 ? "positive" : "negative"
                    }`}
                  >
                    <span className="comparison-amount">
                      {savingsDifference >= 0 ? "▲" : "▼"}{" "}
                      {savingsDifference >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(savingsDifference))}
                    </span>

                    <span className="comparison-divider">•</span>

                    <span className="comparison-percent">
                      {monthlyComparison.savingsChangePercent >= 0 ? "+" : "-"}
                      {Math.abs(monthlyComparison.savingsChangePercent).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
        

        <div className="mini-grid">
          <div className="mca-glass-card dash-card mca-glow-blue overview-card">
            <h2 className="mca-section-title">Goals Overview</h2>

            <div className="insight-list overview-card-content" style={{ marginTop: 18 }}>
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

              <div className="overview-card-action">
                <button
                  className="mca-gradient-button"
                  onClick={() => navigate("/financialGoals")}
                >
                  View Goals
                </button>
              </div>
            </div>
          </div>

          <div className="mca-glass-card dash-card mca-glow-purple overview-card">
            <h2 className="mca-section-title">Net Worth Overview</h2>

            <div className="overview-card-content">
              <h1 style={{ margin: "20px 0 10px" }}>
                {formatMoney(netWorthSummary?.netWorth || 0)}
              </h1>

              <p className="mca-muted">
                Assets: {formatMoney(netWorthSummary?.totalAssets || 0)}
              </p>

              <p className="mca-muted">
                Liabilities: {formatMoney(netWorthSummary?.totalLiabilities || 0)}
              </p>

              <div className="overview-card-action">
                <button
                  className="mca-gradient-button"
                  onClick={() => navigate("/net-worth")}
                >
                  View Net Worth
                </button>
              </div>
            </div>
          </div>

          <div className="mca-glass-card dash-card mca-glow-green overview-card">
            <h2 className="mca-section-title">Investment Overview</h2>

            <div className="overview-card-content">
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

              <div className="overview-card-action">
                <button
                  className="mca-gradient-button"
                  onClick={() => navigate("/investments")}
                >
                  View Investments
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mca-glass-card dash-card" style={{ marginBottom: 20 }}>
              <div className="dash-card-head compact-responsive-head">
        <div className="compact-section-head">
          <h2 className="mca-section-title">Monthly Financial Activity</h2>

          <p className="mca-muted">
            Income, expenses and budget records for {activityPeriodText}.
          </p>
        </div>

        <div className="compact-month-actions">
          <input
            type="month"
            className="compact-month-input"
            value={toMonthInputValue(
              activityMonth,
              activityYear
            )}
            max={currentMonthValue}
            onChange={(event) =>
              updateMonthAndYear(
                event.target.value,
                setActivityMonth,
                setActivityYear
              )
            }
          />

          <button
            className="mca-gradient-button compact-view-button"
            onClick={handleLoadRecentActivity}
          >
            View
          </button>
        </div>
      </div>

          {recentTransactions.length === 0 ? (
            <p className="mca-muted">{`No financial activity found for ${activityPeriodText}.`}</p>
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
                  <p className="mca-muted">{`No income found for ${activityPeriodText}.`}</p>
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
                  <p className="mca-muted">{`No expenses found for ${activityPeriodText}.`}</p>
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
                  <p className="mca-muted">{`No budget found for ${activityPeriodText}.`}</p>
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
                const menuOpen = openMonthlyMenu === cardKey;
                const color = getCardColor(card.topSeverity);

                return (
                  <div className="mca-glass-card monthly-card" key={cardKey}>
                    <div className="monthly-card-head">
                      <h3>
                        {monthNames[card.month]} {card.year}
                      </h3>

                      <div className="monthly-menu">
                        <button
                          type="button"
                          className={`monthly-menu-trigger ${menuOpen ? "active" : ""}`}
                          aria-label={`Open ${monthNames[card.month]} ${card.year} actions`}
                          aria-expanded={menuOpen}
                          onClick={() =>
                            setOpenMonthlyMenu((current) =>
                              current === cardKey ? null : cardKey
                            )
                          }
                        >
                          ⋮
                        </button>
                      </div>
                    </div>

                    {menuOpen && (
                      <div className="monthly-menu-popover">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMonthlyMenu(null);
                            navigate(
                              `/suggestions?month=${card.month}&year=${card.year}`
                            );
                          }}
                        >
                          View suggestions
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMonthlyMenu(null);
                            void handleExportPdf(card.month, card.year);
                          }}
                        >
                          Export PDF
                        </button>
                      </div>
                    )}

                    <p>
                      <strong>💰 Income:</strong> {formatMoney(card.totalIncome)}
                    </p>

                    <p>
                      <strong>💸 Expenses:</strong> {formatMoney(card.totalSpent)}
                    </p>

                    <p>
                      <strong>🏦 Savings:</strong> {formatMoney(card.savings)}
                    </p>

                    <p>
                      <strong>📈 Savings Rate:</strong>{" "}
                      {card.savingsRate.toFixed(1)}%
                    </p>

                    <p>
                      <strong>❤️ Health:</strong>{" "}
                      {getHealthIcon(card.healthStatus)} {card.healthStatus}
                    </p>

                    <hr />

                    <div
                      className="monthly-status-pill"
                      style={{ color }}
                    >
                      {getSeverityIcon(card.topSeverity)} {card.topSeverity}
                    </div>

                    <p>{card.topMessage}</p>
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