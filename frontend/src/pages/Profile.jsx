/* ==============================================================
   Profile page — 3 tabs (Account / Security / Preferences) plus
   an identity card on the left with the user's avatar, stats, and
   quick facts. Local-only preferences are persisted in localStorage.
   ============================================================== */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Profile.css";

/* ---------- localStorage-backed preferences (autoplay, transcript, theme) ---------- */
const PREF_KEY = "vox.prefs";
const DEFAULT_PREFS = {
  autoplay: true,
  showTranscript: true,
  darkMode: false,
};

function readPrefs() {
  try {
    return {
      ...DEFAULT_PREFS,
      ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}"),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/* ---------- date helpers (UK English, also "days since" for the stat) ---------- */
function formatDate(iso, opts) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(
    "en-GB",
    opts || { year: "numeric", month: "long", day: "numeric" },
  );
}

function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function Profile() {
  /* ---------- auth + routing context ---------- */
  const { user, isAdmin, signOut, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  /* ---------- which tab is open + history (used to compute stats) ---------- */
  const [tab, setTab] = useState("account");
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  /* ---------- Account tab — editable first/last name + status flags ---------- */
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState(null);
  const [accountError, setAccountError] = useState(null);

  /* ---------- Security tab — change-password form + status flags ---------- */
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState(null);
  const [pwdError, setPwdError] = useState(null);

  /* ---------- Preferences tab — toggles persisted in localStorage ---------- */
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    });
  }, [user?.first_name, user?.last_name]);

  /* fetch the user's question history once on mount, used to display the
     "questions asked" stat and the "last question" date */
  useEffect(() => {
    let cancelled = false;
    api
      .history()
      .then((rows) => {
        if (cancelled) return;
        setHistory(rows || []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => !cancelled && setHistoryLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  /* persist prefs whenever they change, and apply the dark-mode attribute
     to <html> so the whole app re-themes immediately */
  useEffect(() => {
    writePrefs(prefs);
    if (prefs.darkMode) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [prefs]);

  /* ---------- derived display values (avatar initials, stat tiles) ---------- */
  const initials = useMemo(() => {
    return (
      `${(user?.first_name || "")[0] || ""}${(user?.last_name || "")[0] || ""}`.toUpperCase() ||
      "U"
    );
  }, [user]);

  const stats = useMemo(() => {
    const total = history.length;
    const lastAsked = history[0]?.created_at;
    const memberDays = daysSince(user?.created_at);
    return { total, lastAsked, memberDays };
  }, [history, user?.created_at]);

  /* ---------- Account tab — submit logic + dirty/can-save guards ---------- */
  const accountDirty =
    form.first_name.trim() !== (user?.first_name || "") ||
    form.last_name.trim() !== (user?.last_name || "");
  const canSaveAccount =
    accountDirty &&
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    !savingAccount;

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!canSaveAccount) return;
    setAccountError(null);
    setAccountMessage(null);
    setSavingAccount(true);
    try {
      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      setAccountMessage("Profile updated.");
    } catch (err) {
      setAccountError(err.message || "Could not save changes");
    } finally {
      setSavingAccount(false);
    }
  };

  /* ---------- Security tab — change-password submit + guards ---------- */
  const passwordsMatch = pwd.next.length > 0 && pwd.next === pwd.confirm;
  const canSavePwd =
    pwd.current.length > 0 &&
    pwd.next.length >= 6 &&
    passwordsMatch &&
    !savingPwd;

  const handleSavePwd = async (e) => {
    e.preventDefault();
    if (!canSavePwd) return;
    setPwdError(null);
    setPwdMessage(null);
    setSavingPwd(true);
    try {
      await changePassword({
        current_password: pwd.current,
        new_password: pwd.next,
      });
      setPwd({ current: "", next: "", confirm: "" });
      setPwdMessage("Password changed. Use the new one next time you sign in.");
    } catch (err) {
      setPwdError(err.message || "Could not change password");
    } finally {
      setSavingPwd(false);
    }
  };

  /* ---------- sign out and return to the landing page ---------- */
  const handleSignOut = () => {
    signOut();
    navigate("/welcome", { replace: true });
  };

  if (!user) return null;

  /* ==================== RENDER ====================
     Two-column shell: identity card on the left, tabbed content on
     the right. The tab state controls which form/section is visible.
     ================================================ */
  return (
    <div className="stack fill-page profile-page">
      <div className="profile-shell">
        {/* ============== LEFT: identity card (avatar, badges, stats, sign out) ============== */}
        <aside className="glass identity-card">
          <div className="identity-top">
            <div className="identity-avatar">{initials}</div>
            <div className="identity-text">
              <h2 className="identity-name">
                {user.first_name} {user.last_name}
              </h2>
              <div className="identity-email">{user.email}</div>
              <div className="identity-badges">
                <span className={`badge ${isAdmin ? "success" : ""}`}>
                  {isAdmin ? "Administrator" : "Member"}
                </span>
              </div>
            </div>
          </div>

          <div className="identity-stats">
            <div className="identity-stat">
              <div className="v">{historyLoaded ? stats.total : "—"}</div>
              <div className="k">Questions</div>
            </div>
            <div className="identity-stat">
              <div className="v">{stats.memberDays ?? "—"}</div>
              <div className="k">Days here</div>
            </div>
          </div>

          <div className="identity-quick">
            <div className="identity-quick-row">
              <span className="k">Member since</span>
              <span className="v">
                {formatDate(user.created_at, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="identity-quick-row">
              <span className="k">Last question</span>
              <span className="v">
                {stats.lastAsked
                  ? formatDate(stats.lastAsked, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <div className="identity-quick-row">
              <span className="k">Role</span>
              <span className="v" style={{ textTransform: "capitalize" }}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="identity-signout">
            <button className="btn btn-danger btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </aside>

        {/* ============== RIGHT: tab strip + the active tab's section card ============== */}
        <div className="profile-content">
          {/* tab strip — clicking switches which section below is rendered */}
          <div className="profile-tabs" role="tablist">
            <button
              className={`profile-tab ${tab === "account" ? "active" : ""}`}
              onClick={() => setTab("account")}
            >
              Account
            </button>
            <button
              className={`profile-tab ${tab === "security" ? "active" : ""}`}
              onClick={() => setTab("security")}
            >
              Security
            </button>
            <button
              className={`profile-tab ${tab === "preferences" ? "active" : ""}`}
              onClick={() => setTab("preferences")}
            >
              Preferences
            </button>
          </div>

          {/* ---- Account tab — edit first/last name (email is read-only) ---- */}
          {tab === "account" && (
            <form className="glass section-card" onSubmit={handleSaveAccount}>
              <div className="head">
                <div>
                  <h2>Personal information</h2>
                  <div className="sub">
                    Update the name shown across the workspace. Email is
                    read-only.
                  </div>
                </div>
              </div>

              {accountError && (
                <div className="error-banner">{accountError}</div>
              )}
              {accountMessage && (
                <div className="success-banner">{accountMessage}</div>
              )}

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="first">First name</label>
                  <input
                    id="first"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, first_name: e.target.value }))
                    }
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="last">Last name</label>
                  <input
                    id="last"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, last_name: e.target.value }))
                    }
                    autoComplete="family-name"
                    required
                  />
                </div>
                <div className="field full">
                  <label>Email</label>
                  <input value={user.email} disabled readOnly />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={!accountDirty || savingAccount}
                  onClick={() =>
                    setForm({
                      first_name: user.first_name || "",
                      last_name: user.last_name || "",
                    })
                  }
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canSaveAccount}
                >
                  {savingAccount ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {/* ---- Security tab — current/new/confirm password form ---- */}
          {tab === "security" && (
            <form className="glass section-card" onSubmit={handleSavePwd}>
              <div className="head">
                <div>
                  <h2>Change password</h2>
                  <div className="sub">
                    At least 6 characters. Existing session stays valid.
                  </div>
                </div>
              </div>

              {pwdError && <div className="error-banner">{pwdError}</div>}
              {pwdMessage && <div className="success-banner">{pwdMessage}</div>}

              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="current">Current password</label>
                  <input
                    id="current"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={pwd.current}
                    onChange={(e) =>
                      setPwd((s) => ({ ...s, current: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="next">New password</label>
                  <input
                    id="next"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    value={pwd.next}
                    onChange={(e) =>
                      setPwd((s) => ({ ...s, next: e.target.value }))
                    }
                    minLength={6}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="confirm">Confirm new password</label>
                  <input
                    id="confirm"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    value={pwd.confirm}
                    onChange={(e) =>
                      setPwd((s) => ({ ...s, confirm: e.target.value }))
                    }
                    minLength={6}
                    required
                  />
                  {pwd.confirm && !passwordsMatch && (
                    <span className="hint" style={{ color: "var(--danger)" }}>
                      Passwords don&apos;t match
                    </span>
                  )}
                </div>
              </div>

              <div className="row between">
                <label className="row" style={{ gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showPwd}
                    onChange={(e) => setShowPwd(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span className="small muted">Show passwords</span>
                </label>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={savingPwd}
                    onClick={() =>
                      setPwd({ current: "", next: "", confirm: "" })
                    }
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canSavePwd}
                  >
                    {savingPwd ? "Updating…" : "Update password"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ---- Preferences tab — three toggles (autoplay / transcript / dark) ---- */}
          {tab === "preferences" && (
            <div className="glass section-card">
              <div className="head">
                <div>
                  <h2>Preferences</h2>
                  <div className="sub">
                    Local tweaks — stored in your browser only.
                  </div>
                </div>
              </div>

              <div>
                <div className="pref-row">
                  <div className="label">
                    <span className="title">Dark mode</span>
                    <span className="desc">
                      Switch the entire workspace to a night-friendly palette.
                    </span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={prefs.darkMode}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, darkMode: e.target.checked }))
                      }
                    />
                    <span className="track" />
                    <span className="knob" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
