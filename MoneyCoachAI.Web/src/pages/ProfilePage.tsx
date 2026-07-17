import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import AppLayout from "../components/AppLayout";
import {
  changePassword,
  getProfile,
  updateProfile,
} from "../services/profileService";
import type { UserProfile } from "../types/profileTypes";

type Notice = {
  type: "success" | "error";
  message: string;
};

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

function ProfilePage() {
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice | null>(null);
  const [photoNotice, setPhotoNotice] = useState<Notice | null>(null);

  const photoStorageKey = profile?.email
    ? `moneycoachai-profile-photo:${profile.email.trim().toLowerCase()}`
    : "";

  const loadProfile = async () => {
    try {
      setLoading(true);
      setProfileNotice(null);

      const data = await getProfile();
      setProfile(data);
      setFullName(data.fullName ?? "");
      setPhoneNumber(data.phoneNumber ?? "");

      const storageKey = `moneycoachai-profile-photo:${data.email
        .trim()
        .toLowerCase()}`;
      setProfilePhoto(localStorage.getItem(storageKey));
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfileNotice({
        type: "error",
        message:
          "We could not load your profile. Please refresh and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const initials = useMemo(() => {
    const name = fullName.trim() || profile?.fullName?.trim() || "MC";

    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [fullName, profile?.fullName]);

  const profileHasChanges = useMemo(() => {
    if (!profile) return false;

    return (
      fullName.trim() !== (profile.fullName ?? "").trim() ||
      phoneNumber.trim() !== (profile.phoneNumber ?? "").trim()
    );
  }, [fullName, phoneNumber, profile]);

  const passwordChecks = useMemo(
    () => ({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    }),
    [newPassword],
  );

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrength =
    passwordScore <= 1
      ? "Very weak"
      : passwordScore === 2
        ? "Weak"
        : passwordScore === 3
          ? "Fair"
          : passwordScore === 4
            ? "Strong"
            : "Very strong";

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoNotice({
        type: "error",
        message: "Please choose a valid image file.",
      });
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoNotice({
        type: "error",
        message: "Profile photo must be smaller than 2 MB.",
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string" || !photoStorageKey) return;

      try {
        localStorage.setItem(photoStorageKey, reader.result);
        setProfilePhoto(reader.result);
        setPhotoNotice({ type: "success", message: "Profile photo updated." });
      } catch (error) {
        console.error("Failed to save profile photo:", error);
        setPhotoNotice({
          type: "error",
          message: "The photo could not be saved. Try a smaller image.",
        });
      }
    };

    reader.onerror = () => {
      setPhotoNotice({
        type: "error",
        message: "The selected image could not be read.",
      });
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (photoStorageKey) localStorage.removeItem(photoStorageKey);
    setProfilePhoto(null);
    setPhotoNotice({ type: "success", message: "Profile photo removed." });
  };

  const handleSaveProfile = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      setProfileNotice({ type: "error", message: "Full name is required." });
      return;
    }

    if (trimmedPhone && !/^[+\d][\d\s()-]{7,17}$/.test(trimmedPhone)) {
      setProfileNotice({
        type: "error",
        message: "Please enter a valid phone number.",
      });
      return;
    }

    try {
      setSavingProfile(true);
      setProfileNotice(null);

      const updated = await updateProfile({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
      });

      setProfile(updated);
      setFullName(updated.fullName ?? "");
      setPhoneNumber(updated.phoneNumber ?? "");
      setProfileNotice({
        type: "success",
        message: "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setProfileNotice({
        type: "error",
        message: "Profile update failed. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordNotice(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "Please complete all password fields.",
      });
      return;
    }

    if (passwordScore < 4) {
      setPasswordNotice({
        type: "error",
        message:
          "Use at least 8 characters with uppercase, lowercase, and a number.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordNotice({
        type: "error",
        message: "Your new password must differ from your current password.",
      });
      return;
    }

    try {
      setChangingPassword(true);

      await changePassword({ currentPassword, newPassword, confirmPassword });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({
        type: "success",
        message: "Password changed successfully.",
      });
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordNotice({
        type: "error",
        message: "Password change failed. Verify your current password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <main className="profile-page profile-state-page">
          <span className="profile-loader" />
          <h2>Loading your profile</h2>
          <p>Please wait while we retrieve your account information.</p>
          <style>{profileStyles}</style>
        </main>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <main className="profile-page profile-state-page">
          <div className="profile-state-icon">!</div>
          <h2>Profile unavailable</h2>
          <p>We could not retrieve your account information.</p>
          <button
            className="profile-primary-button"
            onClick={() => void loadProfile()}
          >
            Try again
          </button>
          <style>{profileStyles}</style>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="profile-page">
        <header className="profile-header">
          <div>
            <span className="profile-eyebrow">Account</span>
            <h1>My Profile</h1>
            <p>
              Manage your identity, contact details, profile photo, and
              security.
            </p>
          </div>

          <div className="profile-status">
            <span />
            <div>
              <small>Account status</small>
              <strong>Active</strong>
            </div>
          </div>
        </header>

        <section className="profile-hero">
          <div className="profile-photo-wrap">
            <button
              type="button"
              className={`profile-avatar${profilePhoto ? " profile-avatar-clickable" : ""}`}
              aria-label={
                profilePhoto ? "View profile photo" : "Profile initials"
              }
              onClick={() => {
                if (profilePhoto) {
                  setIsPhotoPreviewOpen(true);
                }
              }}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt={`${profile.fullName} profile`} />
              ) : (
                initials
              )}
            </button>

            <input
              ref={photoInputRef}
              className="profile-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="profile-identity">
            <span className="profile-section-kicker">MoneyCoachAI member</span>
            <h2>{profile.fullName}</h2>
            <p>{profile.email}</p>

            <div className="profile-meta-row">
              <span>
                📅 Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
              <span>🔒 Email verified</span>
            </div>

            <div className="profile-photo-actions">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
              >
                {profilePhoto ? "Change photo" : "Upload photo"}
              </button>
              {profilePhoto && (
                <button
                  type="button"
                  className="profile-remove-photo"
                  onClick={handleRemovePhoto}
                >
                  Remove
                </button>
              )}
            </div>

            {photoNotice && <NoticeBox notice={photoNotice} />}
            <small className="profile-photo-help">
              PNG, JPG or WebP. Maximum size 2 MB.
            </small>
          </div>
        </section>

        <div className="profile-main-grid">
          <section className="profile-section">
            <SectionHeading
              icon="👤"
              kicker="Personal details"
              title="Account information"
              description="Update the information used throughout MoneyCoachAI."
            />

            {profileNotice && <NoticeBox notice={profileNotice} />}

            <div className="profile-form-grid">
              <Field label="Full name">
                <input
                  value={fullName}
                  maxLength={80}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setProfileNotice(null);
                  }}
                />
              </Field>

              <Field label="Phone number">
                <input
                  type="tel"
                  value={phoneNumber}
                  maxLength={18}
                  placeholder="Enter phone number"
                  onChange={(event) => {
                    setPhoneNumber(event.target.value);
                    setProfileNotice(null);
                  }}
                />
              </Field>

              <Field label="Email address" fullWidth>
                <div className="profile-locked-input">
                  <input value={profile.email} readOnly />
                  <span>🔒</span>
                </div>
                <small>Email cannot be changed from this page.</small>
              </Field>
            </div>

            <div className="profile-section-actions">
              <button
                type="button"
                className="profile-secondary-button"
                disabled={!profileHasChanges || savingProfile}
                onClick={() => {
                  setFullName(profile.fullName ?? "");
                  setPhoneNumber(profile.phoneNumber ?? "");
                  setProfileNotice(null);
                }}
              >
                Reset
              </button>

              <button
                type="button"
                className="profile-primary-button"
                disabled={!profileHasChanges || savingProfile}
                onClick={() => void handleSaveProfile()}
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </section>

          <section className="profile-section">
            <SectionHeading
              icon="🔐"
              kicker="Security"
              title="Change password"
              description="Use a strong, unique password for your account."
            />

            {passwordNotice && <NoticeBox notice={passwordNotice} />}

            <PasswordField
              label="Current password"
              value={currentPassword}
              visible={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((value) => !value)}
              onChange={(value) => {
                setCurrentPassword(value);
                setPasswordNotice(null);
              }}
            />

            <PasswordField
              label="New password"
              value={newPassword}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((value) => !value)}
              onChange={(value) => {
                setNewPassword(value);
                setPasswordNotice(null);
              }}
            />

            {newPassword && (
              <div className="password-strength">
                <div className="password-strength-row">
                  <span>Password strength</span>
                  <strong>{passwordStrength}</strong>
                </div>
                <div className="password-meter">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <span
                      key={step}
                      className={passwordScore >= step ? "active" : ""}
                    />
                  ))}
                </div>
                <div className="password-checks">
                  <span className={passwordChecks.length ? "valid" : ""}>
                    8+ characters
                  </span>
                  <span className={passwordChecks.uppercase ? "valid" : ""}>
                    Uppercase
                  </span>
                  <span className={passwordChecks.lowercase ? "valid" : ""}>
                    Lowercase
                  </span>
                  <span className={passwordChecks.number ? "valid" : ""}>
                    Number
                  </span>
                </div>
              </div>
            )}

            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              onChange={(value) => {
                setConfirmPassword(value);
                setPasswordNotice(null);
              }}
            />

            <div className="profile-section-actions">
              <button
                type="button"
                className="profile-primary-button"
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                onClick={() => void handleChangePassword()}
              >
                {changingPassword ? "Changing..." : "Change password"}
              </button>
            </div>
          </section>
        </div>

        {isPhotoPreviewOpen && profilePhoto && (
          <div
            className="profile-photo-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Profile photo preview"
            onClick={() => setIsPhotoPreviewOpen(false)}
          >
            <div
              className="profile-photo-modal-content"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="profile-photo-modal-close"
                aria-label="Close photo preview"
                onClick={() => setIsPhotoPreviewOpen(false)}
              >
                ×
              </button>

              <img
                src={profilePhoto}
                alt={`${profile.fullName} profile preview`}
              />

              <div className="profile-photo-modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoPreviewOpen(false);
                    photoInputRef.current?.click();
                  }}
                >
                  📷 Change photo
                </button>

                <button
                  type="button"
                  className="remove-photo-button"
                  onClick={() => {
                    handleRemovePhoto();
                    setIsPhotoPreviewOpen(false);
                  }}
                >
                  🗑 Remove photo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{profileStyles}</style>
    </AppLayout>
  );
}

