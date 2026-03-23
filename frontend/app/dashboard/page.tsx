"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type TaskUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToId: number;
  createdById: number;
  assignedTo?: TaskUser;
  createdBy?: TaskUser;
};

type TaskSummary = {
  all: number;
  assignedToMe: number;
  createdByMe: number;
  pending: number;
  completed: number;
};

type Scope = "all" | "assigned" | "created" | "team";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const TASKS_API_BASE_URL = `${API_ORIGIN}/api/tasks`;
const AUTH_API_BASE_URL = `${API_ORIGIN}/api/auth`;

const defaultSummary: TaskSummary = {
  all: 0,
  assignedToMe: 0,
  createdByMe: 0,
  pending: 0,
  completed: 0,
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [summary, setSummary] = useState<TaskSummary>(defaultSummary);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [scope, setScope] = useState<Scope>("all");

  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignedToId, setNewTaskAssignedToId] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("pending");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const res = await axios.get(TASKS_API_BASE_URL, {
        params: {
          search,
          status: filterStatus,
          dueDate: dueDateFilter,
          scope,
          page,
          limit: 6,
          sortBy,
          order,
        },
        withCredentials: true,
      });

      setTasks(res.data.tasks ?? []);
      setSummary(res.data.summary ?? defaultSummary);
      setTotalPages(Math.max(res.data.totalPages ?? 1, 1));
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href = "/login";
      } else {
        console.error("Dashboard fetch error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${AUTH_API_BASE_URL}/users`, {
        withCredentials: true,
      });

      setUsers(res.data ?? []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href = "/login";
        return;
      }

      console.error("User fetch error:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${AUTH_API_BASE_URL}/me`, {
        withCredentials: true,
      });

      setCurrentUserId(res.data?.id ?? null);
      setCurrentUserRole(res.data?.role ?? null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.location.href = "/login";
        return;
      }

      console.error("Current user fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTasks();
    }, 350);

    return () => clearTimeout(delay);
  }, [search, filterStatus, dueDateFilter, scope, page, sortBy, order]);

  const handleSort = (field: string) => {
    setPage(1);

    if (sortBy === field) {
      setOrder((currentOrder) => (currentOrder === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setOrder(field === "title" ? "asc" : "desc");
  };

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setDueDateFilter("");
    setScope("all");
    setSortBy("createdAt");
    setOrder("desc");
    setPage(1);
  };

  const deleteTask = async (taskId: number) => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${TASKS_API_BASE_URL}/${taskId}`, {
        withCredentials: true,
      });

      fetchTasks();
    } catch (err: any) {
      window.alert(err.response?.data?.message || "Failed to delete task.");
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      setUpdatingTaskId(taskId);

      await axios.patch(
        `${TASKS_API_BASE_URL}/${taskId}/status`,
        {
          status: "completed",
        },
        {
          withCredentials: true,
        }
      );

      fetchTasks();
    } catch (err: any) {
      window.alert(err.response?.data?.message || "Failed to update task status.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const createTask = async () => {
    setFormError("");
    setFormSuccess("");

    if (!newTaskTitle.trim()) {
      setFormError("Task title is required.");
      return;
    }

    if (!newTaskAssignedToId) {
      setFormError("Please choose a colleague to assign the task.");
      return;
    }

    try {
      setSubmittingTask(true);

      await axios.post(
        TASKS_API_BASE_URL,
        {
          title: newTaskTitle.trim(),
          assignedToId: Number(newTaskAssignedToId),
          status: newTaskStatus,
          priority: newTaskPriority,
          dueDate: newTaskDueDate || null,
        },
        {
          withCredentials: true,
        }
      );

      setFormSuccess("Task created successfully.");
      setNewTaskTitle("");
      setNewTaskAssignedToId("");
      setNewTaskStatus("pending");
      setNewTaskPriority("medium");
      setNewTaskDueDate("");
      setScope("all");
      setPage(1);
      fetchTasks();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const logout = () => {
    axios
      .post(
        `${AUTH_API_BASE_URL}/logout`,
        {},
        {
          withCredentials: true,
        }
      )
      .finally(() => {
        window.location.href = "/login";
      });
  };

  const hasFilters = Boolean(search || filterStatus || dueDateFilter || scope !== "all");

  const statCards = [
    {
      label: "All Tasks",
      value: summary.all,
      tone: "from-slate-900 to-slate-700 text-white",
    },
    {
      label: "Assigned To Me",
      value: summary.assignedToMe,
      tone: "from-cyan-100 to-sky-50 text-slate-900",
    },
    {
      label: "Created By Me",
      value: summary.createdByMe,
      tone: "from-amber-100 to-orange-50 text-slate-900",
    },
    {
      label: "Completed",
      value: summary.completed,
      tone: "from-emerald-100 to-lime-50 text-slate-900",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#eef2ff_35%,#f8fafc_70%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="border-b border-slate-200/70 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                  Team Workspace
                </p>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Task Dashboard
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                    Search by task title, colleague name, status, priority, or due date.
                    Use the scope buttons to switch between your work and the rest of the team.
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 xl:px-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-3xl bg-gradient-to-br p-5 shadow-sm ${card.tone}`}
              >
                <p className="text-sm font-medium">{card.label}</p>
                <p className="mt-4 text-3xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200/70 px-6 py-6 xl:px-8">
            <div className="mb-5 flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-slate-900">Add New Task</h2>
              <p className="text-sm text-slate-600">
                Create a task for yourself or assign work to a colleague directly from the dashboard.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Task Title</span>
                <input
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Prepare weekly status report"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Assign To</span>
                <select
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={newTaskAssignedToId}
                  onChange={(e) => setNewTaskAssignedToId(e.target.value)}
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                      {user.id === currentUserId ? " (You)" : ""}
                      {` (${user.email})`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Due Date</span>
                <input
                  type="date"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-h-6 text-sm">
                {formError ? <p className="text-rose-600">{formError}</p> : null}
                {!formError && formSuccess ? (
                  <p className="text-emerald-600">{formSuccess}</p>
                ) : null}
              </div>

              <button
                onClick={createTask}
                disabled={submittingTask}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingTask ? "Creating Task..." : "Add New Task"}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200/70 px-6 py-6 xl:px-8">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Search</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
                  <span className="text-slate-400">⌕</span>
                  <input
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Search by colleague, task, status, priority, or date"
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={filterStatus}
                  onChange={(e) => {
                    setPage(1);
                    setFilterStatus(e.target.value);
                  }}
                >
                  <option value="">All status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Due Date</span>
                <input
                  type="date"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={dueDateFilter}
                  onChange={(e) => {
                    setPage(1);
                    setDueDateFilter(e.target.value);
                  }}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Sort By</span>
                <select
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
                  value={sortBy}
                  onChange={(e) => {
                    setPage(1);
                    setSortBy(e.target.value);
                  }}
                >
                  <option value="createdAt">Created date</option>
                  <option value="dueDate">Due date</option>
                  <option value="title">Title</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Order</span>
                <button
                  onClick={() => {
                    setPage(1);
                    setOrder(order === "asc" ? "desc" : "asc");
                  }}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                  {order === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "all", label: "All Tasks" },
                  { key: "assigned", label: "Assigned To Me" },
                  { key: "created", label: "Created By Me" },
                  { key: "team", label: "Colleagues" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setPage(1);
                      setScope(item.key as Scope);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      scope === item.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>
                  Viewing {tasks.length} task{tasks.length === 1 ? "" : "s"}
                  {currentUserId ? "" : " for this page"}
                </span>
                <button
                  onClick={clearFilters}
                  className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-100 text-left text-sm text-slate-600">
                  <th
                    onClick={() => handleSort("title")}
                    className="cursor-pointer px-6 py-4 font-semibold"
                  >
                    Title {sortBy === "title" ? (order === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">Created By</th>
                  <th
                    onClick={() => handleSort("status")}
                    className="cursor-pointer px-6 py-4 font-semibold"
                  >
                    Status {sortBy === "status" ? (order === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("priority")}
                    className="cursor-pointer px-6 py-4 font-semibold"
                  >
                    Priority {sortBy === "priority" ? (order === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("dueDate")}
                    className="cursor-pointer px-6 py-4 font-semibold"
                  >
                    Due Date {sortBy === "dueDate" ? (order === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      Loading tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-md space-y-2">
                        <p className="text-lg font-semibold text-slate-900">No tasks found</p>
                        <p className="text-sm text-slate-500">
                          {hasFilters
                            ? "Your current search or filters returned no matching tasks. Clear the filters and try again."
                            : "There are no tasks available yet. Once tasks are created, they will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="border-t border-slate-100 text-sm">
                      <td className="px-6 py-4 font-medium text-slate-900">{task.title}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {task.assignedTo?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {task.createdBy?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            task.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">{task.priority}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {task.assignedToId === currentUserId && task.status !== "completed" ? (
                            <button
                              onClick={() => completeTask(task.id)}
                              disabled={updatingTaskId === task.id}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingTaskId === task.id ? "Updating..." : "Mark Complete"}
                            </button>
                          ) : null}

                          {task.createdById === currentUserId || currentUserRole === "admin" ? (
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-6 py-5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  page === p
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
