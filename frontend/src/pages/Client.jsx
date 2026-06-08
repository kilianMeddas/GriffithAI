/* ==============================================================
   Client page (/ask) — the main chat workspace.
   Two-column layout: history sidebar on the left, active
   conversation pane (messages + composer) on the right.
   ============================================================== */
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";
import AnswerAudio from "../components/AnswerAudio.jsx";
import GlbViewer from "../components/GlbViewer.jsx";
import SendButton from "../components/SendButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Client.css";

/* ---------- example questions shown on the empty conversation state ---------- */
const SUGGESTIONS = [
  "How long does it take to process a letter request?",
  "How do I pass my module?",
  "How do I get a student travel card?",
];

/* ---------- date formatters (UK English):
   formatStamp = long form for message meta lines,
   shortStamp = compact form for the history sidebar (HH:MM for today,
   "DD MMM" otherwise) ---------- */
function formatStamp(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortStamp(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (sameDay)
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

/* ---------- conversation shape adapters
   The API may return either the new "messages" array shape or the
   legacy single-turn {question, answer, audio} shape. These helpers
   normalise them so the rest of the component only deals with messages. */
function getMessages(conversation) {
  if (!conversation) return [];

  if (Array.isArray(conversation.messages)) {
    return conversation.messages.flatMap((m) => {
      if (m.role) return [m];

      return [
        {
          role: "user",
          content: m.question,
          created_at: m.created_at,
        },
        {
          role: "assistant",
          content: m.answer,
          audio: m.audio,
          created_at: m.created_at,
        },
      ];
    });
  }

  return [];
}

function conversationTitle(conversation) {
  if (!conversation) return null;
  return (
    conversation.title ||
    conversation.question ||
    getMessages(conversation).find((m) => m.role === "user")?.content ||
    "Untitled conversation"
  );
}

export default function Client() {
  const { user } = useAuth();

  /* ---------- composer + conversation state ----------
     question      : current text in the composer textarea
     loading       : true while the bot is generating a reply
     current       : the active conversation object (or null = empty state)
     history       : every past conversation, used by the sidebar
     search        : sidebar search box
     collapsed     : sidebar collapsed/expanded on desktop
     showHistoryMobile : sidebar drawer open/closed on mobile
     copiedMessageId   : ID of a message just copied (for the "Copied ✓" badge)
     revealedTranscripts : per-message map of whether its transcript is open */
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [revealedTranscripts, setRevealedTranscripts] = useState({});

  /* ---------- pipeline-progress state (kept for parity with the
     original ask.jsx flow; no extra UI is rendered for this here) ---------- */
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("Starting pipeline...");
  const [speakAudio] = useState(true);
  const [audioUrl, setAudioUrl] = useState("");

  /* ---------- DOM refs (scroll target, textarea, composer hover-glow,
     polling interval, audio element) ---------- */
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);
  const composerRef = useRef(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  /* ---------- composer edge-glow effect ----------
     Paint a glowing border section near the cursor only when it sits in
     the outer ~40% of the input; nothing is drawn in the centre. The
     values are passed to CSS via --mx, --my, and --glow-opacity. */
  const onComposerMove = (e) => {
    const el = composerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dxn = Math.abs(x - cx) / cx;
    const dyn = Math.abs(y - cy) / cy;
    const edge = Math.max(0, Math.min(1, Math.max(dxn, dyn))); // 0 center → 1 edge
    const o = Math.max(0, (edge - 0.6) * 2.5); // gated at 60% out
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--glow-opacity", o.toFixed(3));
  };
  const onComposerLeave = () => {
    const el = composerRef.current;
    if (el) el.style.setProperty("--glow-opacity", "0");
  };

  /* ---------- lifecycle effects ----------
     1. Clean up the status-polling interval if the user navigates away. */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* 2. Load the conversation history once on mount (sidebar items). */
  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    api
      .history()
      .then((rows) => {
        if (cancelled) return;
        setHistory(rows || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => !cancelled && setLoadingHistory(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /* 3. Auto-scroll the message body to the bottom on new messages. */
  useEffect(() => {
    setTimeout(() => {
      if (bodyRef.current)
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, 30);
  }, [current?.conversation_id, current?.messages?.length]);

  /* 4. Auto-grow the composer textarea up to 160px as the user types. */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [question]);

  /* ---------- sidebar search — filter conversations by title or content ---------- */
  const filteredHistory = useMemo(() => {
    if (!search.trim()) return history;
    const q = search.toLowerCase();
    return history.filter((h) => {
      const title = (conversationTitle(h) || "").toLowerCase();
      if (title.includes(q)) return true;
      return getMessages(h).some((m) =>
        (m.content || "").toLowerCase().includes(q),
      );
    });
  }, [history, search]);

  const messages = getMessages(current);

  /* ---------- progress polling helpers (used while the bot generates) ---------- */
  function updateProgress(percentage, text) {
    setProgress(percentage);
    setProgressText(`${text} `);
  }

  function startPollingStatus() {
    intervalRef.current = setInterval(async () => {
      try {
        const status = await api.getStatus();
        if (status && typeof status.percentage === "number") {
          updateProgress(status.percentage, status.message || "");
        }
      } catch (err) {
        // network blip — just log; the request itself drives completion
        console.error("Error while fetching status:", err);
      }
    }, 500);
  }

  /* ---------- send a question to the bot ----------
     Optimistically adds the user bubble, calls the API, replaces `current`
     with the server's full conversation on success, rolls back on failure. */
  const sendQuestion = async (e) => {
    e?.preventDefault?.();
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setLoading(true);

    updateProgress(0, "Starting pipeline...");
    startPollingStatus();

    // Optimistic user bubble so the message appears immediately while
    // the model is thinking. We'll replace `current` once the API
    // returns the full updated conversation.
    if (current) {
      setCurrent({
        ...current,
        messages: [
          ...messages,
          { role: "user", content: q, created_at: new Date().toISOString() },
        ],
      });
    } else {
      setCurrent({
        conversation_id: null,
        messages: [
          { role: "user", content: q, created_at: new Date().toISOString() },
        ],
      });
    }
    setQuestion("");

    try {
      const result = await api.ask(q, current?.conversation_id, speakAudio);
      console.log("API RESULT:", result);
      clearInterval(intervalRef.current);
      updateProgress(100, "Processing completed successfully!");

      setCurrent(result);
      setHistory((rows) => {
        // replace if same id, otherwise prepend (new conversation),
        // then re-sort so pinned conversations stay floated to the top
        const without = rows.filter(
          (r) => r.conversation_id !== result.conversation_id,
        );
        return sortHistory([result, ...without]);
      });

      // Sync the latest audio URL for parity with ask.jsx (not rendered
      // anywhere — the per-message AnswerAudio handles playback).
      const lastAssistant = (result?.messages || [])
        .slice()
        .reverse()
        .find((m) => m.role === "assistant");
      if (speakAudio && lastAssistant?.audio) {
        setAudioUrl(lastAssistant.audio);
      } else {
        setAudioUrl("");
      }
    } catch (err) {
      clearInterval(intervalRef.current);
      setError(err.message || "Could not send your question");
      // roll back the optimistic user bubble on failure
      if (current) {
        setCurrent({ ...current, messages });
      } else {
        setCurrent(null);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- composer keyboard shortcut: Enter sends, Shift+Enter newline ---------- */
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  /* ---------- copy a message's text to the clipboard + flash a "Copied" badge ---------- */
  const copyMessage = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(key);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  /* ---------- show / hide the transcript under an audio answer ---------- */
  const toggleTranscript = (key) => {
    setRevealedTranscripts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ---------- sidebar sort: pinned conversations float to the top,
     everything else is sorted by updated/created date descending ---------- */
  const sortHistory = (rows) => {
    return [...rows].sort((a, b) => {
      // pinned first
      const pinDiff = Number(!!b.pinned) - Number(!!a.pinned);
      if (pinDiff !== 0) return pinDiff;

      // then by updated date
      const ad = a.updated_at || a.created_at || "";
      const bd = b.updated_at || b.created_at || "";
      return bd.localeCompare(ad);
    });
  };

  /* ---------- pin / unpin a conversation; pinned ones float to the top ---------- */
  const onTogglePin = async (conversationId, e) => {
    e?.stopPropagation();
    if (!conversationId) return;

    // snapshot (for rollback if needed)
    const prevHistory = history;
    const prevCurrent = current;

    // optimistic update (instant UI feedback)
    const nextHistory = history.map((r) =>
      r.conversation_id === conversationId ? { ...r, pinned: !r.pinned } : r,
    );

    setHistory(sortHistory(nextHistory));

    if (current?.conversation_id === conversationId) {
      setCurrent((c) => (c ? { ...c, pinned: !c.pinned } : c));
    }

    try {
      // persist change in background
      const result = await api.togglePin(conversationId);

      // reconcile with backend (source of truth)
      setHistory((rows) =>
        sortHistory(
          rows.map((r) =>
            r.conversation_id === result.conversation_id
              ? { ...r, ...result }
              : r,
          ),
        ),
      );

      if (current?.conversation_id === result.conversation_id) {
        setCurrent((c) => (c ? { ...c, ...result } : c));
      }
    } catch (err) {
      // rollback if failure
      setHistory(prevHistory);
      setCurrent(prevCurrent);
      setError(err.message || "Could not toggle pin");
    }
  };

  /* ---------- delete an entire conversation from the sidebar ---------- */
  const onDelete = async (id) => {
    try {
      await api.removeConversation(id);
      setHistory((rows) => rows.filter((h) => h.conversation_id !== id));
      if (current?.conversation_id === id) setCurrent(null);
    } catch (err) {
      setError(err.message || "Could not delete this conversation");
    }
  };

  /* ---------- delete a single turn (user message + the assistant reply
     that followed it). Handles the "no conversation_id yet" draft case
     by splicing the local messages array. */
  const onDeleteTurn = async (index) => {
    if (!current) return;

    // Optimistic / draft (no conversation_id yet): just splice locally.
    if (!current.conversation_id) {
      setCurrent((prev) => {
        if (!prev) return prev;
        const msgs = prev.messages || [];
        const target = msgs[index];
        const removeCount =
          target?.role === "user" && msgs[index + 1]?.role === "assistant"
            ? 2
            : 1;
        const next = [
          ...msgs.slice(0, index),
          ...msgs.slice(index + removeCount),
        ];
        if (next.length === 0) return null;
        return { ...prev, messages: next };
      });
      return;
    }

    try {
      const result = await api.removeMessage(current.conversation_id, index);
      if (result?.deleted_conversation) {
        setHistory((rows) =>
          rows.filter((r) => r.conversation_id !== current.conversation_id),
        );
        setCurrent(null);
        return;
      }
      setCurrent(result);
      setHistory((rows) => {
        const without = rows.filter(
          (r) => r.conversation_id !== result.conversation_id,
        );
        return [result, ...without];
      });
    } catch (err) {
      setError(err.message || "Could not delete this message");
    }
  };

  /* ---------- "+ New chat" button — clears the active conversation ---------- */
  const startNewChat = () => {
    setCurrent(null);
    setQuestion("");
    setError(null);
    setAudioUrl("");
    textareaRef.current?.focus();
  };

  /* ---------- restart playback from 0 (used by the Replay control) ---------- */
  function replayAudio() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        /* autoplay blocked — user can press play manually */
      });
    }
  }

  /* ---------- click a suggestion chip → pre-fill the composer with that text ---------- */
  const askSuggestion = (text) => {
    setQuestion(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const title = conversationTitle(current);

  /* ==================== RENDER ====================
     Two-column workspace: history sidebar on the left (collapsible on
     desktop, drawer on mobile) + the conversation pane on the right
     (header, scrollable message list, docked composer).
     ================================================ */
  return (
    <div
      className={`workspace ${collapsed ? "collapsed" : ""} ${
        showHistoryMobile ? "show-history" : ""
      }`}
    >
      {/* ============ LEFT — history sidebar ============ */}
      <aside className={`glass history-aside ${collapsed ? "collapsed" : ""}`}>
        <div className="history-top">
          {!collapsed && <div className="history-aside-title">History</div>}
          <button
            className="icon-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <button className="new-chat" onClick={startNewChat}>
          <span className="plus">+</span>
          <span className="new-chat-text">New chat</span>
        </button>

        {!collapsed && (
          <>
            <div className="history-search">
              <span className="icn">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
              />
            </div>

            {loadingHistory ? (
              <div className="stack">
                <div className="skeleton" style={{ height: 32 }} />
                <div className="skeleton" style={{ height: 32 }} />
                <div className="skeleton" style={{ height: 32 }} />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="history-empty">
                {search
                  ? "Nothing matches that search."
                  : "No conversations yet."}
              </div>
            ) : (
              <ul className="history-list">
                {filteredHistory.map((item) => {
                  const isActive =
                    current?.conversation_id === item.conversation_id;
                  const label = conversationTitle(item) || "Untitled";
                  const stamp = item.updated_at || item.created_at;
                  const pinned = !!item.pinned;
                  return (
                    <li
                      key={item.conversation_id}
                      className={`history-row ${isActive ? "active" : ""} ${
                        pinned ? "pinned" : ""
                      }`}
                      onClick={() => setCurrent(item)}
                    >
                      <button
                        className={`row-pin-btn ${pinned ? "pinned" : ""}`}
                        title={pinned ? "Unpin" : "Pin"}
                        onClick={(e) => onTogglePin(item.conversation_id, e)}
                      >
                        {pinned ? "★" : "☆"}
                      </button>
                      <div className="label" title={label}>
                        {label}
                      </div>
                      <span className="stamp">{shortStamp(stamp)}</span>
                      <button
                        className="row-delete"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.conversation_id);
                        }}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </aside>

      {/* ============ RIGHT — active conversation pane ============ */}
      <section className="glass conversation">
        {/* header — conversation title + meta line + "New chat" / mobile history toggle */}
        <header className="conv-head">
          <div>
            <h2>{title || `Hello, ${user?.first_name}.`}</h2>
            <div className="sub">
              {current
                ? `${messages.length} message${messages.length === 1 ? "" : "s"}${
                    current.updated_at
                      ? ` · last reply ${formatStamp(current.updated_at)}`
                      : ""
                  }`
                : "Ask anything about the Griffith College answers come back as text + voice."}
            </div>
          </div>
          <div className="row">
            {current && (
              <button className="btn btn-ghost btn-sm" onClick={startNewChat}>
                New chat
              </button>
            )}
            <button
              className="mobile-history"
              onClick={() => setShowHistoryMobile((s) => !s)}
            >
              {showHistoryMobile ? "Hide history" : "History"}
            </button>
          </div>
        </header>

        {/* scrollable body — either the empty welcome state or the message list */}
        <div className="conv-body" ref={bodyRef}>
          {error && <div className="error-banner">{error}</div>}

          {!current ? (
            /* empty state — no conversation open: show suggestions to get started */
            <div className="empty-conv">
              {/* 3D model in place of the old red blurry dot */}
              <GlbViewer size={150} className="empty-conv-model" />
              <h3>Ask about Griffith College</h3>
              <p>
                Ask anything about Griffith. You&apos;ll get a written answer
                and a synthesised voice clip you can replay any time.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion"
                    onClick={() => askSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* active conversation — render every message in order. User
               messages are red bubbles on the right; bot messages are
               white bubbles on the left, with the AnswerAudio component
               when an audio reply is attached. */
            <>
              {messages.map((msg, idx) => {
                const key = `${current.conversation_id || "draft"}-${idx}`;
                if (msg.role === "user") {
                  return (
                    <div className="message you" key={key}>
                      <button
                        className="message-delete"
                        onClick={() => onDeleteTurn(idx)}
                        title="Delete this exchange"
                        aria-label="Delete this exchange"
                      >
                        ×
                      </button>
                      <div className="message-bubble">{msg.content}</div>
                      <div className="message-avatar">
                        {(user?.first_name?.[0] || "U").toUpperCase()}
                      </div>
                    </div>
                  );
                }
                const showTranscript = !!revealedTranscripts[key];
                return (
                  <div className="message bot" key={key}>
                    <div className="message-avatar">V</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {msg.audio ? (
                        <div className="answer-card">
                          <AnswerAudio
                            src={msg.audio}
                            downloadName={`GriffithAI-${current.conversation_id || "draft"}-${idx}.wav`}
                          />

                          <div className="answer-tools">
                            <span className="message-meta-inline">
                              GriffithAI ·{" "}
                              {msg.created_at
                                ? formatStamp(msg.created_at)
                                : "just now"}
                            </span>
                            <div className="answer-tool-buttons">
                              {msg.content && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => toggleTranscript(key)}
                                >
                                  {showTranscript
                                    ? "Hide transcript"
                                    : "Show transcript"}
                                </button>
                              )}
                              {msg.content && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => copyMessage(msg.content, key)}
                                >
                                  {copiedMessageId === key
                                    ? "Copied ✓"
                                    : "Copy"}
                                </button>
                              )}
                            </div>
                          </div>

                          {showTranscript && msg.content && (
                            <div className="transcript-reveal">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="message-bubble">{msg.content}</div>
                          <div className="message-meta">
                            <span>
                              GriffithAI ·{" "}
                              {msg.created_at
                                ? formatStamp(msg.created_at)
                                : "just now"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="message bot" key="thinking">
                  <div className="message-avatar">V</div>

                  <div className="message-bubble aigen-bubble">
                    <div className="aigen-wrapper">
                      <span className="aigen-letter">G</span>
                      <span className="aigen-letter">e</span>
                      <span className="aigen-letter">n</span>
                      <span className="aigen-letter">e</span>
                      <span className="aigen-letter">r</span>
                      <span className="aigen-letter">a</span>
                      <span className="aigen-letter">t</span>
                      <span className="aigen-letter">i</span>
                      <span className="aigen-letter">n</span>
                      <span className="aigen-letter">g</span>

                      <div className="aigen-ring" />
                    </div>

                    <div className="aigen-progress">
                      <div className="aigen-progress-text">{progressText}</div>

                      <div className="aigen-progress-bar">
                        <div
                          className="aigen-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="aigen-progress-percent">{progress}%</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ============ docked composer at the bottom ============
           Auto-grows up to 160px, supports Enter to send / Shift+Enter for
           newline, and paints an edge-glow that follows the cursor. */}
        <form className="composer" onSubmit={sendQuestion}>
          <div
            className="composer-inner"
            ref={composerRef}
            onMouseMove={onComposerMove}
            onMouseLeave={onComposerLeave}
          >
            <textarea
              ref={textareaRef}
              placeholder={
                current
                  ? "Reply to GriffithAI…"
                  : "Ask about the Griffith College "
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              rows={1}
            />
            {question && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setQuestion("")}
                disabled={loading}
              >
                Clear
              </button>
            )}
            <SendButton
              disabled={!question.trim() || loading}
              submitting={loading}
              label="Send Message"
              sentLabel={loading ? "Sending" : "Sent"}
            />
          </div>
          <div className="composer-hint">
            <span>Press Enter to send · Shift+Enter for newline</span>
            <span>{question.length}/2000</span>
          </div>
        </form>
      </section>
    </div>
  );
}
