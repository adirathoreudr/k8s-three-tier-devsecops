import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || '';

export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [form, setForm]         = useState({ title: '', status: 'pending', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]     = useState({ status: '', priority: '' });
  const [editId, setEditId]     = useState(null);
  const [health, setHealth]     = useState(null);

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

  const handleEdit = (task) => {
    setEditId(task._id);
    setForm({ title: task.title, status: task.status, priority: task.priority });
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          ☸ DevSecOps<span>.</span>
        </div>
        <button className="nav-cta">View Cluster</button>
      </nav>

      <div className="app-container">
        {/* Hero */}
        <header className="hero-section">
          <h1 className="app-title">
            Your Infrastructure's Next 10<br />
            Years of Productivity<span className="dot">.</span>
          </h1>
          <p className="app-subtitle">
            Manual tasks create mistakes operators shouldn't have to fix. 
            We fix it with a live DevSecOps platform built for how you work.
          </p>
          
          {health && (
            <div className={`health-badge ${health.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
              API Status: {health.status}
            </div>
          )}
        </header>

        {error && (
          <div className="error-alert">
            <div>⚠️ {error}</div>
            <button className="error-close" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Form */}
        <div className="form-card">
          <h2 className="form-title">
            {editId ? '✏️ Edit Process' : 'Add new process'}
          </h2>
          <form onSubmit={handleSubmit} className="task-form">
            <input
              className="input-field"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What needs to be automated?"
              required
            />
            <select 
              className="select-field"
              value={form.status} 
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select 
              className="select-field"
              value={form.priority} 
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Working...' : editId ? 'Update Process' : 'Start Build'}
            </button>
            {editId && (
              <button type="button" className="btn btn-secondary" onClick={() => { setEditId(null); setForm({ title: '', status: 'pending', priority: 'medium' }); }}>
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <select 
            className="filter-select"
            value={filter.status} 
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select 
            className="filter-select"
            value={filter.priority} 
            onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <span className="task-count">{tasks.length} active process{tasks.length !== 1 ? 'es' : ''}</span>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="state-message">Configuring control center...</div>
        ) : tasks.length === 0 ? (
          <div className="state-message">No active processes. Configure a new task above.</div>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task._id} className="task-item">
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-badges">
                    <span className={`badge status-${task.status}`}>
                      {task.status}
                    </span>
                    <span className={`badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn-icon btn-edit" onClick={() => handleEdit(task)}>
                    Edit
                  </button>
                  <button className="btn-icon btn-delete" onClick={() => handleDelete(task._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
