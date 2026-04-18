const express = require('express');
const router = express.Router();
const TaskStore = require('../models/TaskStore');

// GET /api/tasks — list all tasks (optional ?status= ?priority= filters)
router.get('/', (req, res) => {
  try {
    const { status, priority } = req.query;
    const tasks = TaskStore.getAll({ status, priority });
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tasks/:id — get single task
router.get('/:id', (req, res) => {
  try {
    const task = TaskStore.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks — create task
router.post('/', (req, res) => {
  try {
    const task = TaskStore.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', (req, res) => {
  try {
    const task = TaskStore.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', (req, res) => {
  try {
    const deleted = TaskStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
