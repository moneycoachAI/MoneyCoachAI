import { useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";

import {
  getBudgetSummary,
  getCategoryReport,
  getMonthlyReport,
} from "../services/reportService";

import type {
  BudgetSummaryResponse,
  CategoryReportResponse,
  MonthlyReportResponse,
} from "../types/reportTypes";

import {
  isFutureMonth,
} from "../utils/dateUtils";

type Notice = {
  type: "error";
  message: string;
};

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function ReportsPage() {
  const [month, setMonth] = useState("6");
  const [year, setYear] = useState("2026");

  const [monthlyReport, setMonthlyReport] =
    useState<MonthlyReportResponse | null>(null);

  const [categoryReport, setCategoryReport] = useState<
    CategoryReportResponse[]
  >([]);

  const [budgetSummary, setBudgetSummary] = useState<
    BudgetSummaryResponse[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedMonthName = useMemo(() => {
    return (
      MONTH_OPTIONS.find((option) => option.value === month)?.label ??
      "Selected month"
    );
  }, [month]);

  const summary = useMemo(() => {
    const categoryCount = categoryReport.length;

    const overBudgetCount = budgetSummary.filter(
      (item) => item.isOverBudget
    ).length;

    const withinBudgetCount = budgetSummary.length - overBudgetCount;

    const totalBudget = budgetSummary.reduce(
      (total, item) => total + item.budgetLimit,
      0
    );

    const totalSpentAcrossBudgets = budgetSummary.reduce(
      (total, item) => total + item.spent,
      0
    );

    return {
      categoryCount,
      overBudgetCount,
      withinBudgetCount,
      totalBudget,
      totalSpentAcrossBudgets,
    };
  }, [budgetSummary, categoryReport]);

  const handleLoadReports = async () => {
    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      setNotice({
        type: "error",
        message: "Please select a valid month.",
      });
      return;
    }

    if (
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 2100
    ) {
      setNotice({
        type: "error",
        message: "Please enter a valid year between 2000 and 2100.",
      });
      return;
    }

    if (isFutureMonth(selectedMonth, selectedYear)) {
      setNotice({
        type: "error",
        message: "Reports cannot be generated for a future month.",
      });
      return;
    }

    try {
      setLoading(true);
      setNotice(null);
      setHasLoaded(true);

      const [monthlyData, categoryData, budgetData] = await Promise.all([
        getMonthlyReport(selectedMonth, selectedYear),
        getCategoryReport(selectedMonth, selectedYear),
        getBudgetSummary(selectedMonth, selectedYear),
      ]);

      setMonthlyReport(monthlyData);
      setCategoryReport(categoryData);
      setBudgetSummary(budgetData);
    } catch (error) {
      console.error("Failed to load reports:", error);

      setNotice({
        type: "error",
        message: "Failed to load reports. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <main className="reports-page">
        <header className="reports-header">
          <div>
            <span className="reports-eyebrow">Financial analytics</span>
            <h1>Reports</h1>
            <p>
              Review your spending, category activity and budget performance
              for a selected month.
            </p>
          </div>

          {hasLoaded && (
            <div className="reports-period">
              <small>Report period</small>
              <strong>
                {selectedMonthName} {year}
              </strong>
            </div>
          )}
        </header>

        <section className="reports-controls">
          <div className="reports-control">
            <label htmlFor="reports-month">Month</label>

            <select
              id="reports-month"
              value={month}
              disabled={loading}
              onChange={(event) => {
                setMonth(event.target.value);
                setNotice(null);
              }}
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="reports-control">
            <label htmlFor="reports-year">Year</label>

            <input
              id="reports-year"
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={year}
              disabled={loading}
              onChange={(event) => {
                setYear(event.target.value);
                setNotice(null);
              }}
            />
          </div>

          <button
            type="button"
            className="reports-load-button"
            disabled={loading}
            onClick={() => void handleLoadReports()}
          >
            {loading ? (
              <>
                <span className="reports-button-spinner" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </button>
        </section>

        {notice && (
          <div className="reports-notice" role="alert">
            <span>!</span>
            <p>{notice.message}</p>

            <button
              type="button"
              aria-label="Close error message"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <section className="reports-state">
            <span className="reports-loader" />
            <h2>Generating your report</h2>
            <p>
              We are preparing your monthly, category and budget information.
            </p>
          </section>
        ) : !hasLoaded ? (
          <section className="reports-state">
            <div className="reports-state-icon">📊</div>
            <h2>Select a reporting period</h2>
            <p>
              Choose a month and year above, then generate your financial
              report.
            </p>
          </section>
        ) : (
          <>
            <section className="reports-summary">
              <article className="reports-summary-card">
                <span>Total income</span>
                <strong>
                  {formatCurrency(monthlyReport?.totalIncome ?? 0)}
                </strong>
                <small>Income received this month</small>
              </article>

              <article className="reports-summary-card">
                <span>Total spent</span>
                <strong>
                  {formatCurrency(monthlyReport?.totalSpent ?? 0)}
                </strong>
                <small>Monthly spending total</small>
              </article>

              <article className="reports-summary-card">
                <span>Categories</span>
                <strong>{summary.categoryCount}</strong>
                <small>Categories with activity</small>
              </article>

              <article className="reports-summary-card">
                <span>Budget status</span>
                <strong>{summary.overBudgetCount}</strong>
                <small>
                  {summary.overBudgetCount === 1
                    ? "Category over budget"
                    : "Categories over budget"}
                </small>
              </article>
            </section>

            <section className="reports-section">
              <div className="reports-section-heading">
                <div>
                  <span className="reports-section-kicker">Monthly</span>
                  <h2>Monthly overview</h2>
                  <p>
                    A quick summary of spending for {selectedMonthName} {year}.
                  </p>
                </div>
              </div>

              <div className="reports-divider" />

              {monthlyReport ? (
                <div className="reports-monthly-grid">
                  <div>
                    <span>Month</span>
                    <strong>{selectedMonthName}</strong>
                  </div>

                  <div>
                    <span>Year</span>
                    <strong>{monthlyReport.year}</strong>
                  </div>

                  <div>
                    <span>Total spent</span>
                    <strong>
                      {formatCurrency(monthlyReport.totalSpent)}
                    </strong>
                  </div>

                  <div>
                    <span>Budget usage</span>
                    <strong>
                      {summary.totalBudget > 0
                        ? `${Math.round(
                            (summary.totalSpentAcrossBudgets /
                              summary.totalBudget) *
                              100
                          )}%`
                        : "0%"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="reports-empty-inline">
                  No monthly report was found for this period.
                </div>
              )}
            </section>

            <section className="reports-section">
              <div className="reports-section-heading">
                <div>
                  <span className="reports-section-kicker">Spending</span>
                  <h2>Category report</h2>
                  <p>
                    See which categories contributed most to your monthly
                    expenses.
                  </p>
                </div>

                <span className="reports-section-count">
                  {categoryReport.length}{" "}
                  {categoryReport.length === 1 ? "category" : "categories"}
                </span>
              </div>

              <div className="reports-divider" />

              {categoryReport.length === 0 ? (
                <div className="reports-empty-inline">
                  No category spending was found for this period.
                </div>
              ) : (
                <div className="reports-table-wrap reports-category-wrap">
                  <table className="reports-table reports-category-table">
                    <colgroup>
                      <col className="reports-category-col" />
                      <col className="reports-total-col" />
                      <col className="reports-share-col" />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Total spent</th>
                        <th>Share</th>
                      </tr>
                    </thead>

                    <tbody>
                      {categoryReport.map((item) => {
                        const totalSpent = monthlyReport?.totalSpent ?? 0;

                        const share =
                          totalSpent > 0
                            ? Math.round((item.totalSpent / totalSpent) * 100)
                            : 0;

                        return (
                          <tr key={item.category}>
                            <td>
                              <div className="reports-category-cell">
                                <span className="reports-category-dot" />

                                <div className="reports-category-details">
                                  <strong>{item.category}</strong>

                                  {item.category.toLowerCase() === "other" &&
                                    item.descriptions?.length > 0 && (
                                      <div className="reports-description-list">
                                        {item.descriptions.map((description) => (
                                          <span
                                            key={description}
                                            className="reports-description-chip"
                                            title={description}
                                          >
                                            {description}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </td>

                            <td className="reports-money-cell">
                              {formatCurrency(item.totalSpent)}
                            </td>

                            <td>
                              <div className="reports-share-cell">
                                <span>{share}%</span>

                                <div className="reports-progress">
                                  <div
                                    style={{
                                      width: `${Math.min(share, 100)}%`,
                                    }}
                                  />
                                </div>
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

            <section className="reports-section">
              <div className="reports-section-heading">
                <div>
                  <span className="reports-section-kicker">Budgets</span>
                  <h2>Budget summary</h2>
                  <p>
                    Compare category limits with actual spending and remaining
                    balance.
                  </p>
                </div>

                <span className="reports-section-count">
                  {summary.withinBudgetCount} within budget
                </span>
              </div>

              <div className="reports-divider" />

              {budgetSummary.length === 0 ? (
                <div className="reports-empty-inline">
                  No budget summary was found for this period.
                </div>
              ) : (
                <div className="reports-table-wrap">
                  <table className="reports-table reports-budget-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Budget limit</th>
                        <th>Spent</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {budgetSummary.map((item) => (
                        <tr key={item.category}>
                          <td>
                            <strong>{item.category}</strong>
                          </td>

                          <td>{formatCurrency(item.budgetLimit)}</td>
                          <td>{formatCurrency(item.spent)}</td>

                          <td
                            className={
                              item.remaining < 0
                                ? "reports-negative-value"
                                : ""
                            }
                          >
                            {formatCurrency(item.remaining)}
                          </td>

                          <td>
                            <span
                              className={`reports-status-badge ${
                                item.isOverBudget
                                  ? "reports-status-over"
                                  : "reports-status-within"
                              }`}
                            >
                              {item.isOverBudget
                                ? "Over budget"
                                : "Within budget"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <style>{reportsStyles}</style>
      </main>
    </AppLayout>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const reportsStyles = `
  .reports-page,
  .reports-page * {
    box-sizing: border-box;
  }

  .reports-page {
    width: 100%;
    min-height: 100%;
    padding: 26px 1% 34px;
    color: #111827;
  }

  .reports-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }

  .reports-eyebrow,
  .reports-section-kicker {
    display: block;
    color: #6d5dfc;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .reports-header h1 {
    margin: 7px 0 0;
    font-size: clamp(2rem, 3.2vw, 2.75rem);
    line-height: 1.05;
    letter-spacing: -0.045em;
  }

  .reports-header p {
    max-width: 700px;
    margin: 10px 0 0;
    color: #64748b;
    font-size: 0.96rem;
    line-height: 1.65;
  }

  .reports-period {
    flex: 0 0 auto;
    padding: 7px 0 7px 18px;
    border-left: 2px solid rgba(109, 93, 252, 0.22);
  }

  .reports-period small,
  .reports-period strong {
    display: block;
  }

  .reports-period small {
    color: #94a3b8;
    font-size: 0.68rem;
  }

  .reports-period strong {
    margin-top: 3px;
    color: #334155;
    font-size: 0.9rem;
  }

  .reports-controls {
    display: grid;
    grid-template-columns: minmax(180px, 260px) minmax(150px, 200px) auto;
    align-items: end;
    gap: 13px;
    padding: 24px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .reports-control label {
    display: block;
    margin: 0 0 7px 2px;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 900;
  }

  .reports-control select,
  .reports-control input {
    width: 100%;
    min-height: 46px;
    padding: 0 13px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 13px;
    outline: none;
    background: rgba(255, 255, 255, 0.76);
    color: #1e293b;
    font: inherit;
    font-size: 0.87rem;
    font-weight: 750;
  }

  .reports-control select:focus,
  .reports-control input:focus {
    border-color: #6d5dfc;
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
  }

  .reports-load-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 18px;
    border: 0;
    border-radius: 13px;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 10px 23px rgba(91, 140, 255, 0.24);
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 900;
  }

  .reports-load-button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .reports-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
    color: #b91c1c;
    font-size: 0.84rem;
    font-weight: 750;
  }

  .reports-notice > span {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.12);
    font-weight: 900;
  }

  .reports-notice p {
    flex: 1;
    margin: 0;
  }

  .reports-notice button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.25rem;
  }

  .reports-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 13px;
    padding: 22px 0 6px;
  }

  .reports-summary-card {
    padding: 17px;
    border: 1px solid rgba(255, 255, 255, 0.68);
    border-radius: 17px;
    background: rgba(255, 255, 255, 0.64);
    box-shadow:
      0 8px 24px rgba(15, 23, 42, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(14px);
  }

  .reports-summary-card span,
  .reports-summary-card strong,
  .reports-summary-card small {
    display: block;
  }

  .reports-summary-card span {
    color: #7c5cfc;
    font-size: 0.69rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .reports-summary-card strong {
    margin-top: 8px;
    color: #172033;
    font-size: 1.3rem;
  }

  .reports-summary-card small {
    margin-top: 5px;
    color: #94a3b8;
    font-size: 0.69rem;
  }

  .reports-section {
    padding-top: 30px;
  }

  .reports-section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .reports-section-heading h2 {
    margin: 5px 0 0;
    color: #172033;
    font-size: 1.18rem;
  }

  .reports-section-heading p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .reports-section-count {
    flex: 0 0 auto;
    color: #7c5cfc;
    font-size: 0.72rem;
    font-weight: 900;
  }

  .reports-divider {
    height: 1px;
    margin: 18px 0 0;
    background: rgba(148, 163, 184, 0.2);
  }

  .reports-monthly-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 20px 0 0;
  }

  .reports-monthly-grid > div {
    padding: 5px 20px;
    border-right: 1px solid rgba(148, 163, 184, 0.18);
  }

  .reports-monthly-grid > div:first-child {
    padding-left: 0;
  }

  .reports-monthly-grid > div:last-child {
    border-right: 0;
  }

  .reports-monthly-grid span,
  .reports-monthly-grid strong {
    display: block;
  }

  .reports-monthly-grid span {
    color: #94a3b8;
    font-size: 0.69rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .reports-monthly-grid strong {
    margin-top: 6px;
    color: #172033;
    font-size: 1rem;
  }

  .reports-table-wrap {
    width: 100%;
    max-width: 100%;
    max-height: 360px;
    margin-top: 18px;
    overflow: auto;
    border: 1px solid rgba(148, 163, 184, 0.17);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.52);
    scrollbar-width: thin;
    scrollbar-color: #6c4dff rgba(148, 163, 184, 0.1);
    overscroll-behavior: contain;
  }

  .reports-table-wrap::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .reports-table-wrap::-webkit-scrollbar-track {
    margin: 3px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.1);
  }

  .reports-table-wrap::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    border-radius: 999px;
    background:
      linear-gradient(90deg, #5b8cff, #7b61ff) padding-box;
  }

  .reports-table-wrap::-webkit-scrollbar-thumb:hover {
    background:
      linear-gradient(90deg, #4f7cff, #6c4dff) padding-box;
  }

  .reports-table {
    width: 100%;
    border-collapse: collapse;
  }

  .reports-category-table {
    width: 100%;
    table-layout: fixed;
  }

  .reports-category-col {
    width: 46%;
  }

  .reports-total-col {
    width: 18%;
  }

  .reports-share-col {
    width: 36%;
  }

  .reports-budget-table {
    min-width: 820px;
  }

  .reports-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 13px 15px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    background: rgba(244, 246, 250, 0.97);
    color: #64748b;
    font-size: 0.69rem;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-align: left;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
  }

  .reports-table tbody td {
    padding: 14px 15px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    color: #475569;
    font-size: 0.8rem;
    vertical-align: middle;
  }

  .reports-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .reports-table tbody tr:hover {
    background: rgba(255, 255, 255, 0.54);
  }

  .reports-category-cell {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    min-width: 0;
  }

  .reports-category-details {
    width: 100%;
    min-width: 0;
  }

  .reports-category-details strong {
    display: block;
    color: #334155;
  }

  .reports-description-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    width: 100%;
    max-width: 100%;
    margin-top: 7px;
  }

  .reports-description-chip {
    display: inline-flex;
    align-items: center;
    max-width: 125px;
    min-height: 24px;
    padding: 3px 8px;
    overflow: hidden;
    border: 1px solid rgba(124, 92, 252, 0.16);
    border-radius: 999px;
    background: rgba(124, 92, 252, 0.08);
    color: #64748b;
    font-size: 0.62rem;
    font-weight: 700;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reports-category-dot {
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    margin-top: 4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 0 0 4px rgba(91, 140, 255, 0.1);
  }

  .reports-money-cell {
    white-space: nowrap;
  }

  .reports-share-cell {
    display: grid;
    grid-template-columns: 38px minmax(90px, 1fr);
    align-items: center;
    gap: 9px;
  }

  .reports-progress {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.16);
  }

  .reports-progress > div {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #5b8cff, #7b61ff);
  }

  .reports-status-badge {
    display: inline-flex;
    align-items: center;
    min-height: 27px;
    padding: 0 9px;
    border-radius: 999px;
    font-size: 0.67rem;
    font-weight: 900;
  }

  .reports-status-over {
    background: rgba(255, 100, 103, 0.12);
    color: #dc2626;
  }

  .reports-status-within {
    background: rgba(33, 199, 122, 0.12);
    color: #087f5b;
  }

  .reports-negative-value {
    color: #dc2626 !important;
    font-weight: 800;
  }

  .reports-state {
    display: grid;
    place-items: center;
    min-height: 340px;
    padding: 32px;
    text-align: center;
  }

  .reports-state h2 {
    margin: 15px 0 0;
    color: #172033;
    font-size: 1.1rem;
  }

  .reports-state p {
    max-width: 430px;
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.84rem;
    line-height: 1.6;
  }

  .reports-state-icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 17px;
    background: rgba(109, 93, 252, 0.1);
    color: #6d5dfc;
    font-size: 1.3rem;
  }

  .reports-empty-inline {
    padding: 22px 0 0;
    color: #94a3b8;
    font-size: 0.82rem;
  }

  .reports-loader,
  .reports-button-spinner {
    display: inline-block;
    border-radius: 50%;
    border-style: solid;
    animation: reports-spin 0.75s linear infinite;
  }

  .reports-loader {
    width: 36px;
    height: 36px;
    border-width: 3px;
    border-color: rgba(109, 93, 252, 0.18);
    border-top-color: #6d5dfc;
  }

  .reports-button-spinner {
    width: 14px;
    height: 14px;
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.38);
    border-top-color: white;
  }

  @keyframes reports-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 900px) {
    .reports-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .reports-monthly-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: 16px;
    }

    .reports-monthly-grid > div:nth-child(2) {
      border-right: 0;
    }

    .reports-monthly-grid > div:nth-child(3) {
      padding-left: 0;
    }
  }

  @media (max-width: 760px) {
    .reports-page {
      padding: 18px 6px 28px;
    }

    .reports-header {
      flex-direction: column;
      gap: 14px;
    }

    .reports-controls {
      grid-template-columns: 1fr 1fr;
    }

    .reports-load-button {
      grid-column: 1 / -1;
      width: 100%;
    }

    .reports-section-heading {
      flex-direction: column;
      gap: 8px;
    }

    .reports-table-wrap {
      max-height: 340px;
      overflow-x: auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /*
      Mobile category table:
      Category + Total Spent fit in the visible screen.
      Share stays to the right and is available by horizontal scrolling.
    */
    .reports-category-table {
      width: calc(100vw + 245px);
      min-width: calc(100vw + 245px);
      table-layout: fixed;
    }

    .reports-category-col {
      width: calc(100vw - 132px);
    }

    .reports-total-col {
      width: 112px;
    }

    .reports-share-col {
      width: 265px;
    }

    .reports-category-table th,
    .reports-category-table td {
      padding-left: 10px;
      padding-right: 10px;
    }

    .reports-category-table th:nth-child(2),
    .reports-category-table td:nth-child(2) {
      text-align: right;
    }

    .reports-category-table th:nth-child(2) {
      white-space: normal;
      line-height: 1.2;
    }

    .reports-category-table td:nth-child(2) {
      white-space: nowrap;
    }

    .reports-description-list {
      max-width: 100%;
      gap: 4px;
    }

    .reports-description-chip {
      max-width: 104px;
      min-height: 22px;
      padding: 3px 7px;
      font-size: 0.59rem;
    }

    .reports-share-cell {
      grid-template-columns: 34px minmax(130px, 1fr);
    }
  }

  @media (max-width: 480px) {
    .reports-header h1 {
      font-size: 2rem;
    }

    .reports-controls {
      grid-template-columns: 1fr;
    }

    .reports-load-button {
      grid-column: auto;
    }

    .reports-summary {
      gap: 8px;
    }

    .reports-summary-card {
      padding: 14px 12px;
    }

    .reports-summary-card strong {
      font-size: 1.02rem;
    }

    .reports-monthly-grid {
      grid-template-columns: 1fr 1fr;
    }

    .reports-monthly-grid > div {
      padding: 4px 10px;
    }

    .reports-table-wrap {
      border-radius: 13px;
    }

    .reports-category-col {
      width: calc(100vw - 124px);
    }

    .reports-total-col {
      width: 104px;
    }

    .reports-share-col {
      width: 255px;
    }
  }
`;

export default ReportsPage;