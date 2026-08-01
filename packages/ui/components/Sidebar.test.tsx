import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Sidebar } from "./Sidebar";

function renderSidebar(isOpen: boolean, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <button>Open menu</button>
      <Sidebar isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>,
  );
}

describe("Sidebar mobile drawer", () => {
  it("marks the closed drawer inert so its links are not focusable", () => {
    renderSidebar(false);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveProperty("inert", true);
  });

  it("is not inert and exposes a dialog role when open", () => {
    renderSidebar(true);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveProperty("inert", false);
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves focus to the close button on open", () => {
    renderSidebar(true);
    expect(
      screen.getByRole("button", { name: "Close navigation menu" }),
    ).toHaveFocus();
  });

  it("calls onClose when Escape is pressed while open", () => {
    const onClose = vi.fn();
    renderSidebar(true, onClose);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render a second focusable dialog for the desktop sidebar", () => {
    renderSidebar(true);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});
