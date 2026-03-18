import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";
import i18n from "../i18n";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("taskSenpai.language", "en");
  i18n.changeLanguage("en");
  vi.unstubAllGlobals();
});

describe("App login guard", () => {
  it("forces landing when not logged in, even if activeView was persisted", async () => {
    localStorage.setItem("taskSenpai.activeView", "dashboard");

    render(<App />);

    const startButtons = await screen.findAllByRole("button", { name: /start for free/i }, { timeout: 15000 });
    expect(startButtons.length).toBeGreaterThan(0);
    expect(await screen.findByRole("heading", { name: /task senpai/i }, { timeout: 15000 })).toBeInTheDocument();
  }, 15000);

  it("shows login modal when navigating to a protected view while logged out", async () => {
    const user = userEvent.setup();

    render(<App />);

    const [startButton] = await screen.findAllByRole("button", { name: /start for free/i }, { timeout: 15000 });
    await user.click(startButton);

    expect(await screen.findByText("Sign In Required", {}, { timeout: 15000 })).toBeInTheDocument();
    expect(screen.getByText(/you need to be signed in/i)).toBeInTheDocument();
  }, 15000);
});
