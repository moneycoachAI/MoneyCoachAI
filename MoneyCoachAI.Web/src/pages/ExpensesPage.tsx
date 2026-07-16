import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/AppLayout";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../services/expenseService";

import { categories } from "../constants/categories";
import type { Expense } from "../types/expenseTypes";

import "../styles/pageLayout.css";

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [openActionMenuId, setOpenActionMenuId] =
  useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [editingExpenseId, setEditingExpenseId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] =
    useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      alert("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const loadInitialExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      alert("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const timer = window.setTimeout(() => {
    void loadInitialExpenses();
  }, 0);

  return () => window.clearTimeout(timer);
}, []);

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setDate("");
    setEditingExpenseId(null);
  };

  const handleSubmitExpense = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!category) {
      alert("Please select a category");
      return;
    }

    if (!date) {
      alert("Please select a date");
      return;
    }

    const expenseData = {
      amount: Number(amount),
      category,
      description: description.trim(),
      date,
    };

    try {
      setSaving(true);

      if (editingExpenseId) {
        await updateExpense(editingExpenseId, expenseData);
        alert("Expense updated successfully");
      } else {
        await createExpense(expenseData);
        alert("Expense created successfully");
      }

      resetForm();
      await loadExpenses();
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date.split("T")[0]);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteExpense = async (id: string) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingExpenseId(id);

      await deleteExpense(id);

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== id)
      );

      if (editingExpenseId === id) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Failed to delete expense");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesCategory =
        !filterCategory || expense.category === filterCategory;

      const matchesSearch =
        !normalizedSearch ||
        expense.category.toLowerCase().includes(normalizedSearch) ||
        expense.description.toLowerCase().includes(normalizedSearch) ||
        expense.amount.toString().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [expenses, filterCategory, searchText]);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    return (
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });

  const currentMonthTotal = currentMonthExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const highestExpense =
    expenses.length > 0
      ? Math.max(...expenses.map((expense) => Number(expense.amount || 0)))
      : 0;

  const formatMoney = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <AppLayout>
      <style>
        {`
          .expenses-page {
            width: 100%;
            min-width: 0;
            margin: 0;
            padding: 1%;
            background: transparent;
          }

          .expenses-header {
            width: 100%;
            margin: 0 0 22px;
          }

          /* =========================
            Summary cards
          ========================= */

          .expense-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 24px;
          }

          .expense-summary-card {
            min-width: 0;
            padding: 20px;
          }

          .expense-summary-icon {
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

          .expense-summary-label {
            color: var(--mca-muted);
            font-size: 13px;
            font-weight: 800;
          }

          .expense-summary-value {
            margin-top: 8px;
            color: #111827;
            font-size: 26px;
            font-weight: 900;
            overflow-wrap: anywhere;
          }

          /* =========================
            Section headers
          ========================= */

          .expense-section-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 20px;
          }

          .expense-section-header h2 {
            margin: 0;
            color: #111827;
            font-size: 19px;
            font-weight: 900;
          }

          .expense-section-header p {
            margin: 7px 0 0;
            color: var(--mca-muted);
            font-size: 13px;
            line-height: 1.5;
          }

          .expense-edit-badge {
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

          .expense-form-section {
            width: 100%;
            min-width: 0;
            margin-bottom: 28px;
            padding: 6px 2px 22px;
            border-bottom: 1px solid rgba(17, 24, 39, 0.08);
          }

          .expense-inline-form {
            display: grid;
            grid-template-columns:
              minmax(140px, 0.8fr)
              minmax(180px, 1fr)
              minmax(220px, 1.4fr)
              minmax(160px, 0.9fr)
              auto;
            gap: 14px;
            align-items: end;
            width: 100%;
            min-width: 0;
          }

          .expense-field {
            display: flex;
            flex-direction: column;
            gap: 7px;
            min-width: 0;
          }

          .expense-field label {
            color: #374151;
            font-size: 13px;
            font-weight: 800;
          }

          .expense-input {
            width: 100%;
            min-width: 0;
            padding: 13px 14px;
            border: 1px solid rgba(255, 255, 255, 0.72);
            border-radius: 15px;
            outline: none;
            color: #111827;
            background: rgba(255, 255, 255, 0.62);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .expense-input:focus {
            border-color: rgba(79, 124, 255, 0.58);
            box-shadow: 0 0 0 4px rgba(79, 124, 255, 0.11);
          }

          .expense-inline-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .expense-inline-actions .mca-gradient-button,
          .expense-inline-actions .expense-cancel-button {
            min-height: 46px;
            white-space: nowrap;
          }

          .expense-cancel-button {
            padding: 12px 18px;
            border: 1px solid rgba(255, 100, 103, 0.25);
            border-radius: 16px;
            color: #e5444a;
            background: rgba(255, 100, 103, 0.1);
            font-weight: 800;
            cursor: pointer;
          }

          /* =========================
            History section
          ========================= */

          .expense-history-section {
            width: 100%;
            min-width: 0;
            padding: 22px;
            border: 1px solid rgba(255, 255, 255, 0.7);
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

          .expense-toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(170px, 0.45fr);
            gap: 12px;
            margin-bottom: 18px;
            width: 100%;
            min-width: 0;
          }

          /* =========================
            Table desktop
          ========================= */

          .expense-table-wrapper {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            max-height: 560px;
            overflow-x: hidden;
            overflow-y: auto;
            padding-right: 5px;
            border-radius: 18px;
            scrollbar-width: thin;
            scrollbar-color: #c5a3e6 transparent;
          }

          .expense-table-wrapper::-webkit-scrollbar {
            width: 7px;
          }

          .expense-table-wrapper::-webkit-scrollbar-track {
            background: transparent;
          }

          .expense-table-wrapper::-webkit-scrollbar-thumb {
            border-radius: 999px;
            background: linear-gradient(
              180deg,
              #d4b4ed,
              #a978d1
            );
          }

          .expense-table-wrapper::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(
              180deg,
              #c28fe7,
              #8f5fc1
            );
          }

          .expense-table {
            width: 100%;
            min-width: 0;
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 0;
          }

          .expense-table th {
            padding: 13px 14px;
            text-align: left;
            color: #6b7280;
            background: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.25px;
            position: sticky;
            top: 0;
            z-index: 3;
            backdrop-filter: blur(14px);
          }

          .expense-table th:first-child {
            border-radius: 14px 0 0 14px;
          }

          .expense-table th:last-child {
            border-radius: 0 14px 14px 0;
          }

          .expense-table td {
            padding: 15px 14px;
            border-bottom: 1px solid rgba(17, 24, 39, 0.06);
            color: #374151;
            font-size: 14px;
            font-weight: 600;
            overflow-wrap: anywhere;
          }

          .expense-table tbody tr {
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .expense-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.38);
          }

          .expense-table th:nth-child(1),
          .expense-table td:nth-child(1) {
            width: 14%;
          }

          .expense-table th:nth-child(2),
          .expense-table td:nth-child(2) {
            width: 18%;
          }

          .expense-table th:nth-child(3),
          .expense-table td:nth-child(3) {
            width: 34%;
          }

          .expense-table th:nth-child(4),
          .expense-table td:nth-child(4) {
            width: 16%;
          }

          .expense-table th:nth-child(5),
          .expense-table td:nth-child(5) {
            width: 18%;
          }

          .expense-amount {
            color: #ff525c;
            font-weight: 900;
            white-space: nowrap;
          }

          .expense-category-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            max-width: 100%;
            padding: 6px 10px;
            border-radius: 999px;
            color: #6c4dff;
            background: rgba(124, 92, 252, 0.1);
            font-size: 12px;
            font-weight: 800;
          }

          .expense-date {
            white-space: nowrap;
            color: var(--mca-muted);
          }

          .expense-actions-cell {
            position: relative;
          }

          .expense-desktop-actions {
            display: flex;
            flex-wrap: nowrap;
            gap: 7px;
          }

          .expense-action-button {
            padding: 8px 12px;
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
          }

          .expense-edit-button {
            background: linear-gradient(135deg, #5b8cff, #7b61ff);
          }

          .expense-delete-button {
            background: linear-gradient(135deg, #ff6467, #e5444a);
          }

          .expense-action-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .expense-mobile-menu {
            display: none;
          }

          /* =========================
            Empty/loading states
          ========================= */

          .expenses-empty-state {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            text-align: center;
          }

          .expenses-empty-icon {
            width: 78px;
            height: 78px;
            display: grid;
            place-items: center;
            border-radius: 26px;
            font-size: 37px;
            background:
              radial-gradient(
                circle,
                rgba(255, 100, 103, 0.17),
                rgba(255, 181, 71, 0.1)
              );
          }

          .expenses-empty-state h3 {
            margin: 18px 0 7px;
            color: #111827;
            font-size: 22px;
            font-weight: 900;
          }

          .expenses-empty-state p {
            margin: 0;
            color: var(--mca-muted);
            font-size: 14px;
          }

          .expenses-loading {
            min-height: 340px;
            display: grid;
            place-items: center;
            color: var(--mca-muted);
            font-weight: 800;
          }

          /* =========================
            Tablet
          ========================= */

          @media (max-width: 1100px) {
            .expense-inline-form {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .expense-inline-actions {
              align-self: end;
            }
          }

          @media (max-width: 820px) {
            .expense-toolbar {
              grid-template-columns: 1fr;
            }
          }

          /* =========================
            Mobile
          ========================= */

          @media (max-width: 650px) {
            .expenses-page {
              width: 100%;
              max-width: 100%;
              min-width: 0;
              margin: 0;
              padding: 0 6px;
              box-sizing: border-box;
              overflow-x: hidden;
            }

            .expenses-header {
              padding: 0 6px;
              margin-bottom: 18px;
            }

            .expense-summary-grid {
              width: 100%;
              padding: 0;
            }

            
            /* Keep all 3 summary cards in one line */
            .expense-summary-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 7px;
              margin-bottom: 18px;
            }

            .expense-summary-card {
              min-width: 0;
              min-height: 108px;
              padding: 11px 8px;
              border-radius: 17px;
            }

            .expense-summary-icon {
              width: 31px;
              height: 31px;
              margin-bottom: 8px;
              border-radius: 10px;
              font-size: 15px;
            }

            .expense-summary-label {
              font-size: 9px;
              line-height: 1.25;
            }

            .expense-summary-value {
              margin-top: 6px;
              font-size: 15px;
              line-height: 1.2;
            }

            /* Form */
            .expense-form-section {
              width: 100%;
              max-width: 100%;
              padding: 4px 0 20px;
            }

            .expense-inline-form {
              width: 100%;
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .expense-field,
            .expense-input {
              width: 100%;
              max-width: 100%;
              min-width: 0;
            }

            .expense-inline-actions {
              display: flex;
              width: 100%;
            }

            .expense-inline-actions button {
              width: 100%;
              min-width: 0;
              flex: 1;
            }

            /* History */
            .expense-history-section {
              width: 100%;
              max-width: 100%;
              padding: 16px 12px;
              border-radius: 20px;
            }

            .expense-section-header {
              margin-bottom: 15px;
            }

            .expense-toolbar {
              grid-template-columns: 1fr;
              gap: 10px;
              width: 100%;
            }

            /* Vertical scrolling only */
            .expense-table-wrapper {
              width: 100%;
              max-width: 100%;
              max-height: 470px;
              overflow-x: hidden;
              overflow-y: auto;
              padding-right: 4px;
            }

            /* Turn table rows into compact cards */
            .expense-table,
            .expense-table tbody,
            .expense-table tr,
            .expense-table td {
              display: block;
              width: 100%;
            }

            .expense-table {
              min-width: 0;
              table-layout: auto;
            }

            .expense-table thead {
              display: none;
            }

            .expense-table tbody {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .expense-table tbody tr {
              position: relative;
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 8px 12px;
              padding: 14px 44px 12px 12px;
              border: 1px solid rgba(255, 255, 255, 0.72);
              border-radius: 17px;
              background: rgba(255, 255, 255, 0.52);
              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.9),
                0 7px 16px rgba(49, 66, 104, 0.05);
            }

            .expense-table tbody tr:hover {
              background: rgba(255, 255, 255, 0.66);
            }

            .expense-table td {
              width: auto !important;
              padding: 0;
              border: none;
            }

            .expense-table td:nth-child(1) {
              grid-column: 2;
              grid-row: 1;
              text-align: right;
            }

            .expense-table td:nth-child(2) {
              grid-column: 1;
              grid-row: 1;
            }

            .expense-table td:nth-child(3) {
              grid-column: 1;
              grid-row: 2;

              color: #374151;
              font-size: 13px;
            }

            .expense-table td:nth-child(4) {
              grid-column: 2;
              grid-row: 2;

              text-align: right;

              color: var(--mca-muted);
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
            }

            .expense-table td:nth-child(5) {
              position: absolute;
              top: 10px;
              right: 8px;
              width: auto !important;
            }

            .expense-category-badge {
              max-width: 145px;
              padding: 5px 9px;
              font-size: 11px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .expense-amount {
              font-size: 13px;
            }

            /* Desktop buttons hidden on mobile */
            .expense-desktop-actions {
              display: none;
            }

            /* Three dot menu */
            .expense-mobile-menu {
              position: relative;
              display: block;
            }

            .expense-menu-trigger {
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

            .expense-menu-trigger:hover {
              transform: none;
              background: rgba(124, 92, 252, 0.2);
            }

            .expense-menu-dropdown {
              position: absolute;
              top: 36px;
              right: 0;
              z-index: 30;
              min-width: 125px;
              padding: 6px;
              border: 1px solid rgba(255, 255, 255, 0.85);
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.96);
              box-shadow: 0 14px 32px rgba(17, 24, 39, 0.16);
              backdrop-filter: blur(18px);
            }

            .expense-menu-dropdown button {
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

            .expense-menu-dropdown button:hover {
              transform: none;
              background: rgba(79, 124, 255, 0.09);
            }

            .expense-menu-dropdown .expense-menu-delete {
              color: #e5444a;
            }

            .expenses-empty-state {
              min-height: 240px;
              padding: 20px 10px;
            }
          }

          @media (max-width: 390px) {
            .expense-summary-grid {
              gap: 5px;
            }

            .expense-summary-card {
              padding: 10px 6px;
            }

            .expense-summary-label {
              font-size: 8px;
            }

            .expense-summary-value {
              font-size: 13px;
            }

            .expense-category-badge {
              max-width: 110px;
            }
          }
        `}
      </style>

      <div className="expenses-page">
        <header className="mca-page-header expenses-header">
          <div>
            <h1 className="mca-page-title">💸 Expenses</h1>

            <p className="mca-page-subtitle">
              Record, organize, and review all your spending in one place.
            </p>
          </div>
        </header>

        <section className="expense-summary-grid">
          <div className="mca-glass-card expense-summary-card mca-glow-red">
            <div className="expense-summary-icon">💸</div>

            <div className="expense-summary-label">
              Total Expenses
            </div>

            <div className="expense-summary-value">
              {formatMoney(totalExpenses)}
            </div>
          </div>

          <div className="mca-glass-card expense-summary-card mca-glow-orange">
            <div className="expense-summary-icon">📅</div>

            <div className="expense-summary-label">
              Current Month
            </div>

            <div className="expense-summary-value">
              {formatMoney(currentMonthTotal)}
            </div>
          </div>

          <div className="mca-glass-card expense-summary-card mca-glow-purple">
            <div className="expense-summary-icon">📊</div>

            <div className="expense-summary-label">
              Highest Expense
            </div>

            <div className="expense-summary-value">
              {formatMoney(highestExpense)}
            </div>
          </div>
        </section>

        <section className="expense-form-section">
          <div className="expense-section-header">
            <div>
              <h2>
                {editingExpenseId ? "Update Expense" : "Add New Expense"}
              </h2>

              <p>Enter the transaction details below.</p>
            </div>

            {editingExpenseId && (
              <span className="expense-edit-badge">Editing</span>
            )}
          </div>

          <form
            className="expense-inline-form"
            onSubmit={handleSubmitExpense}
          >
            <div className="expense-field">
              <label htmlFor="expense-amount">Amount</label>

              <input
                id="expense-amount"
                className="expense-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="expense-field">
              <label htmlFor="expense-category">Category</label>

              <select
                id="expense-category"
                className="expense-input"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                <option value="">Select Category</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="expense-field">
              <label htmlFor="expense-description">Description</label>

              <input
                id="expense-description"
                className="expense-input"
                type="text"
                placeholder="Example: Grocery shopping"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>

            <div className="expense-field">
              <label htmlFor="expense-date">Date</label>

              <input
                id="expense-date"
                className="expense-input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="expense-inline-actions">
              <button
                className="mca-gradient-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingExpenseId
                    ? "Update Expense"
                    : "Add Expense"}
              </button>

              {editingExpenseId && (
                <button
                  className="expense-cancel-button"
                  type="button"
                  disabled={saving}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="expense-history-section">
          <div className="expense-section-header">
            <div>
              <h2>Expense History</h2>

              <p>
                {filteredExpenses.length} of {expenses.length} records
              </p>
            </div>
          </div>

          <div className="expense-toolbar">
            <input
              className="expense-input"
              type="search"
              placeholder="Search description, category, or amount..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            <select
              className="expense-input"
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="expenses-loading">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="expenses-empty-state">
              <div className="expenses-empty-icon">💸</div>

              <h3>No expenses found</h3>

              <p>
                Add an expense or change the current search filters.
              </p>
            </div>
          ) : (
            <div className="expense-table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.map((expense) => {
                const deleting = deletingExpenseId === expense.id;
                const menuOpen = openActionMenuId === expense.id;

                return (
                  <tr key={expense.id}>
                    <td data-label="Amount">
                      <span className="expense-amount">
                        -{formatMoney(expense.amount)}
                      </span>
                    </td>

                    <td data-label="Category">
                      <span className="expense-category-badge">
                        💸 {expense.category}
                      </span>
                    </td>

                    <td data-label="Description">
                      {expense.description}
                    </td>

                    <td data-label="Date" className="expense-date">
                      📅{new Date(expense.date).toLocaleDateString("en-IN")}
                    </td>

                    <td data-label="Actions" className="expense-actions-cell">
                      <div className="expense-desktop-actions">
                        <button
                          type="button"
                          className="expense-action-button expense-edit-button"
                          disabled={deleting}
                          onClick={() => handleEditClick(expense)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="expense-action-button expense-delete-button"
                          disabled={deleting}
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                      <div className="expense-mobile-menu">
                        <button
                          type="button"
                          className="expense-menu-trigger"
                          aria-label="Expense actions"
                          onClick={() =>
                            setOpenActionMenuId((current) =>
                              current === expense.id ? null : expense.id
                            )
                          }
                        >
                          ⋮
                        </button>

                        {menuOpen && (
                          <div className="expense-menu-dropdown">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleEditClick(expense);
                              }}
                            >
                              ✏️ Edit
                            </button>

                            <button
                              type="button"
                              className="expense-menu-delete"
                              disabled={deleting}
                              onClick={() => {
                                setOpenActionMenuId(null);
                                void handleDeleteExpense(expense.id);
                              }}
                            >
                              🗑️ {deleting ? "Deleting..." : "Delete"}
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

export default ExpensesPage;