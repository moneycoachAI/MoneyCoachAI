import { useEffect, useState } from "react";
import {
  createNetWorthItem,
  deleteNetWorthItem,
  getNetWorthItems,
  getNetWorthSummary,
  getNetWorthTrend,
} from "../services/netWorthService";
import type {
  NetWorthItem,
  NetWorthSummary,
  NetWorthTrendPoint,
} from "../types/netWorthTypes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import AppLayout from "../components/AppLayout";

function NetWorthPage() {
  const [items, setItems] = useState<NetWorthItem[]>([]);
  const [summary, setSummary] = useState<NetWorthSummary | null>(null);

  const [trend, setTrend] = useState<NetWorthTrendPoint[]>([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Asset");

  const loadNetWorthData = async () => {
    const itemsData = await getNetWorthItems();
    const summaryData = await getNetWorthSummary();
    const trendData = await getNetWorthTrend();

    setTrend(trendData);

    setItems(itemsData);
    setSummary(summaryData);
  };

  useEffect(() => {
    const loadInitialNetWorthData = async () => {
      const itemsData = await getNetWorthItems();
      const summaryData = await getNetWorthSummary();
      const trendData = await getNetWorthTrend();

      setTrend(trendData);

      setItems(itemsData);
      setSummary(summaryData);
    };

    loadInitialNetWorthData();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    await createNetWorthItem({
      name,
      amount: Number(amount),
      type,
    });

    setName("");
    setAmount("");
    setType("Asset");

    await loadNetWorthData();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteNetWorthItem(id);
    await loadNetWorthData();
  };

  const assets = items.filter((item) => item.type === "Asset");
  const liabilities = items.filter((item) => item.type === "Liability");

  return (
    <AppLayout>
    <div style={{ padding: "24px" }}>
      <h1>💎 Net Worth Tracker</h1>

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
            <h3>Total Assets</h3>
            <h2 style={{ color: "green" }}>₹{summary.totalAssets}</h2>
          </div>

          <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
            <h3>Total Liabilities</h3>
            <h2 style={{ color: "red" }}>₹{summary.totalLiabilities}</h2>
          </div>

          <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
            <h3>Net Worth</h3>
            <h2 style={{ color: summary.netWorth >= 0 ? "green" : "red" }}>
              ₹{summary.netWorth}
            </h2>
          </div>
        </div>
      )}

      {trend.length > 0 && (
  <div
    style={{
      border: "2px solid #7c3aed",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "24px",
    }}
  >
    <h2>📈 Net Worth Trend</h2>

    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={trend.map((point) => ({
          date: new Date(point.snapshotDate).toLocaleDateString(),
          netWorth: point.netWorth,
        }))}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="netWorth"
          stroke="#7c3aed"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
)}

      <form onSubmit={handleCreateItem} style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Name e.g. Bank Account"
          value={name}
          onChange={(e) => setName(e.target.value)}
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

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "8px", marginRight: "8px" }}
        >
          <option value="Asset">Asset</option>
          <option value="Liability">Liability</option>
        </select>

        <button type="submit">Add Item</button>
      </form>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <div>
          <h2>Assets</h2>

          {assets.length === 0 ? (
            <p>No assets added.</p>
          ) : (
            assets.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "2px solid green",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3>{item.name}</h3>
                <p>₹{item.amount}</p>

                <button onClick={() => handleDeleteItem(item.id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <h2>Liabilities</h2>

          {liabilities.length === 0 ? (
            <p>No liabilities added.</p>
          ) : (
            liabilities.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "2px solid red",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <h3>{item.name}</h3>
                <p>₹{item.amount}</p>

                <button onClick={() => handleDeleteItem(item.id)}>
                  Delete
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

export default NetWorthPage;