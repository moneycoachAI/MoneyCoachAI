import { useEffect, useState } from "react";
import {
  createExpense,
  deleteExpense,
  getExpenses,
} from "../services/expenseService";
import type { Expense } from "../types/expenseTypes";

function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);

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


  const handleCreateExpense = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      await createExpense({
        amount: Number(amount),
        category,
        description,
        date,
      });

      setAmount("");
      setCategory("");
      setDescription("");
      setDate("");

      const updatedExpenses = await getExpenses();
      setExpenses(updatedExpenses);

      alert("Expense created successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to create expense");
    }
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
    <div>
      <h1>Expenses</h1>

      <form onSubmit={handleCreateExpense}>
        <div>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
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

        <button type="submit">Add Expense</button>
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
                  <button onClick={() => handleDeleteExpense(expense.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ExpensesPage;