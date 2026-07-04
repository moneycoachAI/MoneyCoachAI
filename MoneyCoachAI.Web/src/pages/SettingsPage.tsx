import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

import {
  getUserSettings,
  updateUserSettings,
} from "../services/userSettingsService";

import type { UserSettings } from "../types/userSettingsTypes";

function SettingsPage() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await getUserSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load settings");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadSettings();
    };

    initialize();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updatedSettings = await updateUserSettings(settings);
      setSettings(updatedSettings);
      alert("Settings saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h2>Loading settings...</h2>
      </div>
    );
  }

  return (
    <AppLayout>
    <div
      style={{
        padding: "40px 30px",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ marginBottom: "35px" }}>
        <h1 style={{ margin: 0, fontSize: "42px" }}>⚙️ Settings</h1>

        <p style={{ color: "#666", marginTop: "12px" }}>
          Manage your profile and MoneyCoachAI preferences.
        </p>

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              background: "#fff",
              color: "#2563eb",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

        <section style={sectionStyle}>
            <h2>👤 Profile</h2>

            <div style={fieldGroupStyle}>
                <label>Name</label>
                <input
                style={inputStyle}
                value="MoneyCoachAI User"
                readOnly
                />
            </div>

            <div style={fieldGroupStyle}>
                <label>Email</label>
                <input
                style={inputStyle}
                value="user@example.com"
                readOnly
                />
            </div>

            <button
                disabled
                style={{
                marginTop: "10px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#d1d5db",
                color: "#555",
                cursor: "not-allowed",
                fontWeight: "bold",
                }}
            >
                🔒 Change Password (Coming Soon)
            </button>
        </section>

      <section style={sectionStyle}>
        <h2>⚙️ Preferences</h2>

        <div style={fieldGroupStyle}>
          <label>Currency</label>
          <select
            style={inputStyle}
            value={settings.currency}
            onChange={(e) =>
              setSettings({
                ...settings,
                currency: e.target.value,
              })
            }
          >
            <option value="INR">INR - ₹</option>
            <option value="USD">USD - $</option>
            <option value="EUR">EUR - €</option>
          </select>
        </div>

        <div style={fieldGroupStyle}>
          <label>Date Format</label>
          <select
            style={inputStyle}
            value={settings.dateFormat}
            onChange={(e) =>
              setSettings({
                ...settings,
                dateFormat: e.target.value,
              })
            }
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>🎨 Appearance</h2>

        <div
            style={{
            padding: "18px",
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
            }}
        >
            <p style={{ margin: 0 }}>
            🌙 Dark Mode <strong>(Coming Soon)</strong>
            </p>

            <br />

            <p style={{ margin: 0 }}>
            🎨 Theme Color <strong>(Coming Soon)</strong>
            </p>
        </div>
      </section>

        
      <section style={sectionStyle}>
        <h2>🔒 Security</h2>

        <div
            style={{
            padding: "18px",
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px",
            }}
        >
            <p>
            🚪 Logout From All Devices
            <strong> (Coming Soon)</strong>
            </p>

            <p>
            🗑 Delete Account
            <strong> (Coming Soon)</strong>
            </p>
        </div>
     </section>

      

      

      <div style={{ textAlign: "right" }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: isSaving ? "#9ca3af" : "#2563eb",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
    </AppLayout>
  );
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "22px",
  marginBottom: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  background: "#fff",
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "18px",
};

const inputStyle: React.CSSProperties = {
  padding: "11px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "15px",
};



export default SettingsPage;