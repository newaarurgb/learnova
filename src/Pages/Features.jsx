import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  MessageCircleQuestion,
  Search,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

const featureGroups = [
  {
    title: "For students",
    eyebrow: "LEARN AT YOUR PACE",
    description: "Build skills with short lessons and practical learning tools.",
    items: [
      {
        icon: BookOpen,
        title: "Courses, video lessons, and notes",
        description: "Explore ten beginner-friendly course collections, revisit lesson notes, and share your own study notes with classmates.",
      },
      {
        icon: CheckCircle2,
        title: "Progress that stays with you",
        description: "Mark lessons complete, track course progress, save lessons, and keep personal notes in your learning space.",
      },
      {
        icon: MessageCircleQuestion,
        title: "Learn together and get help",
        description: "Ask trainers for help, discuss ideas with other students, and follow answers until your doubts are resolved.",
      },
      {
        icon: CalendarDays,
        title: "Join scheduled sessions",
        description: "See upcoming live classes and study sessions, including their time, duration, and meeting link.",
      },
    ],
  },
  {
    title: "For trainers",
    eyebrow: "TEACH AND SUPPORT",
    description: "A dedicated workspace for sharing knowledge and helping learners.",
    items: [
      {
        icon: Video,
        title: "Share learning materials",
        description: "Publish study notes, video links, or both. Students can find your resources on their dashboard.",
      },
      {
        icon: CalendarDays,
        title: "Schedule live learning",
        description: "Plan a class, Q&A, or study group with a date, duration, description, and optional meeting link.",
      },
      {
        icon: MessageCircleQuestion,
        title: "Answer student questions",
        description: "Review student doubts, write helpful replies, and mark questions resolved when learners are unstuck.",
      },
      {
        icon: Users,
        title: "Show availability",
        description: "Your trainer profile reflects online availability while you are active in the learning space.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="features-page">
      <section className="features-hero">
        <span className="eyebrow"><Sparkles size={15} /> ONE SPACE TO LEARN AND TEACH</span>
        <h1>Learning that moves <span className="gradient-text">you forward.</span></h1>
        <p>
          Learnova brings courses, trainer support, and organized learning tools
          together, so students can keep growing and trainers can make a real difference.
        </p>
        <div className="features-hero-actions">
          <Link className="button button-primary" to="/courses">
            Explore courses <ArrowRight size={16} />
          </Link>
          <Link className="button button-ghost" to="/register">
            Create an account <GraduationCap size={16} />
          </Link>
        </div>
      </section>

      <section className="features-benefit-strip" aria-label="Learnova benefits">
        <div><BookOpen size={19} /><span>Video courses and study notes</span></div>
        <div><Users size={19} /><span>Student discussions and shared notes</span></div>
        <div><CalendarDays size={19} /><span>Scheduled live sessions</span></div>
        <div><Bookmark size={19} /><span>Saved lessons and progress</span></div>
      </section>

      {featureGroups.map((group, groupIndex) => (
        <section className="features-detail-section" key={group.title}>
          <div className="features-detail-heading">
            <div>
              <span className="eyebrow">{group.eyebrow}</span>
              <h2>{group.title}</h2>
            </div>
            <p>{group.description}</p>
          </div>
          <div className="features-detail-grid">
            {group.items.map(({ icon: Icon, title, description }, itemIndex) => (
              <article className="features-detail-card glass" key={title}>
                <span className={`features-detail-icon tone-${(groupIndex + itemIndex) % 4}`}>
                  <Icon size={21} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="features-steps glass">
        <div>
          <span className="eyebrow"><Search size={14} /> GET STARTED</span>
          <h2>Start with the next step that fits you.</h2>
        </div>
        <ol>
          <li><span>01</span><p>Create an account and choose student or trainer.</p></li>
          <li><span>02</span><p>Students explore lessons, ask questions, and share notes with classmates.</p></li>
          <li><span>03</span><p>Keep learning, ask questions, and track progress over time.</p></li>
        </ol>
        <Link className="button button-primary" to="/login">
          Sign in to Learnova <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
