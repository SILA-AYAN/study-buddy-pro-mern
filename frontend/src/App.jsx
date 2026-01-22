import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api"; // Nginx proxy + dev proxy için doğru

const statusStyles = {
  todo: {
    title: "To Do",
    ring: "ring-slate-200",
    chip: "bg-slate-100 text-slate-700",
  },
  doing: {
    title: "Doing",
    ring: "ring-blue-200",
    chip: "bg-blue-50 text-blue-700",
  },
  done: {
    title: "Done",
    ring: "ring-emerald-200",
    chip: "bg-emerald-50 text-emerald-700",
  },
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-rose-50 text-rose-700",
};

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [health, setHealth] = useState({ ok: false, text: "Checking..." });

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  // Helper: authorized fetch
  async function authFetch(path, options = {}) {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [tasks, query]);

  const byStatus = useMemo(() => {
    const map = { todo: [], doing: [], done: [] };
    for (const t of filtered) {
      map[t.status || "todo"]?.push(t);
    }
    // newest first
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    return map;
  }, [filtered]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  async function fetchHealth() {
    try {
      // Health endpoint should NOT require auth (recommended). If yours requires auth, change to authFetch("/health")
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setHealth({ ok: true, text: `${data.status} - ${data.message}` });
    } catch {
      setHealth({ ok: false, text: "Backend connection failed" });
    }
  }

  async function fetchTasks() {
    const res = await authFetch("/tasks");
    if (res.status === 401) {
      // token invalid/expired
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetchHealth();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTask() {
    const clean = title.trim();
    if (!clean) return;

    const body = {
      title: clean,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status: "todo",
    };

    const res = await authFetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      showToast("Could not add task");
      return;
    }

    setTitle("");
    setDueDate("");
    showToast("Task added ✅");
    fetchTasks();
  }

  async function removeTask(id) {
    const res = await authFetch(`/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast("Delete failed");
      return;
    }
    showToast("Deleted 🗑️");
    fetchTasks();
  }

  async function updateTask(id, patch) {
    // Your backend route uses PUT in my earlier version.
    // If your backend uses PATCH, change method to "PATCH" here.
    const res = await authFetch(`/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      showToast("Update failed");
      return;
    }
    fetchTasks();
  }

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const doing = tasks.filter((t) => t.status === "doing").length;
    const todo = tasks.filter((t) => (t.status || "todo") === "todo").length;
    return { total, todo, doing, done };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Study Buddy
            </h1>
            <p className="mt-2 text-slate-600">
              Your study tasks in a clean Kanban board.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-slate-200 bg-white">
                <span
                  className={`h-2 w-2 rounded-full ${
                    health.ok ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <span className="text-slate-700">
                  Backend health: <b>{health.text}</b>
                </span>
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                <span className="text-slate-700">
                  Total: <b>{stats.total}</b>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700">
                  To Do: <b>{stats.todo}</b>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700">
                  Doing: <b>{stats.doing}</b>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700">
                  Done: <b>{stats.done}</b>
                </span>
              </span>

              {/* Logout */}
              <button
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
                type="button"
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="w-full md:w-80">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <div className="mt-1 flex items-center rounded-xl bg-white ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-slate-300">
              <input
                className="w-full rounded-xl bg-transparent px-3 py-2 text-slate-900 outline-none"
                placeholder="Find a task..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="mr-2 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setQuery("")}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Create task */}
        <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <label className="text-sm font-medium text-slate-700">
                Task title
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="e.g., Finish chapter 3 notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTask();
                }}
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium text-slate-700">
                Due date
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-slate-300"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-12">
              <button
                className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 active:bg-slate-950"
                onClick={addTask}
                type="button"
              >
                Add task
              </button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["todo", "doing", "done"].map((status) => (
            <div
              key={status}
              className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${statusStyles[status].ring}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {statusStyles[status].title}
                </h2>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[status].chip}`}
                >
                  {byStatus[status].length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {byStatus[status].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No tasks here yet.
                  </div>
                ) : (
                  byStatus[status].map((t) => (
                    <div
                      key={t._id}
                      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900">
                            {t.title}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                priorityStyles[(t.priority || "medium").toLowerCase()] ||
                                priorityStyles.medium
                              }`}
                            >
                              {(t.priority || "medium").toUpperCase()}
                            </span>

                            {t.dueDate ? (
                              <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                                Due: {formatDate(t.dueDate)}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                                No due date
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          onClick={() => removeTask(t._id)}
                          type="button"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {status !== "todo" && (
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => updateTask(t._id, { status: "todo" })}
                            type="button"
                          >
                            To Do
                          </button>
                        )}
                        {status !== "doing" && (
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => updateTask(t._id, { status: "doing" })}
                            type="button"
                          >
                            Doing
                          </button>
                        )}
                        {status !== "done" && (
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => updateTask(t._id, { status: "done" })}
                            type="button"
                          >
                            Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}

        <div className="mt-10 text-center text-xs text-slate-500">
          Built with MERN (MongoDB, Express, React, Node) • Tailwind UI
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
