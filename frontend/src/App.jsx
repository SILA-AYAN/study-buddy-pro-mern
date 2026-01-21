import { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  async function load() {
    const r = await fetch(`${API}/api/tasks`);
    const data = await r.json();
    setTasks(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    await fetch(`${API}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    load();
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial", maxWidth: 700, margin: "0 auto" }}>
      <h1>Study Buddy</h1>

      <form onSubmit={addTask} style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title..."
          style={{ flex: 1, padding: 10 }}
        />
        <button style={{ padding: "10px 14px" }}>Add</button>
      </form>

      <h2 style={{ marginTop: 24 }}>Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t._id}>
              <b>{t.title}</b> <span style={{ opacity: 0.7 }}>({t.status})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
