import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import App from "@/App";
import "@/i18n";
import { AppProviders } from "@/providers/app-providers";

describe("DrugSpot public application", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("renders the public landing page without seeded application data", async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /manage your medicines with more confidence/i,
      }),
    ).toBeInTheDocument();
  });
});
