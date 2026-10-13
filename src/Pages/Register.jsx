

import { Link } from "react-router-dom";
import { useState } from "react";
import api from "../api";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Register() {
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const [firstName, ...lastNameParts] = name.trim().split(/\s+/);

    setLoading(true);
    try {
      await api.post("/auth/register/", {
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirm: confirmPassword,
        first_name: firstName,
        last_name: lastNameParts.join(" "),
        role,
      });
      setMessage("Account created successfully. You can now sign in.");
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const apiErrors = responseData
        ? Object.values(responseData)
            .flat()
            .filter((value) => typeof value === "string")
            .join(" ")
        : "";
      setError(apiErrors || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <Link to="/" className="auth-brand">
        <span className="brand-icon">
          <GraduationCap size={25} />
        </span>
        Learn<span>ova</span><span className="brand-dot">.</span>
      </Link>

      <section className="auth-layout register-layout">
        <div className="auth-intro">
          <div className="eyebrow">
            <Sparkles size={15} /> START SOMETHING GREAT
          </div>

          <h1>
            Your next chapter
            <br />
            <span className="gradient-text">starts here.</span>
          </h1>

          <p>
            Join a learning community where students build skills,
            trainers share knowledge, and every lesson moves you forward.
          </p>

          <div className="auth-benefit glass">
            <span className="auth-benefit-icon">
              <GraduationCap size={24} />
            </span>
            <div>
              <strong>One account. New possibilities.</strong>
              <p>Create your profile and start your learning journey.</p>
            </div>
          </div>
        </div>

        <div className="auth-card glass">
          <div className="auth-card-heading">
            <span className="auth-kicker">JOIN THE COMMUNITY</span>
            <h2>Create account</h2>
            <p>Choose a student or trainer account and tell us a little about yourself.</p>
          </div>

          <div className="role-switch" aria-label="Choose account type">
            <button
              type="button"
              className={role === "student" ? "role-option active" : "role-option"}
              onClick={() => setRole("student")}
              aria-pressed={role === "student"}
            >
              <GraduationCap size={17} /> Student
            </button>

            <button
              type="button"
              className={role === "trainer" ? "role-option active" : "role-option"}
              onClick={() => setRole("trainer")}
              aria-pressed={role === "trainer"}
            >
              <GraduationCap size={17} /> Trainer
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-username">Username</label>
              <input
                id="register-username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <div className="password-field">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="register-confirm">Confirm password</label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p className="auth-message error">{error}</p>}
            {message && <p className="auth-message success">{message}</p>}

            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : `Create ${role} account`}{" "}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <Link to="/" className="back-home">← Back to homepage</Link>
        </div>
      </section>

      <p className="auth-footer">
        Learn with purpose. Build with confidence.
      </p>
    </main>
  );
}
