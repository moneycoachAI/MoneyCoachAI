import { useEffect, useState } from "react";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../services/expenseService";

import { categories } from "../constants/categories";
import type { Expense } from "../types/expenseTypes";
import AppLayout from "../components/AppLayout";

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

useEffect(() => {
  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  loadExpenses();
}, []);


  const handleSubmitExpense = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  try {
    const expenseData = {
      amount: Number(amount),
      category,
      description,
      date,
    };

    if (editingExpenseId) {
      await updateExpense(editingExpenseId, expenseData);
      alert("Expense updated successfully");
    } else {
      await createExpense(expenseData);
      alert("Expense created successfully");
    }

    setAmount("");
    setCategory("");
    setDescription("");
    setDate("");
    setEditingExpenseId(null);

    const updatedExpenses = await getExpenses();
    setExpenses(updatedExpenses);
  } catch (error) {
    console.error(error);
    alert("Failed to save expense");
  }
};

  const handleEditClick = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date.split("T")[0]);
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== id)
      );

      alert("Expense deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete expense");
    }
  };

  if (loading) {
    return <p>Loading expenses...</p>;
  }

  return (
    <AppLayout>
    <div>
      <h1>Expenses</h1>

      <form onSubmit={handleSubmitExpense}>
        <div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

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
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button type="submit">
            {editingExpenseId ? "Update Expense" : "Add Expense"}
        </button>

        {editingExpenseId && (
            <button type="button" onClick={() => {
                setEditingExpenseId(null);
                setAmount("");
                setCategory("");
                setDescription("");
                setDate("");
            }}>
                Cancel Edit
            </button>
        )}
      </form>

      <hr />

      <h2>Expense List</h2>

      {expenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <table border={1} cellPadding={8}>
          <thead>
            <tr>
              <th>Amount</th>
              <th>Category</th>
              <th>Description</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>₹{expense.amount}</td>
                <td>{expense.category}</td>
                <td>{expense.description}</td>
                <td>{new Date(expense.date).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEditClick(expense)}>Edit</button>
                    <button onClick={() => handleDeleteExpense(expense.id)}>Delete</button>
                  </div>
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

export default ExpensesPage;