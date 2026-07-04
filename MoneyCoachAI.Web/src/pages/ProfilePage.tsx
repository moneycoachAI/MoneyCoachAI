import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../services/profileService";

import type { UserProfile } from "../types/profileTypes";

function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await getProfile();

      setProfile(data);
      setFullName(data.fullName);
      setPhoneNumber(data.phoneNumber ?? "");
    } catch (error) {
      console.error(error);
      alert("Failed to load profile");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadProfile();
    };

    initialize();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      const updated = await updateProfile({
        fullName,
        phoneNumber,
      });

      setProfile(updated);
      alert("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      alert("Password changed successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to change password. Check current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h2>Loading profile...</h2>
      </div>
    );
  }

  const initials = profile.fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        <h1 style={{ margin: 0, fontSize: "42px" }}>👤 My Profile</h1>

        <p style={{ color: "#666", marginTop: "12px" }}>
          Manage your account information and password.
        </p>

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={secondaryButtonStyle}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <section style={sectionStyle}>
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            {initials}
          </div>

          <div>
            <h2 style={{ margin: 0 }}>{profile.fullName}</h2>
            <p style={{ color: "#666", marginTop: "6px" }}>{profile.email}</p>
            <p style={{ color: "#888", marginTop: "6px" }}>
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <label>Full Name</label>
          <input
            style={inputStyle}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label>Email</label>
          <input style={inputStyle} value={profile.email} readOnly />
        </div>

        <div style={fieldGroupStyle}>
          <label>Phone Number</label>
          <input
            style={inputStyle}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={primaryButtonStyle}
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>🔐 Change Password</h2>

        <div style={fieldGroupStyle}>
          <label>Current Password</label>
          <input
            type="password"
            style={inputStyle}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label>New Password</label>
          <input
            type="password"
            style={inputStyle}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label>Confirm Password</label>
          <input
            type="password"
            style={inputStyle}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            style={primaryButtonStyle}
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </section>
    </div>
    </AppLayout>
  );
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "24px",
  marginBottom: "26px",
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

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #2563eb",
  background: "#fff",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: "bold",
};

export default ProfilePage;