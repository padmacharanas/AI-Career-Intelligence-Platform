
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BrainCircuit,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Authenticate the user and retrieve their profile.
      const user = await login(email, password);

      // Redirect according to the user's role.
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        setError("Your account has an invalid role. Please contact support.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to log in. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">
            <BrainCircuit size={25} color="white" />
          </div>

          <h2>Career Intelligence</h2>
          <p>Your career journey starts here.</p>
        </div>

        <h1>Welcome back</h1>

        <p className="auth-description">
          Sign in to access your career dashboard.
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>

          <div className="auth-input">
            <Mail size={18} />

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password">Password</label>

          <div className="auth-input password-input">
            <LockKeyhole size={18} />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
