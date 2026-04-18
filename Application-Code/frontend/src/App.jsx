import React, { useState, useEffect, useCallback } from 'react';

// Empty string = relative URL = works on Vercel (/api/...) and with CRA proxy locally
const API = process.env.REACT_APP_API_URL || '';

const STATUS_COLORS = {
  'pending':     '#f59e0b',
  'in-progress': '#3b82f6',
  'done':        '#10b981',
};
const PRIORITY_COLORS = {
  low: '#6b7280', medium: '#f59e0b', high: '#ef4444',
};

export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [form, setForm]         = useState({ title: '', status: 'pending', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]     = useState({ status: '', priority: '' });
  const [editId, setEditId]     = useState(null);
  const [health, setHealth]     = useState(null);

  // ── Fetch tasks ──────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.status)   params.set('status',   filter.status);
      if (filter.priority) params.set('priority', filter.priority);
      const res  = await fetch(`${API}/api/tasks?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // ── Fetch health ─────────────────────────────────────────────────
  const fetchHealth = async () => {
    try {
      const res  = await fetch(`${API}/health`);
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'unreachable' });
    }
  };

  useEffect(() => { fetchTasks(); fetchHealth(); }, [fetchTasks]);

  // ── Create / Update ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const url    = editId ? `${API}/api/tasks/${editId}` : `${API}/api/tasks`;
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save task');
      setForm({ title: '', status: 'pending', priority: 'medium' });
      setEditId(null);
      fetchTasks();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res  = await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTasks();
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────
  const handleEdit = (task) => {
    setEditId(task._id);
    setForm({ title: task.title, status: task.status, priority: task.priority });
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#38bdf8' }}>☸ DevSecOps Task Manager</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>Three-Tier Kubernetes Application</p>
        </div>
        {health && (
          <div style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: health.status === 'healthy' ? '#064e3b' : '#450a0a', border: `1px solid ${health.status === 'healthy' ? '#10b981' : '#ef4444'}`, fontSize: '0.8rem' }}>
            API: <strong style={{ color: health.status === 'healthy' ? '#10b981' : '#ef4444' }}>{health.status}</strong>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', color: '#fca5a5' }}>
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Form */}
      <div style={{ background: '#1e293b', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#94a3b8' }}>{editId ? '✏️ Edit Task' : '+ New Task'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title..."
            required
            style={{ flex: '1', minWidth: 200, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem' }}
          />
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            style={{ padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            style={{ padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button type="submit" disabled={submitting}
            style={{ padding: '0.6rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            {submitting ? '...' : editId ? 'Update' : 'Add Task'}
          </button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ title: '', status: 'pending', priority: 'medium' }); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #334155', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            Cancel
          </button>}
        </form>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: '0.85rem' }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
          style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: '0.85rem' }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.85rem', alignSelf: 'center' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem', background: '#1e293b', borderRadius: '0.75rem', border: '1px dashed #334155' }}>No tasks found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tasks.map(task => (
            <div key={task._id} style={{ background: '#1e293b', borderRadius: '0.6rem', padding: '1rem 1.25rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{task.title}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: STATUS_COLORS[task.status] + '22', color: STATUS_COLORS[task.status], border: `1px solid ${STATUS_COLORS[task.status]}44` }}>
                    {task.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: PRIORITY_COLORS[task.priority] + '22', color: PRIORITY_COLORS[task.priority], border: `1px solid ${PRIORITY_COLORS[task.priority]}44` }}>
                    {task.priority}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEdit(task)}
                  style={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #334155', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(task._id)}
                  style={{ padding: '0.3rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #ef444433', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
