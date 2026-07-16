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

const PIE_COLORS = ["#FF6467", "#4F7CFF"];

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

  const latestCard = [...cards]
  .filter(
    (card) =>
      Number(card.totalIncome) > 0 ||
      Number(card.totalSpent) > 0 ||
      Number(card.savings) !== 0
  )
  .sort((a, b) => b.year - a.year || b.month - a.month)[0];

  const latestMonthData = latestCard
  ? latestCard.savings >= 0
    ? [
        {
          name: "Spent",
          value: Number(latestCard.totalSpent) || 0,
        },
        {
          name: "Saved",
          value: Number(latestCard.savings) || 0,
        },
      ]
    : [
        {
          name: "Income Used",
          value: Number(latestCard.totalIncome) || 0,
        },
        {
          name: "Deficit",
          value: Math.abs(Number(latestCard.savings) || 0),
        },
      ]
  : [];

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <h2 style={{ margin: "0 0 24px" }}>Charts Dashboard</h2>

      {/* Income vs Expenses */}
      <section style={{ marginBottom: "40px" }}>
        <h3 style={{ margin: "0 0 16px" }}>Income vs Expenses</h3>

        <div
          style={{
            width: "100%",
            height: "300px",
            minWidth: 0,
            minHeight: "300px",
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
          >
            <BarChart
              data={incomeExpenseData}
              margin={{
                top: 10,
                right: 20,
                bottom: 10,
                left: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(107, 114, 128, 0.18)"
              />

              <XAxis
                dataKey="month"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />

              <YAxis
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />

              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />

              <Legend />

              <Bar
                dataKey="income"
                name="Income"
                fill="#21C77A"
                radius={[8, 8, 0, 0]}
              />

              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#FF6467"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Savings Trend */}
      <section style={{ marginBottom: "40px" }}>
        <h3 style={{ margin: "0 0 16px" }}>Savings Trend</h3>

        <div
          style={{
            width: "100%",
            height: "300px",
            minWidth: 0,
            minHeight: "300px",
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
          >
            <LineChart
              data={savingsData}
              margin={{
                top: 10,
                right: 20,
                bottom: 10,
                left: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(107, 114, 128, 0.18)"
              />

              <XAxis
                dataKey="month"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />

              <YAxis
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />

              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="#4F7CFF"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#ffffff",
                  stroke: "#4F7CFF",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Latest Month Money Split */}
      {latestCard && (
        <section>

          <h3 style={{ margin: "0 0 16px" }}>
            Latest Month Money Split
            {latestCard
              ? ` - ${latestCard.month}/${latestCard.year}`
              : ""}
          </h3>
          
          <div
            style={{
              width: "100%",
              height: "340px",
              minWidth: 0,
              
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              
            >
              <PieChart>
                <Pie
                  data={latestMonthData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={105}
                  paddingAngle={4}
                  label={({ name, value }) =>
                    `${name}: ₹${Number(value).toLocaleString("en-IN")}`
                  }
                  labelLine
                >
                  {latestMonthData.map((entry, index) => (
                    <Cell
                      key={`pie-${entry.name}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

export default DashboardCharts;