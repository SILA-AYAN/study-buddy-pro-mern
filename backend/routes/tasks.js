const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

// GET /api/tasks  -> list tasks
router.get("/", async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});

// POST /api/tasks -> create task
router.post("/", async (req, res) => {
  const { title, description, dueDate, status, priority } = req.body;

  if (!title) return res.status(400).json({ message: "title is required" });

  const task = await Task.create({
    title,
    description: description || "",
    dueDate: dueDate ? new Date(dueDate) : null,
    status: status || "todo",
    priority: priority || "medium",

  });

  res.status(201).json(task);
});
// DELETE /api/tasks/:id -> delete task
router.delete("/:id", async (req, res) => {
  const deleted = await Task.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Deleted" });
});

// PATCH /api/tasks/:id -> update status (or other fields)
router.patch("/:id", async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: "Task not found" });
  res.json(updated);
});


module.exports = router;
