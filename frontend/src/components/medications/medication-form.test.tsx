import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MedicationForm } from "@/components/medications/medication-form";
import type { MedicationInput } from "@/types/medication";

describe("MedicationForm", () => {
  it("submits scheduleTimes without leaking the form-only schedules field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const medication: MedicationInput = {
      name: "Amoxicillin",
      strength: "500 mg",
      form: "Capsule",
      instructions: "Take after meals",
      frequency: "Twice daily",
      startDate: "2026-09-30",
      endDate: "2026-10-07",
      remainingDoses: 14,
      scheduleTimes: ["08:00", "20:00"],
    };

    render(
      <MedicationForm
        initial={medication}
        submitLabel="Create reminders"
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Create reminders" }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(medication);
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("schedules");
  });
});
