
import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import TrainerDashboardPage from "./Pages/TrainerDashboard";
import FeaturesPage from "./Pages/Features";
import CommunityPage from "./Pages/Community";
import {
  CourseCatalogPage,
  DashboardPage,
  LessonPage,
} from "./Pages/Learning";
import { courses } from "./data/courses";
import api from "./api";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  GraduationCap,
  Layers3,
  Menu,
  Play,
  Sparkles,
  Star,
  X,
} from "lucide-react";

function readSavedUser() {
  if (!sessionStorage.getItem("learnova_access")) return null;

  try {
    return JSON.parse(sessionStorage.getItem("learnova_user"));
  } catch {
    sessionStorage.removeItem("learnova_user");
    sessionStorage.removeItem("learnova_access");
    sessionStorage.removeItem("learnova_refresh");
    return null;
  }
}

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar glass">
      <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
        <span className="brand-icon"><GraduationCap size={23} /></span>
        Learn<span>ova</span>
        <span className="brand-dot">.</span>
      </Link>

      <button
        className="menu-toggle"
        aria-label="Toggle navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        {!user && (
          <Link className="nav-mobile-login" to="/login" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
        )}
        {user?.role === "trainer" ? (
          <>
            <Link to="/trainer#my-teachings" onClick={() => setMenuOpen(false)}>My teachings</Link>
            <Link to="/trainer#next-scheduled-class" onClick={() => setMenuOpen(false)}>Next scheduled class</Link>
          </>
        ) : (
          <>
            <Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link>
            {user?.role === "student" && <Link to="/dashboard" onClick={() => setMenuOpen(false)}>My learning</Link>}
            {user?.role === "student" && <Link to="/community" onClick={() => setMenuOpen(false)}>Community</Link>}
          </>
        )}
        <Link to="/features" onClick={() => setMenuOpen(false)}>Features</Link>
      </nav>

      <div className="nav-actions">
        {user ? (
          <>
            <Link className="account-chip" to={user.role === "trainer" ? "/trainer" : "/dashboard"} aria-label={`Signed in as ${user.email}`}>
              <span className="account-avatar">{(user.first_name || user.username || user.email).slice(0, 1).toUpperCase()}</span>
              <span><strong>{user.first_name || user.username}</strong><small>{user.role} · signed in</small></span>
            </Link>
            <button className="button button-ghost nav-logout" type="button" onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link className="login-link" to="/login">Sign in</Link>
            <Link className="button button-primary nav-cta" to="/register">
              Get started <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function Hero({ user }) {
  const firstName = user?.first_name || user?.username;

  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkles size={15} />
          YOUR NEXT CHAPTER STARTS HERE
        </div>

        <h1>{user ? <>Welcome back,<br /><span className="gradient-text">{firstName}.</span></> : <>Learn beyond<br /><span className="gradient-text">limits.</span> Build your<br />future.</>}</h1>

        <p className="hero-description">
          {user
            ? "Your account is signed in. Continue your lessons, review your notes, and track your progress."
            : "One platform. Endless possibilities. Discover new skills, learn from expert trainers, and turn your ambitions into achievements."}
        </p>

        <div className="hero-actions">
          <Link to={user ? (user.role === "trainer" ? "/trainer" : "/dashboard") : "/courses"} className="button button-primary">
            {user ? "Go to my learning" : "Explore courses"} <ArrowRight size={18} />
          </Link>
          {!user && <Link to="/features" className="button button-ghost"><Play size={16} /> Discover Learnova</Link>}
        </div>

        <div className="hero-proof">
          <div className="avatar-stack">
            <span>A</span><span>M</span><span>S</span><span>+</span>
          </div>
          <div>
            <div className="stars">★★★★★</div>
            <p>Built for curious minds and lifelong learners</p>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="orb orb-one" />
        <div className="orb orb-two" />

        <div className="floating-label label-top glass">
          <span className="label-icon cyan-bg"><Sparkles size={19} /></span>
          <div>
            <strong>Keep growing</strong>
            <small>Your future is a work in progress.</small>
          </div>
        </div>

        <div className="learning-card glass">
          <div className="learning-card-top">
            <span className="mini-tag">YOUR LEARNING SPACE</span>
            <span className="live-dot" />
          </div>

          <div className="learning-art">
            <div className="art-ring ring-one" />
            <div className="art-ring ring-two" />
            <div className="art-core">
              <GraduationCap size={53} strokeWidth={1.4} />
            </div>
            <span className="art-spark spark-one">✳</span>
            <span className="art-spark spark-two">✦</span>
          </div>

          <h3>Knowledge in motion.</h3>
          <p>Every lesson brings you closer to your goals.</p>

          <div className="learning-stats">
            <div>
              <span className="stat-icon"><BookOpen size={17} /></span>
              <div><strong>Learn</strong><small>At your pace</small></div>
            </div>
            <div>
              <span className="stat-icon purple-stat"><CheckCircle2 size={17} /></span>
              <div><strong>Progress</strong><small>Every step counts</small></div>
            </div>
          </div>

          <a href="#courses" className="card-action">
            Find your next course <ArrowRight size={16} />
          </a>
        </div>

        <div className="floating-label label-bottom glass">
          <div className="progress-icon"><CheckCircle2 size={21} /></div>
          <div>
            <strong>Small steps. Big results.</strong>
            <small>Make learning a daily habit.</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function Courses({ user }) {
  return (
    <section className="section courses-section" id="courses">
      <div className="section-heading">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> LEARN SOMETHING NEW</div>
          <h2>Find your next <span className="gradient-text">passion.</span></h2>
          <p>Explore skills that move your future forward.</p>
        </div>
        <Link to="/courses" className="text-link">
          Browse all courses <ArrowRight size={17} />
        </Link>
      </div>

      <div className="course-grid">
        {courses.map((course) => {
          const Icon = course.icon === "code" ? Code2 : course.icon === "brain" ? BrainCircuit : Layers3;

          return (
            <article className="course-card glass" key={course.title}>
              <div className={`course-art ${course.color}`}>
                <div className="course-art-orbit" />
                <div className="course-icon"><Icon size={37} /></div>
                <span className="course-badge">{course.category}</span>
              </div>

              <div className="course-content">
                <div className="course-meta">
                  <span><BookOpen size={14} /> {course.lessons.length} video lessons</span>
                  <span>{course.level}</span>
                </div>

                <h3>{course.title}</h3>
                <p>{course.description}</p>

                <Link
                  className="course-link"
                  to={user ? `/courses/${course.id}/lessons/${course.lessons[0].id}` : "/courses"}
                >
                  Explore course <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <p className="demo-note">Each subject includes two video lessons, study notes, and learning progress.</p>
    </section>
  );
}

function ReviewStars({ rating, interactive = false, onSelect }) {
  return (
    <span className={interactive ? "review-stars interactive" : "review-stars"} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => interactive ? (
        <button
          type="button"
          key={value}
          aria-label={`${value} star${value === 1 ? "" : "s"}`}
          aria-pressed={rating === value}
          onClick={() => onSelect(value)}
        >
          <Star size={18} fill={value <= rating ? "currentColor" : "none"} />
        </button>
      ) : (
        <Star key={value} size={14} fill={value <= rating ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

function Footer({ user }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/auth/reviews/")
      .then(({ data }) => {
        if (!active) return;
        setReviews(data.results);
        setAverageRating(data.average_rating);
        setTotalReviews(data.total_reviews);
        setMyReview(data.my_review);
        if (data.my_review) {
          setRating(data.my_review.rating);
          setReviewText(data.my_review.content);
        } else {
          setRating(5);
          setReviewText("");
        }
      })
      .catch((error) => {
        console.error("Unable to load student reviews:", error);
        if (active) setReviewError("Reviews could not be loaded right now.");
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  async function submitReview(event) {
    event.preventDefault();
    setReviewError("");
    setReviewNotice("");
    setReviewSaving(true);
    try {
      const response = await api.post("/auth/reviews/", {
        rating,
        content: reviewText,
      });
      const updatedReview = response.data;
      const previousReview = myReview;
      setReviews((current) => [
        updatedReview,
        ...current.filter((review) => review.id !== updatedReview.id),
      ].slice(0, 12));
      setTotalReviews((current) => previousReview ? current : current + 1);
      setAverageRating((current) => {
        const previousCount = totalReviews;
        if (!previousReview) {
          return Number((((current * previousCount) + updatedReview.rating) / (previousCount + 1)).toFixed(1));
        }
        return previousCount
          ? Number((((current * previousCount) - previousReview.rating + updatedReview.rating) / previousCount).toFixed(1))
          : updatedReview.rating;
      });
      setMyReview(updatedReview);
      setReviewNotice("Thanks for sharing your Learnova experience.");
    } catch (error) {
      console.error("Unable to save student review:", error);
      setReviewError(
        error.response?.data?.detail
        || "Your review could not be saved. Please try again."
      );
    } finally {
      setReviewSaving(false);
    }
  }

  return (
    <footer className="footer" id="about">
      <section className="footer-reviews" aria-labelledby="footer-reviews-title">
        <div className="footer-reviews-heading">
          <div>
            <span className="eyebrow"><Star size={14} /> STUDENT VOICES</span>
            <h2 id="footer-reviews-title">Learning, in their words.</h2>
            <p>Honest feedback from students building skills with Learnova.</p>
          </div>
          <div className="footer-rating-summary" aria-live="polite">
            <strong>{averageRating ? averageRating.toFixed(1) : "New"}</strong>
            {averageRating > 0 && <ReviewStars rating={Math.round(averageRating)} />}
            <span>{totalReviews} {totalReviews === 1 ? "student review" : "student reviews"}</span>
          </div>
        </div>

        {reviewsLoading ? (
          <p className="footer-review-status" role="status">Loading student reviews...</p>
        ) : reviews.length ? (
          <div className="footer-review-grid">
            {reviews.map((review) => (
              <article className="footer-review-card glass" key={review.id}>
                <ReviewStars rating={review.rating} />
                <p>{review.content}</p>
                <div className="footer-review-author">
                  <span className="account-avatar">{review.author_name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{review.author_name}</strong><small>Learnova student</small></span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="footer-review-status">No reviews yet. Be the first student to share your experience.</p>
        )}

        {user?.role === "student" ? (
          <form className="footer-review-form glass" onSubmit={submitReview}>
            <div>
              <span className="eyebrow">{myReview ? "YOUR REVIEW" : "ADD YOUR VOICE"}</span>
              <h3>{myReview ? "Update your review" : "How is your learning going?"}</h3>
            </div>
            <ReviewStars rating={rating} interactive onSelect={setRating} />
            <label>
              <span className="sr-only">Your review</span>
              <textarea
                required
                minLength="8"
                maxLength="1200"
                rows="3"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Tell other students what you find helpful..."
              />
            </label>
            {reviewError && <p className="community-feedback error" role="alert">{reviewError}</p>}
            {reviewNotice && <p className="community-feedback success" role="status">{reviewNotice}</p>}
            <button className="button button-primary" type="submit" disabled={reviewSaving}>
              <Star size={15} /> {reviewSaving ? "Saving..." : myReview ? "Update review" : "Share review"}
            </button>
          </form>
        ) : (
          <p className="footer-review-invite">
            {user?.role === "trainer"
              ? "Student reviews help new learners find their next step."
              : <>Are you a student? <Link to="/login?role=student">Sign in to share a review.</Link></>}
          </p>
        )}
      </section>
      <Link className="brand" to="/">
        <span className="brand-icon"><GraduationCap size={22} /></span>
        Learn<span>ova</span><span className="brand-dot">.</span>
      </Link>
      <p>Learn with purpose. Build with confidence.</p>
      <span className="footer-copy">© 2026 Learnova. All rights reserved.</span>
    </footer>
  );
}

function LandingPage({ user }) {
  return (
    <>
      <div className="background-glow glow-left" />
      <div className="background-glow glow-right" />
      <main>
        <Hero user={user} />
        <Courses user={user} />
      </main>
    </>
  );
}

function ProtectedRoute({ user, children, requiredRole }) {
  const location = useLocation();
  if (!user) {
    const role = requiredRole || "student";
    return (
      <Navigate
        to={`/login?role=${role}`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "trainer" ? "/trainer" : "/dashboard"} replace />;
  }
  return children;
}

function SiteLayout({ user, onLogout }) {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, location.pathname]);

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={onLogout} />
      <Outlet />
      <Footer user={user} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(readSavedUser);

  useEffect(() => {
    const syncUser = () => setUser(readSavedUser());
    window.addEventListener("learnova-auth-change", syncUser);
    return () => window.removeEventListener("learnova-auth-change", syncUser);
  }, []);

  useEffect(() => {
    if (user?.role !== "trainer") return undefined;

    const updatePresence = () => {
      if (document.visibilityState !== "visible") return;
      api.post("/auth/presence/", { is_online: true }).catch((error) => {
        console.error("Unable to update trainer presence:", error);
      });
    };

    updatePresence();
    const intervalId = window.setInterval(updatePresence, 30_000);
    document.addEventListener("visibilitychange", updatePresence);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", updatePresence);
    };
  }, [user]);

  async function handleLogout() {
    if (user?.role === "trainer") {
      try {
        await api.post(
          "/auth/presence/",
          { is_online: false },
          { timeout: 3000 }
        );
      } catch (error) {
        console.error("Unable to update trainer sign-out presence:", error);
      }
    }
    sessionStorage.removeItem("learnova_user");
    sessionStorage.removeItem("learnova_access");
    sessionStorage.removeItem("learnova_refresh");
    setUser(null);
  }

  return (
    <Routes>
      <Route element={<SiteLayout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/courses" element={<CourseCatalogPage user={user} />} />
        <Route path="/dashboard" element={<ProtectedRoute user={user} requiredRole="student"><DashboardPage user={user} /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute user={user} requiredRole="student"><CommunityPage /></ProtectedRoute>} />
        <Route path="/trainer" element={<ProtectedRoute user={user} requiredRole="trainer"><TrainerDashboardPage user={user} /></ProtectedRoute>} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute user={user}><LessonPage user={user} /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
