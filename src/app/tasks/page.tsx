"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getTasks, createTask, completeTask, deleteTask } from "@/lib/api";
import type { Task, TaskInput } from "@/lib/api";
import PriorityBadge from "@/components/shared/PriorityBadge";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", due_date: "" });

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks({
        status: filter === "all" ? undefined : filter,
      });
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleComplete(id: string) {
    try {
      await completeTask(id);
      fetchTasks();
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const task = await createTask({
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        due_date: newTask.due_date || undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const overdueCount = tasks.filter(
    (t) => t.status === "pending" && t.due_date && new Date(t.due_date) < new Date()
  ).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">
            {pendingCount} pending{overdueCount > 0 && `, ${overdueCount} overdue`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3">
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Task title..."
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <div className="grid grid-cols-3 gap-3">
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {filter === "pending" ? "No pending tasks!" : "No tasks found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isOverdue = task.status === "pending" && task.due_date && new Date(task.due_date) < new Date();

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:border-slate-600 ${
                  task.status === "completed" ? "opacity-50" : ""
                }`}
              >
                <button
                  onClick={() => task.status !== "completed" && handleComplete(task.id)}
                  className={`h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    task.status === "completed"
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-slate-600 hover:border-indigo-500"
                  }`}
                >
                  {task.status === "completed" && "✓"}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-slate-500" : "text-white"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.prospects?.business_name && (
                      <Link
                        href={`/prospects/${task.prospect_id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        {task.prospects.business_name}
                      </Link>
                    )}
                    {task.due_date && (
                      <span className={`text-xs ${isOverdue ? "text-red-400" : "text-slate-500"}`}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <PriorityBadge priority={task.priority} />
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-xs text-red-400 hover:text-red-300 ml-2"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
