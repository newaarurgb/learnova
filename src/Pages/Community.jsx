import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock3,
  FileText,
  Link2,
  MessageCircle,
  Send,
  UsersRound,
} from "lucide-react";
import api from "../api";

const postTypes = [
  { value: "discussion", label: "Discussion", icon: MessageCircle },
  { value: "doubt", label: "Ask a doubt", icon: CircleHelp },
  { value: "note", label: "Share notes", icon: FileText },
];

function formatPostDate(value) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [postType, setPostType] = useState("discussion");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingCommentsId, setLoadingCommentsId] = useState(null);
  const [draftComment, setDraftComment] = useState("");
  const [openPostId, setOpenPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/auth/community/posts/")
      .then((response) => {
        if (active) setPosts(response.data);
      })
      .catch((requestError) => {
        console.error("Unable to load student community:", requestError);
        if (active) setError("The student community could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function submitPost(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPosting(true);
    try {
      const response = await api.post("/auth/community/posts/", {
        post_type: postType,
        title,
        course,
        content,
        link_url: linkUrl,
      });
      setPosts((current) => [response.data, ...current]);
      setTitle("");
      setCourse("");
      setContent("");
      setLinkUrl("");
      setNotice(postType === "note" ? "Your notes have been shared with the student community." : "Your post is now open for the community.");
    } catch (requestError) {
      console.error("Unable to publish community post:", requestError);
      setError(
        requestError.response?.data?.detail
        || "Your post could not be shared. Please check the details and try again."
      );
    } finally {
      setPosting(false);
    }
  }

  async function toggleComments(postId) {
    setCommentError("");
    if (openPostId === postId) {
      setOpenPostId(null);
      return;
    }
    setOpenPostId(postId);
    setDraftComment("");
    if (commentsByPost[postId]) return;
    setLoadingCommentsId(postId);
    try {
      const response = await api.get(`/auth/community/posts/${postId}/comments/`);
      setCommentsByPost((current) => ({ ...current, [postId]: response.data }));
    } catch (requestError) {
      console.error("Unable to load community comments:", requestError);
      setCommentError("Replies could not be loaded. Please try again.");
    } finally {
      setLoadingCommentsId(null);
    }
  }

  async function submitComment(event, postId) {
    event.preventDefault();
    setCommentError("");
    setSendingComment(true);
    try {
      const response = await api.post(
        `/auth/community/posts/${postId}/comments/`,
        { content: draftComment }
      );
      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] || []), response.data],
      }));
      setPosts((current) => current.map((post) => (
        post.id === postId
          ? { ...post, comment_count: post.comment_count + 1 }
          : post
      )));
      setDraftComment("");
    } catch (requestError) {
      console.error("Unable to add community reply:", requestError);
      setCommentError(
        requestError.response?.data?.detail
        || "Your reply could not be sent. Please try again."
      );
    } finally {
      setSendingComment(false);
    }
  }

  return (
    <main className="community-page">
      <section className="community-hero glass">
        <span className="eyebrow"><UsersRound size={15} /> LEARN BETTER TOGETHER</span>
        <h1>Your student <span className="gradient-text">community.</span></h1>
        <p>Ask questions, talk through ideas, and share notes with fellow students.</p>
        <div className="community-hero-footer">
          <span><UsersRound size={16} /> A welcoming space for every learner</span>
          <Link className="text-link" to="/dashboard">Back to learning <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className="community-layout">
        <form className="community-compose glass" onSubmit={submitPost}>
          <div className="community-compose-heading">
            <div className="community-heading-icon"><MessageCircle size={19} /></div>
            <div>
              <span className="eyebrow">ADD TO THE CONVERSATION</span>
              <h2>Share with students</h2>
            </div>
          </div>

          <fieldset className="community-type-picker">
            <legend>What would you like to share?</legend>
            {postTypes.map(({ value, label, icon: Icon }) => (
              <button
                className={postType === value ? "community-type active" : "community-type"}
                type="button"
                key={value}
                aria-pressed={postType === value}
                onClick={() => setPostType(value)}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </fieldset>

          <label>
            Title
            <input
              required
              maxLength="160"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={postType === "note" ? "e.g. My JavaScript array notes" : "Give your post a clear title"}
            />
          </label>
          <label>
            Course or topic <span className="community-optional">Optional</span>
            <input
              maxLength="120"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              placeholder="e.g. Python, UI design"
            />
          </label>
          <label>
            {postType === "note" ? "Your notes" : "Your message"}
            <textarea
              required
              maxLength="5000"
              rows="6"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={postType === "note"
                ? "Write the notes you want other students to learn from..."
                : "Share context, what you have tried, or what you think..."}
            />
          </label>
          <label>
            Link to a resource <span className="community-optional">Optional</span>
            <span className="community-link-input">
              <Link2 size={15} aria-hidden="true" />
              <input
                type="url"
                maxLength="200"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://..."
              />
            </span>
          </label>
          {error && <p className="community-feedback error" role="alert">{error}</p>}
          {notice && <p className="community-feedback success" role="status">{notice}</p>}
          <button className="button button-primary community-submit" type="submit" disabled={posting}>
            <Send size={15} /> {posting ? "Sharing..." : postType === "note" ? "Share notes" : "Publish post"}
          </button>
          <p className="community-guideline">Be kind, stay on topic, and keep personal information private.</p>
        </form>

        <section className="community-feed" aria-labelledby="community-feed-title">
          <div className="community-feed-heading">
            <div>
              <span className="eyebrow"><BookOpen size={15} /> STUDENT-TO-STUDENT</span>
              <h2 id="community-feed-title">Community board</h2>
            </div>
            <span className="community-feed-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
          </div>

          {loading ? (
            <p className="learning-empty" role="status">Loading the community board...</p>
          ) : error && !posts.length ? (
            <p className="learning-empty" role="alert">{error}</p>
          ) : posts.length ? (
            <div className="community-post-list">
              {posts.map((post) => {
                const type = postTypes.find((item) => item.value === post.post_type) || postTypes[0];
                const TypeIcon = type.icon;
                const commentsOpen = openPostId === post.id;
                return (
                  <article className="community-post glass" key={post.id}>
                    <div className="community-post-top">
                      <span className={`community-post-type ${post.post_type}`}>
                        <TypeIcon size={13} /> {type.label}
                      </span>
                      {post.course && <span className="community-course-tag">{post.course}</span>}
                    </div>
                    <h3>{post.title}</h3>
                    <p className="community-post-content">{post.content}</p>
                    {post.link_url && (
                      <a className="community-resource-link" href={post.link_url} target="_blank" rel="noreferrer">
                        <Link2 size={14} /> Open shared resource
                      </a>
                    )}
                    <div className="community-post-meta">
                      <span className="community-author-avatar" aria-hidden="true">
                        {post.author_name.slice(0, 1).toUpperCase()}
                      </span>
                      <span><strong>{post.author_name}</strong><small><Clock3 size={12} /> {formatPostDate(post.created_at)}</small></span>
                      <button
                        className="community-replies-toggle"
                        type="button"
                        aria-expanded={commentsOpen}
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle size={15} /> {post.comment_count} {post.comment_count === 1 ? "reply" : "replies"}
                        {commentsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    {commentsOpen && (
                      <div className="community-replies">
                        {commentError && <p className="community-feedback error" role="alert">{commentError}</p>}
                        {loadingCommentsId === post.id ? (
                          <p className="community-no-replies" role="status">Loading replies...</p>
                        ) : commentsByPost[post.id]?.length ? (
                          <ul className="community-comment-list">
                            {commentsByPost[post.id].map((comment) => (
                              <li key={comment.id}>
                                <span className="community-author-avatar small" aria-hidden="true">
                                  {comment.author_name.slice(0, 1).toUpperCase()}
                                </span>
                                <div><strong>{comment.author_name}</strong><p>{comment.content}</p></div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="community-no-replies">Start a thoughtful conversation.</p>
                        )}
                        <form className="community-comment-form" onSubmit={(event) => submitComment(event, post.id)}>
                          <label className="sr-only" htmlFor={`community-comment-${post.id}`}>Write a reply</label>
                          <input
                            id={`community-comment-${post.id}`}
                            required
                            maxLength="2000"
                            value={draftComment}
                            onChange={(event) => setDraftComment(event.target.value)}
                            placeholder={`Reply to ${post.author_name}...`}
                          />
                          <button className="button button-primary" type="submit" disabled={sendingComment}>
                            <Send size={14} /><span className="sr-only">{sendingComment ? "Sending reply" : "Send reply"}</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="community-empty glass">
              <div className="community-empty-icon"><MessageCircle size={23} /></div>
              <h3>Start the first conversation</h3>
              <p>Share a question, an idea, or notes that could help someone else.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
