"use client";

import { useId, useState } from "react";

type PasswordFieldProps = Readonly<{
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
}>;

export function PasswordField({
  label,
  name,
  autoComplete,
  minLength,
}: PasswordFieldProps) {
  const id = useId();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label
      htmlFor={id}
      className="grid gap-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase"
    >
      {label}
      <span className="relative block">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          className="h-12 w-full border border-black/25 bg-transparent px-3 pr-20 text-base font-normal tracking-normal normal-case outline-none focus:border-black"
        />
        <button
          type="button"
          aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className="absolute inset-y-0 right-0 px-3 text-[0.6rem] font-bold tracking-[0.12em] text-black/60 uppercase hover:text-black focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
