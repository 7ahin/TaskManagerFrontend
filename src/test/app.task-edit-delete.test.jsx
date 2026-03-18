import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";
import i18n from "../i18n";

function responseFrom({ ok = true, status = ok ? 200 : 500, jsonData }) {
  return {
    ok,
    status,
    async json() {
      return jsonData;
    },
    async text() {
      return jsonData != null ? JSON.stringify(jsonData) : "";
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("taskSenpai.language", "en");
  i18n.changeLanguage("en");
  localStorage.setItem("taskSenpai.user", JSON.stringify({ id: 1, name: "Test User" }));
  localStorage.setItem("taskSenpai.activeView", "board");
});

describe("Task edit and delete flows", () => {
  it("edits a task name from the kanban card modal", async () => {
    const user = userEvent.setup();
    const store = [
      { id: 1, name: "Old name", isComplete: false, priority: "Medium", status: "Working on it" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const method = String(options.method || "GET").toUpperCase();
        const urlStr = String(url);

        if (urlStr.includes("/api/TodoItems") && method === "GET") {
          return responseFrom({ jsonData: store });
        }

        if (urlStr.includes("/api/TodoItems/1") && method === "PUT") {
          const body = options.body ? JSON.parse(String(options.body)) : {};
          store[0] = { ...store[0], ...body };
          return responseFrom({ jsonData: store[0] });
        }

        return responseFrom({ ok: false, status: 404, jsonData: { message: "Not Found" } });
      })
    );

    render(<App />);

    await user.click(await screen.findByText("Old name"));

    const modalInput = await screen.findByDisplayValue("Old name");
    await user.clear(modalInput);
    await user.type(modalInput, "New name");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("New name")).toBeInTheDocument();
  }, 15000);

  it("deletes a task through the delete confirmation modal", async () => {
    const user = userEvent.setup();
    const store = [
      { id: 1, name: "Delete me", isComplete: false, priority: "Medium", status: "Working on it" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const method = String(options.method || "GET").toUpperCase();
        const urlStr = String(url);

        if (urlStr.includes("/api/TodoItems") && method === "GET") {
          return responseFrom({ jsonData: store });
        }

        if (urlStr.includes("/api/TodoItems/1") && method === "DELETE") {
          store.splice(0, store.length);
          return responseFrom({ jsonData: null });
        }

        return responseFrom({ ok: false, status: 404, jsonData: { message: "Not Found" } });
      })
    );

    render(<App />);

    const taskTitle = await screen.findByText("Delete me", {}, { timeout: 15000 });
    const card = taskTitle.closest(".board-kanban-card");
    expect(card).toBeTruthy();

    const deleteButton = within(card).getByTitle(/delete/i);
    await user.click(deleteButton);

    expect(await screen.findByText(/delete task/i, {}, { timeout: 15000 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(screen.queryByText("Delete me")).not.toBeInTheDocument();
  }, 15000);
});
