import { Request, Response } from "express";
import prisma from "../config/db";

// =======================
// CREATE TASK
// =======================
export const createTask = async (req: any, res: Response) => {
  try {
    const { title, assignedToId, status, priority, dueDate } = req.body;

    // ✅ Validation
    if (!title || !assignedToId) {
      return res.status(400).json({
        message: "Title and assigned user are required",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        status: status || "pending",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,

        // 🔥 RELATIONS
        createdById: req.user.userId,
        assignedToId: Number(assignedToId),
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    res.status(500).json({ message: "Error creating task" });
  }
};

// =======================
// GET TASKS (SEARCH + FILTER + PAGINATION)
// =======================
export const getTasks = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    let {
      status,
      search,
      dueDate,
      scope = "all",
      page = 1,
      limit = 5,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.max(Number(limit) || 5, 1);

    const allowedSortFields = [
      "createdAt",
      "title",
      "status",
      "priority",
      "dueDate",
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const safeOrder = order === "asc" ? "asc" : "desc";
    const safeScope = ["all", "assigned", "created", "team"].includes(scope)
      ? scope
      : "all";

    const filters: any[] = [];

    if (safeScope === "assigned") {
      filters.push({ assignedToId: userId });
    }

    if (safeScope === "created") {
      filters.push({ createdById: userId });
    }

    if (safeScope === "team") {
      filters.push({
        assignedToId: { not: userId },
      });
    }

    if (status) {
      filters.push({ status });
    }

    const normalizedSearch = typeof search === "string" ? search.trim() : "";
    if (normalizedSearch) {
      const searchFilters: any[] = [
        {
          title: {
            contains: normalizedSearch,
          },
        },
        {
          assignedTo: {
            name: {
              contains: normalizedSearch,
            },
          },
        },
        {
          createdBy: {
            name: {
              contains: normalizedSearch,
            },
          },
        },
        {
          status: {
            contains: normalizedSearch,
          },
        },
        {
          priority: {
            contains: normalizedSearch,
          },
        },
      ];

      const parsedSearchDate = new Date(normalizedSearch);
      if (!Number.isNaN(parsedSearchDate.getTime())) {
        const start = new Date(parsedSearchDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        searchFilters.push({
          dueDate: {
            gte: start,
            lt: end,
          },
        });
      }

      filters.push({
        OR: searchFilters,
      });
    }

    if (typeof dueDate === "string" && dueDate) {
      const parsedDueDate = new Date(dueDate);
      if (!Number.isNaN(parsedDueDate.getTime())) {
        const start = new Date(parsedDueDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        filters.push({
          dueDate: {
            gte: start,
            lt: end,
          },
        });
      }
    }

    const where = filters.length > 0 ? { AND: filters } : {};

    const [total, tasks, summary] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          assignedTo: true,
          createdBy: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [safeSortBy]: safeOrder,
        },
      }),
      prisma.$transaction([
        prisma.task.count(),
        prisma.task.count({ where: { assignedToId: userId } }),
        prisma.task.count({ where: { createdById: userId } }),
        prisma.task.count({ where: { status: "pending" } }),
        prisma.task.count({ where: { status: "completed" } }),
      ]),
    ]);

    res.json({
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        all: summary[0],
        assignedToMe: summary[1],
        createdByMe: summary[2],
        pending: summary[3],
        completed: summary[4],
      },
    });
  } catch (error) {
    console.error("GET TASK ERROR:", error);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

// =======================
// UPDATE TASK STATUS
// =======================
export const updateTaskStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (status !== "completed") {
      return res.status(400).json({
        message: "Only completed status updates are allowed",
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.assignedToId !== userId) {
      return res.status(403).json({
        message: "Only the assigned employee can complete this task",
      });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "completed",
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("UPDATE TASK STATUS ERROR:", error);
    res.status(500).json({ message: "Error updating task status" });
  }
};

// =======================
// DELETE TASK
// =======================
export const deleteTask = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const task = await prisma.task.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const canDeleteTask = task.createdById === userId || userRole === "admin";
    if (!canDeleteTask) {
      return res.status(403).json({
        message: "Only the task creator or admin can delete this task",
      });
    }

    await prisma.task.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    res.status(500).json({ message: "Error deleting task" });
  }
};
