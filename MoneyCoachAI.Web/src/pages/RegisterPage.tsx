import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  loginWithGoogle,
  registerUser,
} from "../services/authService";

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (
          response: GoogleCredentialResponse
        ) => void;
      }) => void;

      renderButton: (
        element: HTMLElement,
        options: {
          type?: string;
          theme?: string;
          size?: string;
          text?: string;
          shape?: string;
          width?: number;
        }
      ) => void;
    };
  };
};

function RegisterPage() {
  const navigate = useNavigate();

  const googleButtonRef =
    useRef<HTMLDivElement | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    acceptedTerms,
    setAcceptedTerms,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const googleClientId =
    import.meta.env
      .VITE_GOOGLE_CLIENT_ID?.trim() ??
    "";

  const passwordScore =
    calculatePasswordScore(password);

  const completeAuthentication =
    useCallback(
      (
        token: string,
        userId: string,
        userEmail: string
      ) => {
        localStorage.setItem(
          "token",
          token
        );

        localStorage.setItem(
          "userId",
          userId
        );

        localStorage.setItem(
          "userEmail",
          userEmail
        );

        navigate("/dashboard", {
          replace: true,
        });
      },
      [navigate]
    );

  const handleGoogleCredential =
    useCallback(
      async (credential: string) => {
        if (!credential) {
          setErrorMessage(
            "Google did not return a valid sign-up credential."
          );

          return;
        }

        try {
          setGoogleLoading(true);
          setErrorMessage("");

          const response =
            await loginWithGoogle({
              credential,
            });

          completeAuthentication(
            response.token,
            response.userId,
            response.email
          );
        } catch (error) {
          console.error(
            "Google registration failed:",
            error
          );

          setErrorMessage(
            getApiErrorMessage(
              error,
              "Google sign-up failed. Please try again."
            )
          );
        } finally {
          setGoogleLoading(false);
        }
      },
      [completeAuthentication]
    );

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    let cancelled = false;
    let resizeTimer = 0;

    const renderGoogleButton =
      () => {
        if (
          cancelled ||
          !googleButtonRef.current
        ) {
          return;
        }

        const googleWindow =
          window as Window & {
            google?: GoogleAccountsApi;
          };

        if (!googleWindow.google) {
          return;
        }

        const availableWidth =
          googleButtonRef.current
            .clientWidth;

        const buttonWidth = Math.max(
          220,
          Math.min(
            410,
            availableWidth
          )
        );

        googleButtonRef.current.innerHTML =
          "";

        googleWindow.google.accounts.id.initialize(
          {
            client_id:
              googleClientId,

            callback: (response) => {
              void handleGoogleCredential(
                response.credential
              );
            },
          }
        );

        googleWindow.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signup_with",
            shape: "pill",
            width:
              Math.floor(
                buttonWidth
              ),
          }
        );
      };

    const handleResize = () => {
      window.clearTimeout(
        resizeTimer
      );

      resizeTimer =
        window.setTimeout(() => {
          renderGoogleButton();
        }, 120);
    };

    const scriptUrl =
      "https://accounts.google.com/gsi/client";

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        `script[src="${scriptUrl}"]`
      );

    if (existingScript) {
      const googleWindow =
        window as Window & {
          google?: GoogleAccountsApi;
        };

      if (googleWindow.google) {
        renderGoogleButton();
      } else {
        existingScript.addEventListener(
          "load",
          renderGoogleButton
        );
      }

      window.addEventListener(
        "resize",
        handleResize
      );

      return () => {
        cancelled = true;

        existingScript.removeEventListener(
          "load",
          renderGoogleButton
        );

        window.removeEventListener(
          "resize",
          handleResize
        );

        window.clearTimeout(
          resizeTimer
        );
      };
    }

    const script =
      document.createElement(
        "script"
      );

    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    script.addEventListener(
      "load",
      renderGoogleButton
    );

    document.head.appendChild(
      script
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      cancelled = true;

      script.removeEventListener(
        "load",
        renderGoogleButton
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      window.clearTimeout(
        resizeTimer
      );
    };
  }, [
    googleClientId,
    handleGoogleCredential,
  ]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedName =
      fullName.trim();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedName) {
      setErrorMessage(
        "Enter your full name."
      );

      return;
    }

    if (
      normalizedName.length < 2
    ) {
      setErrorMessage(
        "Your name must contain at least 2 characters."
      );

      return;
    }

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter your email address."
      );

      return;
    }

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      setErrorMessage(
        "Enter a valid email address."
      );

      return;
    }

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      setErrorMessage(
        passwordError
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        "The passwords do not match."
      );

      return;
    }

    if (!acceptedTerms) {
      setErrorMessage(
        "Accept the Terms of Service and Privacy Policy to continue."
      );

      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response =
        await registerUser({
          fullName:
            normalizedName,
          email:
            normalizedEmail,
          password,
        });

      completeAuthentication(
        response.token,
        response.userId,
        response.email
      );
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to create your account. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const isBusy =
    loading || googleLoading;

  return (
    <main className="register-page">
      <div className="register-bg-glow register-bg-glow-one" />
      <div className="register-bg-glow register-bg-glow-two" />
      <div className="register-bg-circle register-bg-circle-one" />
      <div className="register-bg-circle register-bg-circle-two" />

      <section className="register-column register-brand-column">
        <div className="register-brand-content">
          <img
            src="/branding/moneycoachai-logo.png"
            alt="MoneyCoachAI"
            className="register-main-logo"
          />

          <div className="register-brand-badge">
            <span>✦</span>

            <strong>
              Start smarter,
            </strong>

            <em>
              grow wealthier
            </em>
          </div>

          <p className="register-brand-message">
            Create your account and begin
            building a clearer financial
            future.
          </p>
        </div>
      </section>

      <section className="register-column register-form-column">
        <div className="register-card">
          <div className="register-mobile-logo">
            <img
              src="/branding/moneycoachai-logo.png"
              alt="MoneyCoachAI"
            />
          </div>

          <header className="register-card-header">
            <span className="register-eyebrow">
              Get started
            </span>

            <h1>
              Create your account
            </h1>

            <p>
              Join MoneyCoachAI and take
              control of your financial
              journey.
            </p>
          </header>

          {errorMessage && (
            <div
              className="register-error"
              role="alert"
            >
              <span className="register-error-symbol">
                !
              </span>

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

          <div
            className={`register-google-wrapper ${
              googleLoading
                ? "register-google-busy"
                : ""
            }`}
          >
            {googleClientId ? (
              <div
                ref={googleButtonRef}
                className="register-google-button"
              />
            ) : (
              <div className="register-google-disabled">
                <span>G</span>

                <div>
                  <strong>
                    Google Sign-Up is unavailable
                  </strong>

                  <p>
                    Configure
                    VITE_GOOGLE_CLIENT_ID.
                  </p>
                </div>
              </div>
            )}

            {googleLoading && (
              <div className="register-google-overlay">
                <span className="register-spinner" />

                Creating your account...
              </div>
            )}
          </div>

          <div className="register-divider">
            <span>
              or register with email
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="register-field">
              <label htmlFor="register-name">
                Full name
              </label>

              <div className="register-input-wrap">
                <span className="register-input-icon">
                  ◉
                </span>

                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  disabled={isBusy}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="register-email">
                Email address
              </label>

              <div className="register-input-wrap">
                <span className="register-input-icon">
                  @
                </span>

                <input
                  id="register-email"
                  type="email"
                  value={email}
                  disabled={isBusy}
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

            <div className="register-password-grid">
              <div className="register-field">
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="register-input-wrap">
                  <span className="register-input-icon">
                    ●
                  </span>

                  <input
                    id="register-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    disabled={isBusy}
                    autoComplete="new-password"
                    placeholder="Create password"
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    disabled={isBusy}
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="register-confirm-password">
                  Confirm password
                </label>

                <div className="register-input-wrap">
                  <span className="register-input-icon">
                    ●
                  </span>

                  <input
                    id="register-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    disabled={isBusy}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    disabled={isBusy}
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) =>
                          !current
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <PasswordStrength
              password={password}
              score={passwordScore}
            />

            <label className="register-terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                disabled={isBusy}
                onChange={(event) =>
                  setAcceptedTerms(
                    event.target.checked
                  )
                }
              />

              <span className="register-checkbox">
                ✓
              </span>

              <span>
                I agree to the{" "}
                <button type="button">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button">
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            <button
              type="submit"
              className="register-submit"
              disabled={isBusy}
            >
              {loading ? (
                <>
                  <span className="register-spinner" />

                  Creating account...
                </>
              ) : (
                <>
                  Create Account

                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <p className="register-login">
            Already have an account?{" "}
            <Link to="/login">
              Sign in
            </Link>
          </p>

          <p className="register-security">
            Protected with secure JWT
            authentication.
          </p>
        </div>
      </section>

      <section className="register-column register-feature-column">
        <div className="register-feature-content">
          <h2>
            <span>
              Build better
            </span>

            <strong>
              money habits.
            </strong>
          </h2>

          <p className="register-feature-intro">
            Everything you need to track,
            understand and improve your
            financial life.
          </p>

          <div className="register-benefits">
            <BenefitItem
              type="purple"
              title="Personal Dashboard"
              description="View your financial activity in one place."
              icon="⌂"
            />

            <BenefitItem
              type="orange"
              title="Smart Budgets"
              description="Plan spending and receive useful alerts."
              icon="₹"
            />

            <BenefitItem
              type="purple"
              title="AI Guidance"
              description="Receive personalised financial insights."
              icon="✦"
            />

            <BenefitItem
              type="orange"
              title="Goal Tracking"
              description="Create goals and monitor your progress."
              icon="◎"
            />
          </div>
        </div>
      </section>

      <style>{registerStyles}</style>
    </main>
  );
}

type BenefitItemProps = {
  type: "purple" | "orange";
  title: string;
  description: string;
  icon: string;
};

function BenefitItem({
  type,
  title,
  description,
  icon,
}: BenefitItemProps) {
  return (
    <article className="register-benefit">
      <div
        className={`register-benefit-icon register-benefit-icon-${type}`}
      >
        {icon}
      </div>

      <div>
        <strong>{title}</strong>

        <p>{description}</p>
      </div>
    </article>
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
    <div className="register-strength">
      <div className="register-strength-head">
        <span>
          Password strength
        </span>

        <strong>
          {password
            ? label
            : "Not entered"}
        </strong>
      </div>

      <div className="register-strength-bars">
        {[1, 2, 3, 4].map(
          (level) => (
            <span
              key={level}
              className={
                password &&
                score >= level
                  ? `register-strength-active register-strength-score-${score}`
                  : ""
              }
            />
          )
        )}
      </div>

      <div className="register-rules">
        <span
          className={
            password.length >= 8
              ? "register-rule-valid"
              : ""
          }
        >
          8+ characters
        </span>

        <span
          className={
            /[A-Z]/.test(password)
              ? "register-rule-valid"
              : ""
          }
        >
          Uppercase
        </span>

        <span
          className={
            /[a-z]/.test(password)
              ? "register-rule-valid"
              : ""
          }
        >
          Lowercase
        </span>

        <span
          className={
            /\d/.test(password)
              ? "register-rule-valid"
              : ""
          }
        >
          Number
        </span>
      </div>
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
  if (!password) {
    return "Enter a password.";
  }

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

function isValidEmail(
  email: string
) {
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

  const responseData =
    error.response?.data;

  if (
    typeof responseData ===
      "string" &&
    responseData.trim()
  ) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData ===
      "object"
  ) {
    if (
      "message" in
        responseData &&
      typeof responseData.message ===
        "string"
    ) {
      return responseData.message;
    }

    if (
      "title" in
        responseData &&
      typeof responseData.title ===
        "string"
    ) {
      return responseData.title;
    }
  }

  if (
    error.code ===
    "ERR_NETWORK"
  ) {
    return "Unable to connect to the MoneyCoachAI server.";
  }

  return fallbackMessage;
}

const registerStyles = `
  html,
  body,
  #root {
    width: 100%;
    min-width: 0;
    min-height: 100%;
    margin: 0;
  }

  body {
    overflow: hidden;
  }

  .register-page,
  .register-page * {
    box-sizing: border-box;
  }

  .register-page {
    --purple: #6d28d9;
    --purple-light: #8b5cf6;
    --orange: #ff8500;
    --orange-dark: #f97316;
    --text: #16172b;
    --muted: #667085;

    position: relative;

    display: grid;
    grid-template-columns:
      minmax(300px, 0.92fr)
      minmax(430px, 1.05fr)
      minmax(360px, 1fr);

    align-items: center;

    width: 100%;
    min-width: 0;
    height: 100vh;
    height: 100dvh;

    padding:
      clamp(14px, 2vh, 25px)
      clamp(22px, 4vw, 60px);

    gap:
      clamp(22px, 3vw, 52px);

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

    color: var(--text);

    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .register-bg-glow,
  .register-bg-circle {
    position: absolute;

    pointer-events: none;
  }

  .register-bg-glow {
    border-radius: 50%;
    filter: blur(35px);
  }

  .register-bg-glow-one {
    top: 14%;
    left: 30%;

    width: 250px;
    height: 250px;

    background:
      rgba(139, 92, 246, 0.08);
  }

  .register-bg-glow-two {
    right: 2%;
    bottom: 3%;

    width: 250px;
    height: 250px;

    background:
      rgba(255, 133, 0, 0.07);
  }

  .register-bg-circle {
    border:
      1px solid
      rgba(109, 40, 217, 0.065);

    border-radius: 50%;
  }

  .register-bg-circle-one {
    top: -240px;
    left: -190px;

    width: 450px;
    height: 450px;
  }

  .register-bg-circle-two {
    right: -240px;
    bottom: -270px;

    width: 560px;
    height: 560px;

    box-shadow:
      0 0 0 70px
      rgba(109, 40, 217, 0.016);
  }

  .register-column {
    position: relative;
    z-index: 2;

    min-width: 0;
  }

  .register-brand-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    width: 100%;
    max-width: 520px;

    margin: 0 auto;

    text-align: center;

    transform: translateY(-80px);
  }

  .register-main-logo {
    display: block;

    width: clamp(460px, 38vw, 700px);

    max-width: 170%;
    height: auto;
    max-height: 420px;

    object-fit: contain;

    filter:
      drop-shadow(
        0 18px 28px
        rgba(109, 40, 217, 0.12)
      );
  }

  .register-brand-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 5px;

    max-width: 100%;

    margin-top: -20px;

    padding: 9px 16px;

    border:
      1px solid
      rgba(109, 40, 217, 0.24);

    border-radius: 999px;

    background:
      rgba(255, 255, 255, 0.64);

    box-shadow:
      0 12px 30px
      rgba(109, 40, 217, 0.07),
      inset 0 1px 0
      rgba(255, 255, 255, 0.95);

    font-size: 0.68rem;
    font-style: normal;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .register-brand-badge span,
  .register-brand-badge em {
    color: var(--orange);
    font-style: normal;
  }

  .register-brand-badge strong {
    color: var(--purple);
  }

  .register-brand-message {
    max-width: 320px;

    margin: 16px 0 0;

    color: var(--muted);

    font-size: 0.78rem;
    line-height: 1.55;
  }

  .register-form-column {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  

  .register-mobile-logo {
    display: none;
  }

  .register-eyebrow {
    display: block;

    color: var(--purple);

    font-size: 0.61rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .register-card-header h1 {
    margin: 6px 0 0;

    font-size:
      clamp(
        1.65rem,
        2.2vw,
        2.2rem
      );

    line-height: 1.06;
    letter-spacing: -0.045em;
  }

  .register-card-header p {
    margin: 6px 0 0;

    color: #64748b;

    font-size: 0.72rem;
    line-height: 1.45;
  }

  .register-error {
    display: flex;
    align-items: center;
    gap: 9px;

    margin-top: 10px;
    padding: 8px 10px;

    border:
      1px solid
      rgba(239, 68, 68, 0.19);

    border-radius: 12px;

    background:
      rgba(239, 68, 68, 0.07);

    color: #b42318;

    font-size: 0.65rem;
    font-weight: 700;
  }

  .register-error-symbol {
    display: grid;
    place-items: center;

    flex: 0 0 auto;

    width: 21px;
    height: 21px;

    border-radius: 50%;

    background: #dc2626;
    color: white;

    font-weight: 900;
  }

  .register-error p {
    flex: 1;

    min-width: 0;
    margin: 0;
  }

  .register-error button {
    border: 0;

    background: transparent;
    color: inherit;

    cursor: pointer;

    font-size: 1rem;
  }

  .register-google-wrapper {
    position: relative;

    width: 100%;

    margin-top:
      clamp(10px, 1.5vh, 15px);
  }

  .register-google-busy {
    pointer-events: none;
  }

  .register-google-button {
    display: flex;
    justify-content: center;

    width: 100%;
    min-width: 0;
    min-height: 42px;

    overflow: hidden;
  }

  .register-google-button > div,
  .register-google-button iframe {
    max-width: 100% !important;
  }

  .register-google-disabled {
    display: flex;
    align-items: center;
    gap: 10px;

    min-height: 44px;

    padding: 7px 11px;

    border:
      1px dashed
      rgba(148, 163, 184, 0.45);

    border-radius: 14px;

    background:
      rgba(255, 255, 255, 0.55);
  }

  .register-google-disabled > span {
    display: grid;
    place-items: center;

    width: 29px;
    height: 29px;

    border-radius: 50%;

    background: white;
    color: #4285f4;

    font-weight: 900;
  }

  .register-google-disabled strong {
    display: block;

    font-size: 0.66rem;
  }

  .register-google-disabled p {
    margin: 2px 0 0;

    color: #94a3b8;

    font-size: 0.56rem;
  }

  .register-google-overlay {
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    border-radius: 14px;

    background:
      rgba(250, 248, 255, 0.96);

    color: var(--purple);

    font-size: 0.67rem;
    font-weight: 800;
  }

  .register-divider {
    display: flex;
    align-items: center;
    gap: 10px;

    margin:
      clamp(8px, 1.2vh, 12px)
      0;

    color: #94a3b8;

    font-size: 0.58rem;
    font-weight: 700;
  }

  .register-divider::before,
  .register-divider::after {
    content: "";

    flex: 1;
    height: 1px;

    background:
      rgba(148, 163, 184, 0.24);
  }

  .register-field {
    min-width: 0;
    margin-top: 8px;
  }

  .register-field:first-child {
    margin-top: 0;
  }

  .register-field label {
    display: block;

    margin: 0 0 4px 2px;

    color: #475569;

    font-size: 0.7rem;
    font-weight: 900;
  }

  .register-password-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 10px;
  }

  .register-input-wrap {
    position: relative;

    min-width: 0;
  }

  .register-input-wrap input {
    display: block;

    width: 100%;
    min-width: 0;
    min-height: 43px;

    padding:
      0
      57px
      0
      38px;

    border:
      1px solid
      rgba(109, 40, 217, 0.15);

    border-radius: 13px;

    outline: none;

    background:
      rgba(255, 255, 255, 0.76);

    color: #172033;

    font: inherit;
    font-size: 0.72rem;
    font-weight: 650;

    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .register-input-wrap input:focus {
    border-color:
      var(--purple-light);

    background:
      rgba(255, 255, 255, 0.96);

    box-shadow:
      0 0 0 4px
      rgba(109, 40, 217, 0.09);
  }

  .register-input-wrap input::placeholder {
    color: #a0aec0;
  }

  .register-input-icon {
    position: absolute;
    top: 50%;
    left: 13px;

    transform: translateY(-50%);

    color: #94a3b8;

    font-size: 0.64rem;
    font-weight: 900;

    pointer-events: none;
  }

  .register-password-toggle {
    position: absolute;
    top: 50%;
    right: 9px;

    transform: translateY(-50%);

    padding: 2px;

    border: 0;

    background: transparent;
    color: var(--purple);

    cursor: pointer;

    font: inherit;
    font-size: 0.56rem;
    font-weight: 900;
  }

  .register-strength {
    margin-top: 9px;
  }

  .register-strength-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    color: #667085;

    font-size: 0.58rem;
  }

  .register-strength-head strong {
    color: var(--purple);
  }

  .register-strength-bars {
    display: grid;
    grid-template-columns:
      repeat(4, 1fr);

    gap: 5px;

    margin-top: 5px;
  }

  .register-strength-bars span {
    height: 4px;

    border-radius: 999px;

    background:
      rgba(148, 163, 184, 0.22);
  }

  .register-strength-active {
    background: #ef4444 !important;
  }

  .register-strength-score-2 {
    background: #f59e0b !important;
  }

  .register-strength-score-3 {
    background: #8b5cf6 !important;
  }

  .register-strength-score-4 {
    background: #22c55e !important;
  }

  .register-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 10px;

    margin-top: 6px;
  }

  .register-rules span {
    color: #98a2b3;

    font-size: 0.54rem;
  }

  .register-rules span::before {
    content: "○";

    margin-right: 4px;
  }

  .register-rules
  .register-rule-valid {
    color: #168449;
  }

  .register-rules
  .register-rule-valid::before {
    content: "✓";
  }

  .register-terms {
    position: relative;

    display: flex;
    align-items: flex-start;
    gap: 7px;

    margin-top: 10px;

    color: #64748b;

    cursor: pointer;

    font-size: 0.59rem;
    line-height: 1.4;
  }

  .register-terms input {
    position: absolute;

    width: 1px;
    height: 1px;

    opacity: 0;
  }

  .register-checkbox {
    display: grid;
    place-items: center;

    flex: 0 0 auto;

    width: 16px;
    height: 16px;

    border:
      1px solid
      rgba(148, 163, 184, 0.5);

    border-radius: 5px;

    background:
      rgba(255, 255, 255, 0.8);

    color: transparent;

    font-size: 0.58rem;
    font-weight: 950;
  }

  .register-terms input:checked
  + .register-checkbox {
    border-color:
      var(--purple);

    background:
      linear-gradient(
        135deg,
        var(--purple),
        var(--orange)
      );

    color: white;
  }

  .register-terms button {
    padding: 0;

    border: 0;

    background: transparent;
    color: var(--purple);

    cursor: pointer;

    font: inherit;
    font-weight: 850;
  }

  .register-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;

    width: 100%;
    min-height: 45px;

    margin-top: 11px;

    border: 0;
    border-radius: 14px;

    background:
      linear-gradient(
        105deg,
        #6d28d9 0%,
        #8b5cf6 52%,
        #ff8500 100%
      );

    box-shadow:
      0 14px 28px
      rgba(109, 40, 217, 0.2),
      0 7px 18px
      rgba(255, 133, 0, 0.1);

    color: white;

    cursor: pointer;

    font: inherit;
    font-size: 0.73rem;
    font-weight: 900;
  }

  .register-submit:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .register-submit:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .register-login {
    margin: 10px 0 0;

    color: #64748b;

    font-size: 0.63rem;
    text-align: center;
  }

  .register-login a {
    color: var(--purple);

    font-weight: 900;
    text-decoration: none;
  }

  .register-security {
    margin: 6px 0 0;

    color: #9aa5b5;

    font-size: 0.52rem;
    text-align: center;
  }

  .register-spinner {
    width: 14px;
    height: 14px;

    border:
      2px solid
      rgba(255, 255, 255, 0.4);

    border-top-color:
      currentColor;

    border-radius: 50%;

    animation:
      register-spin
      0.72s
      linear
      infinite;
  }

  .register-feature-content {
    width: 100%;
    max-width: 520px;

    margin: 0 auto;
  }

 .register-feature-content h2 {
    display: grid;

    width: 100%;
    margin: 0;

    font-size:
      clamp(
        2.5rem,
        4vw,
        4.5rem
      );

    line-height: 1.30;
    letter-spacing: -0.055em;
  }

  .register-feature-content h2 span,
  .register-feature-content h2 strong {
    display: block;
    white-space: nowrap;
  }

  .register-feature-content h2 span {
    color: #111426;
  }

  .register-feature-content h2 strong {
    background:
      linear-gradient(
        90deg,
        #6d28d9 0%,
        #8b5cf6 35%,
        #ff8500 76%,
        #f97316 100%
      );

    background-clip: text;
    -webkit-background-clip: text;

    color: transparent;
    -webkit-text-fill-color: transparent;
  }

  .register-feature-intro {
    max-width: 390px;

    margin: 15px 0 0;

    color: #4b5565;

    font-size: 0.82rem;
    line-height: 1.55;
  }

  .register-benefits {
    display: grid;
    gap:
      clamp(
        7px,
        1.2vh,
        12px
      );

    margin-top:
      clamp(
        16px,
        2.5vh,
        25px
      );
  }

  .register-benefit {
    display: grid;
    grid-template-columns:
      49px
      1fr;

    align-items: center;
    gap: 12px;

    min-width: 0;

    padding: 4px;
  }

  .register-benefit-icon {
    display: grid;
    place-items: center;

    width: 47px;
    height: 47px;

    border:
      1px solid
      rgba(255, 255, 255, 0.92);

    border-radius: 15px;

    box-shadow:
      0 10px 23px
      rgba(76, 29, 149, 0.09);

    font-size: 1.1rem;
    font-weight: 900;
  }

  .register-benefit-icon-purple {
    background:
      linear-gradient(
        145deg,
        #f4eaff,
        #e9d7ff
      );

    color: var(--purple);
  }

  .register-benefit-icon-orange {
    background:
      linear-gradient(
        145deg,
        #fff1df,
        #ffdeb5
      );

    color: var(--orange-dark);
  }

  .register-benefit strong {
    display: block;

    color: #17192b;

    font-size: 0.79rem;
    font-weight: 900;
  }

  .register-benefit p {
    margin: 3px 0 0;

    color: #667085;

    font-size: 0.64rem;
    line-height: 1.4;
  }

  @keyframes register-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1180px) {
    .register-page {
      grid-template-columns:
        minmax(260px, 0.82fr)
        minmax(410px, 1.05fr)
        minmax(310px, 0.9fr);

      gap: 22px;

      padding-left: 26px;
      padding-right: 26px;
    }

    .register-main-logo {
      width: 455px;
      max-width: 165%;
    }

    .register-feature-content h2 {
      font-size: clamp(2.15rem, 3.35vw, 3.55rem);
    }
  }

  @media (max-width: 980px) {
    body {
      overflow: hidden;
    }

    .register-page {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 100%;
      height: 100vh;
      height: 100dvh;

      padding:
        clamp(6px, 1.2vh, 12px)
        clamp(8px, 3vw, 18px);

      overflow: hidden;
    }

    .register-brand-column,
    .register-feature-column {
      display: none;
    }

    .register-form-column {
      width: 100%;
      max-width: 560px;
    }

    .register-card {
      width: 100%;
      max-width: 100%;

      padding:
        clamp(11px, 1.8vh, 18px)
        clamp(15px, 4vw, 24px);

      border-radius: 23px;
    }

    .register-mobile-logo {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 100%;

      margin-bottom:
        clamp(
          4px,
          1vh,
          9px
        );
    }

    .register-mobile-logo img {
      display: block;

      width:
        min(
          420px,
          100%
        );

      height: auto;
      max-height:
        clamp(
          78px,
          13vh,
          115px
        );

      object-fit: contain;

      filter:
        drop-shadow(
          0 10px 20px
          rgba(109, 40, 217, 0.1)
        );
    }

    .register-card-header h1 {
      font-size:
        clamp(
          1.45rem,
          5.7vw,
          1.95rem
        );
    }
  }

  @media (max-width: 560px) {
    .register-page {
      padding:
        5px
        max(
          6px,
          env(
            safe-area-inset-right
          )
        )
        5px
        max(
          6px,
          env(
            safe-area-inset-left
          )
        );
    }

    .register-card {
      padding: 10px 12px;

      border-radius: 19px;
    }

    .register-mobile-logo {
      margin-bottom: 3px;
    }

    .register-mobile-logo img {
      width: 100%;
      max-height: 78px;
    }

    .register-card-header h1 {
      margin-top: 3px;

      font-size: 1.42rem;
    }

    .register-card-header p {
      margin-top: 3px;

      font-size: 0.64rem;
    }

    .register-google-wrapper {
      margin-top: 7px;
    }

    .register-divider {
      margin: 6px 0;
    }

    .register-field {
      margin-top: 6px;
    }

    .register-input-wrap input {
      min-height: 39px;

      font-size: 0.68rem;
    }

    .register-password-grid {
      grid-template-columns: 1fr;

      gap: 0;
    }

    .register-strength {
      margin-top: 6px;
    }

    .register-rules {
      gap: 3px 8px;

      margin-top: 4px;
    }

    .register-terms {
      margin-top: 7px;
    }

    .register-submit {
      min-height: 41px;
      margin-top: 8px;
    }

    .register-login {
      margin-top: 7px;
    }

    .register-security {
      margin-top: 4px;
    }
  }

  @media (
    max-height: 720px
  ) and (
    min-width: 981px
  ) {
    .register-page {
      padding-top: 9px;
      padding-bottom: 9px;
    }

    .register-card {
      width: 100%;
      max-width: 520px;

      padding:
        clamp(17px, 2.3vh, 25px)
        clamp(21px, 2.7vw, 31px);

      border:
        1px solid
        rgba(255, 255, 255, 0.76);

      border-radius: 28px;

      background:
        rgba(255, 255, 255, 0.58);

      box-shadow:
        0 24px 70px
        rgba(76, 29, 149, 0.1),
        inset 0 1px 0
        rgba(255, 255, 255, 0.96);

      backdrop-filter: blur(22px);
    }

    .register-main-logo {
      width: 445px;
      max-width: 165%;
      max-height: 275px;
    }

    .register-brand-badge {
      margin-top: -22px;
      padding: 6px 12px;
    }

    .register-brand-message {
      margin-top: 7px;
    }

    .register-card {
      padding-top: 14px;
      padding-bottom: 14px;
    }

    .register-google-wrapper {
      margin-top: 8px;
    }

    .register-divider {
      margin-top: 6px;
      margin-bottom: 6px;
    }

    .register-field {
      margin-top: 5px;
    }

    .register-input-wrap input {
      min-height: 39px;
    }

    .register-strength {
      margin-top: 5px;
    }

    .register-terms {
      margin-top: 6px;
    }

    .register-submit {
      min-height: 41px;
      margin-top: 7px;
    }

    .register-login {
      margin-top: 6px;
    }

    .register-benefits {
      gap: 4px;
      margin-top: 12px;
    }

    .register-benefit-icon {
      width: 41px;
      height: 41px;
    }

    .register-benefit {
      grid-template-columns:
        43px
        1fr;
    }
  }
`;

export default RegisterPage;