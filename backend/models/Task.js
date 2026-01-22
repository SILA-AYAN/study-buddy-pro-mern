const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

// All endpoints in this router require a valid JWT
router.use(auth);

/**
 * GET /api/tasks
 * Returns only the authenticated user's tasks.
 */
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

/**
 * POST /api/tasks
 * Creates a new task for the authenticated user (userId is set automatically).
 */
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ?? "",
      priority: priority ?? "medium",
      dueDate: dueDate ?? null,
      status: status ?? "todo",
      userId: req.userId,
    });

    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create task" });
  }
});

/**
 * PUT /api/tasks/:id
 * Updates only the authenticated user's task.
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Allow only these fields to be updated
    const allowedFields = ["title", "description", "priority", "dueDate", "status"];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // If title is provided, validate/trim it
    if (updates.title !== undefined) {
      updates.title = String(updates.title).trim();
      if (!updates.title) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
    }

    const updated = await Task.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Task not found" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update task" });
  }
});

/**
 * DELETE /api/tasks/:id
 * Deletes only the authenticated user's task.
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Task.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deleted) return res.status(404).json({ message: "Task not found" });

    return res.json({ message: "Task deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
