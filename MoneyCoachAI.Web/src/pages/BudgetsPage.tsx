import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/AppLayout";

import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../services/budgetService";

import { categories } from "../constants/categories";
import type { Budget } from "../types/budgetTypes";

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

function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState("");

  const [editingBudgetId, setEditingBudgetId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingBudgetId, setDeletingBudgetId] =
    useState<string | null>(null);

  const [openActionMenuId, setOpenActionMenuId] =
    useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  const loadBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to load budgets:", error);
      alert("Failed to load budgets");
    }
  };

  useEffect(() => {
    const loadInitialBudgets = async () => {
      try {
        const data = await getBudgets();
        setBudgets(data);
      } catch (error) {
        console.error("Failed to load budgets:", error);
        alert("Failed to load budgets");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void loadInitialBudgets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setCategory("");
    setMonthlyLimit("");
    setBudgetPeriod("");
    setEditingBudgetId(null);
  };

  const handleSubmitBudget = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!category) {
      alert("Please select a budget category");
      return;
    }

    if (!monthlyLimit || Number(monthlyLimit) <= 0) {
      alert("Please enter a valid monthly limit");
      return;
    }

    if (!budgetPeriod) {
      alert("Please select a budget month");
      return;
    }

    const [selectedYear, selectedMonth] = budgetPeriod
      .split("-")
      .map(Number);

    if (!selectedMonth || !selectedYear) {
      alert("Please select a valid budget month");
      return;
    }

    const budgetData = {
      category,
      monthlyLimit: Number(monthlyLimit),
      month: selectedMonth,
      year: selectedYear,
    };

    try {
      setSaving(true);

      if (editingBudgetId) {
        await updateBudget(editingBudgetId, budgetData);
        alert("Budget updated successfully");
      } else {
        await createBudget(budgetData);
        alert("Budget created successfully");
      }

      resetForm();
      await loadBudgets();
    } catch (error) {
      console.error("Failed to save budget:", error);
      alert("Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setCategory(budget.category);
    setMonthlyLimit(budget.monthlyLimit.toString());

    setBudgetPeriod(
      `${budget.year}-${String(budget.month).padStart(2, "0")}`
    );

    setOpenActionMenuId(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingBudgetId(budgetId);
      setOpenActionMenuId(null);

      await deleteBudget(budgetId);

      setBudgets((currentBudgets) =>
        currentBudgets.filter(
          (budget) => budget.id !== budgetId
        )
      );

      if (editingBudgetId === budgetId) {
        resetForm();
      }

      alert("Budget deleted successfully");
    } catch (error) {
      console.error("Failed to delete budget:", error);
      alert("Failed to delete budget");
    } finally {
      setDeletingBudgetId(null);
    }
  };

  const filteredBudgets = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return budgets.filter((budget) => {
      const matchesSearch =
        !normalizedSearch ||
        budget.category.toLowerCase().includes(normalizedSearch) ||
        budget.monthlyLimit
          .toString()
          .includes(normalizedSearch) ||
        monthNames[budget.month]
          .toLowerCase()
          .includes(normalizedSearch) ||
        budget.year.toString().includes(normalizedSearch);

      const matchesCategory =
        !filterCategory || budget.category === filterCategory;

      const budgetPeriodValue =
        `${budget.year}-${String(budget.month).padStart(2, "0")}`;

      const matchesPeriod =
        !filterPeriod || budgetPeriodValue === filterPeriod;

      return matchesSearch && matchesCategory && matchesPeriod;
    });
  }, [
    budgets,
    filterCategory,
    filterPeriod,
    searchText,
  ]);

  const totalBudget = budgets.reduce(
    (total, budget) =>
      total + Number(budget.monthlyLimit || 0),
    0
  );

  const uniqueCategories = new Set(
    budgets.map((budget) => budget.category)
  ).size;

  const highestBudget =
    budgets.length > 0
      ? Math.max(
          ...budgets.map((budget) =>
            Number(budget.monthlyLimit || 0)
          )
        )
      : 0;

  const sortedBudgets = [...filteredBudgets].sort(
    (firstBudget, secondBudget) =>
      secondBudget.year - firstBudget.year ||
      secondBudget.month - firstBudget.month ||
      firstBudget.category.localeCompare(
        secondBudget.category
      )
  );

  const formatMoney = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const getCategoryIcon = (budgetCategory: string) => {
    const normalizedCategory = budgetCategory.toLowerCase();

    if (
      normalizedCategory.includes("food") ||
      normalizedCategory.includes("grocery")
    ) {
      return "🍔";
    }

    if (
      normalizedCategory.includes("travel") ||
      normalizedCategory.includes("transport")
    ) {
      return "🚗";
    }

    if (
      normalizedCategory.includes("shopping")
    ) {
      return "🛍️";
    }

    if (
      normalizedCategory.includes("rent") ||
      normalizedCategory.includes("housing")
    ) {
      return "🏠";
    }

    if (
      normalizedCategory.includes("bill") ||
      normalizedCategory.includes("utility")
    ) {
      return "💡";
    }

    if (
      normalizedCategory.includes("health") ||
      normalizedCategory.includes("medical")
    ) {
      return "🏥";
    }

    if (
      normalizedCategory.includes("entertainment")
    ) {
      return "🎬";
    }

    if (
      normalizedCategory.includes("education")
    ) {
      return "📚";
    }

    return "📊";
  };

  return (
    <AppLayout>
      <style>
        {`
          .budgets-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            margin: 0;
            padding: 1%;

            box-sizing: border-box;
            background: transparent;
            overflow-x: hidden;
          }

          .budgets-header {
            width: 100%;
            margin: 0 0 22px;
          }

          .budgets-title {
            margin: 0;

            color: #111827;

            font-size: clamp(30px, 4vw, 42px);
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -0.8px;
          }

          .budgets-subtitle {
            margin: 10px 0 0;

            color: var(--mca-muted);

            font-size: 15px;
            line-height: 1.6;
          }

          /* =========================
             Summary cards
          ========================= */

          .budget-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));

            gap: 18px;
            margin-bottom: 26px;
          }

          .budget-summary-card {
            min-width: 0;
            padding: 20px;
          }

          .budget-summary-icon {
            width: 46px;
            height: 46px;

            display: grid;
            place-items: center;

            margin-bottom: 14px;

            border-radius: 16px;

            font-size: 21px;

            background:
              rgba(255, 255, 255, 0.68);

            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.95),
              0 8px 20px rgba(49, 66, 104, 0.07);
          }

          .budget-summary-label {
            color: var(--mca-muted);

            font-size: 13px;
            font-weight: 800;
          }

          .budget-summary-value {
            margin-top: 8px;

            color: #111827;

            font-size: 26px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          /* =========================
             Headers
          ========================= */

          .budget-section-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;

            gap: 12px;
            margin-bottom: 20px;
          }

          .budget-section-header h2 {
            margin: 0;

            color: #111827;

            font-size: 19px;
            font-weight: 900;
          }

          .budget-section-header p {
            margin: 7px 0 0;

            color: var(--mca-muted);

            font-size: 13px;
            line-height: 1.5;
          }

          .budget-edit-badge {
            flex-shrink: 0;

            padding: 6px 10px;

            border-radius: 999px;

            color: #6c4dff;
            background: rgba(124, 92, 252, 0.12);

            font-size: 11px;
            font-weight: 900;
          }

          /* =========================
             Form
          ========================= */

          .budget-form-section {
            width: 100%;
            min-width: 0;

            margin-bottom: 28px;
            padding: 6px 2px 22px;

            border-bottom:
              1px solid rgba(17, 24, 39, 0.08);
          }

          .budget-inline-form {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(190px, 1fr)
              minmax(170px, 0.8fr)
              minmax(180px, 0.8fr)
              auto;

            gap: 14px;
            align-items: end;
          }

          .budget-field {
            min-width: 0;

            display: flex;
            flex-direction: column;

            gap: 7px;
          }

          .budget-field label {
            color: #374151;

            font-size: 13px;
            font-weight: 800;
          }

          .budget-input {
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

          .budget-input:focus {
            border-color: rgba(124, 92, 252, 0.58);

            box-shadow:
              0 0 0 4px rgba(124, 92, 252, 0.11);
          }

          .budget-inline-actions {
            min-width: 0;

            display: flex;
            align-items: center;

            gap: 8px;
          }

          .budget-inline-actions .mca-gradient-button,
          .budget-inline-actions .budget-cancel-button {
            min-height: 46px;
            white-space: nowrap;
          }

          .budget-cancel-button {
            padding: 12px 18px;

            border:
              1px solid rgba(255, 100, 103, 0.25);

            border-radius: 16px;

            color: #e5444a;
            background: rgba(255, 100, 103, 0.1);

            font-weight: 800;
            cursor: pointer;
          }

          /* =========================
             Budget overview
          ========================= */

          .budget-overview-section {
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

          .budget-toolbar {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              minmax(170px, 0.4fr)
              minmax(170px, 0.4fr);

            gap: 12px;
            margin-bottom: 18px;
          }

          /* =========================
             Desktop table
          ========================= */

          .budget-table-wrapper {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            max-height: 560px;

            overflow-x: hidden;
            overflow-y: auto;

            padding-right: 5px;
            border-radius: 18px;

            scrollbar-width: thin;
            scrollbar-color: #bfa7ed transparent;
          }

          .budget-table-wrapper::-webkit-scrollbar {
            width: 7px;
          }

          .budget-table-wrapper::-webkit-scrollbar-track {
            background: transparent;
          }

          .budget-table-wrapper::-webkit-scrollbar-thumb {
            border-radius: 999px;

            background:
              linear-gradient(
                180deg,
                #a98bf2,
                #7c5cfc
              );
          }

          .budget-table-wrapper::-webkit-scrollbar-thumb:hover {
            background:
              linear-gradient(
                180deg,
                #9270ec,
                #6547e8
              );
          }

          .budget-table {
            width: 100%;
            min-width: 0;

            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 0;
          }

          .budget-table th {
            position: sticky;
            top: 0;
            z-index: 3;

            padding: 13px 14px;

            text-align: left;

            color: #6b7280;
            background: rgba(255, 255, 255, 0.72);

            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.25px;

            backdrop-filter: blur(14px);
          }

          .budget-table th:first-child {
            border-radius: 14px 0 0 14px;
          }

          .budget-table th:last-child {
            border-radius: 0 14px 14px 0;
          }

          .budget-table td {
            padding: 15px 14px;

            border-bottom:
              1px solid rgba(17, 24, 39, 0.06);

            color: #374151;

            font-size: 14px;
            font-weight: 600;

            overflow-wrap: anywhere;
          }

          .budget-table tbody tr {
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .budget-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.38);
          }

          .budget-table th:nth-child(1),
          .budget-table td:nth-child(1) {
            width: 25%;
          }

          .budget-table th:nth-child(2),
          .budget-table td:nth-child(2) {
            width: 23%;
          }

          .budget-table th:nth-child(3),
          .budget-table td:nth-child(3) {
            width: 18%;
          }

          .budget-table th:nth-child(4),
          .budget-table td:nth-child(4) {
            width: 16%;
          }

          .budget-table th:nth-child(5),
          .budget-table td:nth-child(5) {
            width: 18%;
          }

          .budget-category-badge {
            display: inline-flex;
            align-items: center;

            gap: 7px;
            max-width: 100%;

            padding: 6px 10px;

            border-radius: 999px;

            color: #6c4dff;
            background: rgba(124, 92, 252, 0.11);

            font-size: 12px;
            font-weight: 800;
          }

          .budget-limit {
            color: #4f7cff;
            font-weight: 900;
            white-space: nowrap;
          }

          .budget-period {
            color: var(--mca-muted);
            white-space: nowrap;
          }

          .budget-actions-cell {
            position: relative;
          }

          .budget-desktop-actions {
            display: flex;
            flex-wrap: nowrap;
            gap: 7px;
          }

          .budget-action-button {
            padding: 8px 12px;

            border: none;
            border-radius: 12px;

            color: #ffffff;

            font-size: 12px;
            font-weight: 800;

            cursor: pointer;
          }

          .budget-edit-button {
            background:
              linear-gradient(
                135deg,
                #5b8cff,
                #7b61ff
              );
          }

          .budget-delete-button {
            background:
              linear-gradient(
                135deg,
                #ff6467,
                #e5444a
              );
          }

          .budget-action-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .budget-mobile-menu {
            display: none;
          }

          /* =========================
             Empty/loading
          ========================= */

          .budget-loading {
            min-height: 340px;

            display: grid;
            place-items: center;

            color: var(--mca-muted);
            font-weight: 800;
          }

          .budget-empty-state {
            min-height: 300px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            padding: 30px;
            text-align: center;
          }

          .budget-empty-icon {
            width: 78px;
            height: 78px;

            display: grid;
            place-items: center;

            border-radius: 26px;

            font-size: 37px;

            background:
              radial-gradient(
                circle,
                rgba(124, 92, 252, 0.17),
                rgba(79, 124, 255, 0.08)
              );
          }

          .budget-empty-state h3 {
            margin: 18px 0 7px;

            color: #111827;

            font-size: 22px;
            font-weight: 900;
          }

          .budget-empty-state p {
            margin: 0;

            color: var(--mca-muted);
            font-size: 14px;
          }

          /* =========================
             Tablet
          ========================= */

          @media (max-width: 1100px) {
            .budget-inline-form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .budget-inline-actions {
              align-self: end;
            }
          }

          @media (max-width: 860px) {
            .budget-toolbar {
              grid-template-columns: 1fr;
            }
          }

          /* =========================
             Mobile
          ========================= */

          @media (max-width: 650px) {
            .budgets-page {
              width: 100%;
              max-width: 100%;
              min-width: 0;

              margin: 0;
              padding: 0 6px;

              box-sizing: border-box;
              overflow-x: hidden;
            }

            .budgets-header {
              padding: 0 6px;
              margin-bottom: 18px;
            }

            .budget-summary-grid {
              width: 100%;

              grid-template-columns:
                repeat(3, minmax(0, 1fr));

              gap: 7px;
              margin-bottom: 18px;
            }

            .budget-summary-card {
              min-width: 0;
              min-height: 108px;

              padding: 11px 8px;

              border-radius: 17px;
            }

            .budget-summary-icon {
              width: 31px;
              height: 31px;

              margin-bottom: 8px;

              border-radius: 10px;
              font-size: 15px;
            }

            .budget-summary-label {
              font-size: 9px;
              line-height: 1.25;
            }

            .budget-summary-value {
              margin-top: 6px;

              font-size: 15px;
              line-height: 1.2;
            }

            .budget-form-section {
              width: 100%;
              max-width: 100%;

              padding: 4px 0 20px;
            }

            .budget-inline-form {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 12px;
            }

            .budget-field,
            .budget-input {
              width: 100%;
              max-width: 100%;
              min-width: 0;
            }

            .budget-inline-actions {
              width: 100%;
              display: flex;
            }

            .budget-inline-actions button {
              width: 100%;
              min-width: 0;
              flex: 1;
            }

            .budget-overview-section {
              width: 100%;
              max-width: 100%;

              padding: 16px 12px;
              border-radius: 20px;
            }

            .budget-section-header {
              margin-bottom: 15px;
            }

            .budget-toolbar {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 10px;
            }

            .budget-table-wrapper {
              width: 100%;
              max-width: 100%;
              max-height: 470px;

              overflow-x: hidden;
              overflow-y: auto;

              padding-right: 4px;
            }

            .budget-table,
            .budget-table tbody,
            .budget-table tr,
            .budget-table td {
              display: block;
              width: 100%;
            }

            .budget-table {
              min-width: 0;
              table-layout: auto;
            }

            .budget-table thead {
              display: none;
            }

            .budget-table tbody {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .budget-table tbody tr {
              position: relative;

              display: grid;
              grid-template-columns:
                minmax(0, 1fr)
                auto;

              gap: 8px 12px;

              padding: 14px 44px 14px 14px;

              border:
                1px solid rgba(255, 255, 255, 0.72);

              border-radius: 17px;

              background: rgba(255, 255, 255, 0.52);

              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.9),
                0 7px 16px rgba(49, 66, 104, 0.05);
            }

            .budget-table td {
              width: auto !important;

              padding: 0;
              border: none;
            }

            .budget-table td:nth-child(1) {
              grid-column: 1;
              grid-row: 1;
            }

            .budget-table td:nth-child(2) {
              grid-column: 2;
              grid-row: 1;

              text-align: right;
            }

            /* Month */
            .budget-table td:nth-child(3) {
              grid-column: 1;
              grid-row: 2;

              color: var(--mca-muted);
              font-size: 12px;
              font-weight: 600;
            }

            /* Year */
            .budget-table td:nth-child(4) {
              grid-column: 2;
              grid-row: 2;

              text-align: right;

              color: var(--mca-muted);
              font-size: 12px;
              font-weight: 600;
            }

            .budget-table td:nth-child(5) {
              position: absolute;
              top: 10px;
              right: 8px;

              width: auto !important;
            }

            .budget-category-badge {
              max-width: 145px;

              padding: 5px 9px;

              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;

              font-size: 11px;
            }

            .budget-limit {
              font-size: 13px;
            }

            .budget-desktop-actions {
              display: none;
            }

            .budget-mobile-menu {
              position: relative;
              display: block;
            }

            .budget-menu-trigger {
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

            .budget-menu-trigger:hover {
              transform: none;
              background: rgba(124, 92, 252, 0.2);
            }

            .budget-menu-dropdown {
              position: absolute;
              top: 36px;
              right: 0;
              z-index: 30;

              min-width: 125px;
              padding: 6px;

              border:
                1px solid rgba(255, 255, 255, 0.85);

              border-radius: 14px;

              background: rgba(255, 255, 255, 0.96);

              box-shadow:
                0 14px 32px rgba(17, 24, 39, 0.16);

              backdrop-filter: blur(18px);
            }

            .budget-menu-dropdown button {
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

            .budget-menu-dropdown button:hover {
              transform: none;
              background: rgba(124, 92, 252, 0.09);
            }

            .budget-menu-dropdown .budget-menu-delete {
              color: #e5444a;
            }

            .budget-empty-state {
              min-height: 240px;
              padding: 20px 10px;
            }
          }

          @media (max-width: 390px) {
            .budget-summary-grid {
              gap: 5px;
            }

            .budget-summary-card {
              padding: 10px 6px;
            }

            .budget-summary-label {
              font-size: 8px;
            }

            .budget-summary-value {
              font-size: 13px;
            }

            .budget-category-badge {
              max-width: 110px;
            }
          }
        `}
      </style>

      <div className="budgets-page">
        <header className="budgets-header">
          <h1 className="budgets-title">
            📊 Budgets
          </h1>

          <p className="budgets-subtitle">
            Create monthly spending limits and keep your
            finances organized.
          </p>
        </header>

        <section className="budget-summary-grid">
          <div className="mca-glass-card budget-summary-card mca-glow-purple">
            <div className="budget-summary-icon">💰</div>

            <div className="budget-summary-label">
              Total Budget
            </div>

            <div className="budget-summary-value">
              {formatMoney(totalBudget)}
            </div>
          </div>

          <div className="mca-glass-card budget-summary-card mca-glow-blue">
            <div className="budget-summary-icon">📂</div>

            <div className="budget-summary-label">
              Categories
            </div>

            <div className="budget-summary-value">
              {uniqueCategories}
            </div>
          </div>

          <div className="mca-glass-card budget-summary-card mca-glow-orange">
            <div className="budget-summary-icon">🏆</div>

            <div className="budget-summary-label">
              Highest Limit
            </div>

            <div className="budget-summary-value">
              {formatMoney(highestBudget)}
            </div>
          </div>
        </section>

        <section className="budget-form-section">
          <div className="budget-section-header">
            <div>
              <h2>
                {editingBudgetId
                  ? "Update Budget"
                  : "Create New Budget"}
              </h2>

              <p>
                Select a category, monthly limit and budget
                month.
              </p>
            </div>

            {editingBudgetId && (
              <span className="budget-edit-badge">
                Editing
              </span>
            )}
          </div>

          <form
            className="budget-inline-form"
            onSubmit={handleSubmitBudget}
          >
            <div className="budget-field">
              <label htmlFor="budget-category">
                Category
              </label>

              <select
                id="budget-category"
                className="budget-input"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                required
              >
                <option value="">
                  Select Category
                </option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="budget-field">
              <label htmlFor="budget-limit">
                Monthly Limit
              </label>

              <input
                id="budget-limit"
                className="budget-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter limit"
                value={monthlyLimit}
                onChange={(event) =>
                  setMonthlyLimit(event.target.value)
                }
                required
              />
            </div>

            <div className="budget-field">
              <label htmlFor="budget-period">
                Budget Month
              </label>

              <input
                id="budget-period"
                className="budget-input"
                type="month"
                value={budgetPeriod}
                onChange={(event) =>
                  setBudgetPeriod(event.target.value)
                }
                required
              />
            </div>

            <div className="budget-inline-actions">
              <button
                className="mca-gradient-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingBudgetId
                    ? "Update Budget"
                    : "Add Budget"}
              </button>

              {editingBudgetId && (
                <button
                  type="button"
                  className="budget-cancel-button"
                  disabled={saving}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="budget-overview-section">
          <div className="budget-section-header">
            <div>
              <h2>Budget Overview</h2>

              <p>
                {sortedBudgets.length} of {budgets.length} records
              </p>
            </div>
          </div>

          <div className="budget-toolbar">
            <input
              className="budget-input"
              type="search"
              placeholder="Search category, month, year or amount..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <select
              className="budget-input"
              value={filterCategory}
              onChange={(event) =>
                setFilterCategory(event.target.value)
              }
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              className="budget-input"
              type="month"
              value={filterPeriod}
              onChange={(event) =>
                setFilterPeriod(event.target.value)
              }
              aria-label="Filter budget month"
            />
          </div>

          {loading ? (
            <div className="budget-loading">
              Loading budgets...
            </div>
          ) : sortedBudgets.length === 0 ? (
            <div className="budget-empty-state">
              <div className="budget-empty-icon">
                📊
              </div>

              <h3>No budgets found</h3>

              <p>
                Create a budget or change the current search
                filters.
              </p>
            </div>
          ) : (
            <div className="budget-table-wrapper">
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Monthly Limit</th>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedBudgets.map((budget) => {
                    const deleting =
                      deletingBudgetId === budget.id;

                    const menuOpen =
                      openActionMenuId === budget.id;

                    return (
                      <tr key={budget.id}>
                        <td data-label="Category">
                          <span className="budget-category-badge">
                            {getCategoryIcon(budget.category)}
                            {budget.category}
                          </span>
                        </td>

                        <td data-label="Monthly Limit">
                          <span className="budget-limit">
                            {formatMoney(
                              budget.monthlyLimit
                            )}
                          </span>
                        </td>

                        <td
                          data-label="Month"
                          className="budget-period"
                        >
                          {monthNames[budget.month]}
                        </td>

                        <td
                          data-label="Year"
                          className="budget-period"
                        >
                          {budget.year}
                        </td>

                        <td
                          data-label="Actions"
                          className="budget-actions-cell"
                        >
                          <div className="budget-desktop-actions">
                            <button
                              type="button"
                              className="
                                budget-action-button
                                budget-edit-button
                              "
                              disabled={deleting}
                              onClick={() =>
                                handleEditClick(budget)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="
                                budget-action-button
                                budget-delete-button
                              "
                              disabled={deleting}
                              onClick={() =>
                                handleDeleteBudget(
                                  budget.id
                                )
                              }
                            >
                              {deleting
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>

                          <div className="budget-mobile-menu">
                            <button
                              type="button"
                              className="budget-menu-trigger"
                              aria-label="Budget actions"
                              onClick={() =>
                                setOpenActionMenuId(
                                  (currentId) =>
                                    currentId === budget.id
                                      ? null
                                      : budget.id
                                )
                              }
                            >
                              ⋮
                            </button>

                            {menuOpen && (
                              <div className="budget-menu-dropdown">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditClick(budget)
                                  }
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  type="button"
                                  className="budget-menu-delete"
                                  disabled={deleting}
                                  onClick={() =>
                                    void handleDeleteBudget(
                                      budget.id
                                    )
                                  }
                                >
                                  🗑️{" "}
                                  {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export default BudgetsPage;