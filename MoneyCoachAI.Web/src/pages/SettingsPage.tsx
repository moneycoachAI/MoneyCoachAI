import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";

import {
  getUserSettings,
  updateUserSettings,
} from "../services/userSettingsService";

import type { UserSettings } from "../types/userSettingsTypes";

type Notice = {
  type: "success" | "error";
  message: string;
};

function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setNotice(null);

      const data = await getUserSettings();
      setSettings(data);
      setSavedSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);

      setNotice({
        type: "error",
        message: "We could not load your preferences. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const hasChanges = useMemo(() => {
    if (!settings || !savedSettings) {
      return false;
    }

    return (
      settings.currency !== savedSettings.currency ||
      settings.dateFormat !== savedSettings.dateFormat
    );
  }, [settings, savedSettings]);

  const handleSave = async () => {
    if (!settings || !hasChanges) {
      return;
    }

    try {
      setIsSaving(true);
      setNotice(null);

      const updatedSettings = await updateUserSettings(settings);

      setSettings(updatedSettings);
      setSavedSettings(updatedSettings);

      setNotice({
        type: "success",
        message: "Preferences saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);

      setNotice({
        type: "error",
        message: "We could not save your preferences. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!savedSettings) {
      return;
    }

    setSettings({ ...savedSettings });
    setNotice(null);
  };

  if (loading) {
    return (
      <AppLayout>
        <main className="settings-page settings-centered-state">
          <div className="settings-loader" />
          <h2>Loading settings</h2>
          <p>Please wait while we retrieve your preferences.</p>
          <style>{settingsStyles}</style>
        </main>
      </AppLayout>
    );
  }

  if (!settings) {
    return (
      <AppLayout>
        <main className="settings-page settings-centered-state">
          <div className="settings-error-icon">!</div>
          <h2>Settings unavailable</h2>
          <p>We could not retrieve your preferences.</p>

          <button
            type="button"
            className="settings-primary-button"
            onClick={() => void loadSettings()}
          >
            Try again
          </button>

          <style>{settingsStyles}</style>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="settings-page">
        <header className="settings-header">
          <div>
            <span className="settings-eyebrow">Application preferences</span>
            <h1>Settings</h1>
            <p>
              Choose how MoneyCoachAI displays amounts and dates throughout the
              application.
            </p>
          </div>

          <div className={`settings-status ${hasChanges ? "is-changed" : ""}`}>
            <span className="settings-status-dot" />
            <div>
              <small>Preference status</small>
              <strong>{hasChanges ? "Unsaved changes" : "Up to date"}</strong>
            </div>
          </div>
        </header>

        {notice && (
          <div
            className={`settings-notice settings-notice-${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <span>{notice.type === "success" ? "✓" : "!"}</span>
            <p>{notice.message}</p>

            <button
              type="button"
              aria-label="Close message"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}

        <section className="settings-section">
          <div className="settings-section-heading">
            <div className="settings-section-icon" aria-hidden="true">
              ⚙
            </div>

            <div>
              <span className="settings-section-kicker">General</span>
              <h2>Financial preferences</h2>
              <p>
                These options control how values and dates appear across your
                MoneyCoachAI account.
              </p>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="settings-row">
            <div className="settings-row-copy">
              <label htmlFor="settings-currency">Currency</label>
              <p>
                Used for balances, expenses, budgets, goals, investments and
                reports.
              </p>
            </div>

            <div className="settings-control-wrap">
              <select
                id="settings-currency"
                value={settings.currency}
                disabled={isSaving}
                onChange={(event) => {
                  setSettings({
                    ...settings,
                    currency: event.target.value,
                  });

                  setNotice(null);
                }}
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>

              <span className="settings-value-preview">
                Preview: {formatPreviewCurrency(settings.currency, 24500)}
              </span>
            </div>
          </div>

          <div className="settings-divider settings-divider-soft" />

          <div className="settings-row">
            <div className="settings-row-copy">
              <label htmlFor="settings-date-format">Date format</label>
              <p>
                Used for transaction, account, goal and report dates throughout
                the app.
              </p>
            </div>

            <div className="settings-control-wrap">
              <select
                id="settings-date-format"
                value={settings.dateFormat}
                disabled={isSaving}
                onChange={(event) => {
                  setSettings({
                    ...settings,
                    dateFormat: event.target.value,
                  });

                  setNotice(null);
                }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>

              <span className="settings-value-preview">
                Preview: {formatPreviewDate(settings.dateFormat)}
              </span>
            </div>
          </div>
        </section>

        <footer className="settings-footer">
          <div className="settings-footer-copy">
            <strong>
              {hasChanges
                ? "You have unsaved preference changes"
                : "Your preferences are saved"}
            </strong>

            <span>
              {hasChanges
                ? "Save the changes to apply them across MoneyCoachAI."
                : "The current currency and date format are active."}
            </span>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="settings-secondary-button"
              disabled={isSaving || !hasChanges}
              onClick={handleReset}
            >
              Reset
            </button>

            <button
              type="button"
              className="settings-primary-button"
              disabled={isSaving || !hasChanges}
              onClick={() => void handleSave()}
            >
              {isSaving ? (
                <>
                  <span className="settings-button-spinner" />
                  Saving...
                </>
              ) : (
                "Save preferences"
              )}
            </button>
          </div>
        </footer>

        <style>{settingsStyles}</style>
      </main>
    </AppLayout>
  );
}

function formatPreviewCurrency(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatPreviewDate(dateFormat: string) {
  if (dateFormat === "MM/DD/YYYY") {
    return "07/17/2026";
  }

  if (dateFormat === "YYYY-MM-DD") {
    return "2026-07-17";
  }

  return "17/07/2026";
}

const settingsStyles = `
  .settings-page,
  .settings-page * {
    box-sizing: border-box;
  }

  .settings-page {
    width: 100%;
    min-height: 100%;
    padding: 26px 1% 34px;
    color: #111827;
  }

  .settings-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }

  .settings-eyebrow,
  .settings-section-kicker {
    display: block;
    color: #6d5dfc;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .settings-header h1 {
    margin: 7px 0 0;
    color: #111827;
    font-size: clamp(2rem, 3.2vw, 2.75rem);
    line-height: 1.05;
    letter-spacing: -0.045em;
  }

  .settings-header p {
    max-width: 680px;
    margin: 10px 0 0;
    color: #64748b;
    font-size: 0.96rem;
    line-height: 1.65;
  }

  .settings-status {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
    padding: 10px 0;
    color: #475569;
  }

  .settings-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #21c77a;
    box-shadow: 0 0 0 5px rgba(33, 199, 122, 0.12);
  }

  .settings-status.is-changed .settings-status-dot {
    background: #ffb547;
    box-shadow: 0 0 0 5px rgba(255, 181, 71, 0.14);
  }

  .settings-status small,
  .settings-status strong {
    display: block;
  }

  .settings-status small {
    color: #94a3b8;
    font-size: 0.68rem;
  }

  .settings-status strong {
    margin-top: 2px;
    color: #334155;
    font-size: 0.83rem;
  }

  .settings-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0 0;
    padding: 12px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    font-size: 0.84rem;
    font-weight: 750;
  }

  .settings-notice > span {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    font-weight: 900;
  }

  .settings-notice p {
    flex: 1;
    margin: 0;
  }

  .settings-notice button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 1.25rem;
  }

  .settings-notice-success {
    color: #087f5b;
  }

  .settings-notice-success > span {
    background: rgba(33, 199, 122, 0.13);
  }

  .settings-notice-error {
    color: #b91c1c;
  }

  .settings-notice-error > span {
    background: rgba(239, 68, 68, 0.12);
  }

  .settings-section {
    padding: 30px 0 8px;
  }

  .settings-section-heading {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .settings-section-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 45px;
    height: 45px;
    border-radius: 14px;
    background: rgba(109, 93, 252, 0.1);
    color: #6d5dfc;
    font-size: 1.15rem;
    font-weight: 900;
  }

  .settings-section-heading h2 {
    margin: 4px 0 0;
    color: #172033;
    font-size: 1.18rem;
    letter-spacing: -0.02em;
  }

  .settings-section-heading p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.84rem;
    line-height: 1.55;
  }

  .settings-divider {
    height: 1px;
    margin: 22px 0 0;
    background: rgba(148, 163, 184, 0.22);
  }

  .settings-divider-soft {
    margin: 0;
    background: rgba(148, 163, 184, 0.16);
  }

  .settings-row {
    display: grid;
    grid-template-columns: minmax(230px, 0.9fr) minmax(300px, 1.1fr);
    align-items: center;
    gap: 46px;
    padding: 25px 0;
  }

  .settings-row-copy label {
    display: block;
    color: #1f2937;
    font-size: 0.94rem;
    font-weight: 900;
  }

  .settings-row-copy p {
    max-width: 480px;
    margin: 7px 0 0;
    color: #64748b;
    font-size: 0.79rem;
    line-height: 1.58;
  }

  .settings-control-wrap {
    width: min(100%, 470px);
    justify-self: end;
  }

  .settings-control-wrap select {
    width: 100%;
    min-height: 48px;
    padding: 0 42px 0 14px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    border-radius: 13px;
    outline: none;
    background: rgba(255, 255, 255, 0.72);
    color: #1e293b;
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 750;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .settings-control-wrap select:hover {
    border-color: rgba(109, 93, 252, 0.48);
    background: rgba(255, 255, 255, 0.92);
  }

  .settings-control-wrap select:focus {
    border-color: #6d5dfc;
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.1);
  }

  .settings-control-wrap select:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .settings-value-preview {
    display: block;
    margin: 8px 2px 0;
    color: #7c5cfc;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .settings-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-top: 10px;
    padding-top: 22px;
    border-top: 1px solid rgba(148, 163, 184, 0.22);
  }

  .settings-footer-copy strong,
  .settings-footer-copy span {
    display: block;
  }

  .settings-footer-copy strong {
    color: #334155;
    font-size: 0.86rem;
  }

  .settings-footer-copy span {
    margin-top: 4px;
    color: #94a3b8;
    font-size: 0.73rem;
    line-height: 1.45;
  }

  .settings-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex: 0 0 auto;
  }

  .settings-primary-button,
  .settings-secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 43px;
    padding: 0 17px;
    border-radius: 12px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.81rem;
    font-weight: 900;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      opacity 0.2s ease;
  }

  .settings-primary-button {
    border: 0;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 10px 23px rgba(91, 140, 255, 0.24);
    color: #ffffff;
  }

  .settings-secondary-button {
    border: 1px solid rgba(109, 93, 252, 0.18);
    background: rgba(109, 93, 252, 0.06);
    color: #5b4ae6;
  }

  .settings-primary-button:not(:disabled):hover,
  .settings-secondary-button:not(:disabled):hover {
    transform: translateY(-1px);
  }

  .settings-primary-button:disabled,
  .settings-secondary-button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
    box-shadow: none;
    transform: none;
  }

  .settings-centered-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    min-height: 65vh;
    text-align: center;
  }

  .settings-centered-state h2 {
    margin: 15px 0 0;
    color: #172033;
  }

  .settings-centered-state p {
    margin: 8px 0 18px;
    color: #64748b;
  }

  .settings-loader,
  .settings-button-spinner {
    display: inline-block;
    border-radius: 50%;
    border-style: solid;
    animation: settings-spin 0.75s linear infinite;
  }

  .settings-loader {
    width: 36px;
    height: 36px;
    border-width: 3px;
    border-color: rgba(109, 93, 252, 0.18);
    border-top-color: #6d5dfc;
  }

  .settings-button-spinner {
    width: 14px;
    height: 14px;
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.38);
    border-top-color: #ffffff;
  }

  .settings-error-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
    font-weight: 900;
  }

  @keyframes settings-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    .settings-page {
      padding: 18px 6px 28px;
    }

    .settings-header {
      flex-direction: column;
      gap: 14px;
    }

    .settings-status {
      padding: 0 0 2px;
    }

    .settings-row {
      grid-template-columns: 1fr;
      gap: 15px;
      padding: 22px 0;
    }

    .settings-control-wrap {
      width: 100%;
      justify-self: stretch;
    }

    .settings-footer {
      align-items: stretch;
      flex-direction: column;
      gap: 17px;
    }

    .settings-actions {
      width: 100%;
    }

    .settings-actions button {
      flex: 1;
    }
  }

  @media (max-width: 430px) {
    .settings-header h1 {
      font-size: 2rem;
    }

    .settings-section {
      padding-top: 24px;
    }

    .settings-section-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    .settings-section-heading {
      gap: 11px;
    }

    .settings-footer {
      padding-top: 18px;
    }

    .settings-primary-button,
    .settings-secondary-button {
      min-height: 41px;
      padding: 0 11px;
    }
  }
`;

export default SettingsPage;