import { useEffect, useState } from "react";
import {
  createInvestment,
  deleteInvestment,
  getInvestmentSummary,
  getInvestments,
  getInvestmentAllocation,
} from "../services/investmentService";
import type {
  Investment,
  InvestmentSummary,
  InvestmentAllocation,
} from "../types/investmentTypes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);

  const [allocation, setAllocation] = useState<InvestmentAllocation[]>([]);

  const [name, setName] = useState("");
  const [type, setType] = useState("Mutual Fund");
  const [investedAmount, setInvestedAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");

  const loadInvestments = async () => {
    const investmentData = await getInvestments();
    const summaryData = await getInvestmentSummary();

    const allocationData = await getInvestmentAllocation();

    setAllocation(allocationData);

    setInvestments(investmentData);
    setSummary(summaryData);
  };

  useEffect(() => {
    const loadInitialInvestments = async () => {
      const investmentData = await getInvestments();
      const summaryData = await getInvestmentSummary();
      const allocationData =  await getInvestmentAllocation();

      setAllocation(allocationData);

      setInvestments(investmentData);
      setSummary(summaryData);
    };

    loadInitialInvestments();
  }, []);

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();

    await createInvestment({
      name,
      type,
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
      investmentDate,
    });

    setName("");
    setType("Mutual Fund");
    setInvestedAmount("");
    setCurrentValue("");
    setInvestmentDate("");

    await loadInvestments();
  };

  const handleDeleteInvestment = async (id: string) => {
    await deleteInvestment(id);
    await loadInvestments();
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>📈 Investment Portfolio</h1>

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
            <h3>Total Invested</h3>
            <h2>₹{summary.totalInvested}</h2>
          </div>

          <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
            <h3>Current Value</h3>
            <h2>₹{summary.totalCurrentValue}</h2>
          </div>

          <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
            <h3>Profit / Loss</h3>
            <h2 style={{ color: summary.totalProfitOrLoss >= 0 ? "green" : "red" }}>
              ₹{summary.totalProfitOrLoss} ({summary.profitOrLossPercentage}%)
            </h2>
          </div>
        </div>
      )}

      {allocation.length > 0 && (
  <div
    style={{
      border: "2px solid #2563eb",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "24px",
    }}
  >
    <h2 style={{ textAlign: "center" }}>
      📊 Investment Allocation
    </h2>

    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={allocation}
          dataKey="amount"
          nameKey="type"
          outerRadius={110}
          label
        >
          {allocation.map((_, index) => {
            const colors = [
              "#2563eb",
              "#16a34a",
              "#dc2626",
              "#ca8a04",
              "#9333ea",
              "#0891b2",
            ];

            return (
              <Cell
                key={index}
                fill={colors[index % colors.length]}
              />
            );
          })}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
)}

      <form onSubmit={handleCreateInvestment} style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Investment name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        >
          <option value="Mutual Fund">Mutual Fund</option>
          <option value="Stock">Stock</option>
          <option value="Gold">Gold</option>
          <option value="FD">FD</option>
          <option value="Crypto">Crypto</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="number"
          placeholder="Invested amount"
          value={investedAmount}
          onChange={(e) => setInvestedAmount(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <input
          type="number"
          placeholder="Current value"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <input
          type="date"
          value={investmentDate}
          onChange={(e) => setInvestmentDate(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
          required
        />

        <button type="submit">➕ Add Investment</button>
      </form>

      {investments.length === 0 ? (
        <p>No investments added yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {investments.map((investment) => (
            <div
              key={investment.id}
              style={{
                border: `2px solid ${
                  investment.profitOrLoss >= 0 ? "green" : "red"
                }`,
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h2>{investment.name}</h2>
              <p>Type: {investment.type}</p>

              <p>
                Invested: ₹{investment.investedAmount} → Current: ₹
                {investment.currentValue}
              </p>

              <p
                style={{
                  color: investment.profitOrLoss >= 0 ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {investment.profitOrLoss >= 0 ? "Profit" : "Loss"}: ₹
                {investment.profitOrLoss} (
                {investment.profitOrLossPercentage}%)
              </p>

              <p>
                Date:{" "}
                {new Date(investment.investmentDate).toLocaleDateString()}
              </p>

              <button onClick={() => handleDeleteInvestment(investment.id)}>
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InvestmentsPage;