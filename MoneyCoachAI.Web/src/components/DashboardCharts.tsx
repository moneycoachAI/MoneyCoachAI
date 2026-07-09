import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyDashboardCard } from "../types/dashboardTypes";

interface DashboardChartsProps {
  cards: MonthlyDashboardCard[];
}

function DashboardCharts({ cards }: DashboardChartsProps) {
  const incomeExpenseData = cards.map((card) => ({
    month: `${card.month}/${card.year}`,
    income: card.totalIncome,
    expenses: card.totalSpent,
  }));

  const savingsData = cards.map((card) => ({
    month: `${card.month}/${card.year}`,
    savings: card.savings,
  }));

  const latestCard = cards[cards.length - 1];

  const latestMonthData = latestCard
    ? [
        { name: "Income", value: latestCard.totalIncome, color: "#16a34a" },
        { name: "Expenses", value: latestCard.totalSpent, color: "#dc2626" },
        { name: "Savings", value: latestCard.savings, color: "#2563eb" },
      ]
    : [];

  const pieLegendPayload = latestMonthData.map((entry) => ({
    value: entry.name,
    type: "circle" as const,
    id: entry.name,
    color: entry.color,
  }));

  return (
    <div style={{ color: "#f8fafc", display: "grid", gap: "40px" }}>
      <h2 style={{ marginBottom: "0", color: "#f8fafc" }}>Charts Dashboard</h2>

      <div style={{ width: "100%", minHeight: 460, height: 460, padding: "20px", borderRadius: "18px", backgroundColor: "#111827", border: "1px solid #334155", boxSizing: "border-box", overflow: "hidden" }}>
        <h3 style={{ margin: "0 0 16px", color: "#f8fafc" }}>Income vs Expenses</h3>

        <ResponsiveContainer>
          <BarChart data={incomeExpenseData} margin={{ top: 20, right: 20, left: 0, bottom: 32 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fill: "#cbd5e1" }} />
            <YAxis stroke="#cbd5e1" tick={{ fill: "#cbd5e1" }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} cursor={{ fill: "rgba(255,255,255,0.08)" }} itemStyle={{ color: "#e2e8f0" }} />
            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ color: "#f8fafc", paddingTop: "12px" }} />
            <Bar dataKey="income" name="Income" fill="#16a34a" />
            <Bar dataKey="expenses" name="Expenses" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: "100%", minHeight: 460, height: 460, marginTop: "0", padding: "20px", borderRadius: "18px", backgroundColor: "#111827", border: "1px solid #334155", boxSizing: "border-box", overflow: "hidden" }}>
        <h3 style={{ margin: "0 0 16px", color: "#f8fafc" }}>Savings Trend</h3>

        <ResponsiveContainer>
          <LineChart data={savingsData} margin={{ top: 20, right: 20, left: 0, bottom: 32 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fill: "#cbd5e1" }} />
            <YAxis stroke="#cbd5e1" tick={{ fill: "#cbd5e1" }} />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} cursor={{ stroke: "#2563eb", strokeWidth: 1 }} itemStyle={{ color: "#e2e8f0" }} />
            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ color: "#f8fafc", paddingTop: "12px" }} />
            <Line
              type="monotone"
              dataKey="savings"
              name="Savings"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latestCard && (
        <div style={{ width: "100%", minHeight: 460, height: 460, marginTop: "0", padding: "20px", borderRadius: "18px", backgroundColor: "#111827", border: "1px solid #334155", boxSizing: "border-box", overflow: "hidden" }}>
          <h3 style={{ margin: "0 0 16px", color: "#f8fafc" }}>Latest Month Money Split</h3>

          <ResponsiveContainer>
            <PieChart margin={{ top: 20, right: 20, left: 0, bottom: 32 }}>
              <Pie
                data={latestMonthData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {latestMonthData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                payload={pieLegendPayload}
                wrapperStyle={{ color: "#f8fafc", paddingTop: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default DashboardCharts;