export function getTodoUpdateFromDragEnd({ todos, activeId, overId, statuses }) {
  if (!overId) return null;
  const activeTask = (todos || []).find((t) => t.id === activeId);
  if (!activeTask) return null;

  const statusColumn = (statuses || []).find((s) => s === overId);
  if (statusColumn) {
    if (activeTask.status !== statusColumn) {
      return {
        ...activeTask,
        status: statusColumn,
        isComplete: statusColumn === "Done",
      };
    }
    return null;
  }

  const overTask = (todos || []).find((t) => t.id === overId);
  if (overTask && overTask.status !== activeTask.status) {
    return {
      ...activeTask,
      status: overTask.status,
      isComplete: overTask.status === "Done",
    };
  }

  return null;
}

