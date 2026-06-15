import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBudgets, getExpenses } from "../services/dashboardService";
import type { Budget } from "../types/budgetTypes";
import type { Expense } from "../types/expenseTypes";

function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const expensesData = await getExpenses();
        const budgetsData = await getBudgets();

        setExpenses(expensesData);
        setBudgets(budgetsData);
      } catch (error) {
        console.error(error);
        alert("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const totalBudget = budgets.reduce(
    (sum, budget) => sum + budget.monthlyLimit,
    0
  );

  const remainingBudget = totalBudget - totalExpenses;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <h1>MoneyCoachAI Dashboard</h1>

      <button onClick={handleLogout}>Logout</button>

      <hr />

      <h2>Summary</h2>

      <p>Total Expenses: ₹{totalExpenses}</p>
      <p>Total Budget: ₹{totalBudget}</p>
      <p>Remaining Budget: ₹{remainingBudget}</p>

      <hr />

      <h2>Latest Expenses</h2>

      {expenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <ul>
          {expenses.slice(0, 5).map((expense) => (
            <li key={expense.id}>
              ₹{expense.amount} - {expense.category} - {expense.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DashboardPage;