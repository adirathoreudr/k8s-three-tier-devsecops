// In-memory store — used when MONGO_URI is not set (local dev / testing)
let tasks = [
  { _id: '1', title: 'Deploy to Kubernetes', status: 'pending', priority: 'high', createdAt: new Date().toISOString() },
  { _id: '2', title: 'Configure ArgoCD', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString() },
  { _id: '3', title: 'Setup Prometheus monitoring', status: 'pending', priority: 'medium', createdAt: new Date().toISOString() },
];
let nextId = 4;

const VALID_STATUSES = ['pending', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

const TaskStore = {
  getAll: (filters = {}) => {
    let result = [...tasks];
    if (filters.status) result = result.filter(t => t.status === filters.status);
    if (filters.priority) result = result.filter(t => t.priority === filters.priority);
    return result;
  },

  getById: (id) => tasks.find(t => t._id === String(id)) || null,

  create: ({ title, status = 'pending', priority = 'medium' }) => {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw Object.assign(new Error('Title is required'), { statusCode: 400 });
    }
    if (title.trim().length > 200) {
      throw Object.assign(new Error('Title must be 200 chars or less'), { statusCode: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`), { statusCode: 400 });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      throw Object.assign(new Error(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`), { statusCode: 400 });
    }
    const task = {
      _id: String(nextId++),
      title: title.trim(),
      status,
      priority,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    return task;
  },

  update: (id, updates) => {
    const idx = tasks.findIndex(t => t._id === String(id));
    if (idx === -1) return null;
    const allowed = ['title', 'status', 'priority'];
    const sanitized = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) sanitized[key] = updates[key];
    }
    if (sanitized.status && !VALID_STATUSES.includes(sanitized.status)) {
      throw Object.assign(new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`), { statusCode: 400 });
    }
    if (sanitized.priority && !VALID_PRIORITIES.includes(sanitized.priority)) {
      throw Object.assign(new Error(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`), { statusCode: 400 });
    }
    tasks[idx] = { ...tasks[idx], ...sanitized, updatedAt: new Date().toISOString() };
    return tasks[idx];
  },

  delete: (id) => {
    const idx = tasks.findIndex(t => t._id === String(id));
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  },

  // Reset for testing
  _reset: () => {
    tasks = [
      { _id: '1', title: 'Deploy to Kubernetes', status: 'pending', priority: 'high', createdAt: new Date().toISOString() },
      { _id: '2', title: 'Configure ArgoCD', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString() },
      { _id: '3', title: 'Setup Prometheus monitoring', status: 'pending', priority: 'medium', createdAt: new Date().toISOString() },
    ];
    nextId = 4;
  },
};

module.exports = TaskStore;
