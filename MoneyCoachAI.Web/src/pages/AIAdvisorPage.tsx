import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import AppLayout from "../components/AppLayout";
import { getAIAdvice } from "../services/aiService";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
};

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const suggestedQuestions = [
  {
    icon: "💰",
    title: "Reduce spending",
    question: "How can I reduce my spending based on this month's data?",
  },
  {
    icon: "📊",
    title: "Spending analysis",
    question: "Which spending categories should I pay more attention to?",
  },
  {
    icon: "🎯",
    title: "Saving plan",
    question: "Create a simple savings plan based on my financial activity.",
  },
  {
    icon: "⚠️",
    title: "Financial risks",
    question: "Are there any financial risks or unhealthy spending patterns?",
  },
];

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  createdAt: new Date(),
});

const formatMessageTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

function AIAdvisorPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedMonthName = useMemo(
    () =>
      monthOptions.find((monthOption) => monthOption.value === month)?.label ??
      "",
    [month]
  );

  const hasConversation = messages.length > 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startNewConversation = () => {
    if (
      hasConversation &&
      !window.confirm("Start a new conversation for this financial period?")
    ) {
      return false;
    }

    setMessages([]);
    setQuestion("");
    setError("");
    return true;
  };

  const handlePeriodChange = (
    nextMonth: number,
    nextYear: number
  ) => {
    if (hasConversation && !startNewConversation()) {
      return;
    }

    setMonth(nextMonth);
    setYear(nextYear);
  };

  const sendQuestion = async (questionOverride?: string) => {
    const trimmedQuestion = (questionOverride ?? question).trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      setError("Please select a valid financial period.");
      return;
    }

    const userMessage = createMessage("user", trimmedQuestion);

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await getAIAdvice({
        month,
        year,
        question: trimmedQuestion,
      });

      const assistantMessage = createMessage(
        "assistant",
        response.advice?.trim() ||
          "I could not generate advice for that question. Please try again."
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (requestError) {
      console.error("Failed to get AI advice:", requestError);

      setError(
        "The AI Advisor is unavailable right now. Please check the API configuration or try again."
      );
    } finally {
      setLoading(false);
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion();
    }
  };

  const handleSuggestedQuestion = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
    setError("");
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (copyError) {
      console.error("Failed to copy AI response:", copyError);
    }
  };

  const renderAssistantContent = (content: string) =>
    content.split("\n").map((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return <div className="ai-chat-line-space" key={`space-${index}`} />;
      }

      const isBullet =
        trimmedLine.startsWith("-") ||
        trimmedLine.startsWith("•") ||
        /^\d+\./.test(trimmedLine);

      if (isBullet) {
        return (
          <div className="ai-chat-bullet" key={`${trimmedLine}-${index}`}>
            <span>✓</span>
            <p>
              {trimmedLine
                .replace(/^[-•]\s*/, "")
                .replace(/^\d+\.\s*/, "")}
            </p>
          </div>
        );
      }

      return <p key={`${trimmedLine}-${index}`}>{trimmedLine}</p>;
    });

  return (
    <AppLayout>
      <main className="ai-chat-page">
        <section className="ai-chat-shell">
          <header className="ai-chat-header">
            <div className="ai-chat-brand">
              <div className="ai-chat-brand-icon">🤖</div>

              <div>
                <span>MoneyCoachAI</span>
                <h1>AI Financial Advisor</h1>
                <p>Chat with your personal financial coach.</p>
              </div>
            </div>

            <div className="ai-chat-header-controls">
              <div className="ai-chat-period-control">
                <select
                  aria-label="Financial month"
                  value={month}
                  disabled={loading}
                  onChange={(event) =>
                    handlePeriodChange(Number(event.target.value), year)
                  }
                >
                  {monthOptions.map((monthOption) => (
                    <option key={monthOption.value} value={monthOption.value}>
                      {monthOption.label}
                    </option>
                  ))}
                </select>

                <input
                  aria-label="Financial year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  disabled={loading}
                  onChange={(event) =>
                    handlePeriodChange(month, Number(event.target.value))
                  }
                />
              </div>

              <div className="ai-chat-status">
                <span />
                Ready
              </div>

              {hasConversation && (
                <button
                  type="button"
                  className="ai-chat-new-button"
                  disabled={loading}
                  onClick={startNewConversation}
                >
                  ＋ New chat
                </button>
              )}
            </div>
          </header>

          {error && (
            <div className="ai-chat-error" role="alert">
              <span>⚠️</span>
              <p>{error}</p>
              <button
                type="button"
                aria-label="Close error"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          <div className="ai-chat-body">
            {!hasConversation && !loading ? (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">🤖</div>

                <span className="ai-chat-kicker">
                  {selectedMonthName} {year} financial guidance
                </span>

                <h2>How can I help with your finances today?</h2>

                <p>
                  Ask about spending, savings, budgets, categories, or ways to
                  improve your monthly financial position.
                </p>

                <div className="ai-chat-suggestions">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.title}
                      onClick={() =>
                        handleSuggestedQuestion(suggestion.question)
                      }
                    >
                      <span>{suggestion.icon}</span>
                      <div>
                        <strong>{suggestion.title}</strong>
                        <small>{suggestion.question}</small>
                      </div>
                      <b>→</b>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ai-chat-messages">
                <div className="ai-chat-day-label">
                  {selectedMonthName} {year} conversation
                </div>

                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`ai-chat-message ${message.role}`}
                  >
                    <div className="ai-chat-avatar">
                      {message.role === "assistant" ? "🤖" : "🙂"}
                    </div>

                    <div className="ai-chat-message-column">
                      <div className="ai-chat-message-meta">
                        <strong>
                          {message.role === "assistant"
                            ? "MoneyCoachAI"
                            : "You"}
                        </strong>
                        <span>{formatMessageTime(message.createdAt)}</span>
                      </div>

                      <div className="ai-chat-bubble">
                        {message.role === "assistant" ? (
                          <div className="ai-chat-answer">
                            {renderAssistantContent(message.content)}
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>

                      {message.role === "assistant" && (
                        <div className="ai-chat-message-actions">
                          <button
                            type="button"
                            onClick={() => void copyMessage(message.content)}
                          >
                            📋 Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {loading && (
                  <article className="ai-chat-message assistant">
                    <div className="ai-chat-avatar">🤖</div>

                    <div className="ai-chat-message-column">
                      <div className="ai-chat-message-meta">
                        <strong>MoneyCoachAI</strong>
                        <span>Thinking...</span>
                      </div>

                      <div className="ai-chat-bubble ai-chat-typing-bubble">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </article>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <footer className="ai-chat-composer-wrap">
            <div className="ai-chat-composer">
              <textarea
                ref={textareaRef}
                rows={1}
                maxLength={500}
                value={question}
                disabled={loading}
                placeholder="Ask anything about your finances..."
                onChange={(event) => {
                  setQuestion(event.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
              />

              <button
                type="button"
                aria-label="Send question"
                disabled={loading || !question.trim()}
                onClick={() => void sendQuestion()}
              >
                {loading ? <span className="ai-chat-send-spinner" /> : "➤"}
              </button>
            </div>

            <div className="ai-chat-composer-note">
              <span>
                Enter to send · Shift + Enter for a new line · {question.length}
                /500
              </span>
              <span>Advice is educational and based on your app data.</span>
            </div>
          </footer>
        </section>
      </main>

      <style>{`
        .ai-chat-page {
          width: 100%;
          min-height: calc(100vh - 84px);
          box-sizing: border-box;
          padding: 1%;
          color: #111827;
        }

        .ai-chat-shell {
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          min-height: calc(100vh - 110px);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.58);
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .ai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(124, 92, 252, 0.14), transparent 36%),
            rgba(255, 255, 255, 0.7);
        }

        .ai-chat-brand,
        .ai-chat-header-controls,
        .ai-chat-period-control,
        .ai-chat-status,
        .ai-chat-message,
        .ai-chat-message-meta,
        .ai-chat-composer,
        .ai-chat-composer-note {
          display: flex;
          align-items: center;
        }

        .ai-chat-brand {
          gap: 12px;
          min-width: 0;
        }

        .ai-chat-brand-icon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(145deg, #eef2ff, #f4eefe);
          box-shadow: 0 10px 24px rgba(109, 93, 252, 0.16);
          font-size: 1.55rem;
        }

        .ai-chat-brand span {
          color: #6d5dfc;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .ai-chat-brand h1 {
          margin: 2px 0 0;
          font-size: clamp(1.2rem, 2vw, 1.75rem);
        }

        .ai-chat-brand p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 0.78rem;
        }

        .ai-chat-header-controls {
          justify-content: flex-end;
          gap: 9px;
          flex-wrap: wrap;
        }

        .ai-chat-period-control {
          gap: 7px;
          padding: 5px;
          border: 1px solid rgba(109, 93, 252, 0.16);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.72);
        }

        .ai-chat-period-control select,
        .ai-chat-period-control input {
          height: 34px;
          border: 0;
          outline: 0;
          border-radius: 9px;
          background: transparent;
          color: #334155;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .ai-chat-period-control select {
          width: 112px;
          padding: 0 7px;
        }

        .ai-chat-period-control input {
          width: 66px;
          padding: 0 8px;
        }

        .ai-chat-status {
          gap: 8px;
          min-height: 44px;
          padding: 0 13px;
          border-radius: 13px;
          background: rgba(236, 253, 245, 0.82);
          color: #087f5b;
          font-size: 0.76rem;
          font-weight: 850;
        }

        .ai-chat-status span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #21c77a;
          box-shadow: 0 0 0 5px rgba(33, 199, 122, 0.12);
        }

        .ai-chat-new-button {
          min-height: 44px;
          padding: 0 13px;
          border: 1px solid rgba(109, 93, 252, 0.17);
          border-radius: 13px;
          background: rgba(109, 93, 252, 0.08);
          color: #5b4ae6;
          cursor: pointer;
          font-weight: 850;
        }

        .ai-chat-error {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 16px 0;
          padding: 11px 13px;
          border: 1px solid rgba(239, 68, 68, 0.24);
          border-radius: 14px;
          background: rgba(254, 226, 226, 0.86);
          color: #b91c1c;
        }

        .ai-chat-error p {
          flex: 1;
          margin: 0;
          font-size: 0.82rem;
          font-weight: 750;
        }

        .ai-chat-error button {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 9px;
          background: rgba(185, 28, 28, 0.08);
          color: #b91c1c;
          cursor: pointer;
          font-size: 1.15rem;
        }

        .ai-chat-body {
          min-height: 0;
          overflow-y: auto;
          padding: 22px;
          scrollbar-width: thin;
          scrollbar-color: #7b61ff transparent;
        }

        .ai-chat-body::-webkit-scrollbar {
          width: 8px;
        }

        .ai-chat-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .ai-chat-body::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: linear-gradient(180deg, #5b8cff, #7b61ff);
        }

        .ai-chat-welcome {
          max-width: 840px;
          margin: 0 auto;
          padding: 24px 0;
          text-align: center;
        }

        .ai-chat-welcome-icon {
          display: grid;
          place-items: center;
          width: 74px;
          height: 74px;
          margin: 0 auto 14px;
          border-radius: 24px;
          background: linear-gradient(145deg, #ffffff, #eee9ff);
          box-shadow: 0 15px 35px rgba(109, 93, 252, 0.2);
          font-size: 2rem;
        }

        .ai-chat-kicker {
          color: #6d5dfc;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .ai-chat-welcome h2 {
          margin: 8px 0 7px;
          font-size: clamp(1.4rem, 2.3vw, 2rem);
        }

        .ai-chat-welcome > p {
          max-width: 640px;
          margin: 0 auto;
          color: #64748b;
          line-height: 1.6;
        }

        .ai-chat-suggestions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
          margin-top: 24px;
        }

        .ai-chat-suggestions button {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 13px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.68);
          color: #334155;
          cursor: pointer;
          text-align: left;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }

        .ai-chat-suggestions button:hover {
          transform: translateY(-2px);
          border-color: rgba(109, 93, 252, 0.34);
        }

        .ai-chat-suggestions button > span {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background: rgba(109, 93, 252, 0.08);
        }

        .ai-chat-suggestions button div {
          flex: 1;
          min-width: 0;
        }

        .ai-chat-suggestions strong,
        .ai-chat-suggestions small {
          display: block;
        }

        .ai-chat-suggestions strong {
          font-size: 0.84rem;
        }

        .ai-chat-suggestions small {
          margin-top: 3px;
          color: #64748b;
          font-size: 0.71rem;
          line-height: 1.35;
        }

        .ai-chat-suggestions b {
          color: #6d5dfc;
        }

        .ai-chat-messages {
          max-width: 930px;
          margin: 0 auto;
        }

        .ai-chat-day-label {
          width: fit-content;
          margin: 0 auto 22px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(109, 93, 252, 0.08);
          color: #6d5dfc;
          font-size: 0.7rem;
          font-weight: 850;
        }

        .ai-chat-message {
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 20px;
          animation: aiChatFade 0.22s ease;
        }

        .ai-chat-message.user {
          flex-direction: row-reverse;
        }

        .ai-chat-avatar {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          border-radius: 13px;
          background: linear-gradient(145deg, #ffffff, #eee9ff);
          box-shadow: 0 8px 20px rgba(109, 93, 252, 0.14);
        }

        .ai-chat-message.user .ai-chat-avatar {
          background: linear-gradient(145deg, #eaf0ff, #e9e4ff);
        }

        .ai-chat-message-column {
          width: min(78%, 730px);
        }

        .ai-chat-message.user .ai-chat-message-column {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .ai-chat-message-meta {
          gap: 8px;
          margin: 0 4px 6px;
        }

        .ai-chat-message.user .ai-chat-message-meta {
          flex-direction: row-reverse;
        }

        .ai-chat-message-meta strong {
          color: #334155;
          font-size: 0.76rem;
        }

        .ai-chat-message-meta span {
          color: #94a3b8;
          font-size: 0.67rem;
        }

        .ai-chat-bubble {
          padding: 14px 16px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 6px 18px 18px 18px;
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
          color: #334155;
          line-height: 1.65;
        }

        .ai-chat-message.user .ai-chat-bubble {
          border: 0;
          border-radius: 18px 6px 18px 18px;
          background: linear-gradient(135deg, #5b8cff, #7b61ff);
          color: white;
          box-shadow: 0 12px 26px rgba(91, 140, 255, 0.25);
        }

        .ai-chat-bubble > p,
        .ai-chat-answer > p {
          margin: 0 0 9px;
        }

        .ai-chat-bubble > p:last-child,
        .ai-chat-answer > p:last-child {
          margin-bottom: 0;
        }

        .ai-chat-bullet {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 8px 0;
          padding: 9px 10px;
          border-radius: 12px;
          background: rgba(248, 250, 252, 0.82);
        }

        .ai-chat-bullet span {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 21px;
          height: 21px;
          border-radius: 50%;
          background: rgba(33, 199, 122, 0.12);
          color: #059669;
          font-size: 0.68rem;
          font-weight: 900;
        }

        .ai-chat-bullet p {
          margin: 0;
        }

        .ai-chat-line-space {
          height: 6px;
        }

        .ai-chat-message-actions {
          margin: 6px 4px 0;
        }

        .ai-chat-message-actions button {
          padding: 5px 8px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 0.69rem;
          font-weight: 750;
        }

        .ai-chat-message-actions button:hover {
          background: rgba(148, 163, 184, 0.1);
        }

        .ai-chat-typing-bubble {
          display: flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          min-width: 58px;
        }

        .ai-chat-typing-bubble span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7b61ff;
          animation: aiChatTyping 1.1s ease-in-out infinite;
        }

        .ai-chat-typing-bubble span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .ai-chat-typing-bubble span:nth-child(3) {
          animation-delay: 0.3s;
        }

        .ai-chat-composer-wrap {
          padding: 13px 18px 14px;
          border-top: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.76);
        }

        .ai-chat-composer {
          gap: 10px;
          max-width: 930px;
          margin: 0 auto;
          padding: 8px 8px 8px 14px;
          border: 1px solid rgba(109, 93, 252, 0.22);
          border-radius: 19px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
        }

        .ai-chat-composer:focus-within {
          border-color: rgba(109, 93, 252, 0.52);
          box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.09);
        }

        .ai-chat-composer textarea {
          flex: 1;
          min-width: 0;
          max-height: 130px;
          resize: none;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1e293b;
          font: inherit;
          line-height: 1.5;
        }

        .ai-chat-composer button {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #5b8cff, #7b61ff);
          box-shadow: 0 8px 18px rgba(91, 140, 255, 0.27);
          color: white;
          cursor: pointer;
          font-size: 1rem;
        }

        .ai-chat-composer button:disabled,
        .ai-chat-new-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .ai-chat-send-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.42);
          border-top-color: white;
          border-radius: 50%;
          animation: aiChatSpin 0.7s linear infinite;
        }

        .ai-chat-composer-note {
          justify-content: space-between;
          gap: 12px;
          max-width: 930px;
          margin: 7px auto 0;
          color: #94a3b8;
          font-size: 0.65rem;
        }

        @keyframes aiChatTyping {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.45;
          }
          50% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }

        @keyframes aiChatSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes aiChatFade {
          from {
            transform: translateY(7px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 820px) {
          .ai-chat-page {
            padding: 0 6px 18px;
          }

          .ai-chat-shell {
            min-height: calc(100vh - 92px);
            border-radius: 20px;
          }

          .ai-chat-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 15px;
          }

          .ai-chat-header-controls {
            width: 100%;
            justify-content: flex-start;
          }

          .ai-chat-period-control {
            flex: 1;
          }

          .ai-chat-period-control select {
            flex: 1;
            width: auto;
          }

          .ai-chat-body {
            padding: 16px 11px;
          }

          .ai-chat-message-column {
            width: calc(100% - 48px);
          }

          .ai-chat-suggestions {
            grid-template-columns: 1fr;
          }

          .ai-chat-composer-wrap {
            padding: 10px 9px 11px;
          }
        }

        @media (max-width: 520px) {
          .ai-chat-brand p,
          .ai-chat-status,
          .ai-chat-composer-note span:last-child {
            display: none;
          }

          .ai-chat-brand-icon {
            width: 42px;
            height: 42px;
            border-radius: 14px;
          }

          .ai-chat-header-controls {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .ai-chat-period-control {
            min-width: 0;
          }

          .ai-chat-new-button {
            padding: 0 10px;
          }

          .ai-chat-welcome {
            padding: 12px 0;
          }

          .ai-chat-welcome-icon {
            width: 62px;
            height: 62px;
            border-radius: 20px;
          }

          .ai-chat-welcome h2 {
            font-size: 1.3rem;
          }

          .ai-chat-message {
            gap: 7px;
          }

          .ai-chat-avatar {
            width: 32px;
            height: 32px;
            border-radius: 11px;
            font-size: 0.9rem;
          }

          .ai-chat-message-column {
            width: calc(100% - 39px);
          }

          .ai-chat-bubble {
            padding: 11px 12px;
            font-size: 0.86rem;
          }

          .ai-chat-composer-note {
            justify-content: flex-start;
          }
        }
      `}</style>
    </AppLayout>
  );
}

export default AIAdvisorPage;