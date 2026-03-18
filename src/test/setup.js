import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import "../i18n";

vi.mock("@react-oauth/google", async () => {
  const React = await import("react");
  return {
    GoogleOAuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    GoogleLogin: () => React.createElement("div", { "data-testid": "google-login" }),
  };
});

vi.mock("react-hot-toast", async () => {
  const React = await import("react");
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  toastFn.dismiss = vi.fn();
  return {
    __esModule: true,
    default: toastFn,
    Toaster: () => React.createElement(React.Fragment, null),
  };
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserver;
}

if (!globalThis.HTMLElement?.prototype?.scrollIntoView) {
  globalThis.HTMLElement.prototype.scrollIntoView = () => {};
}
