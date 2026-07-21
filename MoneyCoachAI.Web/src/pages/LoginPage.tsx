import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  loginUser,
  loginWithGoogle,
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

function LoginPage() {
  const navigate = useNavigate();

  const googleButtonRef =
    useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState(
    () =>
      localStorage.getItem("rememberedEmail") ??
      ""
  );

  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(
    () =>
      Boolean(
        localStorage.getItem("rememberedEmail")
      )
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ??
    "";

  const completeLogin = useCallback(
    (
      token: string,
      userId: string,
      userEmail: string
    ) => {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem(
        "userEmail",
        userEmail
      );

      if (rememberMe) {
        localStorage.setItem(
          "rememberedEmail",
          userEmail
        );
      } else {
        localStorage.removeItem(
          "rememberedEmail"
        );
      }

      navigate("/dashboard", {
        replace: true,
      });
    },
    [navigate, rememberMe]
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      if (!credential) {
        setErrorMessage(
          "Google did not return a valid sign-in credential."
        );

        return;
      }

      try {
        setGoogleLoading(true);
        setErrorMessage("");

        const response = await loginWithGoogle({
          credential,
        });

        completeLogin(
          response.token,
          response.userId,
          response.email
        );
      } catch (error) {
        console.error(
          "Google login failed:",
          error
        );

        setErrorMessage(
          getApiErrorMessage(
            error,
            "Google sign-in failed. Please try again."
          )
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    [completeLogin]
  );

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    let cancelled = false;
    let resizeTimer = 0;

    const renderGoogleButton = () => {
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
        googleButtonRef.current.clientWidth;

      const buttonWidth = Math.max(
        220,
        Math.min(410, availableWidth)
      );

      googleButtonRef.current.innerHTML = "";

      googleWindow.google.accounts.id.initialize({
        client_id: googleClientId,

        callback: (response) => {
          void handleGoogleCredential(
            response.credential
          );
        },
      });

      googleWindow.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: Math.floor(buttonWidth),
        }
      );
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);

      resizeTimer = window.setTimeout(() => {
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

        window.clearTimeout(resizeTimer);
      };
    }

    const script =
      document.createElement("script");

    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    script.addEventListener(
      "load",
      renderGoogleButton
    );

    document.head.appendChild(script);

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

      window.clearTimeout(resizeTimer);
    };
  }, [
    googleClientId,
    handleGoogleCredential,
  ]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Enter your email address."
      );

      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage(
        "Enter a valid email address."
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        "Enter your password."
      );

      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await loginUser({
        email: normalizedEmail,
        password,
      });

      completeLogin(
        response.token,
        response.userId,
        response.email
      );
    } catch (error) {
      console.error("Login failed:", error);

      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to sign in. Check your email and password."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const isBusy = loading || googleLoading;

  return (
    <main className="login-page">
      <div className="login-bg-glow login-bg-glow-one" />
      <div className="login-bg-glow login-bg-glow-two" />
      <div className="login-bg-circle login-bg-circle-one" />
      <div className="login-bg-circle login-bg-circle-two" />

      <section className="login-column login-brand-column">
        <div className="login-brand-content">
          <img
            src="/branding/moneycoachai-logo.png"
            alt="MoneyCoachAI"
            className="login-main-logo"
          />

          <div className="login-brand-badge">
            <span>✦</span>

            <strong>Smart today,</strong>

            <em>wealthy tomorrow</em>
          </div>

          <p className="login-brand-message">
            Your intelligent partner for smarter
            money decisions.
          </p>
        </div>
      </section>

      <section className="login-column login-form-column">
        <div className="login-card">
          <div className="login-mobile-logo">
            <img
              src="/branding/moneycoachai-logo.png"
              alt="MoneyCoachAI"
            />
          </div>

          <header className="login-card-header">
            <span className="login-eyebrow">
              Welcome back
            </span>

            <h1>Sign in to your account</h1>

            <p>
              Continue managing your financial
              progress.
            </p>
          </header>

          {errorMessage && (
            <div
              className="login-error"
              role="alert"
            >
              <span className="login-error-symbol">
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
            className={`login-google-wrapper ${
              googleLoading
                ? "login-google-busy"
                : ""
            }`}
          >
            {googleClientId ? (
              <div
                ref={googleButtonRef}
                className="login-google-button"
              />
            ) : (
              <div className="login-google-disabled">
                <span>G</span>

                <div>
                  <strong>
                    Google Sign-In is unavailable
                  </strong>

                  <p>
                    Configure
                    VITE_GOOGLE_CLIENT_ID.
                  </p>
                </div>
              </div>
            )}

            {googleLoading && (
              <div className="login-google-overlay">
                <span className="login-spinner" />

                Signing in with Google...
              </div>
            )}
          </div>

          <div className="login-divider">
            <span>or continue with email</span>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="login-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="login-input-wrap">
                <span className="login-input-icon">
                  @
                </span>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  disabled={isBusy}
                  autoComplete="email"
                  placeholder="you@example.com"
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">
                  Password
                </label>

                <button
                  type="button"
                  className="login-forgot"
                  disabled={isBusy}
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <div className="login-input-wrap">
                <span className="login-input-icon">
                  ●
                </span>

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  disabled={isBusy}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  disabled={isBusy}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={isBusy}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
              />

              <span className="login-checkbox">
                ✓
              </span>

              <span>Remember my email</span>
            </label>

            <button
              type="submit"
              className="login-submit"
              disabled={isBusy}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <p className="login-register">
            New to MoneyCoachAI?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>

          <p className="login-security">
            Protected with secure JWT authentication.
          </p>
        </div>
      </section>

      <section className="login-column login-feature-column">
        <div className="login-feature-content">
          <h2>
            <span>Your Money.</span>

            <strong>Smarter with AI.</strong>
          </h2>

          <p className="login-feature-intro">
            Track, analyse and grow your wealth
            with an intelligent financial advisor.
          </p>

          <div className="login-benefits">
            <FeatureItem
              type="purple"
              title="AI Financial Advisor"
              description="Get personalised financial suggestions."
              icon={
                <svg viewBox="0 0 24 24">
                  <rect
                    x="4"
                    y="7"
                    width="16"
                    height="12"
                    rx="5"
                  />

                  <path d="M9 4v3M15 4v3" />
                  <path d="M8.5 12h.01M15.5 12h.01" />
                  <path d="M9 15h6" />
                </svg>
              }
            />

            <FeatureItem
              type="orange"
              title="Track & Manage"
              description="Manage income, expenses and savings."
              icon={
                <svg viewBox="0 0 24 24">
                  <path d="M4 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <path d="M4 10V7a3 3 0 0 1 3-3h10" />
                  <path d="M16 14h4" />
                </svg>
              }
            />

            <FeatureItem
              type="purple"
              title="Smart Reports"
              description="Understand your financial journey."
              icon={
                <svg viewBox="0 0 24 24">
                  <path d="M5 20V12" />
                  <path d="M12 20V5" />
                  <path d="M19 20V9" />
                </svg>
              }
            />

            <FeatureItem
              type="orange"
              title="Achieve Goals"
              description="Set goals and track your progress."
              icon={
                <svg viewBox="0 0 24 24">
                  <circle
                    cx="11"
                    cy="12"
                    r="7"
                  />

                  <circle
                    cx="11"
                    cy="12"
                    r="3"
                  />

                  <path d="M14 9l6-6" />
                  <path d="M16 3h4v4" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      <style>{loginStyles}</style>
    </main>
  );
}

type FeatureItemProps = {
  type: "purple" | "orange";
  title: string;
  description: string;
  icon: React.ReactNode;
};

function FeatureItem({
  type,
  title,
  description,
  icon,
}: FeatureItemProps) {
  return (
    <article className="login-benefit">
      <div
        className={`login-benefit-icon login-benefit-icon-${type}`}
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
      typeof responseData.message === "string"
    ) {
      return responseData.message;
    }

    if (
      "title" in responseData &&
      typeof responseData.title === "string"
    ) {
      return responseData.title;
    }
  }

  if (error.code === "ERR_NETWORK") {
    return "Unable to connect to the MoneyCoachAI server. Make sure the backend is running.";
  }

  return fallbackMessage;
}

const loginStyles = `
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

  .login-page,
  .login-page * {
    box-sizing: border-box;
  }

  .login-page {
    --purple: #6d28d9;
    --purple-light: #8b5cf6;
    --orange: #ff8500;
    --orange-dark: #f97316;
    --text: #16172b;
    --muted: #667085;

    position: relative;

    display: grid;
    grid-template-columns:
      minmax(260px, 0.85fr)
      minmax(390px, 1fr)
      minmax(300px, 0.95fr);

    align-items: center;

    width: 100%;
    min-width: 0;
    height: 100vh;
    height: 100dvh;

    padding:
      clamp(18px, 3vh, 34px)
      clamp(22px, 4vw, 66px);

    gap:
      clamp(22px, 3.5vw, 62px);

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

  .login-bg-glow,
  .login-bg-circle {
    position: absolute;
    pointer-events: none;
  }

  .login-bg-glow {
    border-radius: 50%;
    filter: blur(35px);
  }

  .login-bg-glow-one {
    top: 14%;
    left: 31%;

    width: 250px;
    height: 250px;

    background:
      rgba(139, 92, 246, 0.08);
  }

  .login-bg-glow-two {
    right: 2%;
    bottom: 3%;

    width: 250px;
    height: 250px;

    background:
      rgba(255, 133, 0, 0.07);
  }

  .login-bg-circle {
    border:
      1px solid
      rgba(109, 40, 217, 0.065);

    border-radius: 50%;
  }

  .login-bg-circle-one {
    top: -240px;
    left: -190px;

    width: 450px;
    height: 450px;
  }

  .login-bg-circle-two {
    right: -240px;
    bottom: -270px;

    width: 560px;
    height: 560px;

    box-shadow:
      0 0 0 70px
      rgba(109, 40, 217, 0.016);
  }

  .login-column {
    position: relative;
    z-index: 2;

    min-width: 0;
  }

  .login-brand-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    width: 100%;
    max-width: 430px;

    margin: 0 auto;

    text-align: center;

    transform: translateY(-80px);
  }

  .login-main-logo {
    display: block;

    width: clamp(460px,38vw,700px);

    max-width: 170%;
    height: auto;
    max-height: 420px;

    object-fit: contain;

    filter:
       drop-shadow(0 18px 28px rgba(109,40,217,.12));
  }

  .login-brand-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 5px;

    max-width: 100%;

    margin-top:
      clamp(14px, 2.5vh, 28px);

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

    font-size:
      clamp(
        0.62rem,
        0.7vw,
        0.72rem
      );

    font-style: normal;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .login-brand-badge span,
  .login-brand-badge em {
    color: var(--orange);
    font-style: normal;
  }

  .login-brand-badge strong {
    color: var(--purple);
  }

  .login-brand-message {
    max-width: 310px;

    margin: 18px 0 0;

    color: var(--muted);

    font-size: 0.8rem;
    line-height: 1.6;
  }

  .login-form-column {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-card {
    width: 100%;
    max-width: 455px;

    padding:
      clamp(22px, 3vh, 31px)
      clamp(22px, 2.7vw, 32px);

    border:
      1px solid
      rgba(255, 255, 255, 0.76);

    border-radius: 29px;

    background:
      rgba(255, 255, 255, 0.58);

    box-shadow:
      0 24px 70px
      rgba(76, 29, 149, 0.1),
      inset 0 1px 0
      rgba(255, 255, 255, 0.96);

    backdrop-filter: blur(22px);
  }

  .login-mobile-logo {
    display: none;
  }

  .login-eyebrow {
    display: block;

    color: var(--purple);

    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .login-card-header h1 {
    margin:
      clamp(6px, 1vh, 9px)
      0
      0;

    font-size:
      clamp(
        1.8rem,
        2.5vw,
        2.45rem
      );

    line-height: 1.06;
    letter-spacing: -0.045em;
  }

  .login-card-header p {
    margin: 8px 0 0;

    color: #64748b;

    font-size: 0.78rem;
    line-height: 1.5;
  }

  .login-error {
    display: flex;
    align-items: center;
    gap: 9px;

    margin-top: 14px;
    padding: 9px 11px;

    border:
      1px solid
      rgba(239, 68, 68, 0.19);

    border-radius: 12px;

    background:
      rgba(239, 68, 68, 0.07);

    color: #b42318;

    font-size: 0.68rem;
    font-weight: 700;
  }

  .login-error-symbol {
    display: grid;
    place-items: center;

    flex: 0 0 auto;

    width: 22px;
    height: 22px;

    border-radius: 50%;

    background: #dc2626;
    color: white;

    font-weight: 900;
  }

  .login-error p {
    flex: 1;

    min-width: 0;
    margin: 0;
  }

  .login-error button {
    border: 0;

    background: transparent;
    color: inherit;

    cursor: pointer;

    font-size: 1.05rem;
  }

  .login-google-wrapper {
    position: relative;

    width: 100%;

    margin-top:
      clamp(14px, 2vh, 20px);
  }

  .login-google-busy {
    pointer-events: none;
  }

  .login-google-button {
    display: flex;
    justify-content: center;

    width: 100%;
    min-width: 0;
    min-height: 44px;

    overflow: hidden;
  }

  .login-google-button > div,
  .login-google-button iframe {
    max-width: 100% !important;
  }

  .login-google-disabled {
    display: flex;
    align-items: center;
    gap: 11px;

    min-height: 46px;

    padding: 8px 12px;

    border:
      1px dashed
      rgba(148, 163, 184, 0.45);

    border-radius: 14px;

    background:
      rgba(255, 255, 255, 0.55);
  }

  .login-google-disabled > span {
    display: grid;
    place-items: center;

    width: 30px;
    height: 30px;

    border-radius: 50%;

    background: white;
    color: #4285f4;

    font-weight: 900;
  }

  .login-google-disabled strong {
    display: block;

    font-size: 0.69rem;
  }

  .login-google-disabled p {
    margin: 2px 0 0;

    color: #94a3b8;

    font-size: 0.59rem;
  }

  .login-google-overlay {
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

    font-size: 0.7rem;
    font-weight: 800;
  }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 11px;

    margin:
      clamp(12px, 1.8vh, 18px)
      0;

    color: #94a3b8;

    font-size: 0.62rem;
    font-weight: 700;
  }

  .login-divider::before,
  .login-divider::after {
    content: "";

    flex: 1;
    height: 1px;

    background:
      rgba(148, 163, 184, 0.24);
  }

  .login-field {
    margin-top:
      clamp(9px, 1.4vh, 13px);
  }

  .login-field:first-child {
    margin-top: 0;
  }

  .login-field label {
    display: block;

    margin: 0 0 6px 2px;

    color: #475569;

    font-size: 0.68rem;
    font-weight: 900;
  }

  .login-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .login-forgot {
    margin-bottom: 6px;
    padding: 0;

    border: 0;

    background: transparent;
    color: var(--purple);

    cursor: pointer;

    font: inherit;
    font-size: 0.64rem;
    font-weight: 850;
  }

  .login-input-wrap {
    position: relative;

    min-width: 0;
  }

  .login-input-wrap input {
    display: block;

    width: 100%;
    min-width: 0;
    min-height:
      clamp(
        44px,
        5.4vh,
        49px
      );

    padding:
      0
      65px
      0
      40px;

    border:
      1px solid
      rgba(109, 40, 217, 0.15);

    border-radius: 14px;

    outline: none;

    background:
      rgba(255, 255, 255, 0.76);

    color: #172033;

    font: inherit;
    font-size: 0.77rem;
    font-weight: 650;

    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .login-input-wrap input:focus {
    border-color: var(--purple-light);

    background:
      rgba(255, 255, 255, 0.96);

    box-shadow:
      0 0 0 4px
      rgba(109, 40, 217, 0.09);
  }

  .login-input-wrap input::placeholder {
    color: #a0aec0;
  }

  .login-input-icon {
    position: absolute;
    top: 50%;
    left: 14px;

    transform: translateY(-50%);

    color: #94a3b8;

    font-size: 0.68rem;
    font-weight: 900;

    pointer-events: none;
  }

  .login-password-toggle {
    position: absolute;
    top: 50%;
    right: 12px;

    transform: translateY(-50%);

    padding: 3px;

    border: 0;

    background: transparent;
    color: var(--purple);

    cursor: pointer;

    font: inherit;
    font-size: 0.63rem;
    font-weight: 900;
  }

  .login-remember {
    position: relative;

    display: inline-flex;
    align-items: center;
    gap: 7px;

    margin-top:
      clamp(10px, 1.6vh, 15px);

    color: #64748b;

    cursor: pointer;

    font-size: 0.66rem;
    font-weight: 700;
  }

  .login-remember input {
    position: absolute;

    width: 1px;
    height: 1px;

    opacity: 0;
  }

  .login-checkbox {
    display: grid;
    place-items: center;

    width: 17px;
    height: 17px;

    border:
      1px solid
      rgba(148, 163, 184, 0.5);

    border-radius: 5px;

    background:
      rgba(255, 255, 255, 0.8);

    color: transparent;

    font-size: 0.6rem;
    font-weight: 950;
  }

  .login-remember input:checked
  + .login-checkbox {
    border-color: var(--purple);

    background:
      linear-gradient(
        135deg,
        var(--purple),
        var(--orange)
      );

    color: white;
  }

  .login-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;

    width: 100%;
    min-height:
      clamp(
        45px,
        5.5vh,
        49px
      );

    margin-top:
      clamp(12px, 1.8vh, 18px);

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
    font-size: 0.77rem;
    font-weight: 900;
  }

  .login-submit:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .login-submit:disabled {
    cursor: not-allowed;
    opacity: 0.62;
    box-shadow: none;
  }

  .login-register {
    margin:
      clamp(12px, 1.8vh, 18px)
      0
      0;

    color: #64748b;

    font-size: 0.68rem;
    text-align: center;
  }

  .login-register a {
    color: var(--purple);

    font-weight: 900;
    text-decoration: none;
  }

  .login-security {
    margin: 9px 0 0;

    color: #9aa5b5;

    font-size: 0.57rem;
    text-align: center;
  }

  .login-spinner {
    width: 14px;
    height: 14px;

    border:
      2px solid
      rgba(255, 255, 255, 0.4);

    border-top-color: currentColor;
    border-radius: 50%;

    animation:
      login-spin 0.72s linear infinite;
  }

  .login-feature-content {
    width: 100%;
    max-width: 430px;

    margin: 0 auto;
  }

  .login-feature-content h2 {
    display: grid;

    margin: 0;

    font-size:
      clamp(
        2.5rem,
        4vw,
        4.5rem
      );

    line-height: 0.94;
    letter-spacing: -0.06em;
  }

  .login-feature-content h2 span {
    color: #111426;
  }

  .login-feature-content h2 strong {
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

  .login-feature-intro {
    max-width: 390px;

    margin: 17px 0 0;

    color: #4b5565;

    font-size: 0.86rem;
    line-height: 1.6;
  }

  .login-benefits {
    display: grid;
    gap:
      clamp(9px, 1.4vh, 15px);

    margin-top:
      clamp(18px, 3vh, 30px);
  }

  .login-benefit {
    display: grid;
    grid-template-columns: 52px 1fr;
    align-items: center;
    gap: 13px;

    min-width: 0;

    padding: 5px;
  }

  .login-benefit-icon {
    display: grid;
    place-items: center;

    width: 50px;
    height: 50px;

    border:
      1px solid
      rgba(255, 255, 255, 0.92);

    border-radius: 16px;

    box-shadow:
      0 10px 23px
      rgba(76, 29, 149, 0.09);
  }

  .login-benefit-icon-purple {
    background:
      linear-gradient(
        145deg,
        #f4eaff,
        #e9d7ff
      );

    color: var(--purple);
  }

  .login-benefit-icon-orange {
    background:
      linear-gradient(
        145deg,
        #fff1df,
        #ffdeb5
      );

    color: var(--orange-dark);
  }

  .login-benefit-icon svg {
    width: 27px;
    height: 27px;

    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .login-benefit strong {
    display: block;

    color: #17192b;

    font-size: 0.82rem;
    font-weight: 900;
  }

  .login-benefit p {
    margin: 3px 0 0;

    color: #667085;

    font-size: 0.67rem;
    line-height: 1.45;
  }

  @keyframes login-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1180px) {
    .login-page {
      grid-template-columns:
        minmax(220px, 0.72fr)
        minmax(380px, 1fr)
        minmax(270px, 0.82fr);

      gap: 24px;

      padding-left: 28px;
      padding-right: 28px;
    }

    .login-main-logo {
      width: 400px;
      max-width: 150%;
    }

    .login-feature-content h2 {
      font-size:
        clamp(
          2.35rem,
          3.8vw,
          3.7rem
        );
    }
  }

  @media (max-width: 980px) {
    body {
      overflow: hidden;
    }

    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 100%;
      height: 100vh;
      height: 100dvh;

      padding:
        clamp(8px, 2vh, 16px)
        clamp(9px, 3vw, 20px);

      overflow: hidden;
    }

    .login-brand-column,
    .login-feature-column {
      display: none;
    }

    .login-form-column {
      width: 100%;
      max-width: 520px;
    }

    .login-card {
      width: 100%;
      max-width: 100%;

      padding:
        clamp(16px, 2.6vh, 24px)
        clamp(16px, 5vw, 27px);

      border-radius: 25px;
    }

    .login-mobile-logo {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 100%;

      margin-bottom:
        clamp(9px, 1.8vh, 17px);
    }

    .login-mobile-logo img {
      display: block;

      width:
        min(
          430px,
          100%
        );

      height: auto;
      max-height:
        clamp(
          105px,
          18vh,
          155px
        );

      object-fit: contain;

      filter:
        drop-shadow(
          0 12px 24px
          rgba(109, 40, 217, 0.11)
        );
    }

    .login-card-header h1 {
      font-size:
        clamp(
          1.65rem,
          6vw,
          2.15rem
        );
    }
  }

  @media (max-width: 520px) {
    .login-page {
      padding:
        6px
        max(
          7px,
          env(safe-area-inset-right)
        )
        6px
        max(
          7px,
          env(safe-area-inset-left)
        );
    }

    .login-card {
      padding:
        clamp(12px, 2vh, 18px)
        13px;

      border-radius: 20px;
    }

    .login-mobile-logo {
      margin-bottom:
        clamp(6px, 1.2vh, 10px);
    }

    .login-mobile-logo img {
      width: 100%;
      max-height:
        clamp(
          95px,
          16vh,
          130px
        );
    }

    .login-card-header h1 {
      margin-top: 5px;

      font-size:
        clamp(
          1.45rem,
          7vw,
          1.8rem
        );
    }

    .login-card-header p {
      margin-top: 5px;

      font-size: 0.7rem;
    }

    .login-google-wrapper {
      margin-top:
        clamp(9px, 1.5vh, 13px);
    }

    .login-divider {
      margin:
        clamp(8px, 1.3vh, 12px)
        0;
    }

    .login-field {
      margin-top:
        clamp(7px, 1.1vh, 10px);
    }

    .login-input-wrap input {
      min-height:
        clamp(
          41px,
          5.7vh,
          45px
        );

      padding-left: 38px;
      padding-right: 58px;

      font-size: 0.71rem;
    }

    .login-label-row {
      align-items: flex-end;
    }

    .login-forgot {
      max-width: 47%;

      overflow: hidden;

      font-size: 0.58rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .login-password-toggle {
      right: 9px;

      font-size: 0.58rem;
    }

    .login-remember {
      margin-top:
        clamp(8px, 1.2vh, 11px);

      font-size: 0.61rem;
    }

    .login-submit {
      min-height:
        clamp(
          42px,
          5.8vh,
          46px
        );

      margin-top:
        clamp(9px, 1.4vh, 13px);
    }

    .login-register {
      margin-top:
        clamp(8px, 1.3vh, 12px);

      font-size: 0.62rem;
    }

    .login-security {
      margin-top: 6px;

      font-size: 0.53rem;
    }
  }

  @media (
    max-height: 690px
  ) and (
    max-width: 980px
  ) {
    .login-card {
      padding-top: 9px;
      padding-bottom: 9px;
    }

    .login-mobile-logo {
      margin-bottom: 4px;
    }

    .login-mobile-logo img {
      max-height: 74px;
    }

    .login-eyebrow {
      font-size: 0.54rem;
    }

    .login-card-header h1 {
      font-size: 1.4rem;
    }

    .login-card-header p {
      margin-top: 3px;

      font-size: 0.64rem;
    }

    .login-google-wrapper {
      margin-top: 7px;
    }

    .login-divider {
      margin-top: 6px;
      margin-bottom: 6px;
    }

    .login-field {
      margin-top: 6px;
    }

    .login-field label,
    .login-forgot {
      margin-bottom: 4px;
    }

    .login-input-wrap input {
      min-height: 39px;
    }

    .login-remember {
      margin-top: 6px;
    }

    .login-submit {
      min-height: 40px;
      margin-top: 7px;
    }

    .login-register {
      margin-top: 7px;
    }

    .login-security {
      margin-top: 4px;
    }
  }

  @media (
    max-height: 740px
  ) and (
    min-width: 981px
  ) {
    .login-page {
      padding-top: 13px;
      padding-bottom: 13px;
    }

    .login-main-logo {
      width: 445px;
      max-height: 275px;
    }

    .login-brand-badge {
      margin-top: -23px;
      padding: 6px 12px;
    }

    .login-brand-message {
      margin-top: 10px;
    }

    .login-card {
      padding-top: 19px;
      padding-bottom: 19px;
    }

    .login-google-wrapper {
      margin-top: 12px;
    }

    .login-divider {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .login-field {
      margin-top: 8px;
    }

    .login-remember {
      margin-top: 8px;
    }

    .login-submit {
      margin-top: 10px;
    }

    .login-register {
      margin-top: 10px;
    }

    .login-benefits {
      gap: 6px;
      margin-top: 14px;
    }

    .login-benefit-icon {
      width: 43px;
      height: 43px;
    }

    .login-benefit {
      grid-template-columns: 45px 1fr;
    }
  }
`;

export default LoginPage;