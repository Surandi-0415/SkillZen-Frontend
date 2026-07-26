// src/pages/Register.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation & Toggle States
  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    }

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
      if (field === "name") {
        if (!value.trim()) errors.name = "Full name is required";
        else delete errors.name;
      }
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
    
    if (field === "name") {
      if (!value.trim()) errors.name = "Full name is required";
      else delete errors.name;
    }
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
    
    // Validate all fields on submit
    setTouchedFields({ name: true, email: true, password: true });
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      await register(formData);
      // Redirect to login page
      navigate('/');
    } catch (err) {
      console.error('REGISTER ERROR:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-section">
        <div className="auth-container">
          <div className="brand-logo-container" onClick={() => navigate('/')}>
            <div className="logo-icon-box">S</div>
            <span className="logo-text-main">SkillZen</span>
          </div>

          <div className="auth-header">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join thousands of candidates today.</p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={`input-group ${touchedFields.name && formErrors.name ? "has-error" : ""}`}>
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                required 
              />
              {touchedFields.name && formErrors.name && (
                <div className="field-error-message">
                  <span>{formErrors.name}</span>
                </div>
              )}
            </div>

            <div className={`input-group ${touchedFields.email && formErrors.email ? "has-error" : ""}`}>
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
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
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
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
              {loading ? 'Creating Account...' : 'Get Started Free'}
            </button>
          </form>

          <div className="auth-footer-nav">
            <p>
              Already have an account?{' '}
              <Link to="/" className="text-link-blue">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="auth-visual-section">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200" 
          alt="Team Collaboration" 
          className="visual-bg-image" 
        />
        <div className="glass-widget testimonial-widget">
          <h3 style={{color: '#2563eb', margin: '0 0 10px 0'}}>Ready to Level Up?</h3>
          <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0}}>
            "The AI feedback felt like having a real mentor. I felt 100% more prepared for my technical round."
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;