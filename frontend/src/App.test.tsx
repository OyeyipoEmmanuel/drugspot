import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "@/App";
import "@/i18n";
import { AppProviders } from "@/providers/app-providers";

describe("DrugSpot patient flows", () => {
  it("lets signed-out users return to the public landing page", async () => {
    localStorage.clear();
    window.history.pushState({}, "", "/login");
    const user = userEvent.setup();
    render(<AppProviders><App /></AppProviders>);
    await user.click(await screen.findByRole("link", { name: /drugspot/i }));
    expect(await screen.findByRole("heading", { name: /manage your medicines with more confidence/i })).toBeInTheDocument();
  });

  it("signs a patient in and opens the medication journey", async () => {
    localStorage.clear();
    window.history.pushState({}, "", "/login");
    const user = userEvent.setup();
    render(<AppProviders><App /></AppProviders>);
    expect(await screen.findByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("heading", { name: /good morning, amara/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole("link", { name: /^medicines$/i })[0]);
    expect(await screen.findByRole("heading", { name: /my medicines/i })).toBeInTheDocument();
  });

  it("completes the mocked marketplace checkout journey", async () => {
    localStorage.clear();
    window.history.pushState({}, "", "/login");
    const user = userEvent.setup();
    render(<AppProviders><App /></AppProviders>);
    await user.click(await screen.findByRole("button", { name: /sign in/i }));
    await user.click(await screen.findByRole("link", { name: /order medicine/i }));
    expect(await screen.findByRole("heading", { name: /find medicine from trusted pharmacies/i })).toBeInTheDocument();
    await user.click(await screen.findByRole("link", { name: /paracetamol/i }));
    await user.click(await screen.findByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("link", { name: /shopping cart/i }));
    expect(await screen.findByRole("heading", { name: /^cart$/i })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /continue to checkout/i }));
    await user.type(await screen.findByLabelText(/phone number/i), "+2348012345678");
    await user.type(screen.getByLabelText(/delivery address/i), "18 Admiralty Way, Lekki, Lagos");
    await user.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => expect(window.location.pathname).toMatch(/^\/orders\//), { timeout: 5_000 });
    expect(await screen.findByRole("heading", { name: /order received/i })).toBeInTheDocument();
  }, 15_000);
});
