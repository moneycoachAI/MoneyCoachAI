import { useState } from "react";
import { getAIAdvice } from "../services/aiService";

function AIAdvisorPage() {
  const [month, setMonth] = useState("6");
  const [year, setYear] = useState("2026");
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!question.trim()) {
      alert("Please enter a question");
      return;
    }

    try {
      setLoading(true);

      const response = await getAIAdvice({
        month: Number(month),
        year: Number(year),
        question,
      });

      setAdvice(response.advice);
    } catch (error) {
      console.error(error);

      setAdvice(
        "AI service unavailable. OpenAI API key may not be configured."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Financial Advisor</h1>

      <div>
        <input
          type="number"
          placeholder="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />

        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      <br />

      <textarea
        rows={5}
        cols={60}
        placeholder="Ask a financial question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <br />

      <button onClick={handleAskAI} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {advice && (
        <>
          <hr />
          <h2>AI Advice</h2>
          <p>{advice}</p>
        </>
      )}
    </div>
  );
}

export default AIAdvisorPage;