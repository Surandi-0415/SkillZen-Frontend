// src/pages/ResetPassword.jsx

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./Auth.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Field validations
  const [touchedFields, setTouchedFields] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const validateField = (field, val, otherVal) => {
    let err = "";
    if (field === "password") {
      if (!val) err = "Password is required";
      else if (val.length < 6) err = "Password must be at least 6 characters long";
    }
    if (field === "confirmPassword") {
      if (!val) err = "Confirm password is required";
      else if (val !== otherVal) err = "Passwords do not match";
    }
    return err;
  };

  const handleFieldChange = (field, value) => {
    if (field === "password") {
      setPassword(value);
      if (touchedFields.password) {
        const err = validateField("password", value);
        setFormErrors(prev => ({
          ...prev,
          password: err || undefined,
          confirmPassword: field === "password" && confirmPassword && value !== confirmPassword ? "Passwords do not match" : prev.confirmPassword
        }));
      }
    } else {
      setConfirmPassword(value);
      if (touchedFields.confirmPassword) {
        const err = validateField("confirmPassword", value, password);
        setFormErrors(prev => ({ ...prev, confirmPassword: err || undefined }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const val = field === "password" ? password : confirmPassword;
    const err = validateField(field, val, password);
    setFormErrors(prev => ({ ...prev, [field]: err || undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouchedFields({ password: true, confirmPassword: true });

    const pErr = validateField("password", password);
    const cErr = validateField("confirmPassword", confirmPassword, password);

    if (pErr || cErr) {
      setFormErrors({ password: pErr || undefined, confirmPassword: cErr || undefined });
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword(token, { password });
      setSuccess(true);
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-section">
        <div className="auth-container">
          <div className="brand-logo-container" onClick={() => navigate("/")}>
            <div className="logo-icon-box">S</div>
            <span className="logo-text-main">SkillZen</span>
          </div>

          {!success ? (
            <>
              <div className="auth-header">
                <h2>Reset Password</h2>
                <p className="auth-subtitle">Please enter and confirm your new password below.</p>
              </div>

              {error && (
                <div className="auth-error">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className={`input-group ${touchedFields.password && formErrors.password ? "has-error" : ""}`}>
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="eye-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="eye-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touchedFields.password && formErrors.password && (
                    <div className="field-error-message">
                      <span>{formErrors.password}</span>
                    </div>
                  )}
                </div>

                <div className={`input-group ${touchedFields.confirmPassword && formErrors.confirmPassword ? "has-error" : ""}`}>
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="eye-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="eye-icon">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touchedFields.confirmPassword && formErrors.confirmPassword && (
                    <div className="field-error-message">
                      <span>{formErrors.confirmPassword}</span>
                    </div>
                  )}
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading}>
                  {loading ? "Resetting Password..." : "Update Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="modal-success-state" style={{ padding: "30px 0" }}>
              <div className="success-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="success-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3>Password Reset Successful</h3>
              <p className="success-message-text" style={{ marginBottom: "32px" }}>Your account password has been updated. You can now use your new password to sign in.</p>
              <Link to="/" className="auth-btn-primary success-dismiss-btn" style={{ textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center" }}>
                Proceed to Sign In
              </Link>
            </div>
          )}

          <div className="auth-footer-nav">
            <p>
              Back to{" "}
              <Link to="/" className="text-link-blue">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="auth-visual-section">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
          alt="Password Reset Secure"
          className="visual-bg-image"
        />
        <div className="glass-widget summary-widget">
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px" }}>
            SECURITY PROTOCOL
          </p>
          <div className="stat-row">
            <div className="stat-item" style={{ marginRight: "16px" }}>
              <b>AES-256</b>
              <small>Encryption</small>
            </div>
            <div className="stat-item">
              <b>SHA-256</b>
              <small>Token Hashing</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
