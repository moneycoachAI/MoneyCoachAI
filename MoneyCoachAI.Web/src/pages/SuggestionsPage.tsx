import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSuggestions } from "../services/suggestionService";
import type { SuggestionResponse } from "../types/suggestionTypes";

function SuggestionsPage() {
  const [searchParams] = useSearchParams();

  const monthFromUrl = searchParams.get("month");
  const yearFromUrl = searchParams.get("year");

  const [month, setMonth] = useState(monthFromUrl ?? "6");
  const [year, setYear] = useState(yearFromUrl ?? "2026");
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case "Success":
        return "green";
      case "Warning":
        return "orange";
      case "Danger":
        return "red";
      case "Info":
        return "blue";
      default:
        return "gray";
    }
  };

  const handleLoadSuggestions = async () => {
    try {
      setLoading(true);

      const data = await getSuggestions(Number(month), Number(year));

      setSuggestions(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSuggestionsFromUrl = async () => {
      if (!monthFromUrl || !yearFromUrl) {
        return;
      }

      try {
        setLoading(true);

        const data = await getSuggestions(
          Number(monthFromUrl),
          Number(yearFromUrl)
        );

        setSuggestions(data);
      } catch (error) {
        console.error(error);
        alert("Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    };

    loadSuggestionsFromUrl();
  }, []);

  return (
    <div>
      <h1>Smart Suggestions</h1>

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

        <button onClick={handleLoadSuggestions}>
          Load Suggestions
        </button>
      </div>

      {loading && <p>Loading suggestions...</p>}

      <hr />

      {suggestions.length === 0 ? (
        <p>No suggestions loaded.</p>
      ) : (
        <div>
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.category}-${index}`}
              style={{
                border: `3px solid ${getBorderColor(
                  suggestion.severity
                )}`,
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <h3>{suggestion.type}</h3>

              <p>
                <strong>Severity:</strong> {suggestion.severity}
              </p>

              <p>
                <strong>Category:</strong> {suggestion.category}
              </p>

              <p>{suggestion.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestionsPage;