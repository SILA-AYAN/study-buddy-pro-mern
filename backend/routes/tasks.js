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
  const { title, description, dueDate, status } = req.body;
  if (!title) return res.status(400).json({ message: "title is required" });

  const task = await Task.create({
    title,
    description: description || "",
    dueDate: dueDate ? new Date(dueDate) : null,
    status: status || "todo",
  });

  res.status(201).json(task);
});

module.exports = router;
