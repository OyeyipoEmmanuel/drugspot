import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";
import "@/i18n";
import { AppProviders } from "@/providers/app-providers";

describe("DrugSpot foundation", () => {
  it("renders the patient home experience", () => {
    render(<AppProviders><App /></AppProviders>);
    expect(screen.getByRole("heading", { name: /good morning/i })).toBeInTheDocument();
    expect(screen.getByText(/foundation ready/i)).toBeInTheDocument();
  });
});
