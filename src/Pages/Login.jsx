
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get("role") === "trainer" ? "trainer" : "student";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = sessionStorage.getItem("learnova_user");
    if (!sessionStorage.getItem("learnova_access") || !savedUser) return;
    try {
      const user = JSON.parse(savedUser);
      navigate(user.role === "trainer" ? "/trainer" : "/dashboard", { replace: true });
    } catch {
      sessionStorage.removeItem("learnova_user");
    }
  }, [navigate]);

  function setRole(nextRole) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("role", nextRole);
    setSearchParams(nextSearchParams, { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login/", {
        email: email.trim(),
        password,
        role,
      });

      sessionStorage.setItem(
        "learnova_user",
        JSON.stringify(response.data.user)
      );
      sessionStorage.setItem("learnova_access", response.data.tokens.access);
      sessionStorage.setItem("learnova_refresh", response.data.tokens.refresh);
      window.dispatchEvent(new Event("learnova-auth-change"));
      navigate(
        location.state?.from || (role === "trainer" ? "/trainer" : "/dashboard"),
        { replace: true }
      );
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const apiErrors = responseData
        ? Object.values(responseData)
            .flat()
            .filter((value) => typeof value === "string")
            .join(" ")
        : "";
      setError(apiErrors || "Unable to sign in. Please try again.");
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

      <section className="auth-layout">
        <div className="auth-intro">
          <div className="eyebrow">
            <Sparkles size={15} /> YOUR LEARNING JOURNEY
          </div>

          <h1>
            Welcome back to
            <br />
            <span className="gradient-text">your future.</span>
          </h1>

          <p>
            Pick up where you left off. Your courses, your goals,
            and your next breakthrough are waiting for you.
          </p>

          <div className="auth-benefit glass">
            <span className="auth-benefit-icon">
              <BookOpen size={23} />
            </span>
            <div>
              <strong>Your learning space</strong>
              <p>One place for courses, assignments and progress.</p>
            </div>
          </div>
        </div>

        <div className="auth-card glass">
          <div className="auth-card-heading">
            <span className="auth-kicker">LET'S GET STARTED</span>
            <h2>Sign in</h2>
            <p>Choose your account type to continue.</p>
          </div>

          <div className="role-switch" aria-label="Account type">
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
              <BookOpen size={17} /> Trainer
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

            {error && <p className="auth-message error">{error}</p>}
            {message && <p className="auth-message success">{message}</p>}

            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : `Sign in as ${role}`}{" "}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            New to Learnova? <Link to="/register">Create an account</Link>
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
