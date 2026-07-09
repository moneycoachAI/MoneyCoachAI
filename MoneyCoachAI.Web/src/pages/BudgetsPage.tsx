import { useEffect, useState } from "react";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../services/budgetService";
import { categories } from "../constants/categories";
import type { Budget } from "../types/budgetTypes";
import AppLayout from "../components/AppLayout";


function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const data = await getBudgets();
        setBudgets(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load budgets");
      } finally {
        setLoading(false);
      }
    };

    loadBudgets();
  }, []);

  const handleSubmitBudget = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const budgetData = {
      category,
      monthlyLimit: Number(monthlyLimit),
      month: Number(month),
      year: Number(year),
    };

    try {
      if (editingBudgetId) {
        await updateBudget(editingBudgetId, budgetData);
        alert("Budget updated successfully");
      } else {
        await createBudget(budgetData);
        alert("Budget created successfully");
      }

      setCategory("");
      setMonthlyLimit("");
      setMonth("");
      setYear("");
      setEditingBudgetId(null);

      const updatedBudgets = await getBudgets();
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error(error);
      alert("Failed to save budget");
    }
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setCategory(budget.category);
    setMonthlyLimit(budget.monthlyLimit.toString());
    setMonth(budget.month.toString());
    setYear(budget.year.toString());
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id);

      setBudgets((currentBudgets) =>
        currentBudgets.filter((budget) => budget.id !== id)
      );

      alert("Budget deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete budget");
    }
  };

  const handleCancelEdit = () => {
    setEditingBudgetId(null);
    setCategory("");
    setMonthlyLimit("");
    setMonth("");
    setYear("");
  };

  if (loading) {
    return <p>Loading budgets...</p>;
  }

  return (
    <AppLayout>
    <div>
      <h1>Budgets</h1>

      <form onSubmit={handleSubmitBudget}>
        <div>
          <select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  <option value="">Select Category</option>

  {categories.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>
        </div>

        <div>
          <input
            type="number"
            placeholder="Monthly Limit"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
          />
        </div>

        <div>
          <input
            type="number"
            placeholder="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div>
          <input
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>

        <button type="submit">
          {editingBudgetId ? "Update Budget" : "Add Budget"}
        </button>

        {editingBudgetId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancel Edit
          </button>
        )}
      </form>

      <hr />

      <h2>Budget List</h2>

      {budgets.length === 0 ? (
        <p>No budgets found.</p>
      ) : (
        <table border={1} cellPadding={8}>
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
            {budgets.map((budget) => (
              <tr key={budget.id}>
                <td>{budget.category}</td>
                <td>₹{budget.monthlyLimit}</td>
                <td>{budget.month}</td>
                <td>{budget.year}</td>
                <td>
                  <button onClick={() => handleEditClick(budget)}>
                    Edit
                  </button>

                  <button onClick={() => handleDeleteBudget(budget.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
    </AppLayout>
  );
}

export default BudgetsPage;