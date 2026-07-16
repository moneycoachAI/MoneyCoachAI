import { useEffect, useMemo, useState } from "react";

import AppLayout from "../components/AppLayout";

import { incomeSources } from "../constants/incomeSources";

import {
  createIncome,
  deleteIncome,
  getIncomes,
  updateIncome,
} from "../services/incomeService";

import type { Income } from "../types/incomeTypes";

function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [editingIncomeId, setEditingIncomeId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingIncomeId, setDeletingIncomeId] =
    useState<string | null>(null);

  const [openActionMenuId, setOpenActionMenuId] =
    useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterSource, setFilterSource] = useState("");

  const loadIncomes = async () => {
    try {
      const data = await getIncomes();
      setIncomes(data);
    } catch (error) {
      console.error("Failed to load incomes:", error);
      alert("Failed to load incomes");
    }
  };

  useEffect(() => {
    const loadInitialIncomes = async () => {
      try {
        const data = await getIncomes();
        setIncomes(data);
      } catch (error) {
        console.error("Failed to load incomes:", error);
        alert("Failed to load incomes");
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void loadInitialIncomes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const resetForm = () => {
    setAmount("");
    setSource("");
    setDescription("");
    setDate("");
    setEditingIncomeId(null);
  };

  const handleSubmitIncome = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid income amount");
      return;
    }

    if (!source) {
      alert("Please select an income source");
      return;
    }

    if (!date) {
      alert("Please select a date");
      return;
    }

    const incomeData = {
      amount: Number(amount),
      source,
      description: description.trim(),
      date,
    };

    try {
      setSaving(true);

      if (editingIncomeId) {
        await updateIncome(editingIncomeId, incomeData);
        alert("Income updated successfully");
      } else {
        await createIncome(incomeData);
        alert("Income created successfully");
      }

      resetForm();
      await loadIncomes();
    } catch (error) {
      console.error("Failed to save income:", error);
      alert("Failed to save income");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (income: Income) => {
    setEditingIncomeId(income.id);
    setAmount(income.amount.toString());
    setSource(income.source);
    setDescription(income.description);
    setDate(income.date.split("T")[0]);
    setOpenActionMenuId(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteIncome = async (incomeId: string) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this income?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingIncomeId(incomeId);
      setOpenActionMenuId(null);

      await deleteIncome(incomeId);

      setIncomes((currentIncomes) =>
        currentIncomes.filter((income) => income.id !== incomeId)
      );

      if (editingIncomeId === incomeId) {
        resetForm();
      }

      alert("Income deleted successfully");
    } catch (error) {
      console.error("Failed to delete income:", error);
      alert("Failed to delete income");
    } finally {
      setDeletingIncomeId(null);
    }
  };

  const filteredIncomes = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return incomes.filter((income) => {
      const matchesSource =
        !filterSource || income.source === filterSource;

      const matchesSearch =
        !normalizedSearch ||
        income.source.toLowerCase().includes(normalizedSearch) ||
        income.description.toLowerCase().includes(normalizedSearch) ||
        income.amount.toString().includes(normalizedSearch);

      return matchesSource && matchesSearch;
    });
  }, [filterSource, incomes, searchText]);

  const totalIncome = incomes.reduce(
    (total, income) => total + Number(income.amount || 0),
    0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthIncome = incomes
    .filter((income) => {
      const incomeDate = new Date(income.date);

      return (
        incomeDate.getMonth() === currentMonth &&
        incomeDate.getFullYear() === currentYear
      );
    })
    .reduce(
      (total, income) => total + Number(income.amount || 0),
      0
    );

  const highestIncome =
    incomes.length > 0
      ? Math.max(
          ...incomes.map((income) => Number(income.amount || 0))
        )
      : 0;

  const formatMoney = (value: number) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <AppLayout>
      <style>
        {`
          .incomes-page {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            margin: 0;
            padding: 1%;

            box-sizing: border-box;
            background: transparent;
            overflow-x: hidden;
          }

          .incomes-header {
            width: 100%;
            margin: 0 0 22px;
          }

          /* =========================
             Summary
          ========================= */

          .income-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 26px;
          }

          .income-summary-card {
            min-width: 0;
            padding: 20px;
          }

          .income-summary-icon {
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

          .income-summary-label {
            color: var(--mca-muted);
            font-size: 13px;
            font-weight: 800;
          }

          .income-summary-value {
            margin-top: 8px;

            color: #111827;
            font-size: 26px;
            font-weight: 900;

            overflow-wrap: anywhere;
          }

          /* =========================
             Section headings
          ========================= */

          .income-section-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;

            margin-bottom: 20px;
          }

          .income-section-header h2 {
            margin: 0;

            color: #111827;
            font-size: 19px;
            font-weight: 900;
          }

          .income-section-header p {
            margin: 7px 0 0;

            color: var(--mca-muted);
            font-size: 13px;
            line-height: 1.5;
          }

          .income-edit-badge {
            flex-shrink: 0;

            padding: 6px 10px;

            border-radius: 999px;

            color: #168d59;
            background: rgba(33, 199, 122, 0.12);

            font-size: 11px;
            font-weight: 900;
          }

          /* =========================
             Form
          ========================= */

          .income-form-section {
            width: 100%;
            min-width: 0;

            margin-bottom: 28px;
            padding: 6px 2px 22px;

            border-bottom: 1px solid rgba(17, 24, 39, 0.08);
          }

          .income-inline-form {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(140px, 0.8fr)
              minmax(180px, 1fr)
              minmax(220px, 1.4fr)
              minmax(160px, 0.9fr)
              auto;

            gap: 14px;
            align-items: end;
          }

          .income-field {
            min-width: 0;

            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .income-field label {
            color: #374151;
            font-size: 13px;
            font-weight: 800;
          }

          .income-input {
            width: 100%;
            min-width: 0;

            padding: 13px 14px;

            border: 1px solid rgba(255, 255, 255, 0.72);
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

          .income-input:focus {
            border-color: rgba(33, 199, 122, 0.58);
            box-shadow: 0 0 0 4px rgba(33, 199, 122, 0.11);
          }

          .income-inline-actions {
            min-width: 0;

            display: flex;
            align-items: center;
            gap: 8px;
          }

          .income-inline-actions .mca-gradient-button,
          .income-inline-actions .income-cancel-button {
            min-height: 46px;
            white-space: nowrap;
          }

          .income-cancel-button {
            padding: 12px 18px;

            border: 1px solid rgba(255, 100, 103, 0.25);
            border-radius: 16px;

            color: #e5444a;
            background: rgba(255, 100, 103, 0.1);

            font-weight: 800;
            cursor: pointer;
          }

          /* =========================
             Income history
          ========================= */

          .income-history-section {
            width: 100%;
            max-width: 100%;
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

          .income-toolbar {
            width: 100%;
            min-width: 0;

            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              minmax(170px, 0.45fr);

            gap: 12px;
            margin-bottom: 18px;
          }

          /* =========================
             Desktop table
          ========================= */

          .income-table-wrapper {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            max-height: 560px;

            overflow-x: hidden;
            overflow-y: auto;

            padding-right: 5px;
            border-radius: 18px;

            scrollbar-width: thin;
            scrollbar-color: #a9dfc5 transparent;
          }

          .income-table-wrapper::-webkit-scrollbar {
            width: 7px;
          }

          .income-table-wrapper::-webkit-scrollbar-track {
            background: transparent;
          }

          .income-table-wrapper::-webkit-scrollbar-thumb {
            border-radius: 999px;

            background:
              linear-gradient(
                180deg,
                #7ce2ad,
                #21c77a
              );
          }

          .income-table-wrapper::-webkit-scrollbar-thumb:hover {
            background:
              linear-gradient(
                180deg,
                #51d595,
                #16a764
              );
          }

          .income-table {
            width: 100%;
            min-width: 0;

            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 0;
          }

          .income-table th {
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

          .income-table th:first-child {
            border-radius: 14px 0 0 14px;
          }

          .income-table th:last-child {
            border-radius: 0 14px 14px 0;
          }

          .income-table td {
            padding: 15px 14px;

            border-bottom:
              1px solid rgba(17, 24, 39, 0.06);

            color: #374151;
            font-size: 14px;
            font-weight: 600;

            overflow-wrap: anywhere;
          }

          .income-table tbody tr {
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .income-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.38);
          }

          .income-table th:nth-child(1),
          .income-table td:nth-child(1) {
            width: 15%;
          }

          .income-table th:nth-child(2),
          .income-table td:nth-child(2) {
            width: 19%;
          }

          .income-table th:nth-child(3),
          .income-table td:nth-child(3) {
            width: 32%;
          }

          .income-table th:nth-child(4),
          .income-table td:nth-child(4) {
            width: 16%;
          }

          .income-table th:nth-child(5),
          .income-table td:nth-child(5) {
            width: 18%;
          }

          .income-amount {
            color: #16a764;
            font-weight: 900;
            white-space: nowrap;
          }

          .income-source-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;

            max-width: 100%;

            padding: 6px 10px;

            border-radius: 999px;

            color: #168d59;
            background: rgba(33, 199, 122, 0.12);

            font-size: 12px;
            font-weight: 800;
          }

          .income-date {
            color: var(--mca-muted);
            white-space: nowrap;
          }

          .income-actions-cell {
            position: relative;
          }

          .income-desktop-actions {
            display: flex;
            flex-wrap: nowrap;
            gap: 7px;
          }

          .income-action-button {
            padding: 8px 12px;

            border: none;
            border-radius: 12px;

            color: #ffffff;

            font-size: 12px;
            font-weight: 800;

            cursor: pointer;
          }

          .income-edit-button {
            background:
              linear-gradient(
                135deg,
                #5b8cff,
                #7b61ff
              );
          }

          .income-delete-button {
            background:
              linear-gradient(
                135deg,
                #ff6467,
                #e5444a
              );
          }

          .income-action-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .income-mobile-menu {
            display: none;
          }

          /* =========================
             Empty/loading
          ========================= */

          .income-loading {
            min-height: 340px;

            display: grid;
            place-items: center;

            color: var(--mca-muted);
            font-weight: 800;
          }

          .income-empty-state {
            min-height: 300px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            padding: 30px;
            text-align: center;
          }

          .income-empty-icon {
            width: 78px;
            height: 78px;

            display: grid;
            place-items: center;

            border-radius: 26px;

            font-size: 37px;

            background:
              radial-gradient(
                circle,
                rgba(33, 199, 122, 0.17),
                rgba(79, 124, 255, 0.08)
              );
          }

          .income-empty-state h3 {
            margin: 18px 0 7px;

            color: #111827;
            font-size: 22px;
            font-weight: 900;
          }

          .income-empty-state p {
            margin: 0;

            color: var(--mca-muted);
            font-size: 14px;
          }

          /* =========================
             Tablet
          ========================= */

          @media (max-width: 1100px) {
            .income-inline-form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .income-inline-actions {
              align-self: end;
            }
          }

          @media (max-width: 820px) {
            .income-toolbar {
              grid-template-columns: 1fr;
            }
          }

          /* =========================
             Mobile
          ========================= */

          @media (max-width: 650px) {
            .incomes-page {
              width: 100%;
              max-width: 100%;
              min-width: 0;

              margin: 0;
              padding: 0 6px;

              box-sizing: border-box;
              overflow-x: hidden;
            }

            .incomes-header {
              padding: 0 6px;
              margin-bottom: 18px;
            }

            .income-summary-grid {
              width: 100%;

              grid-template-columns:
                repeat(3, minmax(0, 1fr));

              gap: 7px;
              margin-bottom: 18px;
            }

            .income-summary-card {
              min-width: 0;
              min-height: 108px;

              padding: 11px 8px;

              border-radius: 17px;
            }

            .income-summary-icon {
              width: 31px;
              height: 31px;

              margin-bottom: 8px;

              border-radius: 10px;
              font-size: 15px;
            }

            .income-summary-label {
              font-size: 9px;
              line-height: 1.25;
            }

            .income-summary-value {
              margin-top: 6px;

              font-size: 15px;
              line-height: 1.2;
            }

            .income-form-section {
              width: 100%;
              max-width: 100%;

              padding: 4px 0 20px;
            }

            .income-inline-form {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 12px;
            }

            .income-field,
            .income-input {
              width: 100%;
              max-width: 100%;
              min-width: 0;
            }

            .income-inline-actions {
              width: 100%;
              display: flex;
            }

            .income-inline-actions button {
              width: 100%;
              min-width: 0;
              flex: 1;
            }

            .income-history-section {
              width: 100%;
              max-width: 100%;

              padding: 16px 12px;

              border-radius: 20px;
            }

            .income-section-header {
              margin-bottom: 15px;
            }

            .income-toolbar {
              width: 100%;

              grid-template-columns: 1fr;
              gap: 10px;
            }

            .income-table-wrapper {
              width: 100%;
              max-width: 100%;
              max-height: 470px;

              overflow-x: hidden;
              overflow-y: auto;

              padding-right: 4px;
            }

            .income-table,
            .income-table tbody,
            .income-table tr,
            .income-table td {
              display: block;
              width: 100%;
            }

            .income-table {
              min-width: 0;
              table-layout: auto;
            }

            .income-table thead {
              display: none;
            }

            .income-table tbody {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .income-table tbody tr {
              position: relative;

              display: grid;
              grid-template-columns:
                minmax(0, 1fr)
                auto;

              gap: 8px 12px;

              padding: 12px 44px 12px 12px;

              border:
                1px solid rgba(255, 255, 255, 0.72);

              border-radius: 17px;

              background: rgba(255, 255, 255, 0.52);

              box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.9),
                0 7px 16px rgba(49, 66, 104, 0.05);
            }

            .income-table tbody tr:hover {
              background: rgba(255, 255, 255, 0.66);
            }

            .income-table td {
              width: auto !important;

              padding: 0;

              border: none;
            }

            .income-table td:nth-child(1) {
              grid-column: 2;
              grid-row: 1;

              text-align: right;
            }

            .income-table td:nth-child(2) {
              grid-column: 1;
              grid-row: 1;
            }

            .income-table td:nth-child(3) {
              grid-column: 1;
              grid-row: 2;

              color: #374151;
              font-size: 13px;
            }

            .income-table td:nth-child(4) {
              grid-column: 2;
              grid-row: 2;

              text-align: right;

              color: var(--mca-muted);
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
            }

            .income-table td:nth-child(5) {
              position: absolute;
              top: 10px;
              right: 8px;

              width: auto !important;
            }

            .income-source-badge {
              max-width: 145px;

              padding: 5px 9px;

              font-size: 11px;

              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .income-amount {
              font-size: 13px;
            }

            .income-desktop-actions {
              display: none;
            }

            .income-mobile-menu {
              position: relative;
              display: block;
            }

            .income-menu-trigger {
              width: 32px;
              height: 32px;
              padding: 0;

              display: grid;
              place-items: center;

              border: none;
              border-radius: 11px;

              color: #168d59;
              background: rgba(33, 199, 122, 0.13);

              font-size: 22px;
              font-weight: 900;
              line-height: 1;

              cursor: pointer;
            }

            .income-menu-trigger:hover {
              transform: none;
              background: rgba(33, 199, 122, 0.2);
            }

            .income-menu-dropdown {
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

            .income-menu-dropdown button {
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

            .income-menu-dropdown button:hover {
              transform: none;
              background: rgba(33, 199, 122, 0.09);
            }

            .income-menu-dropdown .income-menu-delete {
              color: #e5444a;
            }

            .income-empty-state {
              min-height: 240px;
              padding: 20px 10px;
            }
          }

          @media (max-width: 390px) {
            .income-summary-grid {
              gap: 5px;
            }

            .income-summary-card {
              padding: 10px 6px;
            }

            .income-summary-label {
              font-size: 8px;
            }

            .income-summary-value {
              font-size: 13px;
            }

            .income-source-badge {
              max-width: 110px;
            }
          }
        `}
      </style>

      <div className="incomes-page">
        <header className="incomes-header">
          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "clamp(30px, 4vw, 42px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.8px",
            }}
          >
            💰 Incomes
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "var(--mca-muted)",
              fontSize: "15px",
              lineHeight: 1.6,
            }}
          >
            Record, organize, and review all your income sources.
          </p>
        </header>

        <section className="income-summary-grid">
          <div className="mca-glass-card income-summary-card mca-glow-green">
            <div className="income-summary-icon">💰</div>

            <div className="income-summary-label">
              Total Income
            </div>

            <div className="income-summary-value">
              {formatMoney(totalIncome)}
            </div>
          </div>

          <div className="mca-glass-card income-summary-card mca-glow-blue">
            <div className="income-summary-icon">📅</div>

            <div className="income-summary-label">
              Current Month
            </div>

            <div className="income-summary-value">
              {formatMoney(currentMonthIncome)}
            </div>
          </div>

          <div className="mca-glass-card income-summary-card mca-glow-purple">
            <div className="income-summary-icon">📈</div>

            <div className="income-summary-label">
              Highest Income
            </div>

            <div className="income-summary-value">
              {formatMoney(highestIncome)}
            </div>
          </div>
        </section>

        <section className="income-form-section">
          <div className="income-section-header">
            <div>
              <h2>
                {editingIncomeId
                  ? "Update Income"
                  : "Add New Income"}
              </h2>

              <p>Enter your income transaction details below.</p>
            </div>

            {editingIncomeId && (
              <span className="income-edit-badge">
                Editing
              </span>
            )}
          </div>

          <form
            className="income-inline-form"
            onSubmit={handleSubmitIncome}
          >
            <div className="income-field">
              <label htmlFor="income-amount">
                Amount
              </label>

              <input
                id="income-amount"
                className="income-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                required
              />
            </div>

            <div className="income-field">
              <label htmlFor="income-source">
                Income Source
              </label>

              <select
                id="income-source"
                className="income-input"
                value={source}
                onChange={(event) =>
                  setSource(event.target.value)
                }
                required
              >
                <option value="">
                  Select Income Source
                </option>

                {incomeSources.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="income-field">
              <label htmlFor="income-description">
                Description
              </label>

              <input
                id="income-description"
                className="income-input"
                type="text"
                placeholder="Example: Monthly salary"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                required
              />
            </div>

            <div className="income-field">
              <label htmlFor="income-date">
                Date
              </label>

              <input
                id="income-date"
                className="income-input"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
              />
            </div>

            <div className="income-inline-actions">
              <button
                className="mca-gradient-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingIncomeId
                    ? "Update Income"
                    : "Add Income"}
              </button>

              {editingIncomeId && (
                <button
                  className="income-cancel-button"
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

        <section className="income-history-section">
          <div className="income-section-header">
            <div>
              <h2>Income History</h2>

              <p>
                {filteredIncomes.length} of {incomes.length} records
              </p>
            </div>
          </div>

          <div className="income-toolbar">
            <input
              className="income-input"
              type="search"
              placeholder="Search description, source, or amount..."
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <select
              className="income-input"
              value={filterSource}
              onChange={(event) =>
                setFilterSource(event.target.value)
              }
            >
              <option value="">All Income Sources</option>

              {incomeSources.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="income-loading">
              Loading incomes...
            </div>
          ) : filteredIncomes.length === 0 ? (
            <div className="income-empty-state">
              <div className="income-empty-icon">💰</div>

              <h3>No incomes found</h3>

              <p>
                Add an income or change the current search filters.
              </p>
            </div>
          ) : (
            <div className="income-table-wrapper">
              <table className="income-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Source</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredIncomes.map((income) => {
                    const deleting =
                      deletingIncomeId === income.id;

                    const menuOpen =
                      openActionMenuId === income.id;

                    return (
                      <tr key={income.id}>
                        <td data-label="Amount">
                          <span className="income-amount">
                            +{formatMoney(income.amount)}
                          </span>
                        </td>

                        <td data-label="Source">
                          <span className="income-source-badge">
                            💰 {income.source}
                          </span>
                        </td>

                        <td data-label="Description">
                          {income.description}
                        </td>

                        <td
                          data-label="Date"
                          className="income-date"
                        >
                         📅 {new Date(
                            income.date
                          ).toLocaleDateString("en-IN")}
                        </td>

                        <td
                          data-label="Actions"
                          className="income-actions-cell"
                        >
                          <div className="income-desktop-actions">
                            <button
                              type="button"
                              className="
                                income-action-button
                                income-edit-button
                              "
                              disabled={deleting}
                              onClick={() =>
                                handleEditClick(income)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="
                                income-action-button
                                income-delete-button
                              "
                              disabled={deleting}
                              onClick={() =>
                                handleDeleteIncome(income.id)
                              }
                            >
                              {deleting
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>

                          <div className="income-mobile-menu">
                            <button
                              type="button"
                              className="income-menu-trigger"
                              aria-label="Income actions"
                              onClick={() =>
                                setOpenActionMenuId(
                                  (currentId) =>
                                    currentId === income.id
                                      ? null
                                      : income.id
                                )
                              }
                            >
                              ⋮
                            </button>

                            {menuOpen && (
                              <div className="income-menu-dropdown">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditClick(income)
                                  }
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  type="button"
                                  className="income-menu-delete"
                                  disabled={deleting}
                                  onClick={() =>
                                    void handleDeleteIncome(
                                      income.id
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

export default IncomesPage;