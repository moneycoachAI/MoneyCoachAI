import { useEffect, useState } from "react";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  generateRecurringTransactions,
  getRecurringTransactions,
} from "../services/recurringTransactionService";
import type { RecurringTransaction } from "../types/recurringTransactionTypes";
import AppLayout from "../components/AppLayout";

function RecurringTransactionsPage() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Income");
  const [frequency, setFrequency] = useState("Monthly");
  const [startDate, setStartDate] = useState("");

  const [generateMonth, setGenerateMonth] = useState("");
  const [generateYear, setGenerateYear] = useState("2026");

  const loadTransactions = async () => {
    const data = await getRecurringTransactions();
    setTransactions(data);
  };

  useEffect(() => {
    const loadInitialTransactions = async () => {
      const data = await getRecurringTransactions();
      setTransactions(data);
    };

    loadInitialTransactions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    await createRecurringTransaction({
      title,
      amount: Number(amount),
      category,
      type,
      frequency,
      startDate,
    });

    setTitle("");
    setAmount("");
    setCategory("");
    setType("Income");
    setFrequency("Monthly");
    setStartDate("");

    await loadTransactions();
  };

  const handleDelete = async (id: string) => {
    await deleteRecurringTransaction(id);
    await loadTransactions();
  };

  const handleGenerate = async () => {
    if (!generateMonth || !generateYear) {
      alert("Please enter month and year");
      return;
    }

  const message = await generateRecurringTransactions(
    Number(generateMonth),
    Number(generateYear)
  );

    alert(message);

  };

  const incomeTransactions = transactions.filter(
    (transaction) => transaction.type === "Income"
  );

  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "Expense"
  );

  return (
    <AppLayout>
    <div style={{ padding: "24px" }}>
      <h1>📅 Recurring Transactions</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Title e.g. Monthly Salary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <input
          type="text"
          placeholder="Category / Source"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        >
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        >
          <option value="Monthly">Monthly</option>
          <option value="Weekly">Weekly</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <button type="submit">➕ Add Recurring</button>
      </form>

      <div
        style={{
          border: "2px solid #2563eb",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <h2>Generate Monthly Entries</h2>

        <input
          type="number"
          placeholder="Month"
          value={generateMonth}
          onChange={(e) => setGenerateMonth(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />

        <input
          type="number"
          placeholder="Year"
          value={generateYear}
          onChange={(e) => setGenerateYear(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        />

        <button onClick={handleGenerate}>⚙️ Generate</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <div>
          <h2>Recurring Income</h2>

          {incomeTransactions.length === 0 ? (
            <p>No recurring income added.</p>
          ) : (
            incomeTransactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  border: "2px solid green",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3>{transaction.title}</h3>
                <p>₹{transaction.amount}</p>
                <p>Source: {transaction.category}</p>
                <p>Frequency: {transaction.frequency}</p>
                <p>
                  Start Date:{" "}
                  {new Date(transaction.startDate).toLocaleDateString()}
                </p>

                <button onClick={() => handleDelete(transaction.id)}>
                  🗑 Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <h2>Recurring Expenses</h2>

          {expenseTransactions.length === 0 ? (
            <p>No recurring expenses added.</p>
          ) : (
            expenseTransactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  border: "2px solid red",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3>{transaction.title}</h3>
                <p>₹{transaction.amount}</p>
                <p>Category: {transaction.category}</p>
                <p>Frequency: {transaction.frequency}</p>
                <p>
                  Start Date:{" "}
                  {new Date(transaction.startDate).toLocaleDateString()}
                </p>

                <button onClick={() => handleDelete(transaction.id)}>
                  🗑 Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}

export default RecurringTransactionsPage;