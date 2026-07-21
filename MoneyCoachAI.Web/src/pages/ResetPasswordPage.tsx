import {
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  resetPassword,
  validateResetToken,
} from "../services/passwordService";

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token") ?? "",
    [searchParams]
  );

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    validatingToken,
    setValidatingToken,
  ] = useState(true);

  const [tokenValid, setTokenValid] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  

  const checkToken = async () => {
    if (!token) {
      setTokenValid(false);
      setValidatingToken(false);

      return;
    }

    try {
      setValidatingToken(true);

      const response =
        await validateResetToken(token);

      setTokenValid(response.valid);
    } catch (error) {
      console.error(
        "Token validation failed:",
        error
      );

      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkToken();
    }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [token]);

  const passwordScore =
    calculatePasswordScore(newPassword);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!newPassword) {
      setErrorMessage(
        "Enter your new password."
      );

      return;
    }

    const passwordError =
      validatePassword(newPassword);

    if (passwordError) {
      setErrorMessage(passwordError);

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setErrorMessage(
        "The passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await resetPassword(
        token,
        newPassword,
        confirmPassword
      );

      setSuccessMessage(response.message);
    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      );

      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to reset your password."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-page">
      <div className="reset-glow reset-glow-purple" />
      <div className="reset-glow reset-glow-orange" />

      <section className="reset-shell">
        <div className="reset-logo">
          <img
            src="/branding/moneycoachai-logo.png"
            alt="MoneyCoachAI"
          />
        </div>

        <div className="reset-card">
          {validatingToken ? (
            <div className="reset-state">
              <span className="reset-large-spinner" />

              <h1>Checking your link</h1>

              <p>
                Please wait while we verify your
                password reset request.
              </p>
            </div>
          ) : successMessage ? (
            <div className="reset-state">
              <div className="reset-success-icon">
                ✓
              </div>

              <span className="reset-eyebrow">
                Password updated
              </span>

              <h1>Reset successful</h1>

              <p>{successMessage}</p>

              <button
                type="button"
                className="reset-primary-button"
                onClick={() =>
                  navigate("/login")
                }
              >
                Sign in with new password
              </button>
            </div>
          ) : !tokenValid ? (
            <div className="reset-state">
              <div className="reset-invalid-icon">
                !
              </div>

              <span className="reset-eyebrow">
                Invalid reset link
              </span>

              <h1>Link expired or invalid</h1>

              <p>
                This password reset link cannot be
                used. It may have expired or
                already been used.
              </p>

              <Link
                to="/forgot-password"
                className="reset-link-button"
              >
                Request a new reset link
              </Link>

              <Link
                to="/login"
                className="reset-text-link"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <header className="reset-header">
                <span className="reset-eyebrow">
                  Secure password reset
                </span>

                <h1>Create a new password</h1>

                <p>
                  Use a strong password that you
                  have not used before.
                </p>
              </header>

              {errorMessage && (
                <div
                  className="reset-alert"
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
                <div className="reset-field">
                  <label htmlFor="new-password">
                    New password
                  </label>

                  <div className="reset-input-shell">
                    <span>●</span>

                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      disabled={loading}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShowNewPassword(
                          (current) => !current
                        )
                      }
                    >
                      {showNewPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                <PasswordStrength
                  password={newPassword}
                  score={passwordScore}
                />

                <div className="reset-field">
                  <label htmlFor="confirm-password">
                    Confirm password
                  </label>

                  <div className="reset-input-shell">
                    <span>●</span>

                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      disabled={loading}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="reset-primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="reset-spinner" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      Reset password
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>

              <p className="reset-back-link">
                <Link to="/login">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>

      <style>{resetStyles}</style>
    </main>
  );
}

type PasswordStrengthProps = {
  password: string;
  score: number;
};

function PasswordStrength({
  password,
  score,
}: PasswordStrengthProps) {
  const label =
    score <= 1
      ? "Weak"
      : score === 2
        ? "Fair"
        : score === 3
          ? "Good"
          : "Strong";

  return (
    <div className="reset-strength">
      <div className="reset-strength-bars">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={
              password && score >= level
                ? `reset-strength-active reset-strength-${score}`
                : ""
            }
          />
        ))}
      </div>

      <div className="reset-strength-copy">
        <span>
          Password strength:{" "}
          <strong>
            {password ? label : "Not entered"}
          </strong>
        </span>
      </div>

      <ul>
        <li
          className={
            password.length >= 8
              ? "reset-rule-valid"
              : ""
          }
        >
          At least 8 characters
        </li>

        <li
          className={
            /[A-Z]/.test(password)
              ? "reset-rule-valid"
              : ""
          }
        >
          One uppercase letter
        </li>

        <li
          className={
            /[a-z]/.test(password)
              ? "reset-rule-valid"
              : ""
          }
        >
          One lowercase letter
        </li>

        <li
          className={
            /\d/.test(password)
              ? "reset-rule-valid"
              : ""
          }
        >
          One number
        </li>
      </ul>
    </div>
  );
}

