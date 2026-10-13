import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Code2,
  GraduationCap,
  Layers3,
  Play,
  Search,
  Users,
  CalendarDays,
  ExternalLink,
  MessageCircleQuestion,
  Send,
} from "lucide-react";
import { courses, getAllLessons } from "../data/courses";
import { getLearningProgress, saveLearningProgress } from "../learningProgress";
import api from "../api";

const courseIcons = {
  code: Code2,
  brain: BrainCircuit,
  design: Layers3,
};

function getCourseProgress(course, progress) {
  const completed = progress?.completed ?? [];
  const done = course.lessons.filter((lesson) =>
    completed.includes(`${course.id}:${lesson.id}`)
  ).length;

  return {
    done,
    percent: Math.round((done / course.lessons.length) * 100),
  };
}

function getCourseHref(course, progress) {
  const nextLesson = course.lessons.find(
    (lesson) => !progress.completed.includes(`${course.id}:${lesson.id}`)
  ) ?? course.lessons[0];

  return `/courses/${course.id}/lessons/${nextLesson.id}`;
}

function CourseCard({ course, user, progress }) {
  const Icon = courseIcons[course.icon] ?? BookOpen;
  const courseProgress = getCourseProgress(course, progress);

  return (
    <article className="course-card glass">
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
        {user && (
          <div
            className="course-progress"
            role="progressbar"
            aria-label={`${courseProgress.percent}% complete`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={courseProgress.percent}
          >
            <span style={{ width: `${courseProgress.percent}%` }} />
          </div>
        )}
        <Link
          className="course-link"
          to={user ? getCourseHref(course, progress) : "/login"}
        >
          {user ? (courseProgress.done ? "Continue learning" : "Start learning") : "Sign in to learn"}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export function CourseCatalogPage({ user }) {
  const [query, setQuery] = useState("");
  const [progress] = useState(() => user ? getLearningProgress(user) : null);
  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return courses;

    return courses.filter((course) =>
      `${course.title} ${course.category} ${course.description}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query]);

  return (
    <main className="learning-page">
      <section className="learning-heading">
        <span className="eyebrow"><BookOpen size={15} /> THE COURSE LIBRARY</span>
        <h1>Choose what you want to <span className="gradient-text">learn.</span></h1>
        <p>Short, focused video lessons with study notes you can revisit anytime.</p>
        <label className="course-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search courses</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search web, AI, or design"
          />
        </label>
      </section>

      {visibleCourses.length ? (
        <div className="course-grid learning-course-grid">
          {visibleCourses.map((course) => (
            <CourseCard
              course={course}
              key={course.id}
              progress={progress}
              user={user}
            />
          ))}
        </div>
      ) : (
        <p className="learning-empty">No courses match “{query}”. Try another search.</p>
      )}
    </main>
  );
}

export function DashboardPage({ user }) {
  const [progress] = useState(() => getLearningProgress(user));
  const allLessons = getAllLessons();
  const completedCount = progress.completed.length;
  const percent = Math.round((completedCount / allLessons.length) * 100);
  const nextLesson = allLessons.find(
    (lesson) => !progress.completed.includes(`${lesson.courseId}:${lesson.id}`)
  );
  const displayName = user.first_name || user.username || user.email;

  return (
    <main className="learning-page">
      <section className="dashboard-welcome glass">
        <div>
          <span className="eyebrow"><GraduationCap size={15} /> YOUR LEARNING SPACE</span>
          <h1>Welcome back, {displayName}.</h1>
          <p>Your learning is saved in this browser. Pick up where you left off.</p>
        </div>
        <div className="dashboard-stats">
          <div><strong>{completedCount}<span>/{allLessons.length}</span></strong><small>lessons completed</small></div>
          <div><strong>{percent}%</strong><small>overall progress</small></div>
        </div>
        {nextLesson ? (
          <Link
            className="button button-primary dashboard-continue"
            to={`/courses/${nextLesson.courseId}/lessons/${nextLesson.id}`}
          >
            <Play size={16} /> Continue learning
          </Link>
        ) : (
          <p className="learning-success"><CheckCircle2 size={17} /> You completed every lesson. Great work!</p>
        )}
      </section>

      <section className="learning-section">
        <div className="learning-section-heading">
          <div>
            <span className="eyebrow"><BookOpen size={15} /> YOUR COURSES</span>
            <h2>Keep building your skills</h2>
          </div>
          <Link className="text-link" to="/courses">Browse all courses <ArrowRight size={16} /></Link>
        </div>
        <div className="course-grid learning-course-grid">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} user={user} progress={progress} />
          ))}
        </div>
      </section>

      <TrainerDirectory />
      <StudentResources />
      <StudentDoubts />

      {!!progress.saved.length && (
        <section className="learning-section">
          <div className="learning-section-heading">
            <div>
              <span className="eyebrow"><Bookmark size={15} /> SAVED LESSONS</span>
              <h2>Come back to these</h2>
            </div>
          </div>
          <ul className="saved-lessons">
            {progress.saved.map((key) => {
              const [courseId, lessonId] = key.split(":");
              const course = courses.find((item) => item.id === courseId);
              const lesson = course?.lessons.find((item) => item.id === lessonId);
              if (!course || !lesson) return null;
              return (
                <li key={key}>
                  <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>
                    <BookOpen size={17} /> {lesson.title}<span>{course.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function StudentResources() {
  const [resources, setResources] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadResources() {
      try {
        const [resourceResponse, sessionResponse] = await Promise.all([
          api.get("/auth/resources/"),
          api.get("/auth/teaching-sessions/"),
        ]);
        if (active) {
          setResources(resourceResponse.data);
          setSessions(sessionResponse.data);
          setError("");
        }
      } catch (requestError) {
        console.error("Unable to load trainer learning resources:", requestError);
        if (active) setError("Trainer resources and scheduled sessions are temporarily unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResources();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="learning-section" aria-labelledby="shared-resources-title">
        <div className="learning-section-heading">
          <div>
            <span className="eyebrow"><BookOpen size={15} /> FROM YOUR TRAINERS</span>
            <h2 id="shared-resources-title">Shared notes and videos</h2>
          </div>
        </div>
        {loading ? (
          <p className="learning-empty" role="status">Loading trainer resources...</p>
        ) : error ? (
          <p className="learning-empty" role="status">{error}</p>
        ) : resources.length ? (
          <ul className="shared-resource-list">
            {resources.map((resource) => (
              <li className="shared-resource-card glass" key={resource.id}>
                <div className="shared-resource-heading">
                  <div>
                    <span className="eyebrow">{resource.course || "LEARNING RESOURCE"}</span>
                    <h3>{resource.title}</h3>
                    <p>Shared by {resource.trainer_name} · {resource.duration_minutes} minute{resource.duration_minutes === 1 ? "" : "s"} lecture</p>
                  </div>
                  {resource.video_url && (
                    <a className="button button-ghost resource-video-link" href={resource.video_url} target="_blank" rel="noreferrer">
                      Open video <ExternalLink size={15} />
                    </a>
                  )}
                </div>
                {resource.notes && <p className="resource-notes">{resource.notes}</p>}
                {resource.video_url && (
                  <div className="resource-video">
                    <iframe
                      src={getSafeVideoEmbed(resource.video_url)}
                      title={`${resource.title} video`}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="learning-empty">Your trainers have not shared any extra resources yet.</p>
        )}
      </section>

      <section className="learning-section" aria-labelledby="upcoming-sessions-title">
        <div className="learning-section-heading">
          <div>
            <span className="eyebrow"><CalendarDays size={15} /> LIVE LEARNING</span>
            <h2 id="upcoming-sessions-title">Upcoming trainer sessions</h2>
          </div>
        </div>
        {loading ? (
          <p className="learning-empty" role="status">Loading scheduled sessions...</p>
        ) : error ? (
          <p className="learning-empty" role="status">{error}</p>
        ) : sessions.length ? (
          <ul className="scheduled-session-list">
            {sessions.map((session) => (
              <li className="scheduled-session-card glass" key={session.id}>
                <div>
                  <span className="eyebrow">{new Date(session.scheduled_for).toLocaleString()}</span>
                  <h3>{session.title}</h3>
                  <p>{session.description || "Join this learning session with your trainer."}</p>
                  <small>{session.trainer_name} · {session.duration_minutes} minutes</small>
                </div>
                {session.meeting_url && (
                  <a className="button button-primary" href={session.meeting_url} target="_blank" rel="noreferrer">
                    Join session <ExternalLink size={15} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="learning-empty">There are no upcoming sessions scheduled right now.</p>
        )}
      </section>
    </>
  );
}

function getSafeVideoEmbed(videoUrl) {
  try {
    const parsedUrl = new URL(videoUrl);
    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v") || "";
      } else {
        videoId = parsedUrl.pathname.split("/").filter(Boolean).at(-1) || "";
      }
    }

    return videoId
      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
      : "about:blank";
  } catch {
    return "about:blank";
  }
}

function StudentDoubts() {
  const [doubts, setDoubts] = useState([]);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/auth/doubts/")
      .then((response) => {
        if (active) setDoubts(response.data);
      })
      .catch((requestError) => {
        console.error("Unable to load student doubts:", requestError);
        if (active) setError("Your doubts could not be loaded. Please refresh to try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submitDoubt(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPosting(true);
    try {
      const response = await api.post("/auth/doubts/", { subject, question });
      setDoubts((current) => [response.data, ...current]);
      setSubject("");
      setQuestion("");
      setNotice("Your doubt has been posted for trainers to answer.");
    } catch (requestError) {
      console.error("Unable to post student doubt:", requestError);
      setError(requestError.response?.data?.detail || "Your doubt could not be posted. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="learning-section doubt-section" aria-labelledby="student-doubts-title">
      <div className="learning-section-heading">
        <div>
          <span className="eyebrow"><MessageCircleQuestion size={15} /> ASK YOUR TRAINERS</span>
          <h2 id="student-doubts-title">Questions and answers</h2>
        </div>
      </div>
      <div className="doubt-board">
        <form className="doubt-form glass" onSubmit={submitDoubt}>
          <h3>What are you stuck on?</h3>
          <label>
            Topic
            <input
              required
              maxLength="160"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Understanding React state"
            />
          </label>
          <label>
            Describe your question
            <textarea
              required
              maxLength="5000"
              rows="5"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Add enough detail so a trainer can help..."
            />
          </label>
          {error && <p className="trainer-feedback error" role="alert">{error}</p>}
          {notice && <p className="trainer-feedback success" role="status">{notice}</p>}
          <button className="button button-primary trainer-submit" type="submit" disabled={posting}>
            <Send size={15} /> {posting ? "Posting..." : "Post my doubt"}
          </button>
        </form>

        <div className="doubt-list" aria-live="polite">
          {loading ? (
            <p className="learning-empty" role="status">Loading your questions...</p>
          ) : error && !doubts.length ? (
            <p className="learning-empty" role="status">{error}</p>
          ) : doubts.length ? (
            doubts.map((doubt) => (
              <article className="doubt-card glass" key={doubt.id}>
                <div className="doubt-card-top">
                  <div>
                    <span className="eyebrow">{new Date(doubt.created_at).toLocaleDateString()}</span>
                    <h3>{doubt.subject}</h3>
                  </div>
                  <span className={`doubt-status ${doubt.status}`}>{doubt.status}</span>
                </div>
                <p className="doubt-question">{doubt.question}</p>
                {doubt.answer ? (
                  <div className="doubt-answer">
                    <strong>Trainer response{doubt.trainer_name ? ` · ${doubt.trainer_name}` : ""}</strong>
                    <p>{doubt.answer}</p>
                  </div>
                ) : (
                  <p className="doubt-waiting">Waiting for a trainer to respond.</p>
                )}
              </article>
            ))
          ) : (
            <p className="learning-empty">No doubts posted yet. Ask a question and your trainers can help.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function TrainerDirectory() {
  const [trainers, setTrainers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTrainers() {
      try {
        const response = await api.get("/auth/trainers/");
        if (active) {
          setTrainers(response.data);
          setError("");
        }
      } catch {
        if (active) setError("Trainer availability could not be loaded. Please refresh to try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTrainers();
    const intervalId = window.setInterval(loadTrainers, 15_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="learning-section" aria-labelledby="trainer-directory-title">
      <div className="learning-section-heading">
        <div>
          <span className="eyebrow"><Users size={15} /> LEARN WITH SUPPORT</span>
          <h2 id="trainer-directory-title">Trainer availability</h2>
        </div>
        <span className="presence-refresh">Refreshes every 15 seconds</span>
      </div>
      {error ? (
        <p className="learning-empty" role="status">{error}</p>
      ) : loading ? (
        <p className="learning-empty" role="status">Loading trainer availability...</p>
      ) : trainers.length ? (
        <ul className="trainer-directory">
          {trainers.map((trainer) => (
            <li className="trainer-card glass" key={trainer.id}>
              <span className={`presence-indicator ${trainer.is_online ? "online" : "offline"}`} aria-hidden="true" />
              <span className="trainer-name">{trainer.name}</span>
              <span className={`presence-label ${trainer.is_online ? "online" : "offline"}`}>
                {trainer.is_online ? "Online" : "Offline"}
              </span>
              {!trainer.is_online && trainer.last_seen_at && (
                <time className="trainer-last-seen" dateTime={trainer.last_seen_at}>
                  Last active {new Date(trainer.last_seen_at).toLocaleString()}
                </time>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="learning-empty">No trainers have registered yet.</p>
      )}
    </section>
  );
}

export function LessonPage({ user }) {
  const { courseId, lessonId } = useParams();
  const course = courses.find((item) => item.id === courseId);
  const lessonIndex = course?.lessons.findIndex((item) => item.id === lessonId) ?? -1;
  const lesson = lessonIndex >= 0 ? course.lessons[lessonIndex] : null;
  const [progress, setProgress] = useState(() => getLearningProgress(user));

  if (!course || !lesson) {
    return (
      <main className="learning-page">
        <h1>Lesson not found</h1>
        <Link className="text-link" to="/courses">Return to the course library</Link>
      </main>
    );
  }

  const lessonKey = `${course.id}:${lesson.id}`;
  const isComplete = progress.completed.includes(lessonKey);
  const isSaved = progress.saved.includes(lessonKey);
  const saveProgress = (nextProgress) => {
    saveLearningProgress(user, nextProgress);
    setProgress(nextProgress);
  };
  const previousLesson = course.lessons[lessonIndex - 1];
  const nextLesson = course.lessons[lessonIndex + 1];

  return (
    <main className="learning-page lesson-page">
      <Link className="lesson-back" to="/dashboard"><ArrowLeft size={16} /> Back to dashboard</Link>
      <div className="lesson-layout">
        <aside className="lesson-sidebar glass" aria-label={`${course.title} lessons`}>
          <span className="eyebrow">{course.category}</span>
          <h2>{course.title}</h2>
          <p>{course.lessons.length} video lessons · notes included</p>
          <ol className="lesson-list">
            {course.lessons.map((item, index) => {
              const key = `${course.id}:${item.id}`;
              const active = item.id === lesson.id;
              return (
                <li key={item.id}>
                  <Link
                    aria-current={active ? "step" : undefined}
                    className={active ? "active" : ""}
                    to={`/courses/${course.id}/lessons/${item.id}`}
                  >
                    <span>{progress.completed.includes(key) ? <CheckCircle2 size={17} /> : <Play size={16} />}</span>
                    <span><small>LESSON {index + 1}</small>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="lesson-main">
          <div className="video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${lesson.videoId}`}
              title={`${lesson.videoTitle} by ${lesson.creator}`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="lesson-title-row">
            <div>
              <span className="eyebrow">VIDEO LESSON {lessonIndex + 1} OF {course.lessons.length}</span>
              <h1>{lesson.title}</h1>
              <p>Video by {lesson.creator}. Study notes are below the lesson.</p>
            </div>
            <a
              className="button button-ghost video-open-link"
              href={`https://www.youtube.com/watch?v=${lesson.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              Open video <ArrowRight size={15} />
            </a>
          </div>

          <section className="lesson-notes glass" aria-labelledby="lesson-notes-title">
            <div className="notes-heading">
              <div>
                <span className="eyebrow"><BookOpen size={15} /> STUDY GUIDE</span>
                <h2 id="lesson-notes-title">Lesson notes</h2>
              </div>
              <button
                className={`button button-ghost ${isSaved ? "is-saved" : ""}`}
                type="button"
                aria-pressed={isSaved}
                onClick={() => saveProgress({
                  ...progress,
                  saved: isSaved
                    ? progress.saved.filter((item) => item !== lessonKey)
                    : [...progress.saved, lessonKey],
                })}
              >
                <Bookmark size={16} /> {isSaved ? "Saved" : "Save lesson"}
              </button>
            </div>
            <ul className="lesson-note-list">
              {lesson.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
            <label className="personal-notes">
              <span>Your personal notes</span>
              <textarea
                rows={5}
                value={progress.notes[lessonKey] ?? ""}
                onChange={(event) => saveProgress({
                  ...progress,
                  notes: { ...progress.notes, [lessonKey]: event.target.value },
                })}
                placeholder="Write your own notes for this lesson..."
              />
              <small>Saved on this device for your account.</small>
            </label>
          </section>

          <div className="lesson-controls">
            {previousLesson ? (
              <Link className="button button-ghost" to={`/courses/${course.id}/lessons/${previousLesson.id}`}>
                <ArrowLeft size={16} /> Previous lesson
              </Link>
            ) : <span />}
            <button
              className={`button ${isComplete ? "button-ghost" : "button-primary"}`}
              type="button"
              aria-pressed={isComplete}
              onClick={() => saveProgress({
                ...progress,
                completed: isComplete
                  ? progress.completed.filter((item) => item !== lessonKey)
                  : [...progress.completed, lessonKey],
              })}
            >
              <CheckCircle2 size={16} /> {isComplete ? "Completed" : "Mark complete"}
            </button>
            {nextLesson ? (
              <Link className="button button-ghost" to={`/courses/${course.id}/lessons/${nextLesson.id}`}>
                Next lesson <ArrowRight size={16} />
              </Link>
            ) : <Link className="button button-ghost" to="/courses">More courses <ArrowRight size={16} /></Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
