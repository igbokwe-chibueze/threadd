import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordField } from "@/components/ui/password-field";

describe("PasswordField", () => {
  it("allows the user to show and hide the entered password", () => {
    render(
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
      />,
    );

    const input = screen.getByLabelText(/^password$/i);
    const toggle = screen.getByRole("button", { name: /show password/i });

    expect((input as HTMLInputElement).type).toBe("password");

    fireEvent.click(toggle);
    expect((input as HTMLInputElement).type).toBe("text");
    expect(
      screen
        .getByRole("button", { name: /hide password/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect((input as HTMLInputElement).type).toBe("password");
  });
});
