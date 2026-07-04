import { useEffect, useState } from "react";
import { incomeSources } from "../constants/incomeSources";
import {
  createIncome,
  deleteIncome,
  getIncomes,
  updateIncome,
} from "../services/incomeService";
import type { Income } from "../types/incomeTypes";
import AppLayout from "../components/AppLayout";

function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncomes = async () => {
      try {
        const data = await getIncomes();
        setIncomes(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load incomes");
      } finally {
        setLoading(false);
      }
    };

    loadIncomes();
  }, []);

  const handleSubmitIncome = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const incomeData = {
      amount: Number(amount),
      source,
      description,
      date,
    };

    try {
      if (editingIncomeId) {
        await updateIncome(editingIncomeId, incomeData);
        alert("Income updated successfully");
      } else {
        await createIncome(incomeData);
        alert("Income created successfully");
      }

      setAmount("");
      setSource("");
      setDescription("");
      setDate("");
      setEditingIncomeId(null);

      const updatedIncomes = await getIncomes();
      setIncomes(updatedIncomes);
    } catch (error) {
      console.error(error);
      alert("Failed to save income");
    }
  };

  const handleEditClick = (income: Income) => {
    setEditingIncomeId(income.id);
    setAmount(income.amount.toString());
    setSource(income.source);
    setDescription(income.description);
    setDate(income.date.split("T")[0]);
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteIncome(id);

      setIncomes((currentIncomes) =>
        currentIncomes.filter((income) => income.id !== id)
      );

      alert("Income deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete income");
    }
  };

  const handleCancelEdit = () => {
    setEditingIncomeId(null);
    setAmount("");
    setSource("");
    setDescription("");
    setDate("");
  };

  if (loading) {
    return <p>Loading incomes...</p>;
  }

  return (
    <AppLayout>
    <div>
      <h1>Incomes</h1>

      <form onSubmit={handleSubmitIncome}>
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
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">Select Income Source</option>

            {incomeSources.map((item) => (
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
          {editingIncomeId ? "Update Income" : "Add Income"}
        </button>

        {editingIncomeId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancel Edit
          </button>
        )}
      </form>

      <hr />

      <h2>Income List</h2>

      {incomes.length === 0 ? (
        <p>No incomes found.</p>
      ) : (
        <table border={1} cellPadding={8}>
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
            {incomes.map((income) => (
              <tr key={income.id}>
                <td>₹{income.amount}</td>
                <td>{income.source}</td>
                <td>{income.description}</td>
                <td>{new Date(income.date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEditClick(income)}>
                    Edit
                  </button>

                  <button onClick={() => handleDeleteIncome(income.id)}>
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

export default IncomesPage;