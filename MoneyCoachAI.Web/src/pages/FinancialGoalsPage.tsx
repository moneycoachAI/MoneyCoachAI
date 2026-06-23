import { useEffect, useState } from "react";
import {
  addGoalProgress,
  createFinancialGoal,
  deleteFinancialGoal,
  getFinancialGoals,
} from "../services/financialGoalService";
import type { FinancialGoal } from "../types/financialGoalTypes";

function FinancialGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progressAmounts, setProgressAmounts] = useState<Record<string, string>>({});

  const loadGoals = async () => {
    const data = await getFinancialGoals();
    setGoals(data);
  };

  useEffect(() => {
    const loadInitialGoals = async () => {
      const data = await getFinancialGoals();
      setGoals(data);
    };

    loadInitialGoals();
  }, []);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "green";
    if (progress >= 80) return "#2563eb";
    if (progress >= 50) return "orange";
    return "red";
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    await createFinancialGoal({
      name,
      targetAmount: Number(targetAmount),
      targetDate: targetDate || undefined,
    });

    setName("");
    setTargetAmount("");
    setTargetDate("");

    await loadGoals();
  };

  const handleAddProgress = async (goalId: string) => {
    const amount = Number(progressAmounts[goalId]);

    if (!amount || amount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    await addGoalProgress(goalId, amount);

    setProgressAmounts((current) => ({
      ...current,
      [goalId]: "",
    }));

    await loadGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteFinancialGoal(goalId);
    await loadGoals();
  };

  const totalTarget = goals.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.progressPercentage >= 100
  ).length;

  return (
    <div style={{ padding: "24px" }}>
      <h1>🎯 Financial Goals</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
          <h3>Total Goals</h3>
          <h2>{goals.length}</h2>
        </div>

        <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
          <h3>Total Target</h3>
          <h2>₹{totalTarget}</h2>
        </div>

        <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "12px" }}>
          <h3>Completed Goals</h3>
          <h2>{completedGoals}</h2>
        </div>
      </div>

      <form onSubmit={handleCreateGoal} style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Goal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "8px", padding: "8px" }}
          required
        />

        <input
          type="number"
          placeholder="Target amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          style={{ marginRight: "8px", padding: "8px" }}
          required
        />

        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          style={{ marginRight: "8px", padding: "8px" }}
        />

        <button type="submit">🎯 Create Goal</button>
      </form>

      {goals.length === 0 ? (
        <p>No financial goals yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {goals.map((goal) => {
            const progressColor = getProgressColor(goal.progressPercentage);
            const status =
              goal.progressPercentage >= 100 ? "Completed" : "In Progress";

            return (
              <div
                key={goal.id}
                style={{
                  border: `2px solid ${progressColor}`,
                  borderRadius: "16px",
                  padding: "20px",
                }}
              >
                <h2>🎯 {goal.name}</h2>

                <strong
                  style={{
                    color: progressColor,
                  }}
                >
                  {status}
                </strong>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginTop: "16px",
                  }}
                >
                  <div>
                    <strong>Saved</strong>
                    <p>₹{goal.currentAmount}</p>
                  </div>

                  <div>
                    <strong>Target</strong>
                    <p>₹{goal.targetAmount}</p>
                  </div>

                  <div>
                    <strong>Progress</strong>
                    <p>{goal.progressPercentage.toFixed(1)}%</p>
                  </div>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "14px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "8px",
                    marginTop: "12px",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(goal.progressPercentage, 100)}%`,
                      height: "100%",
                      backgroundColor: progressColor,
                      borderRadius: "8px",
                    }}
                  />
                </div>

                {goal.targetDate && (
                  <p>
                    Target Date:{" "}
                    {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                )}

                <div style={{ marginTop: "12px" }}>
                  <input
                    type="number"
                    placeholder="Add progress amount"
                    value={progressAmounts[goal.id] ?? ""}
                    onChange={(e) =>
                      setProgressAmounts((current) => ({
                        ...current,
                        [goal.id]: e.target.value,
                      }))
                    }
                    style={{ marginRight: "8px", padding: "8px" }}
                  />

                  <button onClick={() => handleAddProgress(goal.id)}>
                    ➕ Add Progress
                  </button>

                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    style={{ marginLeft: "8px" }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FinancialGoalsPage;