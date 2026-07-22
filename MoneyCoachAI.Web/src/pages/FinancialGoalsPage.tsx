import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/AppLayout";

import {
  addGoalProgress,
  createFinancialGoal,
  deleteFinancialGoal,
  getFinancialGoals,
  getGoalRecommendations,
} from "../services/financialGoalService";

import type { FinancialGoal } from "../types/financialGoalTypes";
import type { GoalRecommendation } from "../types/goalRecommendationTypes";

import {
  getTodayDateInputValue,
} from "../utils/dateUtils";

function FinancialGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [recommendations, setRecommendations] = useState<
    GoalRecommendation[]
  >([]);


  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const today = getTodayDateInputValue();

  const [progressAmounts, setProgressAmounts] = useState<
    Record<string, string>
  >({});

  const [expandedHistory, setExpandedHistory] = useState<
    Record<string, boolean>
  >({});

  const [openActionMenuId, setOpenActionMenuId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [progressLoadingId, setProgressLoadingId] =
    useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] =
    useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Completed"
  >("All");

  const loadGoals = async () => {
    try {
      const [goalData, recommendationData] = await Promise.all([
        getFinancialGoals(),
        getGoalRecommendations(),
      ]);

      setGoals(goalData);
      setRecommendations(recommendationData);
    } catch (error) {
      console.error("Failed to load financial goals:", error);
      alert("Failed to load financial goals");
    }
  };

  useEffect(() => {
    const loadInitialGoals = async () => {
      try {
        const [goalData, recommendationData] = await Promise.all([
          getFinancialGoals(),
          getGoalRecommendations(),
        ]);

        setGoals(goalData);
        setRecommendations(recommendationData);
      } catch (error) {
        console.error("Failed to load financial goals:", error);
        alert("Failed to load financial goals");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void loadInitialGoals();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const resetGoalForm = () => {
    setName("");
    setTargetAmount("");
    setTargetDate("");
  };

  const handleCreateGoal = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("Please enter a goal name");
      return;
    }

    if (!targetAmount || Number(targetAmount) <= 0) {
      alert("Please enter a valid target amount");
      return;
    }

    if (targetDate && targetDate < today) {
      alert("Goal target date cannot be in the past.");
      return;
    }

    try {
      setCreatingGoal(true);

      await createFinancialGoal({
        name: name.trim(),
        targetAmount: Number(targetAmount),
        targetDate: targetDate || undefined,
      });

      resetGoalForm();
      await loadGoals();

      alert("Financial goal created successfully");
    } catch (error) {
      console.error("Failed to create financial goal:", error);
      alert("Failed to create financial goal");
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleAddProgress = async (goalId: string) => {
    const amount = Number(progressAmounts[goalId]);

    if (!amount || amount <= 0) {
      alert("Please enter a valid progress amount");
      return;
    }

    try {
      setProgressLoadingId(goalId);

      await addGoalProgress(goalId, amount);

      setProgressAmounts((currentAmounts) => ({
        ...currentAmounts,
        [goalId]: "",
      }));

      await loadGoals();

      alert("Goal progress added successfully");
    } catch (error) {
      console.error("Failed to add goal progress:", error);
      alert("Failed to add goal progress");
    } finally {
      setProgressLoadingId(null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this financial goal?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingGoalId(goalId);
      setOpenActionMenuId(null);

      await deleteFinancialGoal(goalId);

      setGoals((currentGoals) =>
        currentGoals.filter((goal) => goal.id !== goalId)
      );

      setRecommendations((currentRecommendations) =>
        currentRecommendations.filter((recommendation) => {
          const deletedGoal = goals.find(
            (goal) => goal.id === goalId
          );

          return recommendation.goalName !== deletedGoal?.name;
        })
      );

      alert("Financial goal deleted successfully");
    } catch (error) {
      console.error("Failed to delete financial goal:", error);
      alert("Failed to delete financial goal");
    } finally {
      setDeletingGoalId(null);
    }
  };

  const toggleHistory = (goalId: string) => {
    setExpandedHistory((currentHistory) => ({
      ...currentHistory,
      [goalId]: !currentHistory[goalId],
    }));

    setOpenActionMenuId(null);
  };

  const filteredGoals = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return goals
      .filter((goal) => {
        const matchesSearch =
          !normalizedSearch ||
          goal.name.toLowerCase().includes(normalizedSearch) ||
          goal.targetAmount
            .toString()
            .includes(normalizedSearch) ||
          goal.currentAmount
            .toString()
            .includes(normalizedSearch);

        const completed = goal.progressPercentage >= 100;

        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Completed" && completed) ||
          (statusFilter === "Active" && !completed);

        return matchesSearch && matchesStatus;
      })
      .sort((firstGoal, secondGoal) => {
        const firstCompleted =
          firstGoal.progressPercentage >= 100;
        const secondCompleted =
          secondGoal.progressPercentage >= 100;

        if (firstCompleted !== secondCompleted) {
          return firstCompleted ? 1 : -1;
        }

        return (
          secondGoal.progressPercentage -
          firstGoal.progressPercentage
        );
      });
  }, [goals, searchText, statusFilter]);

  const totalTarget = goals.reduce(
    (total, goal) =>
      total + Number(goal.targetAmount || 0),
    0
  );

  const totalSaved = goals.reduce(
    (total, goal) =>
      total + Number(goal.currentAmount || 0),
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.progressPercentage >= 100
  ).length;

  const formatMoney = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDate = (value?: string) => {
    if (!value) {
      return "No target date";
    }

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) {
      return "#21C77A";
    }

    if (progress >= 80) {
      return "#4F7CFF";
    }

    if (progress >= 50) {
      return "#FFB547";
    }

    return "#FF6467";
  };

  const getGoalStatus = (progress: number) => {
    if (progress >= 100) {
      return {
        label: "Goal Achieved",
        icon: "🏆",
        className: "goal-status-completed",
      };
    }

    if (progress >= 80) {
      return {
        label: "Almost There",
        icon: "🚀",
        className: "goal-status-near",
      };
    }

    return {
      label: "In Progress",
      icon: "🎯",
      className: "goal-status-active",
    };
  };

  const getGoalIcon = (goalName: string) => {
    const normalizedName = goalName.toLowerCase();

    if (
      normalizedName.includes("house") ||
      normalizedName.includes("home")
    ) {
      return "🏠";
    }

    if (
      normalizedName.includes("car") ||
      normalizedName.includes("vehicle")
    ) {
      return "🚗";
    }

    if (
      normalizedName.includes("travel") ||
      normalizedName.includes("vacation") ||
      normalizedName.includes("trip")
    ) {
      return "✈️";
    }

    if (
      normalizedName.includes("education") ||
      normalizedName.includes("study") ||
      normalizedName.includes("college")
    ) {
      return "🎓";
    }

    if (
      normalizedName.includes("emergency")
    ) {
      return "🛡️";
    }

    if (
      normalizedName.includes("wedding")
    ) {
      return "💍";
    }

    if (
      normalizedName.includes("business")
    ) {
      return "💼";
    }

    return "🎯";
  };

  const getRemainingAmount = (goal: FinancialGoal) =>
    Math.max(
      Number(goal.targetAmount || 0) -
        Number(goal.currentAmount || 0),
      0
    );

  return (
    <AppLayout>
      <style>
        {`
          .goals-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            margin: 0;
            padding: 1%;

            box-sizing: border-box;
            background: transparent;
            overflow-x: hidden;
          }

          .goals-page-header {
            width: 100%;
            margin-bottom: 22px;
          }

          .goals-page-title {
            margin: 0;

            color: #111827;

            font-size: clamp(30px, 4vw, 42px);
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -0.8px;
          }

          .goals-page-subtitle {
            margin: 10px 0 0;

            color: var(--mca-muted);

            font-size: 15px;
            line-height: 1.6;
          }

          /* =========================
             Summary
          ========================= */

          .goals-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));

            gap: 18px;
            margin-bottom: 26px;
          }

          .goals-summary-card {
            min-width: 0;
            padding: 20px;
          }

          .goals-summary-icon {
            width: 46px;
            height: 46px;

            display: grid;
            place-items: center;

            margin-bottom: 14px;

            border-radius: 16px;

            font-size: 21px;

            background: rgba(255, 255, 255, 0.68);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 8px 20px rgba(49, 66, 104, 0.07);
          }

          .goals-summary-label {
            color: var(--mca-muted);

            font-size: 13px;
            font-weight: 800;
          }

          .goals-summary-value {
            margin-top: 8px;

            color: #111827;

            font-size: 26px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          /* =========================
             Shared headers
          ========================= */

          .goals-section-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 14px;
            margin-bottom: 20px;
          }

          .goals-section-header h2 {
            margin: 0;

            color: #111827;

            font-size: 19px;
            font-weight: 900;
          }

          .goals-section-header p {
            margin: 7px 0 0;

            color: var(--mca-muted);

            font-size: 15px;
            line-height: 1;
          }

          /* =========================
             Create form
          ========================= */

          .goal-form-section {
            width: 100%;
            min-width: 0;

            margin-bottom: 28px;
            padding: 6px 2px 22px;

            border-bottom:
              1px solid rgba(17, 24, 39, 0.08);
          }

          .goal-inline-form {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(220px, 1.3fr)
              minmax(180px, 0.85fr)
              minmax(180px, 0.85fr)
              auto;

            gap: 14px;
            align-items: end;
          }

          .goal-field {
            min-width: 0;

            display: flex;
            flex-direction: column;

            gap: 7px;
          }

          .goal-field label {
            color: #374151;

            font-size: 13px;
            font-weight: 800;
          }

          .goal-input {
            width: 100%;
            min-width: 0;

            padding: 13px 14px;

            border:
              1px solid rgba(255, 255, 255, 0.72);

            border-radius: 15px;

            outline: none;

            color: #111827;
            background: rgba(255, 255, 255, 0.62);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.9);

            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .goal-input:focus {
            border-color: rgba(79, 124, 255, 0.58);

            box-shadow:
              0 0 0 4px rgba(79, 124, 255, 0.11);
          }

          .goal-create-button {
            min-height: 46px;
            white-space: nowrap;
          }

          /* =========================
             Goal list
          ========================= */

          .goals-overview-section {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            padding: 22px;

            border:
              1px solid rgba(255, 255, 255, 0.7);

            border-radius: 24px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.76),
                rgba(248, 250, 255, 0.64)
              );

            box-shadow:
              0 12px 32px rgba(49, 66, 104, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .goals-toolbar {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              minmax(170px, 0.35fr);

            gap: 12px;
            margin-bottom: 18px;
          }

          .goals-list {
            max-height: 760px;

            display: flex;
            flex-direction: column;

            gap: 16px;
            overflow-y: auto;

            padding-right: 5px;

            scrollbar-width: thin;
            scrollbar-color: #bda8ec transparent;
          }

          .goals-list::-webkit-scrollbar {
            width: 7px;
          }

          .goals-list::-webkit-scrollbar-track {
            background: transparent;
          }

          .goals-list::-webkit-scrollbar-thumb {
            border-radius: 999px;

            background:
              linear-gradient(
                180deg,
                #a98bf2,
                #7c5cfc
              );
          }

          .goal-card {
            position: relative;

            width: 100%;
            min-width: 0;

            padding: 20px;

            border:
              1px solid rgba(255, 255, 255, 0.76);

            border-radius: 22px;

            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.72),
                rgba(247, 249, 255, 0.57)
              );

            box-shadow:
              0 10px 26px rgba(49, 66, 104, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);

            overflow: visible;
          }

          .goal-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 16px;
          }

          .goal-title-area {
            min-width: 0;

            display: flex;
            align-items: flex-start;

            gap: 13px;
          }

          .goal-icon {
            width: 48px;
            height: 48px;

            flex-shrink: 0;

            display: grid;
            place-items: center;

            border-radius: 16px;

            font-size: 22px;

            background: rgba(255, 255, 255, 0.72);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 8px 18px rgba(49, 66, 104, 0.06);
          }

          .goal-title {
            margin: 1px 0 5px;

            color: #111827;

            font-size: 20px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          .goal-created-date {
            margin: 0;
            color: var(--mca-muted);
            font-size: 12px;
            font-weight: 700;
          }

          .goal-status {
            flex-shrink: 0;

            display: inline-flex;
            align-items: center;

            gap: 6px;

            padding: 7px 11px;

            border-radius: 999px;

            font-size: 12px;
            font-weight: 900;
          }

          .goal-status-active {
            color: #a15c00;
            background: rgba(255, 181, 71, 0.15);
          }

          .goal-status-near {
            color: #315fd6;
            background: rgba(79, 124, 255, 0.13);
          }

          .goal-status-completed {
            color: #168d59;
            background: rgba(33, 199, 122, 0.14);
          }

          .goal-amount-row {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;

            gap: 14px;
            margin-top: 20px;
          }

          .goal-saved-label {
            color: var(--mca-muted);

            font-size: 12px;
            font-weight: 800;
          }

          .goal-saved-value {
            margin-top: 4px;

            color: #111827;

            font-size: 21px;
            font-weight: 900;
          }

          .goal-target-value {
            color: var(--mca-muted);

            font-size: 13px;
            font-weight: 700;

            text-align: right;
          }

          .goal-progress-percent {
            color: #111827;

            font-size: 18px;
            font-weight: 900;
          }

          .goal-progress-track {
            width: 100%;
            height: 11px;

            margin-top: 12px;

            overflow: hidden;

            border-radius: 999px;

            background: rgba(17, 24, 39, 0.08);
          }

          .goal-progress-fill {
            height: 100%;

            border-radius: 999px;

            transition: width 0.35s ease;
          }

          .goal-stat-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));

            gap: 10px;
            margin-top: 15px;
          }

          .goal-stat {
            min-width: 0;

            padding: 11px 12px;

            border-radius: 15px;

            background: rgba(255, 255, 255, 0.47);

            border:
              1px solid rgba(255, 255, 255, 0.68);
          }

          .goal-stat span {
            display: block;

            color: var(--mca-muted);

            font-size: 11px;
            font-weight: 800;
          }

          .goal-stat strong {
            display: block;

            margin-top: 5px;

            color: #111827;

            font-size: 14px;

            overflow-wrap: anywhere;
          }

          /* =========================
             Recommendation
          ========================= */

          .goal-recommendation {
            margin-top: 18px;
            padding: 18px;

            border: 1px solid rgba(255, 181, 71, 0.55);
            border-radius: 18px;

            background:
              linear-gradient(
                135deg,
                rgba(255, 247, 224, 0.96),
                rgba(255, 255, 255, 0.82)
              );

            box-shadow:
              0 10px 24px rgba(245, 166, 35, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
          }

          .goal-recommendation-title {
            margin: 0 0 10px;

            color: #9a5700;

            font-size: 16px;
            font-weight: 900;
          }

          .goal-recommendation-message {
            margin: 0;

            color: #374151;

            font-size: 14px;
            font-weight: 600;
            line-height: 1.65;
          }

          .goal-recommendation-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));

            gap: 10px;
            margin-top: 15px;
          }

          .goal-recommendation-stat {
            min-width: 0;

            padding: 13px 14px;

            border: 1px solid rgba(255, 181, 71, 0.2);
            border-radius: 14px;

            background: rgba(255, 255, 255, 0.78);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 5px 14px rgba(49, 66, 104, 0.05);
          }

          .goal-recommendation-stat span {
            display: block;

            color: #7c5a24;

            font-size: 11px;
            font-weight: 900;
            line-height: 1.3;
          }

          .goal-recommendation-stat strong {
            display: block;

            margin-top: 7px;

            color: #111827;

            font-size: 15px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          .goal-extra-saving {
            color: #e5444a !important;
          }
          /* =========================
             Add progress
          ========================= */

          .goal-actions-row {
            display: flex;
            align-items: center;

            gap: 10px;
            margin-top: 16px;
          }

          .goal-progress-input {
            flex: 1;
            min-width: 0;
          }

          .goal-progress-button {
            min-height: 44px;
            white-space: nowrap;
          }

          .goal-secondary-button,
          .goal-delete-button {
            min-height: 44px;

            padding: 10px 14px;

            border: none;
            border-radius: 14px;

            font-size: 12px;
            font-weight: 800;

            cursor: pointer;
          }

          .goal-secondary-button {
            color: #5e42db;
            background: rgba(124, 92, 252, 0.12);
          }

          .goal-delete-button {
            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                #ff6467,
                #e5444a
              );
          }

          .goal-secondary-button:disabled,
          .goal-delete-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* =========================
             History
          ========================= */

          .goal-history {
            margin-top: 14px;
            padding: 14px;

            border-radius: 16px;

            background: rgba(255, 255, 255, 0.52);

            border:
              1px solid rgba(255, 255, 255, 0.7);
          }

          .goal-history-title {
            margin: 0 0 10px;

            color: #111827;

            font-size: 14px;
            font-weight: 900;
          }

          .goal-history-list {
            max-height: 190px;

            display: flex;
            flex-direction: column;

            overflow-y: auto;

            padding-right: 4px;
          }

          .goal-history-item {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 12px;

            padding: 9px 2px;

            border-bottom:
              1px solid rgba(17, 24, 39, 0.06);
          }

          .goal-history-item:last-child {
            border-bottom: none;
          }

          .goal-history-amount {
            color: #21a769;
            font-weight: 900;
          }

          .goal-history-date {
            color: var(--mca-muted);

            font-size: 12px;
            font-weight: 700;
          }

          .goal-mobile-menu {
            display: none;
          }

          /* =========================
             Loading and empty
          ========================= */

          .goals-loading {
            min-height: 340px;

            display: grid;
            place-items: center;

            color: var(--mca-muted);
            font-weight: 800;
          }

          .goals-empty-state {
            min-height: 300px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            padding: 30px;

            text-align: center;
          }

          .goals-empty-icon {
            width: 82px;
            height: 82px;

            display: grid;
            place-items: center;

            border-radius: 27px;

            font-size: 39px;

            background:
              radial-gradient(
                circle,
                rgba(79, 124, 255, 0.17),
                rgba(124, 92, 252, 0.09)
              );
          }

          .goals-empty-state h3 {
            margin: 18px 0 7px;

            color: #111827;

            font-size: 22px;
            font-weight: 900;
          }

          .goals-empty-state p {
            margin: 0;

            color: var(--mca-muted);

            font-size: 14px;
          }

          /* =========================
             Tablet
          ========================= */

          @media (max-width: 1120px) {
            .goals-summary-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .goal-inline-form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .goal-recommendation-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 820px) {
            .goals-toolbar {
              grid-template-columns: 1fr;
            }

            .goal-actions-row {
              flex-wrap: wrap;
            }

            .goal-progress-input {
              flex: 1 1 100%;
            }
          }

          /* =========================
             Mobile
          ========================= */

          @media (max-width: 650px) {
            .goals-page {
              width: 100%;
              max-width: 100%;
              min-width: 0;

              margin: 0;
              padding: 0 6px;

              box-sizing: border-box;
              overflow-x: hidden;
            }

            .goals-page-header {
              padding: 0 6px;
              margin-bottom: 18px;
            }

            .goals-summary-grid {
              width: 100%;

              grid-template-columns:
                repeat(4, minmax(0, 1fr));

              gap: 6px;
              margin-bottom: 18px;
            }

            .goals-summary-card {
              min-width: 0;

              padding: 10px 6px;

              border-radius: 16px;
            }

            .goals-summary-icon {
              width: 30px;
              height: 30px;

              margin-bottom: 7px;

              border-radius: 10px;
              font-size: 14px;
            }

            .goals-summary-label {
              font-size: 8px;
              line-height: 1.25;
            }

            .goals-summary-value {
              margin-top: 5px;

              font-size: 12px;
              line-height: 1.2;
            }

            .goal-form-section {
              width: 100%;
              max-width: 100%;

              padding: 4px 0 20px;
            }

            .goal-inline-form {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 12px;
            }

            .goal-field,
            .goal-input {
              width: 100%;
              max-width: 100%;
              min-width: 0;
            }

            .goal-create-button {
              width: 100%;
            }

            .goals-overview-section {
              width: 100%;
              max-width: 100%;

              padding: 16px 10px;

              border-radius: 20px;
            }

            .goals-toolbar {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 10px;
            }

            .goals-list {
              max-height: 650px;
            }

            .goal-card {
              padding: 14px;

              border-radius: 18px;
            }

            .goal-card-top {
              padding-right: 36px;
            }

            .goal-icon {
              width: 40px;
              height: 40px;

              border-radius: 13px;
              font-size: 18px;
            }

            .goal-title {
              font-size: 17px;
            }

            .goal-status {
              display: none;
            }

            .goal-amount-row {
              margin-top: 15px;
            }

            .goal-saved-value {
              font-size: 17px;
            }

            .goal-progress-percent {
              font-size: 16px;
            }

            .goal-stat-grid {
              grid-template-columns:
                repeat(3, minmax(0, 1fr));

              gap: 6px;
            }

            .goal-stat {
              padding: 8px 7px;
            }

            .goal-stat span {
              font-size: 8px;
            }

            .goal-stat strong {
              font-size: 11px;
            }

            .goal-recommendation {
              padding: 12px;
            }

            .goal-recommendation-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));

              gap: 7px;
            }

            .goal-recommendation-stat {
              padding: 8px;
            }

            .goal-recommendation-stat span {
              font-size: 9px;
            }

            .goal-recommendation-stat strong {
              font-size: 11px;
            }

            .goal-actions-row {
              display: grid;
              grid-template-columns:
                minmax(0, 1fr)
                auto;

              gap: 8px;
            }

            .goal-progress-input {
              width: 100%;
              grid-column: 1;
              grid-row: 1;
            }

            .goal-progress-button {
              grid-column: 2;
              grid-row: 1;

              padding-left: 12px;
              padding-right: 12px;
            }

            .goal-secondary-button,
            .goal-delete-button {
              display: none;
            }

            .goal-mobile-menu {
              position: absolute;
              top: 12px;
              right: 10px;

              display: block;
            }

            .goal-menu-trigger {
              width: 32px;
              height: 32px;
              padding: 0;

              display: grid;
              place-items: center;

              border: none;
              border-radius: 11px;

              color: #6c4dff;
              background: rgba(124, 92, 252, 0.12);

              font-size: 22px;
              font-weight: 900;
              line-height: 1;

              cursor: pointer;
            }

            .goal-menu-trigger:hover {
              transform: none;

              background: rgba(124, 92, 252, 0.2);
            }

            .goal-menu-dropdown {
              position: absolute;
              top: 36px;
              right: 0;
              z-index: 40;

              min-width: 155px;
              padding: 6px;

              border:
                1px solid rgba(255, 255, 255, 0.85);

              border-radius: 14px;

              background: rgba(255, 255, 255, 0.97);

              box-shadow:
                0 14px 32px rgba(17, 24, 39, 0.17);

              backdrop-filter: blur(18px);
            }

            .goal-menu-dropdown button {
              width: 100%;

              padding: 9px 10px;

              border: none;
              border-radius: 9px;

              text-align: left;

              color: #374151;
              background: transparent;

              font-size: 12px;
              font-weight: 800;

              cursor: pointer;
            }

            .goal-menu-dropdown button:hover {
              transform: none;

              background: rgba(124, 92, 252, 0.09);
            }

            .goal-menu-dropdown .goal-menu-delete {
              color: #e5444a;
            }

            .goal-history {
              padding: 11px;
            }

            .goals-empty-state {
              min-height: 240px;
              padding: 20px 10px;
            }
          }

          @media (max-width: 390px) {
            .goals-summary-grid {
              gap: 4px;
            }

            .goals-summary-card {
              padding: 9px 5px;
            }

            .goals-summary-value {
              font-size: 11px;
            }

            .goal-recommendation-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="goals-page">
        <header className="goals-page-header">
          <h1 className="goals-page-title">
            🎯 Financial Goals
          </h1>

          <p className="goals-page-subtitle">
            Build better saving habits and track progress
            toward the goals that matter most.
          </p>
        </header>

        <section className="goals-summary-grid">
          <div className="mca-glass-card goals-summary-card mca-glow-blue">
            <div className="goals-summary-icon">
              🎯
            </div>

            <div className="goals-summary-label">
              Total Goals
            </div>

            <div className="goals-summary-value">
              {goals.length}
            </div>
          </div>

          <div className="mca-glass-card goals-summary-card mca-glow-purple">
            <div className="goals-summary-icon">
              💰
            </div>

            <div className="goals-summary-label">
              Total Target
            </div>

            <div className="goals-summary-value">
              {formatMoney(totalTarget)}
            </div>
          </div>

          <div className="mca-glass-card goals-summary-card mca-glow-green">
            <div className="goals-summary-icon">
              🏦
            </div>

            <div className="goals-summary-label">
              Total Saved
            </div>

            <div className="goals-summary-value">
              {formatMoney(totalSaved)}
            </div>
          </div>

          <div className="mca-glass-card goals-summary-card mca-glow-orange">
            <div className="goals-summary-icon">
              🏆
            </div>

            <div className="goals-summary-label">
              Completed
            </div>

            <div className="goals-summary-value">
              {completedGoals}
            </div>
          </div>
        </section>

        <section className="goal-form-section">
          <div className="goals-section-header">
            <div>
              <h2>Create New Goal</h2>

              <p>
                Add a target amount and optional completion
                date.
              </p>
            </div>
          </div>

          <form
            className="goal-inline-form"
            onSubmit={handleCreateGoal}
          >
            <div className="goal-field">
              <label htmlFor="goal-name">
                Goal Name
              </label>

              <input
                id="goal-name"
                className="goal-input"
                type="text"
                placeholder="Example: Emergency fund"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </div>

            <div className="goal-field">
              <label htmlFor="goal-target">
                Target Amount
              </label>

              <input
                id="goal-target"
                className="goal-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter target"
                value={targetAmount}
                onChange={(event) =>
                  setTargetAmount(event.target.value)
                }
                required
              />
            </div>

            <div className="goal-field">
              <label htmlFor="goal-date">
                Target Date
              </label>

              <input
                id="goal-date"
                className="goal-input"
                type="date"
                value={targetDate}
                min={today}
                onChange={(event) =>
                  setTargetDate(event.target.value)
                }
              />
            </div>

            <button
              className="mca-gradient-button goal-create-button"
              type="submit"
              disabled={creatingGoal}
            >
              {creatingGoal
                ? "Creating..."
                : "🎯 Create Goal"}
            </button>
          </form>
        </section>

        <section className="goals-overview-section">
          <div className="goals-section-header">
            <div>
              <h2>Goals Overview</h2>

              <p>
                {filteredGoals.length} of {goals.length} goals
              </p>
            </div>
          </div>

          <div className="goals-toolbar">
            <input
              className="goal-input"
              type="search"
              placeholder="Search goals or amounts..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <select
              className="goal-input"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "All"
                    | "Active"
                    | "Completed"
                )
              }
            >
              <option value="All">
                All Goals
              </option>

              <option value="Active">
                Active Goals
              </option>

              <option value="Completed">
                Completed Goals
              </option>
            </select>
          </div>

          {loading ? (
            <div className="goals-loading">
              Loading financial goals...
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="goals-empty-state">
              <div className="goals-empty-icon">
                🎯
              </div>

              <h3>No goals found</h3>

              <p>
                Create a goal or change the current filters.
              </p>
            </div>
          ) : (
            <div className="goals-list">
              {filteredGoals.map((goal) => {
                const progressColor =
                  getProgressColor(
                    goal.progressPercentage
                  );

                const status = getGoalStatus(
                  goal.progressPercentage
                );

                const recommendation =
                  recommendations.find(
                    (item) =>
                      item.goalName === goal.name
                  );

                const historyExpanded =
                  Boolean(expandedHistory[goal.id]);

                const menuOpen =
                  openActionMenuId === goal.id;

                const addingProgress =
                  progressLoadingId === goal.id;

                const deleting =
                  deletingGoalId === goal.id;

                const remainingAmount =
                  getRemainingAmount(goal);

                return (
                  <article
                    className="goal-card"
                    key={goal.id}
                    style={{
                      borderLeft:
                        `5px solid ${progressColor}`,
                    }}
                  >
                    <div className="goal-card-top">
                      <div className="goal-title-area">
                        <div className="goal-icon">
                          {getGoalIcon(goal.name)}
                        </div>

                        <div>
                          <h3 className="goal-title">
                            {goal.name}
                          </h3>

                          <p className="goal-created-date">
                            🕒 Created {formatDate(goal.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`goal-status ${status.className}`}
                      >
                        {status.icon} {status.label}
                      </span>
                    </div>

                    <div className="goal-mobile-menu">
                      <button
                        type="button"
                        className="goal-menu-trigger"
                        aria-label="Goal actions"
                        onClick={() =>
                          setOpenActionMenuId(
                            (currentId) =>
                              currentId === goal.id
                                ? null
                                : goal.id
                          )
                        }
                      >
                        ⋮
                      </button>

                      {menuOpen && (
                        <div className="goal-menu-dropdown">
                          {goal.progressHistory.length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleHistory(goal.id)
                              }
                            >
                              📜{" "}
                              {historyExpanded
                                ? "Hide History"
                                : "Show History"}
                            </button>
                          )}

                          <button
                            type="button"
                            className="goal-menu-delete"
                            disabled={deleting}
                            onClick={() =>
                              void handleDeleteGoal(
                                goal.id
                              )
                            }
                          >
                            🗑️{" "}
                            {deleting
                              ? "Deleting..."
                              : "Delete Goal"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="goal-amount-row">
                      <div>
                        <div className="goal-saved-label">
                          Saved
                        </div>

                        <div className="goal-saved-value">
                          {formatMoney(
                            goal.currentAmount
                          )}
                        </div>
                      </div>

                      <div className="goal-target-value">
                        <div className="goal-progress-percent">
                          {Math.min(
                            goal.progressPercentage,
                            100
                          ).toFixed(1)}
                          %
                        </div>

                        of{" "}
                        {formatMoney(
                          goal.targetAmount
                        )}
                      </div>
                    </div>

                    <div className="goal-progress-track">
                      <div
                        className="goal-progress-fill"
                        style={{
                          width:
                            `${Math.min(
                              goal.progressPercentage,
                              100
                            )}%`,
                          background: progressColor,
                        }}
                      />
                    </div>

                   <div className="goal-stat-grid">
                    <div className="goal-stat">
                      <span>Amount Left</span>

                      <strong>
                        {formatMoney(remainingAmount)}
                      </strong>
                    </div>

                    <div className="goal-stat">
                      <span>Payments Added</span>

                      <strong>
                        {goal.progressHistory.length}
                      </strong>
                    </div>

                    <div className="goal-stat">
                      <span>Target Date</span>

                      <strong>
                        {formatDate(goal.targetDate)}
                      </strong>
                    </div>
                  </div>

                    {recommendation && (
                      <div className="goal-recommendation">
                        <h4 className="goal-recommendation-title">
                          💡 Smart Goal Recommendation
                        </h4>

                        <p className="goal-recommendation-message">
                          {
                            recommendation.recommendationMessage
                          }
                        </p>

                        <div className="goal-recommendation-grid">
                          <div className="goal-recommendation-stat">
                            <span>Recommended Monthly Saving</span>

                            <strong>
                              {formatMoney(
                                recommendation.requiredMonthlyContribution
                              )}
                            </strong>
                          </div>

                          <div className="goal-recommendation-stat">
                            <span>Months Available</span>

                            <strong>
                              {recommendation.monthsUntilTargetDate > 0
                                ? `${recommendation.monthsUntilTargetDate} months`
                                : "No deadline"}
                            </strong>
                          </div>

                          <div className="goal-recommendation-stat">
                            <span>Extra Saving Needed</span>

                            <strong
                              className={
                                recommendation.additionalMonthlySavingsNeeded > 0
                                  ? "goal-extra-saving"
                                  : ""
                              }
                            >
                              {formatMoney(
                                recommendation.additionalMonthlySavingsNeeded
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="goal-actions-row">
                      <input
                        className="goal-input goal-progress-input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Add progress amount"
                        value={
                          progressAmounts[goal.id] ??
                          ""
                        }
                        onChange={(event) =>
                          setProgressAmounts(
                            (currentAmounts) => ({
                              ...currentAmounts,
                              [goal.id]:
                                event.target.value,
                            })
                          )
                        }
                      />

                      <button
                        type="button"
                        className="mca-gradient-button goal-progress-button"
                        disabled={
                          addingProgress ||
                          goal.progressPercentage >= 100
                        }
                        onClick={() =>
                          void handleAddProgress(
                            goal.id
                          )
                        }
                      >
                        {goal.progressPercentage >= 100
                          ? "Completed"
                          : addingProgress
                            ? "Adding..."
                            : "➕ Add Progress"}
                      </button>

                      {goal.progressHistory.length >
                        0 && (
                        <button
                          type="button"
                          className="goal-secondary-button"
                          onClick={() =>
                            toggleHistory(goal.id)
                          }
                        >
                          {historyExpanded
                            ? "📂 Hide History"
                            : `📜 History (${goal.progressHistory.length})`}
                        </button>
                      )}

                      <button
                        type="button"
                        className="goal-delete-button"
                        disabled={deleting}
                        onClick={() =>
                          void handleDeleteGoal(
                            goal.id
                          )
                        }
                      >
                        {deleting
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>
                    </div>

                    {historyExpanded &&
                      goal.progressHistory.length >
                        0 && (
                        <div className="goal-history">
                          <h4 className="goal-history-title">
                            📜 Progress History
                          </h4>

                          <div className="goal-history-list">
                            {[...goal.progressHistory]
                              .sort(
                                (
                                  firstEntry,
                                  secondEntry
                                ) =>
                                  new Date(
                                    secondEntry.date
                                  ).getTime() -
                                  new Date(
                                    firstEntry.date
                                  ).getTime()
                              )
                              .map((entry, index) => (
                                <div
                                  className="goal-history-item"
                                  key={`${goal.id}-${entry.date}-${index}`}
                                >
                                  <span className="goal-history-amount">
                                    +
                                    {formatMoney(
                                      entry.amount
                                    )}
                                  </span>

                                  <span className="goal-history-date">
                                    📅{" "}
                                    {new Date(
                                      entry.date
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export default FinancialGoalsPage;