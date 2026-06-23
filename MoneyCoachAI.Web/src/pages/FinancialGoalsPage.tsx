import { useEffect, useState } from "react";
import {
  addGoalProgress,
  createFinancialGoal,
  deleteFinancialGoal,
  getFinancialGoals,
  getGoalRecommendations,
} from "../services/financialGoalService";
import type { FinancialGoal } from "../types/financialGoalTypes";
import type { GoalRecommendation } from "../types/goalRecommendationTypes";

function FinancialGoalsPage() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progressAmounts, setProgressAmounts] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<
    GoalRecommendation[]
    >([]);

  const [expandedHistory, setExpandedHistory] = useState<
  Record<string, boolean>
  >({});
 
    const loadGoals = async () => {
    const data = await getFinancialGoals();
    const recommendationData = await getGoalRecommendations();

    setGoals(data);
    setRecommendations(recommendationData);
    };

  useEffect(() => {
    const loadInitialGoals = async () => {
        const data = await getFinancialGoals();
        const recommendationData = await getGoalRecommendations();

        setGoals(data);
        setRecommendations(recommendationData);
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
            const recommendation = recommendations.find(
                (item) => item.goalName === goal.name
            );
            const status =
              goal.progressPercentage >= 100
                ? "🏆 Goal Achieved"
                : "🟡 In Progress";
              

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

                <div
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      backgroundColor:
                        goal.progressPercentage >= 100
                          ? "#dcfce7"
                          : "#fef3c7",
                      color:
                        goal.progressPercentage >= 100
                          ? "#166534"
                          : "#92400e",
                      fontWeight: "bold",
                      marginBottom: "10px",
                    }}
                  >
                    {status}
                </div>

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
                {recommendation && (
  <div
    style={{
      marginTop: "16px",
      padding: "12px",
      borderRadius: "10px",
      backgroundColor: "#fef3c7",
      border: "1px solid #f59e0b",
    }}
  >
    <h3>💡 Goal Recommendation</h3>

    <p>
      <strong>Remaining:</strong> ₹
      {recommendation.remainingAmount}
    </p>

    <p>{recommendation.recommendationMessage}</p>

    {recommendation.additionalMonthlySavingsNeeded > 0 && (
      <p>
        <strong>Extra Savings Needed:</strong> ₹
        {recommendation.additionalMonthlySavingsNeeded.toFixed(2)}
      </p>
    )}

    

   {recommendation.monthsUntilTargetDate > 0 && (
      <p>
        <strong>Months Until Target Date:</strong>{" "}
        {recommendation.monthsUntilTargetDate}
      </p>
    )}

    <p>
      <strong>Suggested Monthly Contribution:</strong> ₹
      {recommendation.requiredMonthlyContribution.toFixed(2)}
    </p>

    {recommendation.additionalMonthlySavingsNeeded > 0 && (
      <p style={{ color: "red", fontWeight: "bold" }}>
        <strong>Extra Savings Needed:</strong> ₹
        {recommendation.additionalMonthlySavingsNeeded.toFixed(2)}
      </p>
    )}

    
      {goal.progressHistory.length > 0 && (
  <div style={{ marginTop: "16px" }}>
    <button
      onClick={() =>
        setExpandedHistory((current) => ({
          ...current,
          [goal.id]: !current[goal.id],
        }))
      }
    >
      {expandedHistory[goal.id]
        ? "📂 Hide History"
        : `📜 Show History (${goal.progressHistory.length})`}
    </button>

    {expandedHistory[goal.id] && (
      <div
        style={{
          marginTop: "12px",
          padding: "12px",
          borderRadius: "10px",
          backgroundColor: "#f9fafb",
          border: "1px solid #d1d5db",
        }}
      >
        <h3>💰 Progress History</h3>

        {goal.progressHistory.map((entry, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #e5e7eb",
              padding: "6px 0",
            }}
          >
            <span>₹{entry.amount}</span>

            <span>
              {new Date(entry.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
)}

  </div>

  
)}

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