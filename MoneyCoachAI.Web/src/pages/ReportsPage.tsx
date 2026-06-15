import { useState } from "react";
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

  const handleLoadReports = async () => {
    try {
      setLoading(true);

      const selectedMonth = Number(month);
      const selectedYear = Number(year);

      const monthlyData = await getMonthlyReport(
        selectedMonth,
        selectedYear
      );

      const categoryData = await getCategoryReport(
        selectedMonth,
        selectedYear
      );

      const budgetData = await getBudgetSummary(
        selectedMonth,
        selectedYear
      );

      setMonthlyReport(monthlyData);
      setCategoryReport(categoryData);
      setBudgetSummary(budgetData);
    } catch (error) {
      console.error(error);
      alert("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Reports</h1>

      <div>
        <input
          type="number"
          placeholder="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />

        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <button onClick={handleLoadReports}>
          Load Reports
        </button>
      </div>

      {loading && <p>Loading reports...</p>}

      <hr />

      <h2>Monthly Report</h2>

      {monthlyReport ? (
        <div>
          <p>Month: {monthlyReport.month}</p>
          <p>Year: {monthlyReport.year}</p>
          <p>Total Spent: ₹{monthlyReport.totalSpent}</p>
        </div>
      ) : (
        <p>No monthly report loaded.</p>
      )}

      <hr />

      <h2>Category Report</h2>

      {categoryReport.length === 0 ? (
        <p>No category data found.</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Total Spent</th>
            </tr>
          </thead>

          <tbody>
            {categoryReport.map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>₹{item.totalSpent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr />

      <h2>Budget Summary</h2>

      {budgetSummary.length === 0 ? (
        <p>No budget summary found.</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Budget Limit</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {budgetSummary.map((item) => (
              <tr key={item.category}>
                <td>{item.category}</td>
                <td>₹{item.budgetLimit}</td>
                <td>₹{item.spent}</td>
                <td>₹{item.remaining}</td>
                <td>
                  {item.isOverBudget
                    ? "Over Budget"
                    : "Within Budget"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ReportsPage;