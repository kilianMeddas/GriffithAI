/* ==============================================================
   Admin Users page — table of every account in the workspace with
   search, role filter, and a delete button per row. Admins only.
   ============================================================== */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Admin.css';

/* ---------- format created_at dates in UK English (DD MMM YYYY) ---------- */
function formatStamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsers() {
  /* ---------- current user (used to disable self-delete) + table state ---------- */
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  /* ---------- fetch the full user list from the server ---------- */
  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.listUsers();
      setRows(data || []);
    } catch (err) {
      setError(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  /* ---------- delete handler — guards against self-delete + confirms ---------- */
  const onDelete = async user => {
    if (user.user_id === me?.user_id) return;
    if (!confirm(`Delete ${user.email}?`)) return;
    try {
      await api.removeUser(user.user_id);
      setRows(rs => rs.filter(r => r.user_id !== user.user_id));
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------- apply search + role filters to the raw user list ---------- */
  const visible = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        [r.first_name, r.last_name, r.email].some(v => (v || '').toLowerCase().includes(q))
      );
    }
    if (filter !== 'all') {
      list = list.filter(r => r.role === filter);
    }
    return list;
  }, [rows, search, filter]);

  return (
    <div className="stack fill-page">

      {error && <div className="error-banner">{error}</div>}

      <section className="glass list-card">
        {/* toolbar — search, role filter, refresh button, count badge */}
        <div className="toolbar">
          <div className="search">
            <span className="icn">⌕</span>
            <input
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admins only</option>
            <option value="user">Members only</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>
            Refresh
          </button>
          <span className="badge mute">{visible.length} accounts</span>
        </div>

        {/* users table — Name, Role, Created, Actions (delete) */}
        <div className="table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4}>
                      <div className="skeleton" style={{ height: 36 }} />
                    </td>
                  </tr>
                ))
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">No users match those filters.</div>
                  </td>
                </tr>
              ) : (
                visible.map(u => {
                  const initials = `${(u.first_name || '')[0] || ''}${(u.last_name || '')[0] || ''}`
                    .toUpperCase() || 'U';
                  const isSelf = u.user_id === me?.user_id;
                  return (
                    <tr key={u.user_id}>
                      <td>
                        <div className="user-name">
                          <div className="avatar">{initials}</div>
                          <div className="meta">
                            <div className="name">
                              {u.first_name} {u.last_name}
                              {isSelf && (
                                <span className="badge mute" style={{ marginLeft: 8 }}>
                                  you
                                </span>
                              )}
                            </div>
                            <div className="email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'success' : ''}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="dim">{formatStamp(u.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={isSelf}
                          title={isSelf ? "You can't delete yourself" : 'Delete user'}
                          onClick={() => onDelete(u)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
