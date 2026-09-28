import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import "@/i18n";
import { AppProviders } from "@/providers/app-providers";

describe("DrugSpot public application", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("routes an authenticated Home visit to the patient dashboard", async () => {
    const userActions = userEvent.setup();
    const user = {
      id: "patient-1",
      firstName: "Amara",
      lastName: "Okafor",
      email: "amara@example.com",
      role: "patient",
      onboardingComplete: true,
    };
    localStorage.setItem(
      "drugspot-session",
      JSON.stringify({ accessToken: "access-token", refreshToken: "refresh-token", user }),
    );
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/auth/token/refresh/")) {
        return new Promise<Response>(() => undefined);
      }
      if (url.includes("/auth/profile/")) {
        return new Response(JSON.stringify({ detail: "Access token expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    });

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      await screen.findByRole("heading", { name: /good morning, amara/i }),
    ).toBeInTheDocument();
    await userActions.click(screen.getAllByRole("link", { name: "Orders" })[0]);
    await userActions.click(screen.getAllByRole("link", { name: "Home" })[0]);
    expect(
      await screen.findByRole("heading", { name: /good morning, amara/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("keeps authenticated fallback-to-Welcome visits in the patient app", async () => {
    const user = {
      id: "patient-2",
      firstName: "Amara",
      lastName: "Okafor",
      email: "amara@example.com",
      role: "patient",
      onboardingComplete: true,
    };
    localStorage.setItem(
      "drugspot-session",
      JSON.stringify({ accessToken: "access-token", refreshToken: "refresh-token", user }),
    );
    window.history.pushState({ idx: 0 }, "", "/welcome");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("/auth/profile/")) {
        return new Response(JSON.stringify(user), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    });

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      await screen.findByRole("heading", { name: /good morning, amara/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("uses in-app history before falling back to Welcome", async () => {
    const userActions = userEvent.setup();
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await userActions.click(screen.getAllByRole("link", { name: "Sign in" })[0]);
    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    await userActions.click(screen.getByRole("button", { name: /back/i }));
    expect(
      await screen.findByRole("heading", { name: /manage your medicines with more confidence/i }),
    ).toBeInTheDocument();
  });

  it("falls back to Welcome when a screen has no in-app history", async () => {
    const userActions = userEvent.setup();
    window.history.pushState({ idx: 0 }, "", "/login");
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    await userActions.click(screen.getByRole("button", { name: /back/i }));
    expect(
      await screen.findByRole("heading", { name: /manage your medicines with more confidence/i }),
    ).toBeInTheDocument();
  });
});
