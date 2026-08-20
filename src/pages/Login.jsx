

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, forgotPassword } from "../api/authApi";
import { setAuthToken } from "../api/client";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validation States
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    
    // Live validation
    if (touchedFields[field]) {
      const errors = { ...formErrors };
      if (field === "email") {
        if (!value) errors.email = "Email address is required";
        else if (!validateEmail(value)) errors.email = "Please enter a valid email address";
        else delete errors.email;
      }
      if (field === "password") {
        if (!value) errors.password = "Password is required";
        else if (value.length < 6) errors.password = "Password must be at least 6 characters long";
        else delete errors.password;
      }
      setFormErrors(errors);
    }
  };

  const handleBlur = (field) => {
    setTouchedFields({ ...touchedFields, [field]: true });
    const errors = { ...formErrors };
    const value = formData[field];
    if (field === "email") {
      if (!value) errors.email = "Email address is required";
      else if (!validateEmail(value)) errors.email = "Please enter a valid email address";
      else delete errors.email;
    }
    if (field === "password") {
      if (!value) errors.password = "Password is required";
      else if (value.length < 6) errors.password = "Password must be at least 6 characters long";
      else delete errors.password;
    }
    setFormErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trigger validation for all fields on submit
    setTouchedFields({ email: true, password: true });
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await login(formData);
      
      // Save user data with token
      localStorage.setItem("user", JSON.stringify(response.data));
      setAuthToken(response.data.token);
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail) {
      setForgotError("Email address is required");
      return;
    }
    if (!validateEmail(forgotEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await forgotPassword({ email: forgotEmail });
      if (response.data.success) {
        setResetUrl(response.data.resetUrl || "");
        setForgotSuccess(true);
      } else {
        setForgotError(response.data.message || "Failed to generate reset link");
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send reset link. Please try again later.");
    } finally {
      setForgotLoading(false);
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

          <div className="auth-header">
            <h2>Candidate Login</h2>
            <p className="auth-subtitle">Welcome back! Master your next interview.</p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`input-group ${touchedFields.email && formErrors.email ? "has-error" : ""}`}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder=""
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                required
              />
              {touchedFields.email && formErrors.email && (
                <div className="field-error-message">
                  <span>{formErrors.email}</span>
                </div>
              )}
            </div>

            <div className={`input-group ${touchedFields.password && formErrors.password ? "has-error" : ""}`}>
              <div className="label-wrapper">
                <label>Password</label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotSuccess(false);
                    setForgotEmail("");
                    setForgotError("");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  value={formData.password}
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

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-footer-nav">
            <p>
              Don't have account?{" "}
              <Link to="/register" className="text-link-blue">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="auth-visual-section">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
          alt="Interview Platform"
          className="visual-bg-image"
        />
        <div className="glass-widget summary-widget">
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px" }}>
            AI PERFORMANCE
          </p>
          <div className="stat-row">
            <div className="stat-item">
              <b>88%</b>
              <small>Confidence</small>
            </div>
            <div className="stat-item">
              <b>Top 5%</b>
              <small>Ranking</small>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content glass-widget" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForgotModal(false)} aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="close-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            
            {!forgotSuccess ? (
              <form onSubmit={handleForgotSubmit} noValidate>
                <h3>Reset Password</h3>
                <p className="modal-subtitle">Enter your email address and we will send you a secure link to reset your password.</p>
                
                {forgotError && (
                  <div className="auth-error modal-error">
                    <span className="error-icon">⚠️</span>
                    {forgotError}
                  </div>
                )}
                
                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" className="auth-btn-primary" disabled={forgotLoading}>
                  {forgotLoading ? "Sending secure link..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="modal-success-state">
                <div className="success-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="success-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h3>Check your Email</h3>
                <p className="success-message-text">We've sent a password reset link to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.</p>
                {resetUrl && (
                  <div className="test-link-box">
                    <p style={{ fontSize: '12px', margin: '0 0 6px 0', color: '#64748b', fontWeight: 600 }}>DEVELOPER TESTING LINK:</p>
                    <a href={resetUrl} className="test-reset-btn-link" onClick={() => setShowForgotModal(false)}>
                      Click here to reset password directly
                    </a>
                  </div>
                )}
                <button className="auth-btn-primary success-dismiss-btn" onClick={() => { setShowForgotModal(false); setForgotSuccess(false); setForgotEmail(""); setResetUrl(""); }}>
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;