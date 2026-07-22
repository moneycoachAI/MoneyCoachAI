import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { getSuggestions } from "../services/suggestionService";
import type { SuggestionResponse } from "../types/suggestionTypes";

import {
  isFutureMonth,
} from "../utils/dateUtils";

type Notice = {
  type: "error";
  message: string;
};

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function SuggestionsPage() {
  const [searchParams] = useSearchParams();

  const monthFromUrl = searchParams.get("month");
  const yearFromUrl = searchParams.get("year");

  const [month, setMonth] = useState(monthFromUrl ?? "6");
  const [year, setYear] = useState(yearFromUrl ?? "2026");
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(Boolean(monthFromUrl && yearFromUrl));
  const [notice, setNotice] = useState<Notice | null>(null);

  const selectedMonthName = useMemo(
    () => MONTH_OPTIONS.find((item) => item.value === month)?.label ?? "Selected month",
    [month]
  );

  const severityCounts = useMemo(() => {
    return suggestions.reduce(
      (counts, suggestion) => {
        const severity = suggestion.severity?.toLowerCase();

        if (severity === "danger") counts.danger += 1;
        else if (severity === "warning") counts.warning += 1;
        else if (severity === "success") counts.success += 1;
        else counts.info += 1;

        return counts;
      },
      { danger: 0, warning: 0, success: 0, info: 0 }
    );
  }, [suggestions]);

  const loadSuggestions = async (selectedMonth: string, selectedYear: string) => {
    const monthNumber = Number(selectedMonth);
    const yearNumber = Number(selectedYear);

    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      setNotice({ type: "error", message: "Please select a valid month." });
      return;
    }

    if (!Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      setNotice({
        type: "error",
        message: "Please enter a valid year between 2000 and 2100.",
      });
      return;
    }

    if (isFutureMonth(monthNumber, yearNumber)) {
      setNotice({
        type: "error",
        message:
          "Suggestions cannot be loaded for a future month.",
      });
      return;
    }

    try {
      setLoading(true);
      setNotice(null);
      setHasLoaded(true);

      const data = await getSuggestions(monthNumber, yearNumber);
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      setNotice({
        type: "error",
        message: "Failed to load suggestions. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!monthFromUrl || !yearFromUrl) return;

    const timer = window.setTimeout(() => {
      void loadSuggestions(monthFromUrl, yearFromUrl);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [monthFromUrl, yearFromUrl]);

  return (
    <AppLayout>
      <main className="suggestions-page">
        <header className="suggestions-header">
          <div>
            <span className="suggestions-eyebrow">Smart guidance</span>
            <h1>Financial Suggestions</h1>
            <p>
              Review recommendations generated from your income, expenses and
              budget activity for a selected month.
            </p>
          </div>

          {hasLoaded && (
            <div className="suggestions-period">
              <small>Viewing period</small>
              <strong>{selectedMonthName} {year}</strong>
            </div>
          )}
        </header>

        <section className="suggestions-controls">
          <div className="suggestions-control">
            <label htmlFor="suggestions-month">Month</label>
            <select
              id="suggestions-month"
              value={month}
              disabled={loading}
              onChange={(event) => {
                setMonth(event.target.value);
                setNotice(null);
              }}
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="suggestions-control">
            <label htmlFor="suggestions-year">Year</label>
            <input
              id="suggestions-year"
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={year}
              disabled={loading}
              onChange={(event) => {
                setYear(event.target.value);
                setNotice(null);
              }}
            />
          </div>

          <button
            type="button"
            className="suggestions-load-button"
            disabled={loading}
            onClick={() => void loadSuggestions(month, year)}
          >
            {loading ? (
              <>
                <span className="suggestions-button-spinner" />
                Loading...
              </>
            ) : (
              "Load Suggestions"
            )}
          </button>
        </section>

        {notice && (
          <div className="suggestions-notice" role="alert">
            <span>!</span>
            <p>{notice.message}</p>
            <button type="button" onClick={() => setNotice(null)} aria-label="Close error">
              ×
            </button>
          </div>
        )}

        {hasLoaded && !loading && suggestions.length > 0 && (
          <section className="suggestions-summary">
            <div><span>Total</span><strong>{suggestions.length}</strong></div>
            <div><span>Critical</span><strong>{severityCounts.danger}</strong></div>
            <div><span>Warnings</span><strong>{severityCounts.warning}</strong></div>
            <div>
              <span>Positive</span>
              <strong>{severityCounts.success + severityCounts.info}</strong>
            </div>
          </section>
        )}

        <section className="suggestions-content">
          {loading ? (
            <div className="suggestions-state">
              <span className="suggestions-loader" />
              <h2>Preparing your suggestions</h2>
              <p>We are reviewing your financial activity for this period.</p>
            </div>
          ) : !hasLoaded ? (
            <div className="suggestions-state">
              <div className="suggestions-state-icon">💡</div>
              <h2>Select a month to begin</h2>
              <p>Choose a month and year above to view your financial suggestions.</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="suggestions-state">
              <div className="suggestions-state-icon">✓</div>
              <h2>No suggestions for this period</h2>
              <p>There are no recommendations available for {selectedMonthName} {year}.</p>
            </div>
          ) : (
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => {
                const tone = getSeverityTone(suggestion.severity);

                return (
                  <article
                    key={`${suggestion.type}-${suggestion.category}-${index}`}
                    className={`suggestion-item suggestion-item-${tone}`}
                  >
                    <div className="suggestion-item-mark">{getSeverityIcon(tone)}</div>

                    <div className="suggestion-item-body">
                      <div className="suggestion-item-topline">
                        <div>
                          <span className="suggestion-category">
                            {suggestion.category || "General"}
                          </span>
                          <h2>{suggestion.type}</h2>
                        </div>

                        <span className={`suggestion-severity severity-${tone}`}>
                          {suggestion.severity}
                        </span>
                      </div>

                      <p>{suggestion.message}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <style>{suggestionsStyles}</style>
      </main>
    </AppLayout>
  );
}

function getSeverityTone(severity: string) {
  switch (severity?.toLowerCase()) {
    case "danger": return "danger";
    case "warning": return "warning";
    case "success": return "success";
    case "info": return "info";
    default: return "neutral";
  }
}

function getSeverityIcon(tone: string) {
  switch (tone) {
    case "danger": return "!";
    case "warning": return "⚠";
    case "success": return "✓";
    case "info": return "i";
    default: return "•";
  }
}

const suggestionsStyles = `
  .suggestions-page,
  .suggestions-page * {
    box-sizing: border-box;
  }

  .suggestions-page {
    width: 100%;
    min-height: 100%;
    padding: 26px 1% 34px;
    color: #111827;
  }

  .suggestions-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }

  .suggestions-eyebrow {
    display: block;
    color: #6d5dfc;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .suggestions-header h1 {
    margin: 7px 0 0;
    font-size: clamp(2rem, 3.2vw, 2.75rem);
    line-height: 1.05;
    letter-spacing: -0.045em;
  }

  .suggestions-header p {
    max-width: 700px;
    margin: 10px 0 0;
    color: #64748b;
    font-size: 0.96rem;
    line-height: 1.65;
  }

  .suggestions-period {
    flex: 0 0 auto;
    padding: 7px 0 7px 18px;
    border-left: 2px solid rgba(109, 93, 252, 0.22);
  }

  .suggestions-period small,
  .suggestions-period strong {
    display: block;
  }

  .suggestions-period small {
    color: #94a3b8;
    font-size: 0.68rem;
  }

  .suggestions-period strong {
    margin-top: 3px;
    color: #334155;
    font-size: 0.9rem;
  }

  .suggestions-controls {
    display: grid;
    grid-template-columns: minmax(180px, 260px) minmax(150px, 200px) auto;
    align-items: end;
    gap: 13px;
    padding: 24px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .suggestions-control label {
    display: block;
    margin: 0 0 7px 2px;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 900;
  }

  .suggestions-control select,
  .suggestions-control input {
    width: 100%;
    min-height: 46px;
    padding: 0 13px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 13px;
    outline: none;
    background: rgba(255, 255, 255, 0.76);
    color: #1e293b;
    font: inherit;
    font-size: 0.87rem;
    font-weight: 750;
  }

  .suggestions-control select:focus,
  .suggestions-control input:focus {
    border-color: #6d5dfc;
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
  }

  .suggestions-load-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 18px;
    border: 0;
    border-radius: 13px;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 10px 23px rgba(91, 140, 255, 0.24);
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 900;
  }

  .suggestions-load-button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .suggestions-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 0;
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
    color: #b91c1c;
    font-size: 0.84rem;
    font-weight: 750;
  }

  .suggestions-notice > span {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.12);
    font-weight: 900;
  }

  .suggestions-notice p {
    flex: 1;
    margin: 0;
  }

  .suggestions-notice button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.25rem;
  }

  .suggestions-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 18px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .suggestions-summary > div {
    padding: 3px 20px;
    border-right: 1px solid rgba(148, 163, 184, 0.18);
  }

  .suggestions-summary > div:first-child {
    padding-left: 0;
  }

  .suggestions-summary > div:last-child {
    border-right: 0;
  }

  .suggestions-summary span,
  .suggestions-summary strong {
    display: block;
  }

  .suggestions-summary span {
    color: #94a3b8;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .suggestions-summary strong {
    margin-top: 5px;
    color: #172033;
    font-size: 1.2rem;
  }

  .suggestions-content {
    padding-top: 24px;
  }

  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  .suggestion-item {
    position: relative;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 14px;
    padding: 19px 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 19px;
    background: rgba(255, 255, 255, 0.66);
    box-shadow: 0 9px 28px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(16px);
  }

  .suggestion-item::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: #94a3b8;
  }

  .suggestion-item-danger::before { background: #ff6467; }
  .suggestion-item-warning::before { background: #ffb547; }
  .suggestion-item-success::before { background: #21c77a; }
  .suggestion-item-info::before { background: #4f7cff; }

  .suggestion-item-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: rgba(148, 163, 184, 0.12);
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 950;
  }

  .suggestion-item-danger .suggestion-item-mark {
    background: rgba(255, 100, 103, 0.12);
    color: #dc2626;
  }

  .suggestion-item-warning .suggestion-item-mark {
    background: rgba(255, 181, 71, 0.16);
    color: #c77700;
  }

  .suggestion-item-success .suggestion-item-mark {
    background: rgba(33, 199, 122, 0.12);
    color: #087f5b;
  }

  .suggestion-item-info .suggestion-item-mark {
    background: rgba(79, 124, 255, 0.12);
    color: #315fda;
  }

  .suggestion-item-topline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .suggestion-category {
    display: block;
    margin-bottom: 4px;
    color: #7c5cfc;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .suggestion-item h2 {
    margin: 0;
    color: #172033;
    font-size: 1rem;
  }

  .suggestion-item p {
    margin: 10px 0 0;
    color: #5f6b7c;
    font-size: 0.84rem;
    line-height: 1.65;
  }

  .suggestion-severity {
    flex: 0 0 auto;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 0.67rem;
    font-weight: 900;
  }

  .severity-danger { background: rgba(255, 100, 103, 0.12); color: #dc2626; }
  .severity-warning { background: rgba(255, 181, 71, 0.15); color: #b86c00; }
  .severity-success { background: rgba(33, 199, 122, 0.12); color: #087f5b; }
  .severity-info { background: rgba(79, 124, 255, 0.12); color: #315fda; }
  .severity-neutral { background: rgba(148, 163, 184, 0.12); color: #64748b; }

  .suggestions-state {
    display: grid;
    place-items: center;
    min-height: 300px;
    padding: 30px;
    text-align: center;
  }

  .suggestions-state h2 {
    margin: 15px 0 0;
    color: #172033;
    font-size: 1.1rem;
  }

  .suggestions-state p {
    max-width: 430px;
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.84rem;
    line-height: 1.6;
  }

  .suggestions-state-icon {
    display: grid;
    place-items: center;
    width: 53px;
    height: 53px;
    border-radius: 17px;
    background: rgba(109, 93, 252, 0.1);
    color: #6d5dfc;
    font-size: 1.25rem;
    font-weight: 900;
  }

  .suggestions-loader,
  .suggestions-button-spinner {
    display: inline-block;
    border-radius: 50%;
    border-style: solid;
    animation: suggestions-spin 0.75s linear infinite;
  }

  .suggestions-loader {
    width: 36px;
    height: 36px;
    border-width: 3px;
    border-color: rgba(109, 93, 252, 0.18);
    border-top-color: #6d5dfc;
  }

  .suggestions-button-spinner {
    width: 14px;
    height: 14px;
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.38);
    border-top-color: white;
  }

  @keyframes suggestions-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 760px) {
    .suggestions-page {
      padding: 18px 6px 28px;
    }

    .suggestions-header {
      flex-direction: column;
      gap: 14px;
    }

    .suggestions-controls {
      grid-template-columns: 1fr 1fr;
    }

    .suggestions-load-button {
      grid-column: 1 / -1;
      width: 100%;
    }

    .suggestions-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      row-gap: 14px;
    }

    .suggestions-summary > div:nth-child(2) {
      border-right: 0;
    }

    .suggestions-summary > div:nth-child(3) {
      padding-left: 0;
    }
  }

  @media (max-width: 480px) {
    .suggestions-header h1 {
      font-size: 2rem;
    }

    .suggestions-controls {
      grid-template-columns: 1fr;
    }

    .suggestions-load-button {
      grid-column: auto;
    }

    .suggestion-item {
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 11px;
      padding: 17px 14px;
    }

    .suggestion-item-mark {
      width: 38px;
      height: 38px;
      border-radius: 12px;
    }

    .suggestion-item-topline {
      flex-direction: column;
      gap: 9px;
    }

    .suggestion-severity {
      align-self: flex-start;
    }
  }
`;

export default SuggestionsPage;