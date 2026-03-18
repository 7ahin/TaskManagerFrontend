import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GoalsView from "../components/GoalsView.jsx";
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
  localStorage.setItem("taskSenpai.language", "en");
  i18n.changeLanguage("en");
  vi.unstubAllGlobals();
});

describe("Goals date picker", () => {
  it("opens the calendar and sets due date when choosing Today", async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, options = {}) => {
        const method = String(options.method || "GET").toUpperCase();
        const urlStr = String(url);
        if (urlStr.includes("/api/Goals") && method === "GET") {
          return responseFrom({
            jsonData: [
              { id: 1, title: "Goal 1", type: "completed_all", target: 10, dueDate: null },
            ],
          });
        }
        return responseFrom({ ok: false, status: 404, jsonData: { message: "Not Found" } });
      })
    );

    render(<GoalsView todos={[]} onGoBoard={() => {}} />);

    await user.click(await screen.findByRole("button", { name: /edit/i }, { timeout: 15000 }));

    await screen.findByText("Edit Goal", {}, { timeout: 15000 });

    const modal = document.querySelector(".goals-modal");
    expect(modal).toBeTruthy();

    const noDueText = within(modal).getByText("No due date");
    await user.click(noDueText.closest("button"));

    expect(await screen.findByRole("dialog", {}, { timeout: 15000 })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /today/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(modal).queryByText("No due date")).not.toBeInTheDocument();
  }, 15000);
});
