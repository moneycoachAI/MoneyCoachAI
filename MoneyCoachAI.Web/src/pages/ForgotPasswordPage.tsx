import { useState } from "react";
import axios from "axios";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { requestPasswordReset } from "../services/passwordService";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter your registered email address."
      );

      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(
        "Enter a valid email address."
      );

      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await requestPasswordReset(
          normalizedEmail
        );

      setSuccessMessage(response.message);
    } catch (error) {
      console.error(
        "Forgot password request failed:",
        error
      );

      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to send the password reset email."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="password-page">
      <div className="password-glow password-glow-purple" />
      <div className="password-glow password-glow-orange" />

      <section className="password-shell">
        <div className="password-logo">
          <img
            src="/branding/moneycoachai-logo.png"
            alt="MoneyCoachAI"
          />
        </div>

        <div className="password-card">
          {successMessage ? (
            <div className="password-success-view">
              <div className="password-status-icon password-status-success">
                ✓
              </div>

              <span className="password-eyebrow">
                Check your inbox
              </span>

              <h1>Reset link sent</h1>

              <p>{successMessage}</p>

              <div className="password-email-preview">
                {email}
              </div>

              <p className="password-help-text">
                The reset link expires in 30
                minutes. Also check your spam
                folder if you do not see the
                email.
              </p>

              <button
                type="button"
                className="password-primary-button"
                onClick={() => {
                  setSuccessMessage("");
                }}
              >
                Send again
              </button>

              <button
                type="button"
                className="password-secondary-button"
                onClick={() =>
                  navigate("/login")
                }
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <header className="password-header">
                <span className="password-eyebrow">
                  Account recovery
                </span>

                <h1>Forgot your password?</h1>

                <p>
                  Enter your registered email and
                  we will send you a secure link to
                  create a new password.
                </p>
              </header>

              {errorMessage && (
                <div
                  className="password-alert password-alert-error"
                  role="alert"
                >
                  <span>!</span>

                  <p>{errorMessage}</p>

                  <button
                    type="button"
                    aria-label="Close message"
                    onClick={() =>
                      setErrorMessage("")
                    }
                  >
                    ×
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="password-field">
                  <label htmlFor="forgot-email">
                    Email address
                  </label>

                  <div className="password-input-shell">
                    <span>@</span>

                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      disabled={loading}
                      autoComplete="email"
                      placeholder="you@example.com"
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="password-primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="password-spinner" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send reset link
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>

              <p className="password-back-link">
                Remember your password?{" "}
                <Link to="/login">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>

      <style>{passwordStyles}</style>
    </main>
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const responseData = error.response?.data;

  if (
    typeof responseData === "string" &&
    responseData.trim()
  ) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === "object"
  ) {
    if (
      "message" in responseData &&
      typeof responseData.message ===
        "string"
    ) {
      return responseData.message;
    }

    if (
      "title" in responseData &&
      typeof responseData.title ===
        "string"
    ) {
      return responseData.title;
    }
  }

  if (error.code === "ERR_NETWORK") {
    return "Unable to connect to the MoneyCoachAI server.";
  }

  return fallbackMessage;
}

const passwordStyles = `
  html,
  body,
  #root {
    min-width: 0;
    min-height: 100%;
    margin: 0;
  }

  body {
    overflow-x: hidden;
  }

  .password-page,
  .password-page * {
    box-sizing: border-box;
  }

  .password-page {
    --password-purple: #6d28d9;
    --password-purple-light: #8b5cf6;
    --password-orange: #ff8500;
    --password-text: #16172b;
    --password-muted: #667085;

    position: relative;

    display: grid;
    place-items: center;

    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;

    padding: 20px;

    overflow: hidden;

    background:
      radial-gradient(
        circle at 18% 20%,
        rgba(255, 255, 255, 0.82),
        transparent 30%
      ),
      radial-gradient(
        circle at 82% 15%,
        rgba(139, 92, 246, 0.13),
        transparent 28%
      ),
      radial-gradient(
        circle at 76% 85%,
        rgba(255, 133, 0, 0.09),
        transparent 27%
      ),
      linear-gradient(
        135deg,
        #f9f5f5 0%,
        #f8f5fb 43%,
        #f4edff 71%,
        #fff5eb 100%
      );

    color: var(--password-text);

    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .password-glow {
    position: absolute;

    border-radius: 50%;

    filter: blur(42px);

    pointer-events: none;
  }

  .password-glow-purple {
    top: 10%;
    right: 10%;

    width: 280px;
    height: 280px;

    background:
      rgba(139, 92, 246, 0.1);
  }

  .password-glow-orange {
    bottom: 5%;
    left: 10%;

    width: 250px;
    height: 250px;

    background:
      rgba(255, 133, 0, 0.08);
  }

  .password-shell {
    position: relative;
    z-index: 2;

    display: grid;
    grid-template-columns:
      minmax(280px, 0.8fr)
      minmax(390px, 1fr);

    align-items: center;
    gap:
      clamp(
        35px,
        7vw,
        95px
      );

    width: min(100%, 1040px);
  }

  .password-logo {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .password-logo img {
    display: block;

    width:
      clamp(
        360px,
        36vw,
        590px
      );

    max-width: 150%;
    height: auto;

    object-fit: contain;

    filter:
      drop-shadow(
        0 18px 30px
        rgba(109, 40, 217, 0.12)
      );
  }

  .password-card {
    width: 100%;
    max-width: 470px;

    padding:
      clamp(26px, 4vh, 38px)
      clamp(23px, 4vw, 38px);

    border:
      1px solid
      rgba(255, 255, 255, 0.78);

    border-radius: 30px;

    background:
      rgba(255, 255, 255, 0.62);

    box-shadow:
      0 25px 72px
      rgba(76, 29, 149, 0.11),
      inset 0 1px 0
      rgba(255, 255, 255, 0.96);

    backdrop-filter: blur(23px);
  }

  .password-eyebrow {
    display: block;

    color: var(--password-purple);

    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .password-header h1,
  .password-success-view h1 {
    margin: 9px 0 0;

    color: var(--password-text);

    font-size:
      clamp(
        2rem,
        4vw,
        2.65rem
      );

    line-height: 1.05;
    letter-spacing: -0.05em;
  }

  .password-header p,
  .password-success-view > p {
    margin: 12px 0 0;

    color: var(--password-muted);

    font-size: 0.83rem;
    line-height: 1.65;
  }

  .password-alert {
    display: flex;
    align-items: center;
    gap: 10px;

    margin-top: 20px;
    padding: 11px 13px;

    border-radius: 13px;

    font-size: 0.73rem;
    font-weight: 750;
  }

  .password-alert-error {
    border:
      1px solid
      rgba(239, 68, 68, 0.2);

    background:
      rgba(239, 68, 68, 0.07);

    color: #b42318;
  }

  .password-alert > span {
    display: grid;
    place-items: center;

    flex: 0 0 auto;

    width: 24px;
    height: 24px;

    border-radius: 50%;

    background: #dc2626;
    color: #ffffff;

    font-weight: 950;
  }

  .password-alert p {
    flex: 1;

    margin: 0;
  }

  .password-alert button {
    border: 0;

    background: transparent;
    color: inherit;

    cursor: pointer;

    font-size: 1.1rem;
  }

  .password-field {
    margin-top: 24px;
  }

  .password-field label {
    display: block;

    margin: 0 0 7px 2px;

    color: #475569;

    font-size: 0.72rem;
    font-weight: 900;
  }

  .password-input-shell {
    position: relative;
  }

  .password-input-shell > span {
    position: absolute;
    top: 50%;
    left: 15px;

    transform: translateY(-50%);

    color: #94a3b8;

    font-size: 0.73rem;
    font-weight: 900;
  }

  .password-input-shell input {
    display: block;

    width: 100%;
    min-height: 50px;

    padding:
      0
      15px
      0
      42px;

    border:
      1px solid
      rgba(109, 40, 217, 0.16);

    border-radius: 14px;

    outline: none;

    background:
      rgba(255, 255, 255, 0.78);

    color: #172033;

    font: inherit;
    font-size: 0.81rem;
    font-weight: 650;
  }

  .password-input-shell input:focus {
    border-color:
      var(--password-purple-light);

    box-shadow:
      0 0 0 4px
      rgba(109, 40, 217, 0.09);
  }

  .password-primary-button,
  .password-secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;

    width: 100%;
    min-height: 50px;

    border-radius: 14px;

    cursor: pointer;

    font: inherit;
    font-size: 0.8rem;
    font-weight: 900;
  }

  .password-primary-button {
    margin-top: 22px;

    border: 0;

    background:
      linear-gradient(
        105deg,
        #6d28d9 0%,
        #8b5cf6 53%,
        #ff8500 100%
      );

    box-shadow:
      0 15px 32px
      rgba(109, 40, 217, 0.21),
      0 8px 22px
      rgba(255, 133, 0, 0.1);

    color: white;
  }

  .password-primary-button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .password-secondary-button {
    margin-top: 11px;

    border:
      1px solid
      rgba(109, 40, 217, 0.16);

    background:
      rgba(255, 255, 255, 0.7);

    color: var(--password-purple);
  }

  .password-back-link {
    margin: 22px 0 0;

    color: #64748b;

    font-size: 0.72rem;
    text-align: center;
  }

  .password-back-link a {
    color: var(--password-purple);

    font-weight: 900;
    text-decoration: none;
  }

  .password-success-view {
    text-align: center;
  }

  .password-status-icon {
    display: grid;
    place-items: center;

    width: 62px;
    height: 62px;

    margin: 0 auto 19px;

    border-radius: 50%;

    font-size: 1.5rem;
    font-weight: 950;
  }

  .password-status-success {
    background:
      linear-gradient(
        145deg,
        #dcfce7,
        #bbf7d0
      );

    color: #168449;

    box-shadow:
      0 12px 28px
      rgba(22, 132, 73, 0.13);
  }

  .password-email-preview {
    margin-top: 20px;
    padding: 12px 14px;

    border:
      1px solid
      rgba(109, 40, 217, 0.14);

    border-radius: 13px;

    background:
      rgba(255, 255, 255, 0.65);

    color: #3e365e;

    font-size: 0.8rem;
    font-weight: 800;

    overflow-wrap: anywhere;
  }

  .password-help-text {
    font-size: 0.72rem !important;
  }

  .password-spinner {
    width: 15px;
    height: 15px;

    border:
      2px solid
      rgba(255, 255, 255, 0.4);

    border-top-color: currentColor;
    border-radius: 50%;

    animation:
      password-spin 0.72s linear infinite;
  }

  @keyframes password-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 820px) {
    .password-page {
      padding: 10px;
    }

    .password-shell {
      display: block;

      width: min(100%, 500px);
    }

    .password-logo {
      margin-bottom: 12px;
    }

    .password-logo img {
      width: min(430px, 94vw);
      max-width: 100%;
      max-height: 140px;
    }

    .password-card {
      max-width: none;

      padding:
        clamp(22px, 4vh, 30px)
        clamp(18px, 5vw, 27px);

      border-radius: 24px;
    }
  }

  @media (max-width: 480px) {
    .password-page {
      align-items: center;

      padding:
        7px
        max(
          7px,
          env(safe-area-inset-right)
        )
        7px
        max(
          7px,
          env(safe-area-inset-left)
        );
    }

    .password-logo {
      margin-bottom: 6px;
    }

    .password-logo img {
      width: 100%;
      max-height: 112px;
    }

    .password-card {
      padding: 20px 15px;

      border-radius: 20px;
    }

    .password-header h1,
    .password-success-view h1 {
      font-size: 1.85rem;
    }

    .password-field {
      margin-top: 19px;
    }
  }
`;

export default ForgotPasswordPage;