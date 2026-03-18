import { describe, expect, it } from "vitest";
import { getTodoUpdateFromDragEnd } from "../components/boardDragUtils.js";

describe("Kanban drag status updates", () => {
  it("moves a task to a column and sets completion for Done", () => {
    const todos = [{ id: 1, name: "A", status: "Working on it", isComplete: false }];

    const update = getTodoUpdateFromDragEnd({
      todos,
      activeId: 1,
      overId: "Done",
      statuses: ["Working on it", "Stuck", "Done", "Review"],
    });

    expect(update).toMatchObject({
      id: 1,
      status: "Done",
      isComplete: true,
    });
  });

  it("moves a task to the status of another task when dropped on a card", () => {
    const todos = [
      { id: 1, name: "A", status: "Working on it", isComplete: false },
      { id: 2, name: "B", status: "Review", isComplete: false },
    ];

    const update = getTodoUpdateFromDragEnd({
      todos,
      activeId: 1,
      overId: 2,
      statuses: ["Working on it", "Stuck", "Done", "Review"],
    });

    expect(update).toMatchObject({
      id: 1,
      status: "Review",
      isComplete: false,
    });
  });
});