function calculatePasswordScore(
  password: string
) {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password)
  ) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 1;
  }

  if (
    password.length >= 12 ||
    /[^A-Za-z0-9]/.test(password)
  ) {
    score += 1;
  }

  return score;
}

function validatePassword(
  password: string
) {
  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain a number.";
  }

  return "";
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

const resetStyles = `
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

  .reset-page,
  .reset-page * {
    box-sizing: border-box;
  }

  .reset-page {
    --reset-purple: #6d28d9;
    --reset-purple-light: #8b5cf6;
    --reset-orange: #ff8500;
    --reset-text: #16172b;
    --reset-muted: #667085;

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

    color: var(--reset-text);

    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .reset-glow {
    position: absolute;

    border-radius: 50%;

    filter: blur(42px);

    pointer-events: none;
  }

  .reset-glow-purple {
    top: 10%;
    right: 10%;

    width: 280px;
    height: 280px;

    background:
      rgba(139, 92, 246, 0.1);
  }

  .reset-glow-orange {
    bottom: 5%;
    left: 10%;

    width: 250px;
    height: 250px;

    background:
      rgba(255, 133, 0, 0.08);
  }

  .reset-shell {
    position: relative;
    z-index: 2;

    display: grid;
    grid-template-columns:
      minmax(280px, 0.8fr)
      minmax(410px, 1fr);

    align-items: center;
    gap:
      clamp(
        35px,
        7vw,
        95px
      );

    width: min(100%, 1060px);
  }

  .reset-logo {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .reset-logo img {
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

  .reset-card {
    width: 100%;
    max-width: 490px;

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

  .reset-eyebrow {
    display: block;

    color: var(--reset-purple);

    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .reset-header h1,
  .reset-state h1 {
    margin: 9px 0 0;

    color: var(--reset-text);

    font-size:
      clamp(
        2rem,
        4vw,
        2.65rem
      );

    line-height: 1.05;
    letter-spacing: -0.05em;
  }

  .reset-header p,
  .reset-state p {
    margin: 12px 0 0;

    color: var(--reset-muted);

    font-size: 0.82rem;
    line-height: 1.65;
  }

  .reset-alert {
    display: flex;
    align-items: center;
    gap: 10px;

    margin-top: 19px;
    padding: 11px 13px;

    border:
      1px solid
      rgba(239, 68, 68, 0.2);

    border-radius: 13px;

    background:
      rgba(239, 68, 68, 0.07);

    color: #b42318;

    font-size: 0.72rem;
    font-weight: 750;
  }

  .reset-alert > span {
    display: grid;
    place-items: center;

    width: 24px;
    height: 24px;

    border-radius: 50%;

    background: #dc2626;
    color: white;

    font-weight: 950;
  }

  .reset-alert p {
    flex: 1;

    margin: 0;
  }

  .reset-alert button {
    border: 0;

    background: transparent;
    color: inherit;

    cursor: pointer;

    font-size: 1.1rem;
  }

  .reset-field {
    margin-top: 21px;
  }

  .reset-field label {
    display: block;

    margin: 0 0 7px 2px;

    color: #475569;

    font-size: 0.71rem;
    font-weight: 900;
  }

  .reset-input-shell {
    position: relative;
  }

  .reset-input-shell > span {
    position: absolute;
    top: 50%;
    left: 15px;

    transform: translateY(-50%);

    color: #94a3b8;

    font-size: 0.7rem;
  }

  .reset-input-shell input {
    display: block;

    width: 100%;
    min-height: 50px;

    padding:
      0
      68px
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

  .reset-input-shell input:focus {
    border-color:
      var(--reset-purple-light);

    box-shadow:
      0 0 0 4px
      rgba(109, 40, 217, 0.09);
  }

  .reset-input-shell button {
    position: absolute;
    top: 50%;
    right: 12px;

    transform: translateY(-50%);

    border: 0;

    background: transparent;
    color: var(--reset-purple);

    cursor: pointer;

    font-size: 0.65rem;
    font-weight: 900;
  }

  .reset-strength {
    margin-top: 12px;
  }

  .reset-strength-bars {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .reset-strength-bars span {
    height: 5px;

    border-radius: 999px;

    background:
      rgba(148, 163, 184, 0.22);
  }

  .reset-strength-active {
    background: #ef4444 !important;
  }

  .reset-strength-2 {
    background: #f59e0b !important;
  }

  .reset-strength-3 {
    background: #8b5cf6 !important;
  }

  .reset-strength-4 {
    background: #22c55e !important;
  }

  .reset-strength-copy {
    margin-top: 8px;

    color: #667085;

    font-size: 0.66rem;
  }

  .reset-strength ul {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px 12px;

    margin: 10px 0 0;
    padding: 0;

    list-style: none;
  }

  .reset-strength li {
    color: #98a2b3;

    font-size: 0.63rem;
  }

  .reset-strength li::before {
    content: "○";

    margin-right: 5px;
  }

  .reset-strength .reset-rule-valid {
    color: #168449;
  }

  .reset-strength
  .reset-rule-valid::before {
    content: "✓";
  }

  .reset-primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;

    width: 100%;
    min-height: 50px;

    margin-top: 22px;

    border: 0;
    border-radius: 14px;

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

    cursor: pointer;

    font: inherit;
    font-size: 0.8rem;
    font-weight: 900;
  }

  .reset-primary-button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .reset-back-link {
    margin: 19px 0 0;

    text-align: center;
  }

  .reset-back-link a,
  .reset-text-link {
    color: var(--reset-purple);

    font-size: 0.72rem;
    font-weight: 900;
    text-decoration: none;
  }

  .reset-state {
    text-align: center;
  }

  .reset-success-icon,
  .reset-invalid-icon {
    display: grid;
    place-items: center;

    width: 64px;
    height: 64px;

    margin: 0 auto 19px;

    border-radius: 50%;

    font-size: 1.5rem;
    font-weight: 950;
  }

  .reset-success-icon {
    background:
      linear-gradient(
        145deg,
        #dcfce7,
        #bbf7d0
      );

    color: #168449;
  }

  .reset-invalid-icon {
    background:
      linear-gradient(
        145deg,
        #fee2e2,
        #fecaca
      );

    color: #c62828;
  }

  .reset-link-button {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    min-height: 50px;

    margin-top: 22px;

    border-radius: 14px;

    background:
      linear-gradient(
        105deg,
        #6d28d9,
        #8b5cf6,
        #ff8500
      );

    color: white;

    font-size: 0.8rem;
    font-weight: 900;
    text-decoration: none;
  }

  .reset-text-link {
    display: inline-block;

    margin-top: 18px;
  }

  .reset-large-spinner {
    display: block;

    width: 46px;
    height: 46px;

    margin: 0 auto 20px;

    border:
      4px solid
      rgba(109, 40, 217, 0.15);

    border-top-color:
      var(--reset-purple);

    border-radius: 50%;

    animation:
      reset-spin 0.75s linear infinite;
  }

  .reset-spinner {
    width: 15px;
    height: 15px;

    border:
      2px solid
      rgba(255, 255, 255, 0.4);

    border-top-color: currentColor;
    border-radius: 50%;

    animation:
      reset-spin 0.72s linear infinite;
  }

  @keyframes reset-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 840px) {
    .reset-page {
      padding: 10px;
    }

    .reset-shell {
      display: block;

      width: min(100%, 520px);
    }

    .reset-logo {
      margin-bottom: 10px;
    }

    .reset-logo img {
      width: min(430px, 94vw);
      max-width: 100%;
      max-height: 135px;
    }

    .reset-card {
      max-width: none;

      padding:
        clamp(21px, 4vh, 29px)
        clamp(17px, 5vw, 27px);

      border-radius: 24px;
    }
  }

  @media (max-width: 480px) {
    .reset-page {
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

    .reset-logo {
      margin-bottom: 5px;
    }

    .reset-logo img {
      width: 100%;
      max-height: 105px;
    }

    .reset-card {
      padding: 18px 14px;

      border-radius: 20px;
    }

    .reset-header h1,
    .reset-state h1 {
      font-size: 1.8rem;
    }

    .reset-field {
      margin-top: 17px;
    }

    .reset-strength ul {
      grid-template-columns: 1fr;
    }
  }
`;

export default ResetPasswordPage;