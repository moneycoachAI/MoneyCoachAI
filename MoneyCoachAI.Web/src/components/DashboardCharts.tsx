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
        { name: "Income", value: latestCard.totalIncome },
        { name: "Expenses", value: latestCard.totalSpent },
        { name: "Savings", value: latestCard.savings },
      ]
    : [];

  return (
    <div>
      <h2>Charts Dashboard</h2>

      <div style={{ width: "100%", height: 300 }}>
        <h3>Income vs Expenses</h3>

        <ResponsiveContainer>
          <BarChart data={incomeExpenseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#16a34a" />
            <Bar dataKey="expenses" name="Expenses" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: "100%", height: 300, marginTop: "40px" }}>
        <h3>Savings Trend</h3>

        <ResponsiveContainer>
          <LineChart data={savingsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
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
        <div style={{ width: "100%", height: 300, marginTop: "40px" }}>
          <h3>Latest Month Money Split</h3>

          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={latestMonthData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {latestMonthData.map((_, index) => (
                  <Cell key={index} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default DashboardCharts;