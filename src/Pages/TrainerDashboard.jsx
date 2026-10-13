import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  ExternalLink,
  Link as LinkIcon,
  MessageCircleQuestion,
  Plus,
  Presentation,
  Send,
  Trash2,
  Video,
} from "lucide-react";
import api from "../api";

const emptyResource = {
  title: "",
  course: "",
  video_url: "",
  notes: "",
};

const emptySession = {
  title: "",
  description: "",
  scheduled_for: "",
  duration_minutes: "60",
  meeting_url: "",
};

function getApiError(error, fallback) {
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    return Object.values(data)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .find((value) => typeof value === "string") || fallback;
  }
  return fallback;
}

export default function TrainerDashboardPage({ user }) {
  const [resources, setResources] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [resource, setResource] = useState(emptyResource);
  const [session, setSession] = useState(emptySession);
  const [loading, setLoading] = useState(true);
  const [savingResource, setSavingResource] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/auth/resources/"),
      api.get("/auth/teaching-sessions/"),
      api.get("/auth/doubts/"),
    ])
      .then(([resourceResponse, sessionResponse, doubtResponse]) => {
        if (active) {
          setCurrentTimestamp(Date.now());
          setResources(resourceResponse.data);
          setSessions(sessionResponse.data);
          setDoubts(doubtResponse.data);
          return api.post("/auth/resources/starter-lectures/")
            .then(({ data }) => {
              if (active) setResources(data.resources);
            });
        }
        return undefined;
      })
      .catch((requestError) => {
        console.error("Unable to load trainer workspace:", requestError);
        if (active) {
          setError(getApiError(requestError, "Your workspace could not be loaded. Please try again."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function publishResource(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingResource(true);
    try {
      const response = await api.post("/auth/resources/", resource);
      setResources((current) => [response.data, ...current]);
      setResource(emptyResource);
      setNotice("Your learning resource is now available to students.");
    } catch (requestError) {
      console.error("Unable to publish trainer resource:", requestError);
      setError(getApiError(requestError, "The resource could not be published."));
    } finally {
      setSavingResource(false);
    }
  }

  async function scheduleSession(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSavingSession(true);
    try {
      const response = await api.post("/auth/teaching-sessions/", {
        ...session,
        scheduled_for: new Date(session.scheduled_for).toISOString(),
        duration_minutes: Number(session.duration_minutes),
      });
      setSessions((current) =>
        [...current, response.data].sort(
          (first, second) =>
            new Date(first.scheduled_for) - new Date(second.scheduled_for)
        )
      );
      setSession(emptySession);
      setNotice("Your session is scheduled and visible to students.");
    } catch (requestError) {
      console.error("Unable to schedule trainer session:", requestError);
      setError(getApiError(requestError, "The session could not be scheduled."));
    } finally {
      setSavingSession(false);
    }
  }

  async function removeItem(kind, item) {
    setError("");
    setNotice("");
    const endpoint = kind === "resource" ? "resources" : "teaching-sessions";
    try {
      await api.delete(`/auth/${endpoint}/${item.id}/`);
      if (kind === "resource") {
        setResources((current) => current.filter((entry) => entry.id !== item.id));
      } else {
        setSessions((current) => current.filter((entry) => entry.id !== item.id));
      }
      setNotice(kind === "resource" ? "Resource removed." : "Session cancelled.");
    } catch (requestError) {
      console.error(`Unable to remove trainer ${kind}:`, requestError);
      setError(getApiError(requestError, `The ${kind} could not be removed.`));
    }
  }

  async function replyToDoubt(doubt, status) {
    const answer = draftAnswers[doubt.id] ?? doubt.answer;
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/auth/doubts/${doubt.id}/`, {
        answer,
        status,
      });
      setDoubts((current) =>
        current.map((item) => item.id === doubt.id ? response.data : item)
      );
      setDraftAnswers((current) => ({ ...current, [doubt.id]: response.data.answer }));
      setNotice(status === "resolved" ? "Doubt marked as resolved." : "Your answer has been shared with the student.");
    } catch (requestError) {
      console.error("Unable to update student doubt:", requestError);
      setError(getApiError(requestError, "The doubt response could not be saved."));
    }
  }

  const displayName = user.first_name || user.username || "Trainer";
  const upcomingSessions = sessions
    .filter((item) => new Date(item.scheduled_for).getTime() >= currentTimestamp)
    .sort((first, second) => new Date(first.scheduled_for) - new Date(second.scheduled_for));
  const nextSession = upcomingSessions[0];

  return (
    <main className="trainer-workspace">
      <section className="trainer-welcome">
        <div className="trainer-welcome-copy">
          <span className="eyebrow"><BookOpen size={15} /> TRAINER STUDIO</span>
          <h1>Teach, share, and inspire, {displayName}.</h1>
          <p>Your dedicated space to publish study materials and organize live learning sessions.</p>
          <Link className="button button-primary" to="/trainer#my-teachings">
            Manage my teachings <ArrowRight size={16} />
          </Link>
        </div>
        <div className="trainer-studio-stats" aria-label="Workspace overview">
          <a href="#my-teachings" className="trainer-stat-card">
            <small>MY TEACHINGS</small>
            <strong>{resources.length}</strong>
            <span>lectures shared with students</span>
          </a>
          <a href={nextSession ? "#next-scheduled-class" : "#schedule-session-title"} className="trainer-stat-card next-class-stat">
            <small>NEXT SCHEDULED CLASS</small>
            <strong>{nextSession?.title || "No class yet"}</strong>
            <span>
              {nextSession
                ? new Date(nextSession.scheduled_for).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                : "Schedule your first learning session"}
            </span>
          </a>
        </div>
      </section>

      {error && <p className="trainer-feedback error" role="alert">{error}</p>}
      {notice && <p className="trainer-feedback success" role="status">{notice}</p>}

      <div className="trainer-workspace-grid">
        <section className="trainer-panel glass" aria-labelledby="publish-resource-title">
          <div className="trainer-panel-heading">
            <span className="trainer-panel-icon"><Video size={19} /></span>
            <div>
              <span className="eyebrow">BUILD YOUR CLASSROOM</span>
              <h2 id="publish-resource-title">Share a learning resource</h2>
            </div>
          </div>
          <p className="trainer-panel-description">
            Post lesson notes, a video, or both. Students will find it in their learning dashboard.
          </p>
          <form className="trainer-form" onSubmit={publishResource}>
            <label>
              Resource title
              <input
                required
                maxLength="160"
                value={resource.title}
                onChange={(event) => setResource({ ...resource, title: event.target.value })}
                placeholder="e.g. Introduction to Python functions"
              />
            </label>
            <label>
              Course or subject
              <input
                maxLength="120"
                value={resource.course}
                onChange={(event) => setResource({ ...resource, course: event.target.value })}
                placeholder="e.g. Python Programming"
              />
            </label>
            <label>
              Video link
              <span className="trainer-input-with-icon">
                <LinkIcon size={16} aria-hidden="true" />
                <input
                  type="url"
                  value={resource.video_url}
                  onChange={(event) => setResource({ ...resource, video_url: event.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </span>
            </label>
            <label>
              Study notes
              <textarea
                rows="6"
                value={resource.notes}
                onChange={(event) => setResource({ ...resource, notes: event.target.value })}
                placeholder="Write explanations, key points, or homework for students..."
              />
            </label>
            <button className="button button-primary trainer-submit" type="submit" disabled={savingResource}>
              <Plus size={16} /> {savingResource ? "Sharing..." : "Share with students"}
            </button>
          </form>
        </section>

        <section className="trainer-panel glass" aria-labelledby="schedule-session-title">
          <div className="trainer-panel-heading">
            <span className="trainer-panel-icon schedule"><CalendarDays size={19} /></span>
            <div>
              <span className="eyebrow">MEET YOUR LEARNERS</span>
              <h2 id="schedule-session-title">Schedule a learning session</h2>
            </div>
          </div>
          <p className="trainer-panel-description">
            Add a live class, Q&amp;A, or study group. Upcoming sessions appear in the student dashboard.
          </p>
          <form className="trainer-form" onSubmit={scheduleSession}>
            <label>
              Session title
              <input
                required
                maxLength="160"
                value={session.title}
                onChange={(event) => setSession({ ...session, title: event.target.value })}
                placeholder="e.g. React questions and answers"
              />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                value={session.description}
                onChange={(event) => setSession({ ...session, description: event.target.value })}
                placeholder="What will students learn or need to bring?"
              />
            </label>
            <div className="trainer-form-row">
              <label>
                Date and time
                <input
                  required
                  type="datetime-local"
                  value={session.scheduled_for}
                  onChange={(event) => setSession({ ...session, scheduled_for: event.target.value })}
                />
              </label>
              <label>
                Duration (minutes)
                <input
                  required
                  type="number"
                  min="10"
                  max="480"
                  step="5"
                  value={session.duration_minutes}
                  onChange={(event) => setSession({ ...session, duration_minutes: event.target.value })}
                />
              </label>
            </div>
            <label>
              Meeting link
              <span className="trainer-input-with-icon">
                <LinkIcon size={16} aria-hidden="true" />
                <input
                  type="url"
                  value={session.meeting_url}
                  onChange={(event) => setSession({ ...session, meeting_url: event.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </span>
            </label>
            <button className="button button-primary trainer-submit" type="submit" disabled={savingSession}>
              <CalendarDays size={16} /> {savingSession ? "Scheduling..." : "Schedule for students"}
            </button>
          </form>
        </section>
      </div>

      <section className="trainer-content-section" id="my-teachings" aria-labelledby="my-resources-title">
        <div className="learning-section-heading">
          <div>
            <span className="eyebrow"><BookOpen size={15} /> YOUR CLASSROOM</span>
            <h2 id="my-resources-title">My teachings</h2>
          </div>
        </div>
        {loading ? (
          <p className="learning-empty" role="status">Loading your resources...</p>
        ) : resources.length ? (
          <ul className="trainer-item-list">
            {resources.map((item) => (
              <li className="trainer-item-card glass" key={item.id}>
                <div>
                  <span className="eyebrow">{item.course || "LEARNING RESOURCE"}</span>
                  <h3>{item.title}</h3>
                  <p className="trainer-lecture-meta">
                    <Clock3 size={13} /> {item.duration_minutes} minute{item.duration_minutes === 1 ? "" : "s"}
                    {item.course === "Python Programming" && " · Sample lecture slides"}
                  </p>
                  {item.notes && item.notes.startsWith("60-MINUTE SAMPLE MEETING SLIDES") ? (
                    <details className="trainer-lecture-details">
                      <summary><Presentation size={15} /> Open lecture notes and slides <ChevronDown size={14} /></summary>
                      <div className="trainer-slide-deck">
                        {item.notes.split(/(?=SLIDE \d+ ·)/).filter(Boolean).map((slide, slideIndex) => {
                          const [heading, ...body] = slide.trim().split("\n");
                          return (
                            <section className="trainer-slide" key={`${item.id}-slide-${slideIndex}`}>
                              {slideIndex === 0 && <p className="trainer-slide-intro">{heading}</p>}
                              {slideIndex > 0 && <h4>{heading}</h4>}
                              {body.length > 0 && <p>{body.join("\n").trim()}</p>}
                            </section>
                          );
                        })}
                      </div>
                    </details>
                  ) : (
                    <p>{item.notes || "Video resource shared with your students."}</p>
                  )}
                  {item.video_url && (
                    <a href={item.video_url} target="_blank" rel="noreferrer">
                      View video <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <button className="button button-ghost trainer-delete" type="button" onClick={() => removeItem("resource", item)} aria-label={`Delete ${item.title}`}>
                  <Trash2 size={15} /> Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="learning-empty">Resources you share will appear here and in student dashboards.</p>
        )}
      </section>

      <section className="trainer-content-section" id="next-scheduled-class" aria-labelledby="my-sessions-title">
        <div className="learning-section-heading">
          <div>
            <span className="eyebrow"><CalendarDays size={15} /> YOUR CALENDAR</span>
            <h2 id="my-sessions-title">My next scheduled class</h2>
          </div>
        </div>
        {loading ? (
          <p className="learning-empty" role="status">Loading your sessions...</p>
        ) : upcomingSessions.length ? (
          <ul className="trainer-item-list">
            {upcomingSessions.map((item, index) => (
              <li className={`trainer-item-card glass${index === 0 ? " trainer-next-session" : ""}`} key={item.id}>
                <div>
                  <span className="eyebrow"><Clock3 size={13} /> {index === 0 ? "NEXT CLASS · " : ""}{new Date(item.scheduled_for).toLocaleString()}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description || "Learning session"} · {item.duration_minutes} minutes</p>
                  {item.meeting_url && (
                    <a href={item.meeting_url} target="_blank" rel="noreferrer">
                      Open meeting link <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <button className="button button-ghost trainer-delete" type="button" onClick={() => removeItem("session", item)} aria-label={`Cancel ${item.title}`}>
                  <Trash2 size={15} /> Cancel
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="learning-empty">No class is scheduled yet. Add your next session using the schedule form above.</p>
        )}
      </section>

      <section className="trainer-content-section" aria-labelledby="student-doubts-title">
        <div className="learning-section-heading">
          <div>
            <span className="eyebrow"><MessageCircleQuestion size={15} /> STUDENT SUPPORT</span>
            <h2 id="student-doubts-title">Student doubts</h2>
          </div>
        </div>
        {loading ? (
          <p className="learning-empty" role="status">Loading student questions...</p>
        ) : doubts.length ? (
          <ul className="trainer-item-list">
            {doubts.map((doubt) => (
              <li className="trainer-doubt-card glass" key={doubt.id}>
                <div className="trainer-doubt-content">
                  <div className="doubt-card-top">
                    <div>
                      <span className="eyebrow">
                        {doubt.student_name} · {new Date(doubt.created_at).toLocaleString()}
                      </span>
                      <h3>{doubt.subject}</h3>
                    </div>
                    <span className={`doubt-status ${doubt.status}`}>{doubt.status}</span>
                  </div>
                  <p className="doubt-question">{doubt.question}</p>
                  <label className="trainer-answer-field">
                    Reply to the student
                    <textarea
                      rows="4"
                      maxLength="5000"
                      value={draftAnswers[doubt.id] ?? doubt.answer}
                      onChange={(event) => setDraftAnswers((current) => ({
                        ...current,
                        [doubt.id]: event.target.value,
                      }))}
                      placeholder="Explain the answer or suggest the next step..."
                    />
                  </label>
                  <div className="trainer-doubt-actions">
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => replyToDoubt(doubt, "answered")}
                      disabled={!(draftAnswers[doubt.id] ?? doubt.answer).trim()}
                    >
                      <Send size={14} /> {doubt.answer ? "Update answer" : "Send answer"}
                    </button>
                    <button
                      className="button button-ghost"
                      type="button"
                      onClick={() => replyToDoubt(doubt, "resolved")}
                      disabled={!(draftAnswers[doubt.id] ?? doubt.answer).trim() || doubt.status === "resolved"}
                    >
                      Mark resolved
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="learning-empty">Student questions will appear here when they post them.</p>
        )}
      </section>
    </main>
  );
}