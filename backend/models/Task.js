const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ["todo", "doing", "done"], default: "todo" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