function SectionHeading({
  icon,
  kicker,
  title,
  description,
}: {
  icon: string;
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="profile-section-heading">
      <div className="profile-section-icon">{icon}</div>
      <div>
        <span className="profile-section-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <label className={`profile-field${fullWidth ? " full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="profile-field profile-password-field">
      <span>{label}</span>
      <div>
        <input
          type={visible ? "text" : "password"}
          value={value}
          autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

function NoticeBox({ notice }: { notice: Notice }) {
  return (
    <div className={`profile-notice ${notice.type}`}>{notice.message}</div>
  );
}

const profileStyles = `
  .profile-page {
    width: 100%;
    min-height: 100vh;
    padding: 1%;
    box-sizing: border-box;
    color: #111827;
  }

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 14px 4px 22px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  }

  .profile-eyebrow,
  .profile-section-kicker {
    display: inline-block;
    margin-bottom: 5px;
    color: #6d5dfc;
    font-size: 0.71rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .profile-section-kicker.danger { color: #dc2626; }

  .profile-header h1 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.45rem);
  }

  .profile-header p,
  .profile-section-heading p {
    margin: 7px 0 0;
    color: #64748b;
    line-height: 1.55;
  }

  .profile-status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 15px;
    background: rgba(236, 253, 245, 0.64);
  }

  .profile-status > span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.12);
  }

  .profile-status small,
  .profile-status strong { display: block; }
  .profile-status small { color: #64748b; font-size: 0.67rem; }
  .profile-status strong { color: #047857; font-size: 0.82rem; }

  .profile-hero {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 28px 4px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  }

  .profile-photo-wrap { flex: 0 0 auto; }

  .profile-avatar {
    display: grid;
    place-items: center;
    width: 110px;
    height: 110px;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 30px;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    box-shadow: 0 14px 30px rgba(91, 140, 255, 0.25);
    color: white;
    cursor: default;
    font-size: 2rem;
    font-weight: 900;
  }

  .profile-avatar-clickable {
    cursor: zoom-in;
  }

  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }


  .profile-file-input { display: none; }
  .profile-identity { min-width: 0; }
  .profile-identity h2 { margin: 0; font-size: 1.5rem; }
  .profile-identity > p { margin: 5px 0 0; color: #64748b; }

  .profile-meta-row,
  .profile-photo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .profile-meta-row span {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(109, 93, 252, 0.07);
    color: #475569;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .profile-photo-actions button {
    padding: 8px 12px;
    border: 1px solid rgba(109, 93, 252, 0.23);
    border-radius: 10px;
    background: rgba(109, 93, 252, 0.07);
    color: #5b4ae6;
    cursor: pointer;
    font-weight: 800;
  }

  .profile-photo-actions .profile-remove-photo {
    border-color: rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.06);
    color: #dc2626;
  }

  .profile-photo-help {
    display: block;
    margin-top: 8px;
    color: #94a3b8;
  }

  .profile-main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  }

  .profile-section {
    min-width: 0;
    padding: 28px 4px;
  }

  .profile-section:first-child {
    padding-right: 28px;
    border-right: 1px solid rgba(148, 163, 184, 0.24);
  }

  .profile-section:last-child { padding-left: 28px; }

  .profile-section-heading {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }

  .profile-section-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    border-radius: 13px;
    background: rgba(109, 93, 252, 0.08);
  }

  .profile-section-heading h2 { margin: 0; font-size: 1.08rem; }
  .profile-section-heading p { font-size: 0.79rem; }

  .profile-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .profile-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .profile-field.full { grid-column: 1 / -1; }
  .profile-field > span { color: #475569; font-size: 0.75rem; font-weight: 850; }
  .profile-field small { color: #94a3b8; font-size: 0.68rem; }

  .profile-field input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 12px;
    outline: none;
    background: rgba(255, 255, 255, 0.68);
    color: #1e293b;
    font: inherit;
  }

  .profile-field input:focus {
    border-color: rgba(109, 93, 252, 0.62);
    box-shadow: 0 0 0 4px rgba(109, 93, 252, 0.09);
  }

  .profile-field input:read-only { color: #64748b; }

  .profile-locked-input,
  .profile-password-field > div { position: relative; }

  .profile-locked-input span {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
  }

  .profile-password-field > div button {
    position: absolute;
    right: 7px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 8px;
    border: 0;
    border-radius: 8px;
    background: rgba(109, 93, 252, 0.08);
    color: #5b4ae6;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 800;
  }

  .profile-password-field input { padding-right: 60px; }

  .profile-section-actions {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 7px;
  }

  .profile-primary-button,
  .profile-secondary-button {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 850;
  }

  .profile-primary-button {
    border: 0;
    background: linear-gradient(135deg, #5b8cff, #7b61ff);
    color: white;
    box-shadow: 0 8px 20px rgba(91, 140, 255, 0.22);
  }

  .profile-secondary-button {
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(255, 255, 255, 0.58);
    color: #475569;
  }

  button:disabled { cursor: not-allowed; opacity: 0.55; }

  .profile-notice {
    margin: 0 0 14px;
    padding: 10px 12px;
    border-radius: 11px;
    font-size: 0.75rem;
    font-weight: 750;
  }

  .profile-notice.success {
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
  }

  .profile-notice.error {
    background: rgba(239, 68, 68, 0.09);
    color: #b91c1c;
  }

  .password-strength { margin: -2px 0 15px; }

  .password-strength-row {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.69rem;
  }

  .password-strength-row strong { color: #5b4ae6; }

  .password-meter {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
    margin: 7px 0 9px;
  }

  .password-meter span {
    height: 5px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.22);
  }

  .password-meter span.active { background: linear-gradient(90deg, #5b8cff, #21c77a); }

  .password-checks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .password-checks span {
    padding: 4px 7px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.09);
    color: #94a3b8;
    font-size: 0.62rem;
  }

  .password-checks span.valid {
    background: rgba(16, 185, 129, 0.09);
    color: #047857;
  }


  .profile-state-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .profile-state-page h2 { margin: 16px 0 0; }
  .profile-state-page p { color: #64748b; }
  .profile-state-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #dc2626; font-weight: 900; }

  .profile-loader {
    width: 36px;
    height: 36px;
    border: 4px solid rgba(109, 93, 252, 0.15);
    border-top-color: #6d5dfc;
    border-radius: 50%;
    animation: profileSpin 0.75s linear infinite;
  }

  @keyframes profileSpin { to { transform: rotate(360deg); } }

  .profile-photo-modal {
    position: fixed;
    z-index: 9999;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(15, 23, 42, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .profile-photo-modal-content {
    position: relative;
    width: min(520px, 100%);
    padding: 18px;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.35);
  }

  .profile-photo-modal-content > img {
    display: block;
    width: 100%;
    max-height: 65vh;
    border-radius: 18px;
    object-fit: contain;
    background: #eef2f7;
  }

  .profile-photo-modal-close {
    position: absolute;
    z-index: 2;
    top: 27px;
    right: 27px;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.72);
    color: #ffffff;
    cursor: pointer;
    font-size: 1.4rem;
  }

  .profile-photo-modal-actions {
    display: flex;
    justify-content: center;
    gap: 9px;
    margin-top: 14px;
  }

  .profile-photo-modal-actions button {
    min-height: 40px;
    padding: 0 15px;
    border: 0;
    border-radius: 12px;
    background: #eef2ff;
    color: #4f46e5;
    cursor: pointer;
    font-weight: 800;
  }

  .profile-photo-modal-actions .remove-photo-button {
    background: #fee2e2;
    color: #dc2626;
  }

  @media (max-width: 980px) {
    .profile-main-grid { grid-template-columns: 1fr; }
    .profile-section:first-child { padding-right: 4px; border-right: 0; border-bottom: 1px solid rgba(148, 163, 184, 0.24); }
    .profile-section:last-child { padding-left: 4px; }
  }

  @media (max-width: 700px) {
    .profile-page { padding: 0 6px 24px; }
    .profile-header { align-items: flex-start; }
    .profile-status { padding: 8px 10px; }
    .profile-hero { align-items: flex-start; gap: 17px; }
    .profile-avatar { width: 82px; height: 82px; border-radius: 24px; font-size: 1.45rem; }
    .profile-form-grid { grid-template-columns: 1fr; }
    .profile-field.full { grid-column: auto; }
  }

  @media (max-width: 480px) {
    .profile-header { flex-direction: column; gap: 12px; }
    .profile-status { width: 100%; box-sizing: border-box; }
    .profile-hero { flex-direction: column; }
    .profile-photo-actions { width: 100%; }
    .profile-photo-actions button { flex: 1; }
    .profile-section { padding: 22px 2px; }
    .profile-section-actions { width: 100%; }
    .profile-section-actions button { flex: 1; }
    .profile-photo-modal-content { padding: 12px; border-radius: 19px; }
    .profile-photo-modal-close { top: 20px; right: 20px; }
    .profile-photo-modal-actions { display: grid; grid-template-columns: 1fr 1fr; }
    .profile-photo-modal-actions button { padding: 0 8px; }
  }
`;

export default ProfilePage;