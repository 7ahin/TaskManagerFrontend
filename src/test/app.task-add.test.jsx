import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";
import i18n from "../i18n";

function jsonResponse(data, init = {}) {
  const ok = init.ok ?? true;
  const status = init.status ?? (ok ? 200 : 500);
  return {
    ok,
    status,
    async json() {
      return data;
    },
    async text() {
      return JSON.stringify(data);
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

describe("Task add flow", () => {
  it("adds a task via Board form and renders it", async () => {
    const user = userEvent.setup();
    const store = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const method = String(options.method || "GET").toUpperCase();
        const urlStr = String(url);

        if (urlStr.includes("/api/TodoItems") && method === "GET") {
          return jsonResponse(store);
        }

        if (urlStr.includes("/api/TodoItems") && method === "POST") {
          const body = options.body ? JSON.parse(String(options.body)) : {};
          const created = { id: 123, ...body };
          store.push(created);
          return jsonResponse(created);
        }

        return { ok: false, status: 404, async text() { return "Not Found"; } };
      })
    );

    render(<App />);

    const input = await screen.findByPlaceholderText("Add a new task");
    await user.type(input, "My Task");
    await user.click(screen.getByRole("button", { name: "+ Add Task" }));

    expect(await screen.findByText("My Task")).toBeInTheDocument();
  }, 15000);
});
