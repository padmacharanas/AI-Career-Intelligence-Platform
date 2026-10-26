
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BrainCircuit,
  User,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

import api from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roles = [
    {
      value: "student",
      title: "Student / Job Seeker",
      description:
        "Explore career opportunities and improve your skills.",
      available: true,
      icon: GraduationCap,
    },
    {
      value: "recruiter",
      title: "Recruiter",
      description: "Recruiter features will be developed soon.",
      available: false,
      icon: Building2,
    },
  ];

  const passwordRules = [
    {
      label: "At least 6 characters",
      valid: password.length >= 6,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "One number",
      valid: /\d/.test(password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9\s]/.test(password),
    },
  ];

  const isPasswordValid = passwordRules.every((rule) => rule.valid);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please satisfy all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/users/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: "student",
      });

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: "Your account has been created. Please log in.",
          },
        });
      }, 1000);
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError("Request timed out. Please check whether the backend is running and try again.");
      } else if (err.response) {
        const detail = err.response.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Registration failed. Please check your details."
        );
      } else {
        setError(
          "Unable to connect to the server. Please check your backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-brand">
          <div className="brand-icon">
            <BrainCircuit size={30} />
          </div>

          <h1>Career Intelligence</h1>
          <p>Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="professional-register">
            <div className="register-heading">
              <h2>Create Account</h2>
              <p>Enter your details to register.</p>
            </div>

            <div className="register-section">
              <div className="section-heading">
                <User size={18} />
                <h3>Personal Information</h3>
              </div>

              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={100}
              />

              <label htmlFor="email">Email Address</label>
              <div className="register-input-wrapper">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="register-section">
              <div className="section-heading">
                <LockKeyhole size={18} />
                <h3>Account Security</h3>
              </div>

              <label htmlFor="password">Password</label>
              <div className="register-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={128}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="password-rules">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={rule.valid ? "rule-valid" : "rule-invalid"}
                  >
                    {rule.valid ? <Check size={14} /> : <X size={14} />}
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>

              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="register-password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  maxLength={128}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={
                    passwordsMatch
                      ? "password-match match-success"
                      : "password-match match-error"
                  }
                >
                  {passwordsMatch ? (
                    <Check size={15} />
                  ) : (
                    <X size={15} />
                  )}
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}
            </div>

            <div className="register-section">
              <div className="section-heading">
                <GraduationCap size={18} />
                <h3>Choose Account Type</h3>
              </div>

              <div className="professional-role-grid">
                {roles.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`professional-role-card ${
                        role === item.value ? "selected" : ""
                      }`}
                      disabled={!item.available}
                      onClick={() => setRole(item.value)}
                    >
                      <div className="role-card-top">
                        <div className="role-icon">
                          <Icon size={23} />
                        </div>

                        <span
                          className={
                            item.available
                              ? "status-available"
                              : "status-unavailable"
                          }
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      <h4>{item.title}</h4>
                      <p className="role-description">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="admin-info">
                <div className="role-card-top">
                  <div className="role-icon">
                    <ShieldCheck size={23} />
                  </div>

                  <span className="status-unavailable">Unavailable</span>
                </div>

                <h4>Administrator</h4>
                <p>
                  An administrator account already exists. Only one admin
                  account is allowed.
                </p>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="auth-success" role="status">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="register-terms">
              By creating an account, you agree to use this platform
              responsibly.
            </p>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
